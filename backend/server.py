import mysql.connector
# import fastapi from FastAPI, HTTPException
from fastapi import FastAPI

import os
from dotenv import load_dotenv

load_dotenv() # load variables from .env

userr = os.getenv('My_SQL_USER')
passwordd = os.getenv('My_SQL_PASSWORD')


# 2. Initialize the FastAPI app (Equivalent to: const app = express())
app = FastAPI(title="HealthStack API")

def getDBconnection():
    return mysql.connector.connect(host = "localhost", user = userr, password = passwordd, database = "healthstack")

con = getDBconnection()
cur = con.cursor()

# cur.execute("any")
# rows = cur.fetchall()
# print(rows)

cur.close()
con.close()