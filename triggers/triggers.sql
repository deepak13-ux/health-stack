DELIMITER //
-- Employees must be adults by the time they join, and cannot have a future
-- date of birth or joining date.
CREATE TRIGGER trg_employee_validate_before_insert
BEFORE INSERT ON Employee
FOR EACH ROW
BEGIN
    IF NEW.DOB >= CURRENT_DATE() THEN
        SIGNAL SQLSTATE '45000'
            SET MESSAGE_TEXT = 'Employee DOB must be in the past';
    END IF;

    IF NEW.Date_join < NEW.DOB OR NEW.Date_join > CURRENT_DATE() THEN
        SIGNAL SQLSTATE '45000'
            SET MESSAGE_TEXT = 'Employee joining date must be after DOB and not in the future';
    END IF;
END //

CREATE TRIGGER trg_employee_validate_before_update
BEFORE UPDATE ON Employee
FOR EACH ROW
BEGIN
    IF NEW.DOB >= CURRENT_DATE() THEN
        SIGNAL SQLSTATE '45000'
            SET MESSAGE_TEXT = 'Employee DOB must be in the past';
    END IF;

    IF NEW.Date_join < NEW.DOB OR NEW.Date_join > CURRENT_DATE() THEN
        SIGNAL SQLSTATE '45000'
            SET MESSAGE_TEXT = 'Employee joining date must be after DOB and not in the future';
    END IF;
END // 

CREATE TRIGGER trg_patient_validate_before_insert
BEFORE INSERT ON Patient
FOR EACH ROW
BEGIN
    IF NEW.DOB >= CURRENT_DATE() THEN
        SIGNAL SQLSTATE '45000'
            SET MESSAGE_TEXT = 'Patient DOB must be in the past';
    END IF;
END //

CREATE TRIGGER trg_patient_validate_before_update
BEFORE UPDATE ON Patient
FOR EACH ROW
BEGIN
    IF NEW.DOB >= CURRENT_DATE() THEN
        SIGNAL SQLSTATE '45000'
            SET MESSAGE_TEXT = 'Patient DOB must be in the past';
    END IF;
END // 

-- The ER diagram marks employee specializations as disjoint. Enforce that an
-- employee can belong to no more than one of the six subtype tables.
CREATE TRIGGER trg_doctor_disjoint_before_insert
BEFORE INSERT ON Doctor
FOR EACH ROW
BEGIN
    IF EXISTS (SELECT 1 FROM Nurse WHERE Employee_id = NEW.Employee_id)
       OR EXISTS (SELECT 1 FROM Ward_boy WHERE Employee_id = NEW.Employee_id)
       OR EXISTS (SELECT 1 FROM Receptionist WHERE Employee_id = NEW.Employee_id)
       OR EXISTS (SELECT 1 FROM Technician WHERE Employee_id = NEW.Employee_id)
       OR EXISTS (SELECT 1 FROM Pharmacist WHERE Employee_id = NEW.Employee_id) THEN
        SIGNAL SQLSTATE '45000'
            SET MESSAGE_TEXT = 'An employee can belong to only one employee subtype';
    END IF;
END //

CREATE TRIGGER trg_doctor_disjoint_before_update
BEFORE UPDATE ON Doctor
FOR EACH ROW
BEGIN
    IF EXISTS (SELECT 1 FROM Nurse WHERE Employee_id = NEW.Employee_id)
       OR EXISTS (SELECT 1 FROM Ward_boy WHERE Employee_id = NEW.Employee_id)
       OR EXISTS (SELECT 1 FROM Receptionist WHERE Employee_id = NEW.Employee_id)
       OR EXISTS (SELECT 1 FROM Technician WHERE Employee_id = NEW.Employee_id)
       OR EXISTS (SELECT 1 FROM Pharmacist WHERE Employee_id = NEW.Employee_id) THEN
        SIGNAL SQLSTATE '45000'
            SET MESSAGE_TEXT = 'An employee can belong to only one employee subtype';
    END IF;
END //

CREATE TRIGGER trg_nurse_disjoint_before_insert
BEFORE INSERT ON Nurse
FOR EACH ROW
BEGIN
    IF EXISTS (SELECT 1 FROM Doctor WHERE Employee_id = NEW.Employee_id)
       OR EXISTS (SELECT 1 FROM Ward_boy WHERE Employee_id = NEW.Employee_id)
       OR EXISTS (SELECT 1 FROM Receptionist WHERE Employee_id = NEW.Employee_id)
       OR EXISTS (SELECT 1 FROM Technician WHERE Employee_id = NEW.Employee_id)
       OR EXISTS (SELECT 1 FROM Pharmacist WHERE Employee_id = NEW.Employee_id) THEN
        SIGNAL SQLSTATE '45000'
            SET MESSAGE_TEXT = 'An employee can belong to only one employee subtype';
    END IF;
