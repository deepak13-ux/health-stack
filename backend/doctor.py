from datetime import date as Date, datetime, time, timedelta
from zoneinfo import ZoneInfo

import mysql.connector
from fastapi import APIRouter, Depends, HTTPException

from server import getDBconnection, SLOTS, MAX_BOOKING_DAYS
from middleware import getCurrentUser

router = APIRouter()


# universal transaction executer
def read_all(sql, params=()):
    con = getDBconnection()
    cur = con.cursor(dictionary=True)
    try:
        cur.execute(sql, params)
        return cur.fetchall()
    except mysql.connector.Error as exc:
        raise HTTPException(500, 'Could not read database') from exc
    finally:
        cur.close()
        con.close()


# Get the departments for the doctors
@router.get('/departments')
def departments():
    return read_all('select Dept_id, Dept_name from Department order by Dept_name')


# get the doctors
@router.get('/doctors')
def doctors(department_id: int | None = None):
    query = '''
        select d.Employee_id as doctor_id, e.First_name, e.Last_name,
               dep.Dept_name, d.Dept_id, d.Consultation_fee
        from Doctor d
        join Employee e on e.Employee_id = d.Employee_id
        join Department dep on dep.Dept_id = d.Dept_id
        where e.Is_active = true
    '''
    params = ()
    if department_id is not None:
        query += ' and d.Dept_id = %s'
        params = (department_id,)
    return read_all(query + ' order by e.First_name', params)


@router.get('/doctors/{doctor_id}')
def doctor_profile(doctor_id: int):
    rows = read_all('''
        select d.Employee_id as doctor_id, e.First_name, e.Last_name,
               d.License_no, dep.Dept_name, d.Consultation_fee
        from Doctor d
        join Employee e on e.Employee_id = d.Employee_id
        join Department dep on dep.Dept_id = d.Dept_id
        where d.Employee_id = %s and e.Is_active = true
    ''', (doctor_id,))
    if not rows:
        raise HTTPException(404, 'Doctor not found or inactive')
    return rows[0]


# Read-only medicine catalogue for the doctor's prescription form
# (POST /appointments/{id}/complete expects items[].medicineId from this list).
@router.get('/medicines')
def medicines(user: dict = Depends(getCurrentUser)):
    return read_all('select Med_id, Med_name, Price from Medicine order by Med_name')


# Get a particular docs slots (that are hardcoded)
@router.get('/doctors/{doctor_id}/slots')
def available_slots(doctor_id: int, date: Date):
    now = datetime.now(ZoneInfo('Asia/Kolkata'))
    if not now.date() <= date <= now.date() + timedelta(days=MAX_BOOKING_DAYS):
        raise HTTPException(422, 'Date outside the booking window')

    doctor_profile(doctor_id)
    used = read_all('''
        select time_format(App_time, '%H:%i') as slot
        from Appointment
        where Doctor_id = %s and App_date = %s
          and App_status <> 'Cancelled'
    ''', (doctor_id, date))
    taken = {r['slot'] for r in used}
    available = [
        s for s in SLOTS
        if s not in taken and
        (date > now.date() or time.fromisoformat(s) > now.time())
    ]
    return {'doctor_id': doctor_id, 'date': date, 'available_slots': available}


# Active appointments for the logged-in doctor for today, with patient information.
@router.get('/doctors/me/appointments')
def current_appointments(user: dict = Depends(getCurrentUser)):
    if user['role'] != 'doctor':
        raise HTTPException(status_code=403, detail='Doctor access required.')

    today = datetime.now(ZoneInfo('Asia/Kolkata')).date()
    query = """
        select a.Appointment_id, a.App_date,
               time_format(a.App_time, '%H:%i') as App_time, a.App_status,
               p.Patient_id, p.First_name, p.Last_name, p.DOB,
               p.Gender, p.Contact, p.History
        from Appointment a join Patient p on a.Patient_id = p.Patient_id
        where a.Doctor_id = %s and a.App_date = %s and a.App_status = 'Scheduled'
        order by a.App_time
    """
    return read_all(query, (user['userId'], today))
