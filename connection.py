import mysql.connector
import os
from dotenv import load_dotenv

load_dotenv() # load variables from .env

userr = os.getenv('My_SQL_USER')
passwordd = os.getenv('My_SQL_PASSWORD')

con = mysql.connector.connect(host = "localhost",
                              user = userr,
                              password = passwordd,
                              database = "healthstack")

cur = con.cursor()

# cur.execute("any")
# rows = cur.fetchall()
# print(rows)

cur.close()
con.close()