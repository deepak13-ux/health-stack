"""Patient and doctor API backed by the existing Healthstack MySQL schema."""
import hashlib
import hmac
import os
import secrets
from contextlib import contextmanager
from datetime import date, datetime
from decimal import Decimal
from zoneinfo import ZoneInfo
from pathlib import Path
from typing import Literal

import mysql.connector
from dotenv import load_dotenv
from fastapi import Depends, FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from pydantic import BaseModel, Field, field_validator

load_dotenv(Path(__file__).with_name('.env'))

app = FastAPI(title='HealthStack API')
# middleware 
app.add_middleware(
    CORSMiddleware,
    allow_origins=os.getenv('FRONTEND_ORIGINS', 'http://localhost:5173,http://127.0.0.1:5173').split(','),
    allow_methods=['GET', 'POST', 'DELETE'], allow_headers=['Authorization', 'Content-Type'],
)
bearer = HTTPBearer(auto_error=False)


def getDBconnection():
    return mysql.connector.connect(
        host=os.getenv('My_SQL_HOST', 'localhost'),
        port=int(os.getenv('My_SQL_PORT', '3306')),
        user=os.getenv('My_SQL_USER'), password=os.getenv('My_SQL_PASSWORD'),
        database=os.getenv('My_SQL_DATABASE', 'Healthstack'),
    )


# This is the one universal database context manager we use everytime and dont write this logic everywhere.
@contextmanager
def database():
    con = None
    cur = None
    try:
        con = getDBconnection()
        cur = con.cursor(dictionary=True)
        yield cur
        con.commit()
    except mysql.connector.IntegrityError as exc:
        if con is not None:
            con.rollback()
        raise HTTPException(409, 'The operation conflicts with an existing record.') from exc
    except mysql.connector.Error as exc:
        if con is not None:
            con.rollback()
        raise HTTPException(503, 'Database query failed. Check your query and database configuration.') from exc
    except Exception:
        if con is not None:
            con.rollback()
        raise
    finally:
        if cur is not None:
            cur.close()
        if con is not None:
            con.close()


# Generate Hash password 
def hashPassword(password):
    salt = secrets.token_hex(16)
    digest = hashlib.scrypt(password.encode(), salt=bytes.fromhex(salt), n=16384, r=8, p=1).hex()
    return f'scrypt${salt}${digest}'


# verify the hashed password using hmac.compare_digest
def verifyPassword(password, stored):
    try:
        algo, salt, expected = stored.split('$')
        if algo != 'scrypt':
            return False
        actual = hashlib.scrypt(password.encode(), salt=bytes.fromhex(salt), n=16384, r=8, p=1).hex()
        return hmac.compare_digest(actual, expected)
    except (ValueError, TypeError):
        return False


# Project only has patients, doctors and pharmacists. Hardcoded data - 
CONSULTATION_FEE = 200
SLOTS = ['09:00', '09:30', '10:00', '10:30', '11:00', '11:30']

# Helper function to get today
def today():
    return datetime.now(ZoneInfo('Asia/Kolkata')).date()

""" These are the schemas (data structures basically) we define for the incoming data from the frontend"""

class Login(BaseModel):
    email: str = Field(min_length=3, max_length=100)
    password: str = Field(min_length=6, max_length=128)
    role: Literal['patient', 'doctor', 'pharmacist'] = 'patient'

    @field_validator('email')
    @classmethod
    def email_address(cls, value):
        value = value.strip().lower()
        if '@' not in value or '.' not in value.split('@')[-1]:
            raise ValueError('Enter a valid email address.')
        return value


class Registration(Login):
    name: str = Field(min_length=2, max_length=100)
    phone: str = Field(pattern=r'^(\+91)?\d{10}$')
    dob: date
    gender: Literal['Male', 'Female', 'Other']

    @field_validator('name')
    @classmethod
    def full_name(cls, value):
        parts = value.strip().split(maxsplit=1)
        if not parts or any(len(part) > 50 for part in parts):
            raise ValueError('Use up to 50 characters for each name.')
        return value.strip()

    @field_validator('dob')
    @classmethod
    def birth_date(cls, value):
        if value > today():
            raise ValueError('Date of birth cannot be in the future.')
        return value


class Booking(BaseModel):
    doctorId: int
    date: date
    time: str


