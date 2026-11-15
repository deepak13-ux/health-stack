-- HealthStack: fictional college-project data.
-- Run ONCE on an empty database after backend/schema/table.sql.
-- Optional triggers can be installed before this seed; prescription items precede bills.
-- All seeded login accounts use password: demo123
-- Patient: patient@demo.com | Doctor: doctor@demo.com | Pharmacist: pharmacist@demo.com
-- This script does not delete or overwrite existing records.
USE Healthstack;
SET time_zone = '+05:30';
SET @today = CURDATE();
START TRANSACTION;

-- 1. Departments
INSERT INTO Department (Dept_id, Dept_name, Description) VALUES
(1, 'General Medicine', 'Outpatient consultations and routine follow-up'),
(2, 'Cardiology', 'Heart and cardiovascular care'),
(3, 'Orthopedics', 'Bone, joint and mobility care'),
(4, 'Pediatrics', 'Child health and routine check-ups');

-- 2. Staff: four active doctors, one inactive doctor, nurses and support staff
INSERT INTO Employee (Employee_id, First_name, Last_name, Gender, DOB, Date_join, Mail, Salary, Role, Is_active) VALUES
(101, 'Meera', 'Iyer', 'Female', '1982-05-14', '2015-06-01', 'doctor@demo.com', 120000, 'Doctor', TRUE),
(102, 'Arjun', 'Nair', 'Male', '1980-08-22', '2014-03-15', 'arjun@demo.com', 140000, 'Doctor', TRUE),
(103, 'Sana', 'Qureshi', 'Female', '1986-01-11', '2017-07-01', 'sana@demo.com', 125000, 'Doctor', TRUE),
(104, 'Vikram', 'Joshi', 'Male', '1983-11-03', '2016-02-10', 'vikram@demo.com', 115000, 'Doctor', TRUE),
(105, 'Neha', 'Kapoor', 'Female', '1978-06-20', '2010-04-01', 'neha@demo.com', 110000, 'Doctor', FALSE),
(201, 'Kavya', 'Pillai', 'Female', '1993-03-12', '2020-08-01', 'kavya@demo.com', 42000, 'Nurse', TRUE),
(202, 'Joseph', 'Dsouza', 'Male', '1991-09-18', '2019-05-10', 'joseph@demo.com', 45000, 'Nurse', TRUE),
(301, 'Riya', 'Shah', 'Female', '1990-01-15', '2018-06-01', 'pharmacist@demo.com', 40000, 'Pharmacist', TRUE),
(302, 'Aditya', 'Rao', 'Male', '1994-07-09', '2021-01-10', 'aditya@demo.com', 36000, 'Pharmacist', TRUE),
(401, 'Deepak', 'Sen', 'Male', '1992-04-25', '2020-09-01', 'deepak@demo.com', 22000, 'Ward_boy', TRUE),
(402, 'Manoj', 'Patel', 'Male', '1989-12-07', '2017-11-01', 'manoj@demo.com', 24000, 'Ward_boy', TRUE),
(501, 'Rahul', 'Verma', 'Male', '1995-02-16', '2022-03-01', 'reception@demo.com', 28000, 'Receptionist', TRUE);

INSERT INTO Doctor (Employee_id, License_no, Current_appointment_id, Dept_id, Consultation_fee) VALUES
(101, 'DEMO-GEN-101', NULL, 1, 200),
(102, 'DEMO-CARD-102', NULL, 2, 200),
(103, 'DEMO-ORTHO-103', NULL, 3, 200),
(104, 'DEMO-PED-104', NULL, 4, 200),
(105, 'DEMO-GEN-105', NULL, 1, 200);

INSERT INTO Nurse (Employee_id) VALUES (201), (202);
INSERT INTO Pharmacist (Employee_id) VALUES (301), (302);
INSERT INTO Ward (Ward_id, Ward_name, Capacity) VALUES
(1, 'General Ward', 12), (2, 'Cardiac Ward', 6), (3, 'Pediatric Ward', 8);
INSERT INTO Ward_boy (Employee_id, Ward_id) VALUES (401, 1), (402, 2);
INSERT INTO Receptionist (Employee_id, Desk_no) VALUES (501, 'FRONT-01');
-- Receptionist/nurse records demonstrate the hospital tables; AuthAccount currently
-- supports only patient, doctor and pharmacist logins, so they get no login accounts.

