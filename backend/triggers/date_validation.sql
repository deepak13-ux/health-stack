use Healthstack;

drop trigger if exists trg_employee_validate_before_insert;
drop trigger if exists trg_employee_validate_before_update;
drop trigger if exists trg_patient_validate_before_insert;
drop trigger if exists trg_patient_validate_before_update;
drop trigger if exists trg_prescription_validate_before_insert;
drop trigger if exists trg_prescription_validate_before_update;
drop trigger if exists trg_employee_dates_bi;
drop trigger if exists trg_employee_dates_bu;
drop trigger if exists trg_patient_dob_bi;
drop trigger if exists trg_patient_dob_bu;
drop trigger if exists trg_prescription_bi;
drop trigger if exists trg_prescription_bu;

delimiter //

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
end//

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
end//

create trigger trg_patient_dob_bi
before insert on Patient
for each row
begin
    if new.DOB > curdate() then
        signal sqlstate '45000'
            set message_text = 'dob cannot be in the future';
    end if;
end//

create trigger trg_patient_dob_bu
before update on Patient
for each row
begin
    if new.DOB > curdate() then
        signal sqlstate '45000'
            set message_text = 'dob cannot be in the future';
    end if;
end//

create trigger trg_prescription_bi
before insert on Prescription
for each row
begin
    if exists (
        select 1
        from Appointment
        where Appointment_id = new.Appointment_id
          and App_status = 'Cancelled'
    ) then
        signal sqlstate '45000'
            set message_text = 'cannot prescribe for a cancelled appointment';
    end if;

    if exists (
        select 1
        from Appointment
        where Appointment_id = new.Appointment_id
          and new.Pres_date < App_date
    ) then
        signal sqlstate '45000'
            set message_text = 'prescription date cannot be before the appointment date';
    end if;
end//

create trigger trg_prescription_bu
before update on Prescription
for each row
begin
    if exists (
        select 1
        from Appointment
        where Appointment_id = new.Appointment_id
          and App_status = 'Cancelled'
    ) then
        signal sqlstate '45000'
            set message_text = 'cannot prescribe for a cancelled appointment';
    end if;

    if exists (
        select 1
        from Appointment
        where Appointment_id = new.Appointment_id
          and new.Pres_date < App_date
    ) then
        signal sqlstate '45000'
            set message_text = 'prescription date cannot be before the appointment date';
    end if;
end//

delimiter ;
