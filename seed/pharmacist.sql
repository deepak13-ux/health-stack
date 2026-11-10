-- Optional fictional pharmacist record. Apply once, then create credentials with register.py.
INSERT INTO Employee (Employee_id,First_name,Last_name,Gender,DOB,Date_join,Mail,Salary,Role)
VALUES (301,'Riya','Shah','Other','1990-01-01','2020-01-01','pharmacist@example.com',25000,'Pharmacist');
INSERT INTO Pharmacist (Employee_id) VALUES (301);
