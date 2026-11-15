from datetime import datetime
from zoneinfo import ZoneInfo

import mysql.connector
from fastapi import APIRouter, Depends, HTTPException

from middleware import getCurrentUser
from server import getDBconnection

router = APIRouter()


@router.post('/bills/{bill_id}/payments')
def mark_bill_paid(bill_id: int, user: dict = Depends(getCurrentUser)):
    if user['role'] not in ('pharmacist', 'receptionist'):
        raise HTTPException(status_code=403, detail='Pharmacist or receptionist access required.')

    con = getDBconnection()
    cur = con.cursor(dictionary=True)
    try:
        cur.execute("START TRANSACTION")
        query = "select Payment_status FROM Bill WHERE Bill_id = %s FOR UPDATE"
        cur.execute(query, (bill_id,))
        rows = cur.fetchall()

        if not rows:
            raise HTTPException(status_code=404, detail='Bill not found.')
        if rows[0]['Payment_status'] != 'Pending':
            raise HTTPException(status_code=409, detail='Bill is already paid.')

        # Mock payment: No payment gateway
        paid_date = datetime.now(ZoneInfo('Asia/Kolkata')).date()
        query = "update Bill SET Payment_status = 'Paid', Payment_mode = 'Cash', Paid_date = %s WHERE Bill_id = %s"
        cur.execute(query, (paid_date, bill_id))
        con.commit()
        return {'message': 'Payment completed. Bill marked as paid.', 'bill_id': bill_id, 'status': 'Paid', 'payment_mode': 'Cash'}

    except HTTPException:
        con.rollback()
        raise
    except mysql.connector.Error as exc:
        con.rollback()
        raise HTTPException(status_code=500, detail='Could not update bill payment.') from exc
    finally:
        cur.close()
        con.close()


@router.get('/reception/pending-bills')
def pending_bills(user: dict = Depends(getCurrentUser)):
    if user['role'] not in ('pharmacist', 'receptionist'):
        raise HTTPException(status_code=403, detail='Pharmacist or receptionist access required.')

    con = getDBconnection()
    cur = con.cursor(dictionary=True)
    try:
        # Keep bills visible even if they do not have a prescription yet.
        query = """
            select b.Bill_id, b.Appointment_id, b.Consultation_fee, b.Bill_amount,
                   b.Bill_date, b.Payment_status, p.Patient_id,
                   p.First_name, p.Last_name, p.Contact,
                   r.Pres_id, r.Pres_date, r.Notes, r.Valid_until
            from Bill b
            join Appointment a on b.Appointment_id = a.Appointment_id
            join Patient p on a.Patient_id = p.Patient_id
            left join Prescription r on r.Appointment_id = a.Appointment_id
            where b.Payment_status = 'Pending'
            order by b.Bill_date, b.Bill_id
        """
        cur.execute(query)
        rows = cur.fetchall()

        # Fetch the prescribed medicines for each bill's prescription.
        for row in rows:
            row['medicines'] = []
            if row['Pres_id'] is not None:
                query = """
                    select m.Med_id, m.Med_name, pd.Quantity,
                           pd.Dosage, pd.Frequency, pd.Unit_price
                    from Pres_Details pd join Medicine m on pd.Med_id = m.Med_id
                    where pd.Pres_id = %s
                """
                cur.execute(query, (row['Pres_id'],))
                row['medicines'] = cur.fetchall()

        return rows
    except mysql.connector.Error as exc:
        raise HTTPException(status_code=500, detail='Could not fetch pending bills and prescriptions.') from exc
    finally:
        cur.close()
        con.close()
