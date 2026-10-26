-- Run after table.sql. Requires MySQL 8.0+.
-- Note: MySQL does not fire triggers for rows changed by ON DELETE CASCADE,
-- which is why Prescription has its own delete guard below.
USE healthstack;

DROP PROCEDURE IF EXISTS check_employee_role;
DROP TRIGGER IF EXISTS trg_doctor_role;
DROP TRIGGER IF EXISTS trg_nurse_role;
DROP TRIGGER IF EXISTS trg_ward_boy_role;
DROP TRIGGER IF EXISTS trg_receptionist_role;
DROP TRIGGER IF EXISTS trg_technician_role;
DROP TRIGGER IF EXISTS trg_pharmacist_role;
DROP TRIGGER IF EXISTS trg_employee_role_lock;
DROP TRIGGER IF EXISTS trg_pres_details_bi;
DROP TRIGGER IF EXISTS trg_pres_details_bu;
DROP TRIGGER IF EXISTS trg_pres_details_bd;
DROP TRIGGER IF EXISTS trg_prescription_bi;
DROP TRIGGER IF EXISTS trg_prescription_bd;
DROP TRIGGER IF EXISTS trg_bill_bi;
DROP TRIGGER IF EXISTS trg_bill_bu;
DROP TRIGGER IF EXISTS trg_patient_dob_bi;
DROP TRIGGER IF EXISTS trg_patient_dob_bu;

DELIMITER $$

-- -----------------------------------------------------
-- 1. Each employee belongs to exactly one subclass, matching Employee.Role
-- -----------------------------------------------------
CREATE PROCEDURE check_employee_role(IN p_emp_id INT, IN p_role VARCHAR(20))
BEGIN
    IF NOT EXISTS (SELECT 1 FROM Employee WHERE Employee_id = p_emp_id AND Role = p_role) THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Employee does not exist or has a different Role';
    END IF;
END$$

CREATE TRIGGER trg_doctor_role BEFORE INSERT ON Doctor
FOR EACH ROW CALL check_employee_role(NEW.Employee_id, 'Doctor')$$

CREATE TRIGGER trg_nurse_role BEFORE INSERT ON Nurse
FOR EACH ROW CALL check_employee_role(NEW.Employee_id, 'Nurse')$$

CREATE TRIGGER trg_ward_boy_role BEFORE INSERT ON Ward_boy
FOR EACH ROW CALL check_employee_role(NEW.Employee_id, 'Ward_boy')$$

CREATE TRIGGER trg_receptionist_role BEFORE INSERT ON Receptionist
FOR EACH ROW CALL check_employee_role(NEW.Employee_id, 'Receptionist')$$

CREATE TRIGGER trg_technician_role BEFORE INSERT ON Technician
FOR EACH ROW CALL check_employee_role(NEW.Employee_id, 'Technician')$$

CREATE TRIGGER trg_pharmacist_role BEFORE INSERT ON Pharmacist
FOR EACH ROW CALL check_employee_role(NEW.Employee_id, 'Pharmacist')$$

-- Role can only change once the old subclass row has been removed
CREATE TRIGGER trg_employee_role_lock BEFORE UPDATE ON Employee
FOR EACH ROW
BEGIN
    IF NEW.Role <> OLD.Role AND (
           EXISTS (SELECT 1 FROM Doctor       WHERE Employee_id = OLD.Employee_id)
        OR EXISTS (SELECT 1 FROM Nurse        WHERE Employee_id = OLD.Employee_id)
        OR EXISTS (SELECT 1 FROM Ward_boy     WHERE Employee_id = OLD.Employee_id)
        OR EXISTS (SELECT 1 FROM Receptionist WHERE Employee_id = OLD.Employee_id)
        OR EXISTS (SELECT 1 FROM Technician   WHERE Employee_id = OLD.Employee_id)
        OR EXISTS (SELECT 1 FROM Pharmacist   WHERE Employee_id = OLD.Employee_id)) THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Remove the employee from their subclass table before changing Role';
    END IF;
END$$

