from datetime import date

import mysql.connector
from fastapi import APIRouter, Depends, HTTPException

from server import getDBconnection
from middleware import getCurrentUser

router = APIRouter(prefix="/patients")

@router.get("/me")
def personalInfo(user: dict = Depends(getCurrentUser)):
    if user["role"] != "patient":
        raise HTTPException(status_code=403, detail="Patient access required.")

    con = getDBconnection()
    cur = con.cursor(dictionary=True)
    try:
        query = """
            SELECT Patient_id AS id, First_name AS firstName, Last_name AS lastName, Mail AS email, Contact AS phone, Gender AS gender, DOB AS dob, Street AS street, City AS city, State AS state, History AS history FROM Patient WHERE Patient_id = %s
        """
        cur.execute(query, (user["userId"],))
        rows = cur.fetchall()
        if not rows:
            raise HTTPException(status_code=404, detail="Patient not found.")

        return rows[0]
    except mysql.connector.Error:
        raise HTTPException(status_code=500, detail="Could not fetch patient information.")
    finally:
        cur.close()
        con.close()

@router.get("/me/dashboard")
def dashboard(user: dict = Depends(getCurrentUser)):
    if user["role"] != "patient":
        raise HTTPException(status_code=403, detail="Patient access required.")

    con = getDBconnection()
    cur = con.cursor(dictionary=True)
    try:
        query = "SELECT COUNT(*) AS total FROM Appointment WHERE Patient_id = %s AND App_status = 'Scheduled' AND TIMESTAMP(App_date, App_time) >= NOW()"
        cur.execute(query, (user["userId"],))
        rows = cur.fetchall()
        appointments = rows[0]["total"]

        query = "SELECT COUNT(*) AS total FROM Bill b JOIN Appointment a ON b.Appointment_id = a.Appointment_id WHERE a.Patient_id = %s AND b.Payment_status = 'Pending'"
        cur.execute(query, (user["userId"],))
        rows = cur.fetchall()
        bills = rows[0]["total"]

        query = "SELECT COUNT(*) AS total FROM Prescription p JOIN Appointment a ON p.Appointment_id = a.Appointment_id WHERE a.Patient_id = %s AND p.Valid_until >= CURDATE()"
        cur.execute(query, (user["userId"],))
        rows = cur.fetchall()
        prescriptions = rows[0]["total"]

        return {"upcomingAppointments": appointments, "pendingBills": bills, "activePrescriptions": prescriptions}
    except mysql.connector.Error as exc:
        raise HTTPException(status_code=500, detail="Could not fetch patient dashboard.") from exc
    finally:
        cur.close()
        con.close()