-- 3. Patients
INSERT INTO Patient (Patient_id, First_name, Last_name, Gender, DOB, Mail, Contact, Street, City, State, History) VALUES
(1, 'Aarav', 'Mehta', 'Male', '1998-04-12', 'patient@demo.com', '9000000001', '12 Lake Road', 'Indore', 'Madhya Pradesh', 'Routine outpatient follow-up'),
(2, 'Isha', 'Rao', 'Female', '1991-09-03', 'isha@demo.com', '9000000002', '8 Park Street', 'Indore', 'Madhya Pradesh', 'Previous general consultation'),
(3, 'Kabir', 'Shah', 'Male', '1975-01-22', 'kabir@demo.com', '9000000003', '24 Garden Lane', 'Bhopal', 'Madhya Pradesh', 'Previous joint discomfort consultation'),
(4, 'Naina', 'Desai', 'Female', '1988-11-30', 'naina@demo.com', '9000000004', '5 Station Road', 'Ujjain', 'Madhya Pradesh', NULL),
(5, 'Rohan', 'Kulkarni', 'Male', '2001-06-18', 'rohan@demo.com', '9000000005', '17 Temple Road', 'Indore', 'Madhya Pradesh', 'Previous consultation completed'),
(6, 'Anaya', 'Gupta', 'Female', '2004-02-08', 'anaya@demo.com', '9000000006', '3 Rose Avenue', 'Dewas', 'Madhya Pradesh', 'Follow-up requested'),
(7, 'Vihaan', 'Patel', 'Male', '2016-08-19', 'vihaan@demo.com', '9000000007', '9 School Lane', 'Indore', 'Madhya Pradesh', 'Routine child health check-up'),
(8, 'Diya', 'Menon', 'Female', '1997-12-05', 'diya@demo.com', '9000000008', '42 College Road', 'Bhopal', 'Madhya Pradesh', NULL),
(9, 'Samir', 'Khan', 'Male', '1984-05-27', 'samir@demo.com', '9000000009', '6 River View', 'Indore', 'Madhya Pradesh', NULL),
(10, 'Tara', 'Roy', 'Other', '1999-10-14', 'tara@demo.com', '9000000010', '11 Market Street', 'Ujjain', 'Madhya Pradesh', NULL);

-- 4. Medicine catalog (prices are fictional demo prices)
INSERT INTO Medicine (Med_id, Med_name, Price) VALUES
(1, 'Paracetamol 500 mg tablet', 2.00),
(2, 'Vitamin C tablet', 5.00),
(3, 'Calcium tablet', 10.00),
(4, 'Multivitamin tablet', 5.00),
(5, 'Vitamin D tablet', 10.00),
(6, 'Oral rehydration sachet', 5.00),
(7, 'Zinc tablet', 3.00),
(8, 'Saline nasal drops', 25.00);

-- 5. Appointments: all six possible start times are between 09:00 and 11:30.
INSERT INTO Appointment (Appointment_id, Patient_id, Doctor_id, App_date, App_time, App_status) VALUES
-- Today's doctor queue
(1, 1, 101, @today, '09:00', 'Scheduled'),
(2, 2, 101, @today, '09:30', 'Scheduled'),
(3, 3, 102, @today, '09:00', 'Scheduled'),
(4, 4, 103, @today, '10:00', 'Scheduled'),
-- Future bookings
(5, 1, 101, DATE_ADD(@today, INTERVAL 1 DAY), '09:30', 'Scheduled'),
(6, 5, 102, DATE_ADD(@today, INTERVAL 1 DAY), '10:00', 'Scheduled'),
(7, 6, 103, DATE_ADD(@today, INTERVAL 1 DAY), '11:00', 'Scheduled'),
(8, 7, 104, DATE_ADD(@today, INTERVAL 2 DAY), '09:00', 'Scheduled'),
(9, 8, 101, DATE_ADD(@today, INTERVAL 2 DAY), '11:30', 'Scheduled'),
-- A cancelled slot was successfully rebooked as appointment 5.
(10, 9, 101, DATE_ADD(@today, INTERVAL 1 DAY), '09:30', 'Cancelled'),
-- Completed visits for prescription and bill screens
(11, 1, 101, DATE_SUB(@today, INTERVAL 1 DAY), '09:00', 'Completed'),
(12, 2, 102, DATE_SUB(@today, INTERVAL 1 DAY), '09:30', 'Completed'),
(13, 3, 103, DATE_SUB(@today, INTERVAL 1 DAY), '10:00', 'Completed'),
(14, 4, 104, DATE_SUB(@today, INTERVAL 1 DAY), '10:30', 'Completed'),
(15, 5, 101, DATE_SUB(@today, INTERVAL 10 DAY), '11:00', 'Completed'),
(16, 6, 102, DATE_SUB(@today, INTERVAL 1 DAY), '11:00', 'Completed');