class MedicineItem(BaseModel):
    medicineId: int
    qty: int = Field(gt=0)
    dosage: str = Field(min_length=1, max_length=50)
    frequency: str = Field(default='Daily', min_length=1, max_length=50)


class PrescriptionForm(BaseModel):
    notes: str = Field(default='', max_length=5000)
    durationDays: int = Field(default=7, ge=1, le=365)
    items: list[MedicineItem] = Field(default_factory=list, max_length=50)


class Payment(BaseModel):
    method: Literal['Cash', 'Card', 'UPI']


# require this role for a user
def require_role(user, role):
    if user['role'] != role:
        raise HTTPException(403, f'{role.title()} access required.')


# A standard helper function
def accUser(cur, account):
    # The account's role tells us which table contains the person's profile.

    # Because we have split users into Patient and Employee tables, this function acts as a router.
    # It queries the correct database table based on account['Role'].
    # It remakes the database keys (e.g., combining First_name and Last_name into a single name key) to return a clean dictionary representing the current user.
    # After this we have a user attached.
    if account['Role'] == 'patient':
        query = "SELECT Patient_id AS id, First_name, Last_name, Mail AS email, Contact AS phone FROM Patient WHERE Patient_id=%s"
    else:
        query = "SELECT Employee_id AS id, First_name, Last_name, Mail AS email FROM Employee WHERE Employee_id=%s AND Is_active=TRUE AND LOWER(Role)=%s"
    params = (account['User_id'],) if account['Role'] == 'patient' else (account['User_id'], account['Role'])
    cur.execute(query, params)
    rows = cur.fetchall()
    if not rows:
        raise HTTPException(401, 'Account is unavailable.')
    user = rows[0]
    user['name'] = f"{user.pop('First_name')} {user.pop('Last_name')}".strip()
    user['role'] = account['Role']
    return user


def currUser(cred: HTTPAuthorizationCredentials = Depends(bearer)): 
    #  FastAPI automatically looks at the incoming HTTP request, extracts the Authorization: Bearer <token> header, and passes it into cred
    if not cred:
        raise HTTPException(401, 'Please sign in.')
    # Session Verification: It hashes the token and checks your database to see if the session exists and hasn't expired (Expires_at > UTC_TIMESTAMP())
    token_hash = hashlib.sha256(cred.credentials.encode()).hexdigest()
    with database() as cur:
        query = "SELECT a.* FROM AuthAccount a JOIN AuthSession s ON a.Account_id=s.Account_id WHERE s.Token_hash=%s AND s.Expires_at>UTC_TIMESTAMP()"
        cur.execute(query, (token_hash,))
        rows = cur.fetchall()
        if not rows:
            raise HTTPException(401, 'Session expired. Please sign in again.')
        # The Hand-off: If the session is valid, it passes the database cursor and the account row down to accUser to fetch the profile.
        return accUser(cur, rows[0])


# A session is to be created generate token using secrets and INSERT INTO AuthSession
def createSession(cur, account):
    token = secrets.token_urlsafe(32)
    t_hash = hashlib.sha256(token.encode()).hexdigest()
    query = "INSERT INTO AuthSession (Token_hash,Account_id,Expires_at) VALUES (%s,%s,DATE_ADD(UTC_TIMESTAMP(), INTERVAL 1 DAY))"
    cur.execute(query, (t_hash, account['Account_id']))
    return {'token': token, 'user': accUser(cur, account)}


# login
@app.post('/auth/login')
def login(data: Login):
    with database() as cur:
        query = "SELECT * FROM AuthAccount WHERE Email=%s AND Role=%s"
        cur.execute(query, (data.email, data.role))
        rows = cur.fetchall()
        if not rows or not verifyPassword(data.password, rows[0]['Password_hash']):
            raise HTTPException(401, 'Email or password is incorrect.')
        # If you dont have email inside or enter wrong password then no login
        return createSession(cur, rows[0])


