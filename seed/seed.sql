-- Departments
INSERT INTO Department (Dept_id, Dept_name, Description) VALUES
(1, 'Cardiology', 'Heart and cardiovascular care'),
(2, 'Neurology', 'Brain and nervous system treatment');

-- Employees & Subclasses
INSERT INTO Employee (Employee_id, First_name, Last_name, Gender, DOB, Date_join, Mail, Salary, Role) VALUES
(101, 'Arjun', 'Mehta', 'Male', '1982-05-14', '2015-06-01', 'arjun.mehta@healthstack.com', 120000.00, 'Doctor'),
(102, 'Priya', 'Sharma', 'Female', '1990-08-22', '2018-03-15', 'priya.sharma@healthstack.com', 95000.00, 'Doctor');

INSERT INTO Doctor (Employee_id, License_no, Dept_id, Consultation_fee) VALUES
(101, 'MED-CARD-8832', 1, 800.00),
(102, 'MED-NEUR-4410', 2, 700.00);

-- Medicines
INSERT INTO Medicine (Med_id, Med_name, Price) VALUES
(1, 'Atorvastatin 10mg', 15.50),
(2, 'Aspirin 75mg', 5.00),
(3, 'Neurobion Forte', 12.00);
