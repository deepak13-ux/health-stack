create database if not exists Healthstack;
use Healthstack;

drop tables if exists Admission;
drop tables if exists Bill;
drop tables if exists Pres_Details;
drop tables if exists Medicine;
drop tables if exists Prescription;
drop tables if exists Appointment;
drop tables if exists Patient;
drop tables if exists Pharmacist;
drop tables if exists Technician;
drop tables if exists Receptionist;
drop tables if exists Ward_boy;
drop tables if exists Ward;
drop tables if exists Nurse;
drop tables if exists Doctor;
drop tables if exists Employee;
drop tables if exists Department;

create table Department (
    Dept_id int,
    Dept_name varchar(100) unique not null,
    Description text,
    Primary key (Dept_id)
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
    Primary key (Employee_id),
    check (Gender in ('Male', 'Female', 'Other')),
    check (Salary >= 0),
    check (Role in ('Doctor', 'Nurse', 'Ward_boy', 'Receptionist', 'Technician', 'Pharmacist')),
    check (Date_join > DOB)
);

create table Doctor (
    Employee_id int,
    License_no varchar(50) unique not null,
    Dept_id int not null,
    Consultation_fee decimal(10, 2) not null default 200,
    Primary key (Employee_id),
    Foreign key (Employee_id) references Employee(Employee_id) on delete cascade,
    Foreign key (Dept_id) references Department(Dept_id) on delete restrict,
    check (Consultation_fee >= 0)
);

create table Nurse (
    Employee_id int,
    Primary key (Employee_id),
    Foreign key (Employee_id) references Employee(Employee_id) on delete cascade
);

create table Ward (
    Ward_id int,
    Ward_name varchar(50) unique not null,
    Capacity int not null,
    Primary key (Ward_id),
    check (Capacity > 0)
);

create table Ward_boy (
    Employee_id int,
    Ward_id int not null,
    Primary key (Employee_id),
    Foreign key (Employee_id) references Employee(Employee_id) on delete cascade,
    Foreign key (Ward_id) references Ward(Ward_id) on delete restrict
);

create table Receptionist (
    Employee_id int,
    Desk_no varchar(20) not null,
    Primary key (Employee_id),
    Foreign key (Employee_id) references Employee(Employee_id) on delete cascade
);

create table Technician (
    Employee_id int,
    Skill varchar(100) not null,
    Primary key (Employee_id),
    Foreign key (Employee_id) references Employee(Employee_id) on delete cascade
);

create table Pharmacist (
    Employee_id int,
    Primary key (Employee_id),
    Foreign key (Employee_id) references Employee(Employee_id) on delete cascade
);

create table Patient (
    Patient_id int,
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
    Primary key (Patient_id),
    check (Gender in ('Male', 'Female', 'Other'))
);

create table Appointment (
    Appointment_id int,
    Patient_id int not null,
    Doctor_id int not null,
    App_date date not null,
    App_time time not null,
    App_status varchar(20) not null default 'Scheduled',
    Active_slot tinyint as (if(App_status = 'Cancelled', null, 1)) stored,
    unique (Doctor_id, App_date, App_time, Active_slot),
    unique (Patient_id, App_date, App_time, Active_slot),
    Primary key (Appointment_id),
    Foreign key (Patient_id) references Patient(Patient_id) on delete restrict,
    Foreign key (Doctor_id) references Doctor(Employee_id) on delete restrict,
    check (App_status in ('Scheduled', 'Completed', 'Cancelled'))
);

create table Prescription (
    Pres_id int,
    Appointment_id int unique not null,
    Pres_date date not null,
    Primary key (Pres_id),
    Foreign key (Appointment_id) references Appointment(Appointment_id) on delete restrict
);

create table Medicine (
    Med_id int,
    Med_name varchar(100) not null,
    Price decimal(10, 2) not null,
    Primary key (Med_id),
    check (Price >= 0)
);

create table Pres_Details (
    Pres_id int not null,
    Med_id int not null,
    Dosage varchar(50) not null,
    Quantity int not null,
    Frequency varchar(50) not null,
    Unit_price decimal(10, 2) not null default 0,
    Primary key (Pres_id, Med_id),
    Foreign key (Pres_id) references Prescription(Pres_id) on delete cascade,
    Foreign key (Med_id) references Medicine(Med_id) on delete restrict,
    check (Quantity > 0),
    check (Unit_price >= 0)
);

create table Bill (
    Bill_id int,
    Appointment_id int unique not null,
    Consultation_fee decimal(10, 2) not null default 200,
    Bill_amount decimal(10, 2) not null default 200,
    Bill_date date not null,
    Paid_date date null,
    Payment_status varchar(10) not null default 'Pending',
    Payment_mode varchar(50) null,
    Primary key (Bill_id),
    Foreign key (Appointment_id) references Appointment(Appointment_id) on delete restrict,
    check (Consultation_fee >= 0),
    check (Bill_amount >= 0),
    check (Payment_status in ('Pending', 'Paid')),
    check (Payment_mode in ('Cash', 'Card', 'UPI', 'Insurance', 'NetBanking')),
    check (Payment_status = 'Pending' or Payment_mode is not null)
);

create table Admission (
    Admission_id int,
    Patient_id int not null,
    Ward_id int not null,
    Nurse_id int not null,
    Admit_date date not null,
    Discharge_date date,
    Primary key (Admission_id),
    Foreign key (Patient_id) references Patient(Patient_id) on delete restrict,
    Foreign key (Ward_id) references Ward(Ward_id) on delete restrict,
    Foreign key (Nurse_id) references Nurse(Employee_id) on delete restrict,
    check (Discharge_date is null or Discharge_date >= Admit_date)
);
