import os
from pathlib import Path

import mysql.connector
from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware

load_dotenv(Path(__file__).with_name('.env'))

app = FastAPI(title='HealthStack API')
app.add_middleware(
    CORSMiddleware,
    allow_origins=os.getenv(
        'FRONTEND_ORIGINS',
        'http://localhost:5173,http://127.0.0.1:5173'
    ).split(','),
    allow_methods=['GET', 'POST', 'PATCH', 'DELETE'],
    allow_headers=['Authorization', 'Content-Type'],
)

SLOTS = ['09:00', '09:30', '10:00', '10:30', '11:00', '11:30']
MAX_BOOKING_DAYS = 3  # Working assumption: today through the next 3 days.


def getDBconnection():
    return mysql.connector.connect(
        host=os.getenv('My_SQL_HOST', 'localhost'),
        port=int(os.getenv('My_SQL_PORT', '3306')),
        user=os.getenv('My_SQL_USER'),
        password=os.getenv('My_SQL_PASSWORD'),
        database=os.getenv('My_SQL_DATABASE', 'Healthstack'),
    )


@app.get('/health/db')
def health_db():
    con = None
    cur = None
    try:
        con = getDBconnection()
        cur = con.cursor()
        cur.execute('select 1')
        return {'database': 'connected'}
    except mysql.connector.Error as exc:
        raise HTTPException(status_code=503, detail='Database unavailable') from exc
    finally:
        if cur is not None:
            cur.close()
        if con is not None:
            con.close()


# Import routers only after getDBconnection is defined.
# Existing auth/patient modules import it from server.py.
from auth import router as auth_router
from patient import router as patient_router
from doctor import router as doctor_router
from appointment import router as appointment_router

app.include_router(auth_router, tags=['auth'])
app.include_router(patient_router, tags=['patients'])
app.include_router(doctor_router, tags=['doctors'])
app.include_router(appointment_router, tags=['appointments'])


if __name__ == '__main__':
    import uvicorn
    uvicorn.run('server:app', host='127.0.0.1', port=8000, reload=True)