END //

CREATE TRIGGER trg_nurse_disjoint_before_update
BEFORE UPDATE ON Nurse
FOR EACH ROW
BEGIN
    IF EXISTS (SELECT 1 FROM Doctor WHERE Employee_id = NEW.Employee_id)
       OR EXISTS (SELECT 1 FROM Ward_boy WHERE Employee_id = NEW.Employee_id)
       OR EXISTS (SELECT 1 FROM Receptionist WHERE Employee_id = NEW.Employee_id)
       OR EXISTS (SELECT 1 FROM Technician WHERE Employee_id = NEW.Employee_id)
       OR EXISTS (SELECT 1 FROM Pharmacist WHERE Employee_id = NEW.Employee_id) THEN
        SIGNAL SQLSTATE '45000'
            SET MESSAGE_TEXT = 'An employee can belong to only one employee subtype';
    END IF;
END //

CREATE TRIGGER trg_ward_boy_disjoint_before_insert
BEFORE INSERT ON Ward_boy
FOR EACH ROW
BEGIN
    IF EXISTS (SELECT 1 FROM Doctor WHERE Employee_id = NEW.Employee_id)
       OR EXISTS (SELECT 1 FROM Nurse WHERE Employee_id = NEW.Employee_id)
       OR EXISTS (SELECT 1 FROM Receptionist WHERE Employee_id = NEW.Employee_id)
       OR EXISTS (SELECT 1 FROM Technician WHERE Employee_id = NEW.Employee_id)
       OR EXISTS (SELECT 1 FROM Pharmacist WHERE Employee_id = NEW.Employee_id) THEN
        SIGNAL SQLSTATE '45000'
            SET MESSAGE_TEXT = 'An employee can belong to only one employee subtype';
    END IF;
END //

CREATE TRIGGER trg_ward_boy_disjoint_before_update
BEFORE UPDATE ON Ward_boy
FOR EACH ROW
BEGIN
    IF EXISTS (SELECT 1 FROM Doctor WHERE Employee_id = NEW.Employee_id)
       OR EXISTS (SELECT 1 FROM Nurse WHERE Employee_id = NEW.Employee_id)
       OR EXISTS (SELECT 1 FROM Receptionist WHERE Employee_id = NEW.Employee_id)
       OR EXISTS (SELECT 1 FROM Technician WHERE Employee_id = NEW.Employee_id)
       OR EXISTS (SELECT 1 FROM Pharmacist WHERE Employee_id = NEW.Employee_id) THEN
        SIGNAL SQLSTATE '45000'
            SET MESSAGE_TEXT = 'An employee can belong to only one employee subtype';
    END IF;
END //

CREATE TRIGGER trg_receptionist_disjoint_before_insert
BEFORE INSERT ON Receptionist
FOR EACH ROW
BEGIN
    IF EXISTS (SELECT 1 FROM Doctor WHERE Employee_id = NEW.Employee_id)
       OR EXISTS (SELECT 1 FROM Nurse WHERE Employee_id = NEW.Employee_id)
       OR EXISTS (SELECT 1 FROM Ward_boy WHERE Employee_id = NEW.Employee_id)
       OR EXISTS (SELECT 1 FROM Technician WHERE Employee_id = NEW.Employee_id)
       OR EXISTS (SELECT 1 FROM Pharmacist WHERE Employee_id = NEW.Employee_id) THEN
        SIGNAL SQLSTATE '45000'
            SET MESSAGE_TEXT = 'An employee can belong to only one employee subtype';
    END IF;
END //

CREATE TRIGGER trg_receptionist_disjoint_before_update
BEFORE UPDATE ON Receptionist
FOR EACH ROW
BEGIN
    IF EXISTS (SELECT 1 FROM Doctor WHERE Employee_id = NEW.Employee_id)
       OR EXISTS (SELECT 1 FROM Nurse WHERE Employee_id = NEW.Employee_id)
       OR EXISTS (SELECT 1 FROM Ward_boy WHERE Employee_id = NEW.Employee_id)
       OR EXISTS (SELECT 1 FROM Technician WHERE Employee_id = NEW.Employee_id)
       OR EXISTS (SELECT 1 FROM Pharmacist WHERE Employee_id = NEW.Employee_id) THEN
        SIGNAL SQLSTATE '45000'
            SET MESSAGE_TEXT = 'An employee can belong to only one employee subtype';
    END IF;
