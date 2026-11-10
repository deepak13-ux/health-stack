# Simple hospital app

Three roles only:

- Patient: register/login, choose a doctor, book a slot, see active appointments, running prescriptions and bill history.
- Doctor: see today's queue, start one patient's consultation, submit the prescription and complete the visit.
- Pharmacist: see prescriptions with unpaid bills, collect payment and mark the bill paid.

Nurse, admission, admin, payroll, tests, leave and reports code has been removed from the app. The old hospital tables and reference documents are retained; this app does not use those extra tables.

## Rules

- Six fixed 30-minute slots every day: 09:00, 09:30, 10:00, 10:30, 11:00, 11:30. All dates/times use Asia/Kolkata.
- Only future slots can be booked. A doctor and a patient cannot have overlapping bookings.
- Consultation fee is a constant **₹200** in `server.py`. The billing trigger uses the same fixed fee.
- A doctor can have one consultation in progress. `Doctor.Current_appointment_id` stores it; no extra appointment status system is needed.
- Completing a visit inserts the prescription, medicine details and unpaid bill, marks the appointment Completed, and clears the current patient in one transaction.
- Bill total = ₹200 + sum of prescribed medicine quantities × database prices. Prescription duration defaults to seven days.
- Only pharmacists can mark a bill paid; this records a received payment and does not process a bank transfer.

## Database setup

Set `backend/.env` using `.env.example`. Database names are case-sensitive on some systems; use the name of your actual database.

All schema definitions are in `schema/table.sql`, including the login tables,
workflow columns and AUTO_INCREMENT IDs. The separate account and migration scripts
have been merged into it; the existing table definitions were preserved.

For a fresh database, run `schema/table.sql`, then `seed/seed.sql`. The table script
contains its original DROP TABLE statements, so it rebuilds hospital tables; it is
not an upgrade script for preserving existing hospital records.

If installing billing triggers, run `triggers/billing.sql` against the selected database.
It uses the same fixed ₹200 fee as the backend.

The new login tables are `AuthAccount` and `AuthSession`. The previous ApiAccount/ApiSession tables are left untouched to preserve their contents but are no longer used. Create new credentials for existing records:

```bash
cd backend
../.venv/bin/python register.py doctor 101
../.venv/bin/python register.py patient PATIENT_ID
../.venv/bin/python register.py pharmacist PHARMACIST_EMPLOYEE_ID
```

Each command prompts for a password. New patients can register through the website. A pharmacist needs an Employee record with Role `Pharmacist`; `seed/pharmacist.sql` supplies an optional fictional example with employee ID 301. Apply that file once before creating the credentials.

## Start

From the repository root:

```bash
.venv/bin/python -m pip install -r backend/requirements.txt
.venv/bin/python -m uvicorn server:app --app-dir backend --reload --port 8000
npm run dev --prefix frontend
```

Frontend defaults to `http://127.0.0.1:8000`. Set `VITE_API_URL` in `frontend/.env` if needed. API docs: `http://127.0.0.1:8000/docs`.

## Useful APIs

| Method | Path | Purpose |
| --- | --- | --- |
| POST | /auth/login | Login with email, password, role |
| POST | /patients/register | Create patient and account |
| GET | /auth/me | Restore signed-in profile |
| DELETE | /auth/session | Logout |
| GET | /doctors | Active doctor directory, fixed fee |
| GET | /departments | Departments |
| GET | /doctors/{id}/slots?date=YYYY-MM-DD | Six slots with availability |
| POST | /appointments | Book with doctorId, date, time |
| GET | /appointments | Patient's active visits or doctor's queue |
| POST | /appointments/{id}/start | Set the doctor's current patient |
| GET | /medicines | Medicine options for the doctor |
| POST | /appointments/{id}/complete | Save prescription and generate bill |
| GET | /prescriptions | Patient's running prescriptions |
| GET | /bills | Patient's bill history |
| GET | /pharmacy | Prescriptions with unpaid bills |
| POST | /bills/{id}/payments | Pharmacist records Cash/Card/UPI payment |

Login returns `{token,user}`. Other calls send `Authorization: Bearer TOKEN`; the frontend handles this automatically. Passwords and session tokens are stored as hashes, not plaintext.

Completion body:

```json
{"notes":"Rest and fluids","durationDays":7,"items":[{"medicineId":1,"qty":10,"dosage":"After food","frequency":"Twice daily"}]}
```

## Checks

```bash
.venv/bin/python -m unittest discover -s backend/tests
npm run test --prefix frontend
npm run build --prefix frontend
```

Backend tests use a separate in-memory SQLite database with small MySQL date-function adjustments. They cover the complete patient → doctor → pharmacist workflow, rollback, duplicate booking/completion/payment, and role access. They do not execute migrations or test live MySQL triggers. Apply the database setup before running the real app.
