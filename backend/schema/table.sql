-- This resets the application's tables and data. No separate trigger install is needed.

create database if not exists Healthstack;
use Healthstack;
SET time_zone = '+05:30';

-- Reset login sessions/accounts too, so sourcing both files again works.
drop table if exists AuthSession;
drop table if exists AuthAccount;

drop table if exists Bill;
drop table if exists Pres_Details;
drop table if exists Medicine;
drop table if exists Prescription;
drop table if exists Appointment;
drop table if exists Patient;
drop table if exists Pharmacist;
drop table if exists Receptionist;
drop table if exists Ward_boy;
drop table if exists Ward;
drop table if exists Nurse;
drop table if exists Doctor;
drop table if exists Employee;
drop table if exists Department;

create table Department (
    Dept_id int,
    Dept_name varchar(100) unique not null,
    Description text,
    primary key (Dept_id)
);

create table Employee (
    Employee_id int,
    First_name varchar(50) not null,
    Last_name varchar(50) not null,
    Gender varchar(10) not null,
    DOB date not null,
    Date_join date not null,
    Mail varchar(100) unique not null,
    Salary decimal(10, 2) not null,
    Role varchar(20) not null,
    Is_active boolean not null default true,
    primary key (Employee_id),
    check (Gender in ('Male', 'Female', 'Other')),
    check (Salary >= 0),
    check (Role in ('Doctor', 'Nurse', 'Ward_boy', 'Receptionist', 'Technician', 'Pharmacist')),
    check (Date_join > DOB)
);

create table Doctor (
    Employee_id int,
    License_no varchar(50) unique not null,
    Current_appointment_id int null,
    Dept_id int not null,
    Consultation_fee decimal(10, 2) not null default 200,
    primary key (Employee_id),
    foreign key (Employee_id) references Employee(Employee_id) on delete cascade,
    foreign key (Dept_id) references Department(Dept_id) on delete restrict,
    check (Consultation_fee >= 0)
);

create table Nurse (
    Employee_id int,
    primary key (Employee_id),
    foreign key (Employee_id) references Employee(Employee_id) on delete cascade
);

create table Ward (
    Ward_id int,
    Ward_name varchar(50) unique not null,
    Capacity int not null,
    primary key (Ward_id),
    check (Capacity > 0)
);

create table Ward_boy (
    Employee_id int,
    Ward_id int not null,
    primary key (Employee_id),
    foreign key (Employee_id) references Employee(Employee_id) on delete cascade,
    foreign key (Ward_id) references Ward(Ward_id) on delete restrict
);

create table Receptionist (
    Employee_id int,
    Desk_no varchar(20) not null,
    primary key (Employee_id),
    foreign key (Employee_id) references Employee(Employee_id) on delete cascade
);

create table Pharmacist (
    Employee_id int,
    primary key (Employee_id),
    foreign key (Employee_id) references Employee(Employee_id) on delete cascade
);

create table Patient (
    Patient_id int auto_increment,
    First_name varchar(50) not null,
    Last_name varchar(50) not null,
    Gender varchar(10) not null,
    DOB date not null,
    Mail varchar(100),
    Contact varchar(20) not null,
    Street varchar(100),
    City varchar(50),
    State varchar(50),
    History text,
    primary key (Patient_id),
    check (Gender in ('Male', 'Female', 'Other'))
);

create table Appointment (
    Appointment_id int auto_increment,
    Patient_id int not null,
    Doctor_id int not null,
    App_date date not null,
    App_time time not null,
    App_status varchar(20) not null default 'Scheduled',
    Active_slot tinyint as (if(App_status = 'Cancelled', null, 1)) stored,
    unique (Doctor_id, App_date, App_time, Active_slot),
    unique (Patient_id, App_date, App_time, Active_slot),
    primary key (Appointment_id),
    foreign key (Patient_id) references Patient(Patient_id) on delete restrict,
    foreign key (Doctor_id) references Doctor(Employee_id) on delete restrict,
    check (App_status in ('Scheduled', 'Completed', 'Cancelled'))
);

create table Prescription (
    Pres_id int auto_increment,
    Appointment_id int unique not null,
    Pres_date date not null,
    Notes text,
    Valid_until date not null,
    primary key (Pres_id),
    foreign key (Appointment_id) references Appointment(Appointment_id) on delete restrict
);

create table Medicine (
    Med_id int,
    Med_name varchar(100) not null,
    Price decimal(10, 2) not null,
    primary key (Med_id),
    check (Price >= 0)
);

