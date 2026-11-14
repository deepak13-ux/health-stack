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


bearer = HTTPBearer(auto_error=False)

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

# Helper function to get today
def today():
    return datetime.now(ZoneInfo('Asia/Kolkata')).date()

# require this role for a user
def require_role(user, role):
    if user['role'] != role:
        raise HTTPException(403, f'{role.title()} access required.')