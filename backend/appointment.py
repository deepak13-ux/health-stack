from datetime import date, datetime, time, timedelta
from zoneinfo import ZoneInfo

import mysql.connector
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, Field

from middleware import getCurrentUser
from server import getDBconnection, SLOTS, MAX_BOOKING_DAYS

router = APIRouter()


class Booking(BaseModel):
    doctor_id: int = Field(gt=0)
    app_date: date
    app_time: str


class Reschedule(BaseModel):
    app_date: date
    app_time: str


def require_patient(user):
    if user['role'] != 'patient':
        raise HTTPException(403, 'Patient access required')
    return user['userId']


def validate_slot(day, slot):
    now = datetime.now(ZoneInfo('Asia/Kolkata'))
    if slot not in SLOTS:
        raise HTTPException(422, 'Invalid time slot')
    if not now.date() <= day <= now.date() + timedelta(days=MAX_BOOKING_DAYS):
        raise HTTPException(422, 'Date outside the booking window')
    if day == now.date() and time.fromisoformat(slot) <= now.time():
        raise HTTPException(422, 'Appointment must be in the future')


def database_failure(con, exc):
    con.rollback()
    if exc.errno == 1062:
        raise HTTPException(409, 'This appointment slot is already occupied') from exc
    if exc.sqlstate == '45000':
        raise HTTPException(409, exc.msg) from exc
    raise HTTPException(500, 'Database operation failed') from exc


@router.post('/appointments', status_code=201)
def book_appointment(data: Booking, user: dict = Depends(getCurrentUser)):
    patient_id = require_patient(user)
    validate_slot(data.app_date, data.app_time)
    con = getDBconnection()
    cur = con.cursor(dictionary=True)
    try:
        con.start_transaction()
        cur.execute('''
            select e.Is_active
            from Doctor d join Employee e on e.Employee_id = d.Employee_id
            where d.Employee_id = %s
        ''', (data.doctor_id,))
        doctor = cur.fetchone()
        if not doctor or not doctor['Is_active']:
            raise HTTPException(404, 'Doctor not found or inactive')
        cur.execute('''
            insert into Appointment (Patient_id, Doctor_id, App_date, App_time)
            values (%s, %s, %s, %s)
        ''', (patient_id, data.doctor_id, data.app_date, data.app_time))
        appointment_id = cur.lastrowid
        con.commit()
        return {'appointment_id': appointment_id, 'status': 'Scheduled'}
    except HTTPException:
        con.rollback()
        raise
    except mysql.connector.Error as exc:
        database_failure(con, exc)
    finally:
        cur.close()
        con.close()


@router.get('/patients/me/appointments')
def my_appointments(user: dict = Depends(getCurrentUser)):
    patient_id = require_patient(user)
    con = getDBconnection()
    cur = con.cursor(dictionary=True)
    try:
        cur.execute('''
            select a.Appointment_id, a.Doctor_id, a.App_date,
                   time_format(a.App_time, '%H:%i') as App_time,
                   a.App_status, e.First_name, e.Last_name
            from Appointment a
            join Employee e on e.Employee_id = a.Doctor_id
            where a.Patient_id = %s
            order by a.App_date desc, a.App_time desc
        ''', (patient_id,))
        return cur.fetchall()
    finally:
        cur.close()
        con.close()


@router.get('/appointments/{appointment_id}')
def appointment_details(appointment_id: int, user: dict = Depends(getCurrentUser)):
    if user['role'] not in ('patient', 'doctor'):
        raise HTTPException(403, 'Not permitted')
    identity_column = 'Patient_id' if user['role'] == 'patient' else 'Doctor_id'
    con = getDBconnection()
    cur = con.cursor(dictionary=True)
    try:
        # identity_column is selected from fixed server-side strings, never user input.
        cur.execute(f'''
            select Appointment_id, Patient_id, Doctor_id, App_date,
                   time_format(App_time, '%H:%i') as App_time, App_status
            from Appointment
            where Appointment_id = %s and {identity_column} = %s
        ''', (appointment_id, user['userId']))
        row = cur.fetchone()
        if not row:
            raise HTTPException(404, 'Appointment not found')
        return row
    finally:
        cur.close()
        con.close()


@router.patch('/appointments/{appointment_id}/cancel')
def cancel_appointment(appointment_id: int, user: dict = Depends(getCurrentUser)):
    patient_id = require_patient(user)
    con = getDBconnection()
    cur = con.cursor()
    try:
        con.start_transaction()
        cur.execute('''
            update Appointment set App_status = 'Cancelled'
            where Appointment_id = %s and Patient_id = %s
              and App_status = 'Scheduled' and App_date > %s
        ''', (appointment_id, patient_id, datetime.now(ZoneInfo('Asia/Kolkata')).date()))
        if cur.rowcount != 1:
            raise HTTPException(409, 'Appointment cannot be cancelled')
        con.commit()
        return {'appointment_id': appointment_id, 'status': 'Cancelled'}
    except HTTPException:
        con.rollback()
        raise
    except mysql.connector.Error as exc:
        database_failure(con, exc)
    finally:
        cur.close()
        con.close()


@router.patch('/appointments/{appointment_id}/reschedule')
def reschedule_appointment(appointment_id: int, data: Reschedule,
                           user: dict = Depends(getCurrentUser)):
    patient_id = require_patient(user)
    validate_slot(data.app_date, data.app_time)
    con = getDBconnection()
    cur = con.cursor(dictionary=True)
    try:
        con.start_transaction()
        cur.execute('''
            select Doctor_id, App_status, App_date
            from Appointment
            where Appointment_id = %s and Patient_id = %s
            for update
        ''', (appointment_id, patient_id))
        current = cur.fetchone()
        if not current:
            raise HTTPException(404, 'Appointment not found')
        if current['App_status'] != 'Scheduled' or \
                current['App_date'] <= datetime.now(ZoneInfo('Asia/Kolkata')).date():
            raise HTTPException(409, 'Appointment is not eligible for rescheduling')

        cur.execute('''
            select Is_active from Employee where Employee_id = %s
        ''', (current['Doctor_id'],))
        doctor = cur.fetchone()
        if not doctor or not doctor['Is_active']:
            raise HTTPException(409, 'Doctor is inactive')

        cur.execute('''
            select 1 from Prescription where Appointment_id = %s
            union
            select 1 from Bill where Appointment_id = %s
        ''', (appointment_id, appointment_id))
        if cur.fetchone() is not None:
            raise HTTPException(409, 'Appointment already has medical or billing records')

        cur.execute('''
            update Appointment set App_date = %s, App_time = %s
            where Appointment_id = %s
        ''', (data.app_date, data.app_time, appointment_id))
        con.commit()
        return {'appointment_id': appointment_id, 'status': 'Scheduled',
                'app_date': data.app_date, 'app_time': data.app_time}
    except HTTPException:
        con.rollback()
        raise
    except mysql.connector.Error as exc:
        database_failure(con, exc)
    finally:
        cur.close()
        con.close()