-- Example of a consultation already in progress.
UPDATE Doctor SET Current_appointment_id = 1 WHERE Employee_id = 101;

-- 6. Prescriptions: five running and one expired. Instructions are fictional test data.
INSERT INTO Prescription (Pres_id, Appointment_id, Pres_date, Notes, Valid_until) VALUES
(1, 11, DATE_SUB(@today, INTERVAL 1 DAY), 'Fictional follow-up prescription for demonstration.', DATE_ADD(@today, INTERVAL 5 DAY)),
(2, 12, DATE_SUB(@today, INTERVAL 1 DAY), 'Fictional consultation record; review at next visit.', DATE_ADD(@today, INTERVAL 3 DAY)),
(3, 13, DATE_SUB(@today, INTERVAL 1 DAY), 'Fictional outpatient prescription.', DATE_ADD(@today, INTERVAL 6 DAY)),
(4, 14, DATE_SUB(@today, INTERVAL 1 DAY), 'Observation only. No medicines prescribed in this demo visit.', DATE_ADD(@today, INTERVAL 1 DAY)),
(5, 15, DATE_SUB(@today, INTERVAL 10 DAY), 'Expired prescription for testing the active-prescription filter.', DATE_SUB(@today, INTERVAL 3 DAY)),
(6, 16, DATE_SUB(@today, INTERVAL 1 DAY), 'Fictional follow-up prescription.', DATE_ADD(@today, INTERVAL 4 DAY));

INSERT INTO Pres_Details (Pres_id, Med_id, Dosage, Quantity, Frequency, Unit_price) VALUES
(1, 1, 'Demo instruction A', 10, 'As recorded in demo', 2.00),
(1, 2, 'Demo instruction B', 2, 'As recorded in demo', 5.00),
(2, 3, 'Demo instruction A', 7, 'As recorded in demo', 10.00),
(2, 4, 'Demo instruction B', 10, 'As recorded in demo', 5.00),
(3, 5, 'Demo instruction A', 10, 'As recorded in demo', 10.00),
(5, 6, 'Demo instruction A', 10, 'As recorded in demo', 5.00),
(6, 1, 'Demo instruction A', 6, 'As recorded in demo', 2.00),
(6, 7, 'Demo instruction B', 10, 'As recorded in demo', 3.00);

-- 7. Bill totals = fixed consultation fee 200 + prescription medicine total.
-- Pending bills appear in the reception list. Paid bills appear in patient history.
INSERT INTO Bill (Bill_id, Appointment_id, Consultation_fee, Bill_amount, Bill_date, Paid_date, Payment_status, Payment_mode) VALUES
(1, 11, 200, 230, DATE_SUB(@today, INTERVAL 1 DAY), NULL, 'Pending', NULL),
(2, 12, 200, 320, DATE_SUB(@today, INTERVAL 1 DAY), @today, 'Paid', 'UPI'),
(3, 13, 200, 300, DATE_SUB(@today, INTERVAL 1 DAY), NULL, 'Pending', NULL),
(4, 14, 200, 200, DATE_SUB(@today, INTERVAL 1 DAY), @today, 'Paid', 'Cash'),
(5, 15, 200, 250, DATE_SUB(@today, INTERVAL 10 DAY), DATE_SUB(@today, INTERVAL 9 DAY), 'Paid', 'Card'),
(6, 16, 200, 242, DATE_SUB(@today, INTERVAL 1 DAY), NULL, 'Pending', NULL);

-- 8. Login accounts (password hash generated by the same scrypt settings as helpers.py).
SET @demo_hash = 'scrypt$6430176ca6b59e1a1c52e8f8719571b9$5519ded842a874f4ea9a31a2e576545a7a7b2159a6a150e16f964f6186ae5685dbb857bf005103135af888e3f875ca94280901fc366a985c25f755a8f90ad262';
INSERT INTO AuthAccount (Email, Password_hash, Role, User_id)
SELECT Mail, @demo_hash, 'patient', Patient_id FROM Patient;
INSERT INTO AuthAccount (Email, Password_hash, Role, User_id)
SELECT Mail, @demo_hash, 'doctor', Employee_id FROM Employee WHERE Role = 'Doctor' AND Is_active = TRUE;
INSERT INTO AuthAccount (Email, Password_hash, Role, User_id)
SELECT Mail, @demo_hash, 'pharmacist', Employee_id FROM Employee WHERE Role = 'Pharmacist' AND Is_active = TRUE;

-- Sessions are intentionally empty: log in through /auth/login to create a session.
COMMIT;