@app.post('/patients/register', status_code=201)
def register_patient(data: Registration):
    parts = data.name.split(maxsplit=1)
    first, last = parts[0], parts[1] if len(parts) > 1 else ''
    with database() as cur:
        query = "SELECT Patient_id FROM Patient WHERE Mail=%s"
        cur.execute(query, (data.email,))
        if cur.fetchall(): # raise error for the same patient registering twice
            raise HTTPException(409, 'This email already has a patient record.')
        query = "INSERT INTO Patient (First_name,Last_name,Mail,Contact,DOB,Gender) VALUES (%s,%s,%s,%s,%s,%s)"
        cur.execute(query, (first, last, data.email, data.phone.removeprefix('+91'), data.dob, data.gender))
        patient_id = cur.lastrowid
        query = "INSERT INTO AuthAccount (Email,Password_hash,Role,User_id) VALUES (%s,%s,'patient',%s)"
        cur.execute(query, (data.email, hashPassword(data.password), patient_id))
        # generate session after register
        return createSession(cur, {'Account_id': cur.lastrowid, 'Role': 'patient', 'User_id': patient_id})


# fetch us
@app.get('/auth/me')
def me(user=Depends(currUser)):
    return user


# sessions logout API - deletes the record from AuthSession simply
@app.delete('/auth/session', status_code=204)
def logout(cred: HTTPAuthorizationCredentials = Depends(bearer)):
    if cred:
        with database() as cur:
            query = "DELETE FROM AuthSession WHERE Token_hash=%s"
            cur.execute(query, (hashlib.sha256(cred.credentials.encode()).hexdigest(),))

# fetch doctors
@app.get('/doctors')
def doctors(user=Depends(currUser)):
    with database() as cur:
        query = """SELECT d.Employee_id AS id, CONCAT(e.First_name,' ',e.Last_name) AS name, dep.Dept_name AS specialty, d.Dept_id AS deptId FROM Doctor d JOIN Employee e ON d.Employee_id=e.Employee_id JOIN Department dep ON d.Dept_id=dep.Dept_id WHERE e.Is_active=TRUE"""
        cur.execute(query)
        rows = cur.fetchall()
        for row in rows:
            row['fee'] = CONSULTATION_FEE
        return rows


# fetch departments
@app.get('/departments')
def departments(user=Depends(currUser)):
    with database() as cur:
        cur.execute('SELECT Dept_id AS id, Dept_name AS name FROM Department')
        rows = cur.fetchall()
        return rows


# get the slots for docs so that patient chooses and books - If you are able to then pls do write this i am still not knowing how do we write times
# We need TIME_FORMAT as time, and App_status != 'Cancelled'
@app.get('/doctors/{doctor_id}/slots')
def slots(doctor_id: int, date: date, user=Depends(currUser)): 
    # FastAPI automatically runs bearer -> runs currUser -> runs accUser and injects the returned 'user' dict directly into this variable!
    require_role(user, 'patient')
    with database() as cur:
        return {}

# Current_appointment_id is a new attribute the doctor that shows the appointment of patient that is being processed or is going on say.

@app.post('/appointments', status_code=201)
def book_appointment(data: Booking, user=Depends(currUser)):
    require_role(user, 'patient')
    now = datetime.now(ZoneInfo('Asia/Kolkata')) # this is the time right now
    # Start the transaction
    # First check if data.time is in slots or not - If not then raise an exception
    # Then if valid check for the doctor if he is available, 
    # Now check if the patient or the doctor is busy in any other appointment at this time only if not only then insert an appointment
    if data.time not in SLOTS or data.date < now.date() or data.date == now.date() and data.time <= now.strftime('%H:%M'):
        raise HTTPException(422, 'Choose a future slot between 09:00 and 12:00.')
    with database() as cur:
        # cur.execute('SELECT Employee_id FROM Employee WHERE Employee_id=%s AND Role=\'Doctor\' AND Is_active=TRUE', (data.doctorId,))
        return {'id': cur.lastrowid, 'message': 'Appointment booked.'}


# Get the appointments
@app.get('/appointments')
def appointments(user=Depends(currUser)):
    # Get the appointment id as id doctorId, App_date as date and get the required time format. Get the scheduled once for the patients 
    if user['role'] not in ('patient', 'doctor'):
        raise HTTPException(403, 'Patient or doctor access required.')
    with database() as cur:
        if user['role'] == 'patient':
            # get for patient
            # appointment_id, doctorId, date, TIME_FORMAT as time, doctorName 
            query = ""
        else:
            # get for doctor
            # appointment_id, patientId, date, TIME_FORMAT as time, patientName, Current_appointment_id as isCurrent and App_status = 'Scheduled'
            query = ""
        # cur.execute(query, (user['id'], today()))
        rows = cur.fetchall()
        for row in rows:
            row['status'] = 'in_consultation' if row.get('isCurrent') else 'scheduled'
        return rows


