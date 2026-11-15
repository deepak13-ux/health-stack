-- BOOK Appointment - ONLY FOR PATIENT
START TRANSACTION
select e.Is_active from Doctor d join Employee e on e.Employee_id = d.Employee_id where d.Employee_id = %s
-- IF no Doctor or Doctor Not Active - RETURN
select Appointment_id from Appointment where Patient_id = %s and App_date = %s and App_time = %s and App_status <> 'Cancelled';
-- IF an appointment exists - RETURN 409: You already have an appointment at this time
insert into Appointment (Patient_id, Doctor_id, App_date, App_time) values (%s, %s, %s, %s)
-- Edge cases handled by UNIQUE constraint for the DATABASE, No rows added if failed
COMMIT

-- Get the patient's appointment for every doctor that are active or inactive both
select a.Appointment_id, a.Doctor_id, a.App_date, time_format(a.App_time, '%H:%i') as App_time, a.App_status, e.First_name, e.Last_name from Appointment a join Employee e on e.Employee_id = a.Doctor_id where a.Patient_id = %s order by a.App_date desc, a.App_time desc


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
