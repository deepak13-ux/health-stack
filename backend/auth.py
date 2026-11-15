import hashlib
import secrets
import mysql.connector

from server import getDBconnection
from middleware import getCurrentUser
from helpers import verifyPassword, hashPassword

from fastapi import Depends, HTTPException, APIRouter

router = APIRouter(prefix="/auth")

@router.get("/me")
async def me(user: dict = Depends(getCurrentUser)):
    return user

@router.post("/login")
def login(data: dict):
    con = getDBconnection()
    cur = con.cursor(dictionary=True)
    try:
        cur.execute("START TRANSACTION")
        query = "SELECT Account_id, Password_hash, Role FROM AuthAccount WHERE Email = %s AND Role = %s"
        cur.execute(query, (data["email"], data["role"]))
        rows = cur.fetchall()
        if not rows:
            raise HTTPException(status_code=401, detail="Not registered.")
        
        userRow = rows[0]
        if not verifyPassword(data["password"], userRow['Password_hash']):
            raise HTTPException(status_code=401, detail="Incorrect Password.")
        token = secrets.token_urlsafe(32)
        t_hash = hashlib.sha256(token.encode()).hexdigest()
        
        insert_query = """
            INSERT INTO AuthSession (Token_hash, Account_id, Expires_at) 
            VALUES (%s, %s, DATE_ADD(UTC_TIMESTAMP(), INTERVAL 1 DAY))
            """
        cur.execute(insert_query, (t_hash, userRow['Account_id']))
        con.commit()
        return { "token": token, "user": userRow}
    
    except HTTPException:
        con.rollback()
        raise
    except mysql.connector.IntegrityError as exc:
        con.rollback()
        raise HTTPException( status_code=409, detail="The operation conflicts with existing database data.")
    finally:
        cur.close()
        con.close()
            
@router.post("/register")
def register(data: dict):
    con = getDBconnection()
    cur = con.cursor(dictionary=True)
    try:
        cur.execute("START TRANSACTION")
        cur.execute("SELECT Patient_id FROM Patient WHERE Mail=%s", (data["email"],))
        existingPatient = cur.fetchall()
        if existingPatient:
            raise HTTPException(status_code=403, detail="Already Registered")

        Name = data["name"].split(maxsplit=1)
        if len(Name) > 1:
            first, last = Name[0], Name[1]
        else:
            first, last = '', ''

        query = "INSERT INTO Patient (First_name,Last_name,Mail,Contact,DOB,Gender) VALUES (%s,%s,%s,%s,%s,%s)"
        cur.execute(query, (first, last, data["email"], data["phone"].removeprefix('+91'), data["dob"], data["gender"]))
        
        patient_id = cur.lastrowid
        query = "INSERT INTO AuthAccount (Email,Password_hash,Role,User_id) VALUES (%s,%s,'patient',%s)"
        cur.execute(query, (data["email"], hashPassword(data["password"]), patient_id))

        account_id = cur.lastrowid
        token = secrets.token_urlsafe(32)
        t_hash = hashlib.sha256(token.encode()).hexdigest()
        cur.execute("INSERT INTO AuthSession (Token_hash,Account_id,Expires_at) VALUES (%s,%s,DATE_ADD(UTC_TIMESTAMP(), INTERVAL 1 DAY))", (t_hash, account_id))

        con.commit()
        return {'token' : token}
    finally:
        cur.close()
        con.close()

@router.delete("/session", status_code=204)
def logout(data: dict):
    token = data.get("token")
    if not isinstance(token, str) or not token:
        raise HTTPException(status_code=401, detail="Please log in.")

    token_hash = hashlib.sha256(token.encode()).hexdigest()
    con = getDBconnection()
    cur = con.cursor(dictionary=True)
    try:
        query = "DELETE FROM AuthSession WHERE Token_hash = %s"
        cur.execute(query, (token_hash,))
        con.commit()
    except mysql.connector.Error:
        con.rollback()
        raise HTTPException(status_code=500, detail="Could not log out.")
    finally:
        cur.close()
        con.close()