# Doc Starts the appointment (INCOMPLETE)
@app.post('/appointments/{appointment_id}/start')
def start_appointment(appointment_id: int, user=Depends(currUser)):
    require_role(user, 'doctor')
    with database() as cur:
        cur.execute('SELECT Current_appointment_id FROM Doctor WHERE Employee_id=%s FOR UPDATE', (user['id'],))
        rows = cur.fetchall()
        if not rows:
            raise HTTPException(404, 'Doctor not found.') # Doc not found exception
        # Current_appointment_id is not appointment_id then he must do the previous guy's first
        if rows[0]['Current_appointment_id'] not in (None, appointment_id):
            raise HTTPException(409, 'Complete the current patient first.')
        # query = "SELECT Appointment_id nt WHER Appointment_id=%s AND Doctor_i=%s AND App_date=%s AND App_status='"
        query = ""
        cur.execute(query, (appointment_id, user['id'], today()))
        if not cur.fetchall(): # Appointment was not found
            raise HTTPException(404, 'Today’s appointment not found.')
        # cur.execute('UPDATE Doctor SET, (appointment_id, user['id'])) 
        return {'message': 'Consultation started.'}


# fetch the meds
@app.get('/medicines')
def medicines(user=Depends(currUser)):
    require_role(user, 'doctor')
    with database() as cur:
        cur.execute('SELECT Med_id AS id, Med_name AS name, Price AS price FROM Medicine')
        rows = cur.fetchall()
        return rows


# doc marks the appointment as complete
@app.post('/appointments/{appointment_id}/complete')
def complete_appointment(appointment_id: int, data: PrescriptionForm, user=Depends(currUser)):
    require_role(user, 'doctor')
    if len({item.medicineId for item in data.items}) != len(data.items):
        raise HTTPException(422, 'Add each medicine only once.')
    with database() as cur:
        cur.execute('SELECT Current_appointment_id FROM Doctor WHERE Employee_id=%s FOR UPDATE', (user['id'],))
        rows = cur.fetchall()
        # If the appointment is not started then raise an exception
        if not rows or rows[0]['Current_appointment_id'] != appointment_id:
            raise HTTPException(409, 'Start this patient’s consultation first.')
        query = "SELECT Appointment_id FROM Appointment WHERE Appointment_id=%s AND Doctor_id=%s AND App_status='Scheduled' FOR UPDATE"
        cur.execute(query, (appointment_id, user['id']))
        # Appointment not found status
        if not cur.fetchall():
            raise HTTPException(409, 'Appointment is already completed or unavailable.')
        # Now your appointment is valid
        query = 'INSERT INTO Prescription (Appointment_id,Pres_date,Notes,Valid_until) VALUES (%s,%s,%s,DATE_ADD(%s, INTERVAL %s DAY))'
        # Find the med, multiply by price and compute the total - simple logic
        cur.execute(query, (appointment_id, today(), data.notes, today(), data.durationDays))
        prescription_id = cur.lastrowid
        total = Decimal(CONSULTATION_FEE)
        for item in data.items:
            cur.execute('SELECT Price FROM Medicine WHERE Med_id=%s', (item.medicineId,))
            rows = cur.fetchall()
            if not rows:
                raise HTTPException(422, 'Medicine not found.')
            price = Decimal(str(rows[0]['Price']))
            total += price * item.qty
            query = 'INSERT INTO Pres_Details (Pres_id,Med_id,Quantity,Dosage,Frequency,Unit_price) VALUES (%s,%s,%s,%s,%s,%s)'
            cur.execute(query, (prescription_id, item.medicineId, item.qty, item.dosage, item.frequency, price))
        query = 'INSERT INTO Bill (Appointment_id,Consultation_fee,Bill_amount,Bill_date) VALUES (%s,%s,%s,%s)'
        cur.execute(query, (appointment_id, CONSULTATION_FEE, total, today()))
        bill_id = cur.lastrowid
        cur.execute("UPDATE Appointment SET App_status='Completed' WHERE Appointment_id=%s", (appointment_id,))
        cur.execute('UPDATE Doctor SET Current_appointment_id=NULL WHERE Employee_id=%s', (user['id'],))
        # All changes must and they do commit together. A failed medicine or bill insert rollsback everything.
        return {'message': 'Visit completed. Prescription and bill created.', 'prescriptionId': prescription_id, 'billId': bill_id}