-- -----------------------------------------------------
-- 2. Pres_Details: record the price at prescription time; freeze once billed
-- -----------------------------------------------------
CREATE TRIGGER trg_pres_details_bi BEFORE INSERT ON Pres_Details
FOR EACH ROW
BEGIN
    IF EXISTS (SELECT 1 FROM Bill b JOIN Prescription p ON p.Appointment_id = b.Appointment_id
               WHERE p.Pres_id = NEW.Pres_id) THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Prescription is already billed';
    END IF;
    SET NEW.Unit_price = (SELECT Price FROM Medicine WHERE Med_id = NEW.Med_id);
END$$

CREATE TRIGGER trg_pres_details_bu BEFORE UPDATE ON Pres_Details
FOR EACH ROW
BEGIN
    IF EXISTS (SELECT 1 FROM Bill b JOIN Prescription p ON p.Appointment_id = b.Appointment_id
               WHERE p.Pres_id = OLD.Pres_id) THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Prescription is already billed';
    END IF;
    IF NEW.Med_id <> OLD.Med_id THEN
        SET NEW.Unit_price = (SELECT Price FROM Medicine WHERE Med_id = NEW.Med_id);
    ELSE
        SET NEW.Unit_price = OLD.Unit_price;
    END IF;
END$$

CREATE TRIGGER trg_pres_details_bd BEFORE DELETE ON Pres_Details
FOR EACH ROW
BEGIN
    IF EXISTS (SELECT 1 FROM Bill b JOIN Prescription p ON p.Appointment_id = b.Appointment_id
               WHERE p.Pres_id = OLD.Pres_id) THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Prescription is already billed';
    END IF;
END$$

-- -----------------------------------------------------
-- 3. Prescription: date not before the appointment; can't be deleted once billed
-- -----------------------------------------------------
CREATE TRIGGER trg_prescription_bi BEFORE INSERT ON Prescription
FOR EACH ROW
BEGIN
    IF NEW.Pres_date < (SELECT Date FROM Appointment WHERE Appointment_id = NEW.Appointment_id) THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Pres_date is before the appointment date';
    END IF;
END$$

-- Needed because deleting a Prescription cascades to Pres_Details without firing its triggers
CREATE TRIGGER trg_prescription_bd BEFORE DELETE ON Prescription
FOR EACH ROW
BEGIN
    IF EXISTS (SELECT 1 FROM Bill WHERE Appointment_id = OLD.Appointment_id) THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Prescription is already billed';
    END IF;
END$$

-- -----------------------------------------------------
-- 4. Bill: amount is computed, never typed in
-- -----------------------------------------------------
CREATE TRIGGER trg_bill_bi BEFORE INSERT ON Bill
FOR EACH ROW
BEGIN
    IF NEW.Bill_date < (SELECT Date FROM Appointment WHERE Appointment_id = NEW.Appointment_id) THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Bill_date is before the appointment date';
    END IF;
    SET NEW.Consultation_fee = (SELECT d.Consultation_fee
                                FROM Appointment a JOIN Doctor d ON d.Employee_id = a.Doctor_id
                                WHERE a.Appointment_id = NEW.Appointment_id);
    SET NEW.Bill_amount = NEW.Consultation_fee + (SELECT COALESCE(SUM(pd.Quantity * pd.Unit_price), 0)
                                                  FROM Prescription p JOIN Pres_Details pd ON pd.Pres_id = p.Pres_id
                                                  WHERE p.Appointment_id = NEW.Appointment_id);
END$$

-- Payment mode and date may be corrected; the amounts and appointment may not
CREATE TRIGGER trg_bill_bu BEFORE UPDATE ON Bill
FOR EACH ROW
BEGIN
    IF NEW.Appointment_id <> OLD.Appointment_id THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'A bill cannot be moved to another appointment';
    END IF;
    SET NEW.Consultation_fee = OLD.Consultation_fee;
    SET NEW.Bill_amount = OLD.Bill_amount;
END$$

-- -----------------------------------------------------
-- 5. Patient: DOB cannot be in the future (CHECK can't use CURDATE())
-- -----------------------------------------------------
CREATE TRIGGER trg_patient_dob_bi BEFORE INSERT ON Patient
FOR EACH ROW
BEGIN
    IF NEW.DOB > CURDATE() THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'DOB cannot be in the future';
    END IF;
END$$

CREATE TRIGGER trg_patient_dob_bu BEFORE UPDATE ON Patient
FOR EACH ROW
BEGIN
    IF NEW.DOB > CURDATE() THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'DOB cannot be in the future';
    END IF;
END$$

DELIMITER ;
