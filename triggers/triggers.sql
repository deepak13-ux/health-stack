use healthstack;

drop trigger if exists trg_employee_validate_before_insert;
drop trigger if exists trg_employee_validate_before_update;
drop trigger if exists trg_patient_validate_before_insert;
drop trigger if exists trg_patient_validate_before_update;
drop trigger if exists trg_doctor_disjoint_before_insert;
drop trigger if exists trg_doctor_disjoint_before_update;
drop trigger if exists trg_nurse_disjoint_before_insert;
drop trigger if exists trg_nurse_disjoint_before_update;
drop trigger if exists trg_ward_boy_disjoint_before_insert;
drop trigger if exists trg_ward_boy_disjoint_before_update;
drop trigger if exists trg_receptionist_disjoint_before_insert;
drop trigger if exists trg_receptionist_disjoint_before_update;
drop trigger if exists trg_technician_disjoint_before_insert;
drop trigger if exists trg_technician_disjoint_before_update;
drop trigger if exists trg_pharmacist_disjoint_before_insert;
drop trigger if exists trg_pharmacist_disjoint_before_update;
drop trigger if exists trg_appointment_check_slot_before_insert;
drop trigger if exists trg_appointment_check_slot_before_update;
drop trigger if exists trg_prescription_validate_before_insert;
drop trigger if exists trg_prescription_validate_before_update;
drop trigger if exists trg_bill_calculate_before_insert;
drop trigger if exists trg_bill_calculate_before_update;
drop trigger if exists trg_pres_details_freeze_before_insert;
drop trigger if exists trg_pres_details_freeze_before_update;
drop trigger if exists trg_pres_details_freeze_before_delete;

drop trigger if exists trg_doctor_role;
drop trigger if exists trg_doctor_role_bi;
drop trigger if exists trg_doctor_role_bu;
drop trigger if exists trg_nurse_role;
drop trigger if exists trg_nurse_role_bi;
drop trigger if exists trg_nurse_role_bu;
drop trigger if exists trg_ward_boy_role;
drop trigger if exists trg_ward_boy_role_bi;
drop trigger if exists trg_ward_boy_role_bu;
drop trigger if exists trg_receptionist_role;
drop trigger if exists trg_receptionist_role_bi;
drop trigger if exists trg_receptionist_role_bu;
drop trigger if exists trg_technician_role;
drop trigger if exists trg_technician_role_bi;
drop trigger if exists trg_technician_role_bu;
drop trigger if exists trg_pharmacist_role;
drop trigger if exists trg_pharmacist_role_bi;
drop trigger if exists trg_pharmacist_role_bu;
drop trigger if exists trg_employee_role_lock;
drop trigger if exists trg_employee_dates_bi;
drop trigger if exists trg_employee_dates_bu;
drop trigger if exists trg_pres_details_bi;
drop trigger if exists trg_pres_details_bu;
drop trigger if exists trg_pres_details_bd;
drop trigger if exists trg_prescription_bi;
drop trigger if exists trg_prescription_bu;
drop trigger if exists trg_prescription_bd;
drop trigger if exists trg_bill_bi;
drop trigger if exists trg_bill_bu;
drop trigger if exists trg_patient_dob_bi;
drop trigger if exists trg_patient_dob_bu;

drop procedure if exists check_employee_role;

DELIMITER //

create procedure check_employee_role(
    in p_emp_id int,
    in p_role varchar(20)
)
begin
    if not exists (
        select 1
        from Employee
        where Employee_id = p_emp_id
          and Role = p_role
    ) then
        signal sqlstate '45000'
            set message_text = 'employee does not exist or has a different role';
    end if;
end //

-- change an employee's role only after removing their old subclass row
create trigger trg_employee_role_lock
before update on Employee
for each row
begin
    if new.Role <> old.Role and (
           exists (select 1 from Doctor where Employee_id = old.Employee_id)
        or exists (select 1 from Nurse where Employee_id = old.Employee_id)
        or exists (select 1 from Ward_boy where Employee_id = old.Employee_id)
        or exists (select 1 from Receptionist where Employee_id = old.Employee_id)
        or exists (select 1 from Technician where Employee_id = old.Employee_id)
        or exists (select 1 from Pharmacist where Employee_id = old.Employee_id)
    ) then
        signal sqlstate '45000'
            set message_text = 'remove the employee from their subclass table before changing role';
    end if;
end //

-- employee dates must be valid, and the employee must be at least 18 when joining
create trigger trg_employee_dates_bi
before insert on Employee
for each row
begin
    if new.DOB >= curdate() then
        signal sqlstate '45000'
            set message_text = 'employee dob must be in the past';
    end if;

    if new.Date_join > curdate() then
        signal sqlstate '45000'
            set message_text = 'employee joining date cannot be in the future';
    end if;

    if new.Date_join < date_add(new.DOB, interval 18 year) then
        signal sqlstate '45000'
            set message_text = 'employee must be at least 18 years old when joining';
    end if;
end //

