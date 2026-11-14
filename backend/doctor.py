from datetime import date as Date, datetime, time, timedelta
from zoneinfo import ZoneInfo

import mysql.connector
from fastapi import APIRouter, HTTPException

from server import getDBconnection, SLOTS, MAX_BOOKING_DAYS

router = APIRouter()


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


@router.get('/departments')
def departments():
    return read_all('select Dept_id, Dept_name from Department order by Dept_name')


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
