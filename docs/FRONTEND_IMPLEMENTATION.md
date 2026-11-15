# Frontend ↔ backend integration

The frontend (`frontend/`) is built against the FastAPI backend in `backend/`. Visual design, tokens and interaction patterns follow `frontend/Careflow-Frontend-Blueprint.md`. Screens exist only for workflows the backend supports: **patient, doctor and pharmacist** (the `AuthAccount.Role` enum). Blueprint modules with no backend tables or APIs (admissions/beds, invoice editing, reports, hospital settings, admin doctor management) are not built, so no control promises behaviour the server can't perform.

## Running locally

```bash
# backend (needs backend/.env, see .env.example)
cd backend && uvicorn server:app --reload          # http://127.0.0.1:8000
# frontend
cd frontend && npm install && npm run dev           # http://localhost:5173
npm test        # domain rules + API contract tests (node --test)
npm run lint && npm run build
```

`VITE_API_URL` overrides the API base URL. Seeded demo accounts (`backend/seed/seed.sql`) use password `demo123`: `patient@demo.com`, `doctor@demo.com`, `pharmacist@demo.com`.

## Routes

| Route | Patient | Doctor | Pharmacist |
| --- | --- | --- | --- |
| `/login`, `/register` | Sign in / self-registration | Sign in | Sign in |
| `/overview` | KPIs, upcoming visits, bills, running prescriptions | Today's queue KPIs | Pending-bill KPIs |
| `/appointments` | Own visits (Upcoming/Past/Cancelled/All), reschedule, cancel | Today's scheduled queue | — (403) |
| `/appointments/:id` | Visit detail + prescription + bill | Patient details, visit history, **Complete visit** | — |
| `/doctors`, `/doctors/:id` | Directory, availability, booking | — | — |
| `/prescriptions` | Running / history | — | — |
| `/billing`, `/billing/:id` | Own bills, printable bill | — | Pending bills, **Record payment**, printable bill |
| `/settings` | Read-only profile, workspace info | same | same |

## API map

`frontend/src/api/index.js` is the only module that calls the server; `normalize.js` maps database column names to UI shapes and rupees to integer paise.

| Frontend call | Endpoint |
| --- | --- |
| login / getSession / registerPatient / logout | `POST /auth/login`, `GET /auth/me`, `POST /auth/register`, `DELETE /auth/session` |
| listDepartments, listDoctors, getDoctor, getSlots | `GET /departments`, `GET /doctors`, `GET /doctors/{id}`, `GET /doctors/{id}/slots?date=` |
| myProfile, myDashboard, myAppointments | `GET /patients/me`, `GET /patients/me/dashboard`, `GET /patients/me/appointments` |
| bookAppointment, rescheduleAppointment, cancelAppointment | `POST /appointments`, `PATCH /appointments/{id}/reschedule`, `PATCH /appointments/{id}/cancel` |
| doctorQueue, getAppointment, listMedicines, completeAppointment | `GET /doctors/me/appointments`, `GET /appointments/{id}`, `GET /medicines`, `POST /appointments/{id}/complete` |
| pendingBills, recordPayment | `GET /reception/pending-bills`, `POST /bills/{id}/payments` |

## Backend changes made for the integration

No endpoint's workflow, authorisation or validation was changed. Changes are limited to response data, one read-only endpoint, and two SQL typo fixes.

1. **`POST /auth/login`**: the `user` object is now `{accountId, role, userId, name, email}`, the same as `/auth/me`. It previously returned `{Account_id, Password_hash, Role}`, which exposed the password hash. `User_id` was added to the SELECT to build it.
2. **`GET /auth/me`**: adds `name` and `email` (from `Patient` or `Employee`). Changed from `async def` to `def` because it now queries the database.
3. **`GET /patients/me/appointments`**: each row adds `Dept_name`, `prescription` (`{Pres_id, Appointment_id, Pres_date, Notes, Valid_until, medicines[]}` or `null`) and `bill` (`{Bill_id, Appointment_id, Consultation_fee, Bill_amount, Bill_date, Paid_date, Payment_status, Payment_mode}` or `null`). The patient's prescription and bill screens rely on these.
4. **`GET /appointments/{id}`**: for the doctor role only, the response adds `patient` (contact and history fields) and `history` (all of that patient's visits with prescriptions; no bills). The patient-role response is unchanged.
5. **New `GET /medicines`** (authenticated, read-only): `[{Med_id, Med_name, Price}]`. The completion form needs it to pick the `medicineId`s that `complete` already expects.
6. **`POST /appointments/{id}/complete`**: two SQL typos are fixed. The flow is unchanged and matches `transactions/appointment.sql`. Before the fix, every call failed with HTTP 500.
   - `JOIN Employee e ON a.Doctor_id = a.Employee_id` → `= e.Employee_id`
   - the `INSERT INTO Prescription (…, Valid_until values` statement was missing its `)`

## Known backend gaps (not changed)

- Payments are recorded as the full amount in **Cash** only. The endpoint takes no method or amount, so the UI states this.
- No profile-update, doctor-management, "start consultation" or "past patients" endpoints exist, so those screens are read-only or absent.
- `GET /health/db` returns 500 ("Unread result found"): it closes the cursor without fetching the `select 1` row.
- `POST /auth/register` with an email that already has a staff login raises an unhandled IntegrityError (500).
- `triggers/employee.sql` and `triggers/appointment.sql` reference `Technician` and `Admission` tables that aren't in `schema/table.sql`, so those 3 triggers fail to install.
- `schema/table.sql` doesn't drop `AuthAccount`/`AuthSession`, so re-running the seed on an existing database fails on duplicate emails.