create trigger trg_employee_dates_bu
before update on Employee
for each row
begin
    if new.DOB >= curdate() then
        signal sqlstate '45000'
            set message_text = 'employee dob must be in the past';
    end if;

    if new.Date_join > curdate() then
        signal sqlstate '45000'
            set message_text = 'employee joining date cannot be in the future';
    end if;

    if new.Date_join < date_add(new.DOB, interval 18 year) then
        signal sqlstate '45000'
            set message_text = 'employee must be at least 18 years old when joining';
    end if;
end //

-- capture the medicine price when a prescription line is added
create trigger trg_pres_details_bi
before insert on Pres_Details
for each row
begin
    if exists (
        select 1
        from Bill as b
        join Prescription as p on p.Appointment_id = b.Appointment_id
        where p.Pres_id = new.Pres_id
    ) then
        signal sqlstate '45000'
            set message_text = 'prescription is already billed';
    end if;

    set new.Unit_price = (
        select Price from Medicine where Med_id = new.Med_id
    );
end //

-- keep billed prescription lines fixed; changing the medicine captures its current price
create trigger trg_pres_details_bu
before update on Pres_Details
for each row
begin
    if exists (
        select 1
        from Bill as b
        join Prescription as p on p.Appointment_id = b.Appointment_id
        where p.Pres_id = old.Pres_id
    ) or exists (
        select 1
        from Bill as b
        join Prescription as p on p.Appointment_id = b.Appointment_id
        where p.Pres_id = new.Pres_id
    ) then
        signal sqlstate '45000'
            set message_text = 'prescription is already billed';
    end if;

    if new.Med_id <> old.Med_id then
        set new.Unit_price = (
            select Price from Medicine where Med_id = new.Med_id
        );
    else
        set new.Unit_price = old.Unit_price;
    end if;
end //

create trigger trg_pres_details_bd
before delete on Pres_Details
for each row
begin
    if exists (
        select 1
        from Bill as b
        join Prescription as p on p.Appointment_id = b.Appointment_id
        where p.Pres_id = old.Pres_id
    ) then
        signal sqlstate '45000'
            set message_text = 'prescription is already billed';
    end if;
end //

-- a prescription cannot be dated before its appointment
create trigger trg_prescription_bi
before insert on Prescription
for each row
begin
    if exists (
        select 1
        from Appointment
        where Appointment_id = new.Appointment_id
          and new.Pres_date < `Date`
    ) then
        signal sqlstate '45000'
            set message_text = 'prescription date cannot be before the appointment date';
    end if;
end //

create trigger trg_prescription_bu
before update on Prescription
for each row
begin
    if exists (
        select 1
        from Appointment
        where Appointment_id = new.Appointment_id
          and new.Pres_date < `Date`
    ) then
        signal sqlstate '45000'
            set message_text = 'prescription date cannot be before the appointment date';
    end if;
end //

-- prevent a billed prescription from being deleted
create trigger trg_prescription_bd
before delete on Prescription
for each row
begin
    if exists (
        select 1
        from Bill
        where Appointment_id = old.Appointment_id
    ) then
        signal sqlstate '45000'
            set message_text = 'prescription is already billed';
    end if;
end //

-- calculate the bill when it is created; later edits must not change its amount
create trigger trg_bill_bi
before insert on Bill
for each row
begin
    if new.Bill_date < (
        select `Date`
        from Appointment
        where Appointment_id = new.Appointment_id
    ) then
        signal sqlstate '45000'
            set message_text = 'bill date cannot be before the appointment date';
    end if;

    set new.Consultation_fee = (
        select d.Consultation_fee
        from Appointment as a
        join Doctor as d on d.Employee_id = a.Doctor_id
        where a.Appointment_id = new.Appointment_id
    );

    set new.Bill_amount = new.Consultation_fee + (
        select coalesce(sum(pd.Quantity * pd.Unit_price), 0)
        from Prescription as p
        join Pres_Details as pd on pd.Pres_id = p.Pres_id
        where p.Appointment_id = new.Appointment_id
    );
end //

create trigger trg_bill_bu
before update on Bill
for each row
begin
    if new.Appointment_id <> old.Appointment_id then
        signal sqlstate '45000'
            set message_text = 'a bill cannot be moved to another appointment';
    end if;

    if new.Bill_date < (
        select `Date`
        from Appointment
        where Appointment_id = new.Appointment_id
    ) then
        signal sqlstate '45000'
            set message_text = 'bill date cannot be before the appointment date';
    end if;

    set new.Consultation_fee = old.Consultation_fee;
    set new.Bill_amount = old.Bill_amount;
end //

-- a patient's date of birth cannot be in the future
create trigger trg_patient_dob_bi
before insert on Patient
for each row
begin
    if new.DOB > curdate() then
        signal sqlstate '45000'
            set message_text = 'dob cannot be in the future';
    end if;
end //

create trigger trg_patient_dob_bu
before update on Patient
for each row
begin
    if new.DOB > curdate() then
        signal sqlstate '45000'
            set message_text = 'dob cannot be in the future';
    end if;
end //

DELIMITER ;
