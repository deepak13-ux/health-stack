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

from middleware import getCurrentUser

import mysql.connector
from dotenv import load_dotenv
from fastapi import Depends, FastAPI, HTTPException, APIRouter
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from pydantic import BaseModel, Field, field_validator

router = APIRouter()
    