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

import backend.appointment as appointment
from backend.helpers import currUser, accUser, require_role


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

def getDBconnection():
    return mysql.connector.connect(
        host=os.getenv('My_SQL_HOST', 'localhost'),
        port=int(os.getenv('My_SQL_PORT', '3306')),
        user=os.getenv('My_SQL_USER'), password=os.getenv('My_SQL_PASSWORD'),
        database=os.getenv('My_SQL_DATABASE', 'Healthstack'),
    )


# Project only has patients, doctors and pharmacists. Hardcoded data - 
CONSULTATION_FEE = 200
SLOTS = ['09:00', '09:30', '10:00', '10:30', '11:00', '11:30']


""" DO NOT REMOVE THIS  """
if __name__ == '__main__':
    import uvicorn
    uvicorn.run('server:app', host='127.0.0.1', port=8000, reload=True)