END //

CREATE TRIGGER trg_technician_disjoint_before_insert
BEFORE INSERT ON Technician
FOR EACH ROW
BEGIN
    IF EXISTS (SELECT 1 FROM Doctor WHERE Employee_id = NEW.Employee_id)
       OR EXISTS (SELECT 1 FROM Nurse WHERE Employee_id = NEW.Employee_id)
       OR EXISTS (SELECT 1 FROM Ward_boy WHERE Employee_id = NEW.Employee_id)
       OR EXISTS (SELECT 1 FROM Receptionist WHERE Employee_id = NEW.Employee_id)
       OR EXISTS (SELECT 1 FROM Pharmacist WHERE Employee_id = NEW.Employee_id) THEN
        SIGNAL SQLSTATE '45000'
            SET MESSAGE_TEXT = 'An employee can belong to only one employee subtype';
    END IF;
END //

CREATE TRIGGER trg_technician_disjoint_before_update
BEFORE UPDATE ON Technician
FOR EACH ROW
BEGIN
    IF EXISTS (SELECT 1 FROM Doctor WHERE Employee_id = NEW.Employee_id)
       OR EXISTS (SELECT 1 FROM Nurse WHERE Employee_id = NEW.Employee_id)
       OR EXISTS (SELECT 1 FROM Ward_boy WHERE Employee_id = NEW.Employee_id)
       OR EXISTS (SELECT 1 FROM Receptionist WHERE Employee_id = NEW.Employee_id)
       OR EXISTS (SELECT 1 FROM Pharmacist WHERE Employee_id = NEW.Employee_id) THEN
        SIGNAL SQLSTATE '45000'
            SET MESSAGE_TEXT = 'An employee can belong to only one employee subtype';
    END IF;
END //

CREATE TRIGGER trg_pharmacist_disjoint_before_insert
BEFORE INSERT ON Pharmacist
FOR EACH ROW
BEGIN
    IF EXISTS (SELECT 1 FROM Doctor WHERE Employee_id = NEW.Employee_id)
       OR EXISTS (SELECT 1 FROM Nurse WHERE Employee_id = NEW.Employee_id)
       OR EXISTS (SELECT 1 FROM Ward_boy WHERE Employee_id = NEW.Employee_id)
       OR EXISTS (SELECT 1 FROM Receptionist WHERE Employee_id = NEW.Employee_id)
       OR EXISTS (SELECT 1 FROM Technician WHERE Employee_id = NEW.Employee_id) THEN
        SIGNAL SQLSTATE '45000'
            SET MESSAGE_TEXT = 'An employee can belong to only one employee subtype';
    END IF;
END //

CREATE TRIGGER trg_pharmacist_disjoint_before_update
BEFORE UPDATE ON Pharmacist
FOR EACH ROW
BEGIN
    IF EXISTS (SELECT 1 FROM Doctor WHERE Employee_id = NEW.Employee_id)
       OR EXISTS (SELECT 1 FROM Nurse WHERE Employee_id = NEW.Employee_id)
       OR EXISTS (SELECT 1 FROM Ward_boy WHERE Employee_id = NEW.Employee_id)
       OR EXISTS (SELECT 1 FROM Receptionist WHERE Employee_id = NEW.Employee_id)
       OR EXISTS (SELECT 1 FROM Technician WHERE Employee_id = NEW.Employee_id) THEN
        SIGNAL SQLSTATE '45000'
            SET MESSAGE_TEXT = 'An employee can belong to only one employee subtype';
    END IF;
END //

-- A patient and a doctor can each have at most one appointment at an exact
-- date/time. The schema has no appointment duration, so overlap checks are
-- limited to exact slot collisions.
CREATE TRIGGER trg_appointment_check_slot_before_insert
BEFORE INSERT ON Appointment
FOR EACH ROW
BEGIN
    IF EXISTS (
        SELECT 1
        FROM Appointment
        WHERE `Date` = NEW.`Date`
          AND `Time` = NEW.`Time`
          AND (Doctor_id = NEW.Doctor_id OR Patient_id = NEW.Patient_id)
    ) THEN
        SIGNAL SQLSTATE '45000'
            SET MESSAGE_TEXT = 'The doctor or patient already has an appointment at this date and time';
    END IF;
END //