create table Pres_Details (
    Pres_id int not null,
    Med_id int not null,
    Dosage varchar(50) not null,
    Quantity int not null,
    Frequency varchar(50) not null,
    Unit_price decimal(10, 2) not null default 0,
    primary key (Pres_id, Med_id),
    foreign key (Pres_id) references Prescription(Pres_id) on delete cascade,
    foreign key (Med_id) references Medicine(Med_id) on delete restrict,
    check (Quantity > 0),
    check (Unit_price >= 0)
);

create table Bill (
    Bill_id int auto_increment,
    Appointment_id int unique not null,
    Consultation_fee decimal(10, 2) not null default 200,
    Bill_amount decimal(10, 2) not null default 200,
    Bill_date date not null,
    Paid_date date null,
    Payment_status varchar(10) not null default 'Pending',
    Payment_mode varchar(50) null,
    primary key (Bill_id),
    foreign key (Appointment_id) references Appointment(Appointment_id) on delete restrict,
    check (Consultation_fee >= 0),
    check (Bill_amount >= 0),
    check (Payment_status in ('Pending', 'Paid')),
    check (Payment_mode in ('Cash', 'Card', 'UPI', 'Insurance', 'NetBanking')),
    check (Payment_status = 'Pending' or Payment_mode is not null)
);

CREATE TABLE IF NOT EXISTS AuthAccount (
    Account_id INT AUTO_INCREMENT PRIMARY KEY,
    Email VARCHAR(100) NOT NULL UNIQUE,
    Password_hash VARCHAR(255) NOT NULL,
    Role ENUM('patient','doctor','pharmacist') NOT NULL,
    User_id INT NOT NULL,
    UNIQUE (Role, User_id)
);
-- User_id is Patient.Patient_id for patients, Employee.Employee_id for staff.
CREATE TABLE IF NOT EXISTS AuthSession (
    Token_hash CHAR(64) PRIMARY KEY,
    Account_id INT NOT NULL,
    Expires_at DATETIME NOT NULL,
    FOREIGN KEY (Account_id) REFERENCES AuthAccount(Account_id) ON DELETE CASCADE
);

-- BEGIN INCLUDED TRIGGERS
-- Kept inline so SOURCE works without resolving other file paths.

-- From backend/triggers/employee.sql
drop trigger if exists trg_doctor_disjoint_before_insert;
drop trigger if exists trg_doctor_disjoint_before_update;
drop trigger if exists trg_nurse_disjoint_before_insert;
drop trigger if exists trg_nurse_disjoint_before_update;
drop trigger if exists trg_ward_boy_disjoint_before_insert;
drop trigger if exists trg_ward_boy_disjoint_before_update;
drop trigger if exists trg_receptionist_disjoint_before_insert;
drop trigger if exists trg_receptionist_disjoint_before_update;
drop trigger if exists trg_pharmacist_disjoint_before_insert;
drop trigger if exists trg_pharmacist_disjoint_before_update;
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
drop trigger if exists trg_pharmacist_role;
drop trigger if exists trg_pharmacist_role_bi;
drop trigger if exists trg_pharmacist_role_bu;
drop trigger if exists trg_employee_role_lock;
drop procedure if exists check_employee_role;

delimiter //

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
end//

create trigger trg_doctor_role_bi
before insert on Doctor
for each row call check_employee_role(new.Employee_id, 'Doctor')//

create trigger trg_doctor_role_bu
before update on Doctor
for each row call check_employee_role(new.Employee_id, 'Doctor')//

create trigger trg_nurse_role_bi
before insert on Nurse
for each row call check_employee_role(new.Employee_id, 'Nurse')//

create trigger trg_nurse_role_bu
before update on Nurse
for each row call check_employee_role(new.Employee_id, 'Nurse')//

create trigger trg_ward_boy_role_bi
before insert on Ward_boy
for each row call check_employee_role(new.Employee_id, 'Ward_boy')//

create trigger trg_ward_boy_role_bu
before update on Ward_boy
for each row call check_employee_role(new.Employee_id, 'Ward_boy')//

create trigger trg_receptionist_role_bi
before insert on Receptionist
for each row call check_employee_role(new.Employee_id, 'Receptionist')//

create trigger trg_receptionist_role_bu
before update on Receptionist
for each row call check_employee_role(new.Employee_id, 'Receptionist')//



create trigger trg_pharmacist_role_bi
before insert on Pharmacist
for each row call check_employee_role(new.Employee_id, 'Pharmacist')//