def prescription_items(cur, prescription_id):
    query = """SELECT m.Med_name AS name, pd.Quantity AS qty, pd.Dosage AS dosage, pd.Frequency AS frequency, pd.Unit_price AS unitPrice FROM Pres_Details pd JOIN Medicine m ON pd.Med_id=m.Med_id WHERE pd.Pres_id=%s"""
    cur.execute(query, (prescription_id,))
    rows = cur.fetchall()
    return rows


def bill_details(cur, bill):
    query = """SELECT m.Med_name AS description, pd.Quantity AS qty, pd.Unit_price AS unitPrice FROM Prescription p JOIN Pres_Details pd ON p.Pres_id=pd.Pres_id JOIN Medicine m ON pd.Med_id=m.Med_id WHERE p.Appointment_id=%s"""
    cur.execute(query, (bill['appointmentId'],))
    bill['lines'] = [{'description': 'Consultation', 'qty': 1, 'unitPrice': bill.pop('fee')}] + cur.fetchall()
    bill['status'] = 'paid' if bill.pop('Payment_status') == 'Paid' else 'unpaid'
    bill['paid'] = bill['total'] if bill['status'] == 'paid' else 0
    bill['state'] = 'issued'
    bill['number'] = f"CF-B-{bill['id']:04d}"
    return bill


# get the pres_id as id, Pres_date as createdAt, Notes as notes, Valid_until as validUntil, doctorName for the patient in desc order
@app.get('/prescriptions')
def prescriptions(user=Depends(currUser)):
    require_role(user, 'patient')
    with database() as cur:
        query = ""
        cur.execute(query, (user['id'], today()))
        rows = cur.fetchall()
        
        return rows


# ftehc the bills
@app.get('/bills')
def bills(user=Depends(currUser)):
    require_role(user, 'patient')
    with database() as cur:
        query = """SELECT b.Bill_id AS id, b.Appointment_id AS appointmentId, b.Consultation_fee AS fee, b.Bill_amount AS total, b.Bill_date AS createdAt, b.Paid_date AS paidAt, b.Payment_status FROM Bill b JOIN Appointment a ON b.Appointment_id=a.Appointment_id WHERE a.Patient_id=%s ORDER BY b.Bill_date DESC,b.Bill_id DESC"""
        cur.execute(query, (user['id'],))
        rows = cur.fetchall()
        for row in rows:
            bill_details(cur, row)
        return rows


# get the pres_id as id, Notes as notes, Bill_id as billId, patientName, WHERE payment status is 'Pending' in sorted by date, This is not complete rn Pls complete if you know.
@app.get('/pharmacy')
def pharmacy(user=Depends(currUser)):
    require_role(user, 'pharmacist')
    with database() as cur:
        query = ""
        cur.execute(query)
        rows = cur.fetchall()
        return rows


# pharmacist marks the bill complete - bill is done
@app.post('/bills/{bill_id}/payments')
def pay_bill(bill_id: int, data: Payment, user=Depends(currUser)):
    require_role(user, 'pharmacist')
    with database() as cur:
        cur.execute('SELECT Payment_status FROM Bill WHERE Bill_id=%s FOR UPDATE', (bill_id,))
        rows = cur.fetchall()
        if not rows:
            raise HTTPException(404, 'Bill not found.') # Notn foundd bill
        if rows[0]['Payment_status'] == 'Paid':
            raise HTTPException(409, 'This bill is already paid.') # Bill Paid!
        query = "UPDATE Bill SET Payment_status='Paid',Payment_mode=%s,Paid_date=%s WHERE Bill_id=%s"
        cur.execute(query, (data.method, today(), bill_id))
        return {'message': 'Payment recorded.'}


if __name__ == '__main__':
    import uvicorn
    uvicorn.run('server:app', host='127.0.0.1', port=8000, reload=True)