CREATE TRIGGER trg_appointment_check_slot_before_update
BEFORE UPDATE ON Appointment
FOR EACH ROW
BEGIN
    IF EXISTS (
        SELECT 1
        FROM Appointment
        WHERE `Date` = NEW.`Date`
          AND `Time` = NEW.`Time`
          AND (Doctor_id = NEW.Doctor_id OR Patient_id = NEW.Patient_id)
          AND Appointment_id <> OLD.Appointment_id
    ) THEN
        SIGNAL SQLSTATE '45000'
            SET MESSAGE_TEXT = 'The doctor or patient already has an appointment at this date and time';
    END IF;
END //

CREATE TRIGGER trg_prescription_validate_before_insert
BEFORE INSERT ON Prescription
FOR EACH ROW
BEGIN
    IF EXISTS (
        SELECT 1
        FROM Appointment
        WHERE Appointment_id = NEW.Appointment_id
          AND NEW.Pres_date < `Date`
    ) THEN
        SIGNAL SQLSTATE '45000'
            SET MESSAGE_TEXT = 'Prescription date cannot be before its appointment';
    END IF;
END //

CREATE TRIGGER trg_prescription_validate_before_update
BEFORE UPDATE ON Prescription
FOR EACH ROW
BEGIN
    IF EXISTS (
        SELECT 1
        FROM Appointment
        WHERE Appointment_id = NEW.Appointment_id
          AND NEW.Pres_date < `Date`
    ) THEN
        SIGNAL SQLSTATE '45000'
            SET MESSAGE_TEXT = 'Prescription date cannot be before its appointment';
    END IF;
END //

-- At invoice creation/update, snapshot the current medicine subtotal. Once an
-- invoice exists, its prescription lines are frozen so its amount stays valid.
CREATE TRIGGER trg_bill_calculate_before_insert
BEFORE INSERT ON Bill
FOR EACH ROW
BEGIN
    IF EXISTS (
        SELECT 1
        FROM Prescription
        WHERE Pres_id = NEW.Pres_id
          AND NEW.Bill_date < Pres_date
    ) THEN
        SIGNAL SQLSTATE '45000'
            SET MESSAGE_TEXT = 'Bill date cannot be before its prescription date';
    END IF;

    SET NEW.Bill_amount = (
        SELECT COALESCE(SUM(pd.Quantity * m.Price), 0)
        FROM Pres_Details AS pd
        JOIN Medicine AS m ON m.Med_id = pd.Med_id
        WHERE pd.Pres_id = NEW.Pres_id
    );
END //

CREATE TRIGGER trg_bill_calculate_before_update
BEFORE UPDATE ON Bill
FOR EACH ROW
BEGIN
    IF EXISTS (
        SELECT 1
        FROM Prescription
        WHERE Pres_id = NEW.Pres_id
          AND NEW.Bill_date < Pres_date
    ) THEN
        SIGNAL SQLSTATE '45000'
            SET MESSAGE_TEXT = 'Bill date cannot be before its prescription date';
    END IF;

    SET NEW.Bill_amount = (
        SELECT COALESCE(SUM(pd.Quantity * m.Price), 0)
        FROM Pres_Details AS pd
        JOIN Medicine AS m ON m.Med_id = pd.Med_id
        WHERE pd.Pres_id = NEW.Pres_id
    );
END //

CREATE TRIGGER trg_pres_details_freeze_before_insert
BEFORE INSERT ON Pres_Details
FOR EACH ROW
BEGIN
    IF EXISTS (SELECT 1 FROM Bill WHERE Pres_id = NEW.Pres_id) THEN
        SIGNAL SQLSTATE '45000'
            SET MESSAGE_TEXT = 'Prescription details cannot change after a bill is issued';
    END IF;
END //

CREATE TRIGGER trg_pres_details_freeze_before_update
BEFORE UPDATE ON Pres_Details
FOR EACH ROW
BEGIN
    IF EXISTS (SELECT 1 FROM Bill WHERE Pres_id = OLD.Pres_id)
       OR EXISTS (SELECT 1 FROM Bill WHERE Pres_id = NEW.Pres_id) THEN
        SIGNAL SQLSTATE '45000'
            SET MESSAGE_TEXT = 'Prescription details cannot change after a bill is issued';
    END IF;
END //

CREATE TRIGGER trg_pres_details_freeze_before_delete
BEFORE DELETE ON Pres_Details
FOR EACH ROW
BEGIN
    IF EXISTS (SELECT 1 FROM Bill WHERE Pres_id = OLD.Pres_id) THEN
        SIGNAL SQLSTATE '45000'
            SET MESSAGE_TEXT = 'Prescription details cannot change after a bill is issued';
    END IF;
END //

DELIMITER ;