create trigger trg_pharmacist_role_bu
before update on Pharmacist
for each row call check_employee_role(new.Employee_id, 'Pharmacist')//

create trigger trg_employee_role_lock
before update on Employee
for each row
begin
    if new.Role <> old.Role and (
           exists (select 1 from Doctor where Employee_id = old.Employee_id)
        or exists (select 1 from Nurse where Employee_id = old.Employee_id)
        or exists (select 1 from Ward_boy where Employee_id = old.Employee_id)
        or exists (select 1 from Receptionist where Employee_id = old.Employee_id)
        or exists (select 1 from Pharmacist where Employee_id = old.Employee_id)
    ) then
        signal sqlstate '45000'
            set message_text = 'remove the employee from their subclass table before changing role';
    end if;
end//

delimiter ;

-- From backend/triggers/date_validation.sql
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

-- From backend/triggers/prescription.sql
drop trigger if exists trg_pres_details_freeze_before_insert;
drop trigger if exists trg_pres_details_freeze_before_update;
drop trigger if exists trg_pres_details_freeze_before_delete;
drop trigger if exists trg_pres_details_bi;
drop trigger if exists trg_pres_details_bu;
drop trigger if exists trg_pres_details_bd;
drop trigger if exists trg_prescription_bd;

delimiter //

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
end//

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
end//

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
end//

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
end//

delimiter ;

-- From backend/triggers/billing.sql
drop trigger if exists trg_bill_calculate_before_insert;
drop trigger if exists trg_bill_calculate_before_update;
drop trigger if exists trg_bill_bi;
drop trigger if exists trg_bill_bu;

delimiter //

create trigger trg_bill_bi
before insert on Bill
for each row
begin
    if exists (
        select 1
        from Appointment
        where Appointment_id = new.Appointment_id
          and App_status = 'Cancelled'
    ) then
        signal sqlstate '45000'
            set message_text = 'cannot bill a cancelled appointment';
    end if;

    if new.Bill_date < (
        select App_date
        from Appointment
        where Appointment_id = new.Appointment_id
    ) then
        signal sqlstate '45000'
            set message_text = 'bill date cannot be before the appointment date';
    end if;

    set new.Consultation_fee = 200;

    set new.Bill_amount = new.Consultation_fee + (
        select coalesce(sum(pd.Quantity * pd.Unit_price), 0)
        from Prescription as p
        join Pres_Details as pd on pd.Pres_id = p.Pres_id
        where p.Appointment_id = new.Appointment_id
    );
end//

create trigger trg_bill_bu
before update on Bill
for each row
begin
    if new.Appointment_id <> old.Appointment_id then
        signal sqlstate '45000'
            set message_text = 'a bill cannot be moved to another appointment';
    end if;

    if new.Bill_date < (
        select App_date
        from Appointment
        where Appointment_id = new.Appointment_id
    ) then
        signal sqlstate '45000'
            set message_text = 'bill date cannot be before the appointment date';
    end if;

    set new.Consultation_fee = old.Consultation_fee;
    set new.Bill_amount = old.Bill_amount;
end//

delimiter ;

-- From backend/triggers/appointment.sql
drop trigger if exists trg_appointment_bi;
drop trigger if exists trg_appointment_bu;

delimiter //

-- appointments can only be booked with doctors who still work here
create trigger trg_appointment_bi
before insert on Appointment
for each row
begin
    if not exists (
        select 1
        from Employee
        where Employee_id = new.Doctor_id
          and Is_active
    ) then
        signal sqlstate '45000'
            set message_text = 'doctor is no longer active';
    end if;
end//

-- an appointment that already has a prescription or bill cannot be cancelled
create trigger trg_appointment_bu
before update on Appointment
for each row
begin
    if new.Doctor_id <> old.Doctor_id and not exists (
        select 1
        from Employee
        where Employee_id = new.Doctor_id
          and Is_active
    ) then
        signal sqlstate '45000'
            set message_text = 'doctor is no longer active';
    end if;

    if new.App_status = 'Cancelled' and old.App_status <> 'Cancelled' and (
           exists (select 1 from Prescription where Appointment_id = old.Appointment_id)
        or exists (select 1 from Bill where Appointment_id = old.Appointment_id)
    ) then
        signal sqlstate '45000'
            set message_text = 'appointment already has a prescription or bill';
    end if;
end//


delimiter ;
-- END INCLUDED TRIGGERS
