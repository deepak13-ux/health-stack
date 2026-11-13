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

import backend.appointment as appointment
from backend.utils.helpers import currUser, accUser, require_role

import mysql.connector
from dotenv import load_dotenv
from fastapi import Depends, FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from pydantic import BaseModel, Field, field_validator

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