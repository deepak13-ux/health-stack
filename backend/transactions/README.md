# Application transactions

Overview of the SQL already written in this folder. Snippets are preserved as written; rollback statements represent failure cases.

## Login

Checks the account and password, then creates a session token.

```sql
-- LOGIN TRANSACTION
START TRANSACTION

SELECT Account_id, Password_hash, Role FROM AuthAccount WHERE Email = <email> AND Role = <role>;

-- IF Not rows - not registered.
ROLLBACK;
-- IF Not verify Password - Incorrect Password
ROLLBACK;

-- Generate token, and hash
INSERT INTO AuthSession (Token_hash, Account_id, Expires_at)
VALUES (<token>, <account_id>, DATE_ADD(UTC_TIMESTAMP(), INTERVAL 1 DAY))
COMMIT; -- Commit when passed
```

## Register

Checks for an existing email, then creates the patient, login account and session.

```sql
-- Register Transaction
START TRANSACTION
SELECT Patient_id FROM Patient WHERE Mail = <email>
-- IF exisiting email
ROLLBACK;
INSERT INTO Patient (First_name,Last_name,Mail,Contact,DOB,Gender) VALUES (%s,%s,%s,%s,%s,%s)
INSERT INTO AuthAccount (Email,Password_hash,Role,User_id) VALUES (%s,%s,'patient',%s)
INSERT INTO AuthSession (Token_hash,Account_id,Expires_at) VALUES (%s,%s,DATE_ADD(UTC_TIMESTAMP(), INTERVAL 1 DAY))
```

## Logout

Deletes the session matching the token.

```sql
-- LOGOUT Transaction
-- token = data.get("token")
DELETE FROM AuthSession WHERE Token_hash = token
```

## Book appointment

Checks doctor availability and patient time conflicts, then inserts the appointment.

```sql
-- BOOK Appointment - ONLY FOR PATIENT
START TRANSACTION
select e.Is_active from Doctor d join Employee e on e.Employee_id = d.Employee_id where d.Employee_id = %s
-- IF no Doctor or Doctor Not Active - RETURN
select Appointment_id from Appointment where Patient_id = %s and App_date = %s and App_time = %s and App_status <> 'Cancelled';
-- IF an appointment exists - RETURN 409: You already have an appointment at this time
insert into Appointment (Patient_id, Doctor_id, App_date, App_time) values (%s, %s, %s, %s)
-- Edge cases handled by UNIQUE constraint for the DATABASE, No rows added if failed
COMMIT
```

## View appointments

Fetches the patient’s appointments with doctor names, newest first.

```sql
-- Get the patient's appointment for every doctor that are active or inactive both
select a.Appointment_id, a.Doctor_id, a.App_date, time_format(a.App_time, '%H:%i') as App_time, a.App_status, e.First_name, e.Last_name from Appointment a join Employee e on e.Employee_id = a.Doctor_id where a.Patient_id = %s order by a.App_date desc, a.App_time desc
```

## Complete appointment

Locks the appointment, creates its prescription, medicine details and bill, then marks the appointment completed.

```sql
-- COMPLETE APPOINTMENT
START TRANSACTION
-- get the appointment to be completed 
SELECT a.App_status, a.App_date FROM Appointment a JOIN Employee e ON a.Doctor_id = e.Employee_id WHERE a.Appointment_id = %s AND a.Doctor_id = %s AND e.Is_active = true FOR UPDATE

INSERT INTO Prescription (Appointment_id, Pres_date, Notes, Valid_until values (%s, %s, %s, %s)
-- For all the medicines in data.items
select Price from Medicine where Med_id = %s for update -- Not Found ROLLBACK
ROLLBACK;
insert into Pres_Details (Pres_id, Med_id, Quantity, Dosage, Frequency, Unit_price) values (%s, %s, %s, %s, %s, %s)
insert into Bill (Appointment_id, Consultation_fee, Bill_amount, Bill_date) values (%s, %s, %s, %s)
-- Bill amount auto calculates

update Appointment set App_status = 'Completed' where Appointment_id = %s
update Doctor set Current_appointment_id = NULL where Employee_id = %s and Current_appointment_id = %s
```

## Complete bill

Checks the pending bill and marks it paid by cash.

```sql
-- complete BILL
START TRANSACTION
select Payment_status FROM Bill WHERE Bill_id = %s FOR UPDATE

-- IF NOT ROWS OR BILL != Pending - Paid and ROLLBACK
ROLLBACK;
UPDATE Bill SET Payment_status = 'Paid' Payment_mode = 'Cash'
COMMIT;
```
