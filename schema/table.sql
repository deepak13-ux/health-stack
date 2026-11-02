CREATE DATABASE IF NOT EXISTS healthstack;
USE healthstack;

DROP TABLE IF EXISTS Bill;
DROP TABLE IF EXISTS Pres_Details;
DROP TABLE IF EXISTS Medicine;
DROP TABLE IF EXISTS Prescription;
DROP TABLE IF EXISTS Appointment;
DROP TABLE IF EXISTS Patient;
DROP TABLE IF EXISTS Pharmacist;
DROP TABLE IF EXISTS Technician;
DROP TABLE IF EXISTS Receptionist;
DROP TABLE IF EXISTS Ward_boy;
DROP TABLE IF EXISTS Nurse;
DROP TABLE IF EXISTS Doctor;
DROP TABLE IF EXISTS Employee;
DROP TABLE IF EXISTS Department;

CREATE TABLE Department (
    Dept_id INT PRIMARY KEY AUTO_INCREMENT,
    Dept_name VARCHAR(100) UNIQUE NOT NULL,
    Description TEXT
);

CREATE TABLE Employee (
    Employee_id INT PRIMARY KEY AUTO_INCREMENT,
    First_name VARCHAR(50) NOT NULL,
    Last_name VARCHAR(50) NOT NULL,
    Gender VARCHAR(10) NOT NULL CHECK (Gender IN ('Male', 'Female', 'Other')),
    DOB DATE NOT NULL,
    Date_join DATE NOT NULL,
    Mail VARCHAR(100) UNIQUE NOT NULL,
    Salary DECIMAL(10, 2) NOT NULL CHECK (Salary >= 0),
    Role VARCHAR(20) NOT NULL CHECK (Role IN ('Doctor', 'Nurse', 'Ward_boy', 'Receptionist', 'Technician', 'Pharmacist')),
    CHECK (Date_join > DOB)
);

CREATE TABLE Doctor (
    Employee_id INT PRIMARY KEY,
    License_no VARCHAR(50) UNIQUE NOT NULL,
    Dept_id INT,
    Consultation_fee DECIMAL(10, 2) NOT NULL DEFAULT 0 CHECK (Consultation_fee >= 0),
    FOREIGN KEY (Employee_id) REFERENCES Employee(Employee_id) ON DELETE CASCADE,
    FOREIGN KEY (Dept_id) REFERENCES Department(Dept_id) ON DELETE SET NULL
);

CREATE TABLE Nurse (
    Employee_id INT PRIMARY KEY,
    FOREIGN KEY (Employee_id) REFERENCES Employee(Employee_id) ON DELETE CASCADE
);

CREATE TABLE Ward_boy (
    Employee_id INT PRIMARY KEY,
    Ward VARCHAR(50) NOT NULL,
    FOREIGN KEY (Employee_id) REFERENCES Employee(Employee_id) ON DELETE CASCADE
);

CREATE TABLE Receptionist (
    Employee_id INT PRIMARY KEY,
    Desk_no VARCHAR(20) NOT NULL,
    FOREIGN KEY (Employee_id) REFERENCES Employee(Employee_id) ON DELETE CASCADE
);

CREATE TABLE Technician (
    Employee_id INT PRIMARY KEY,
    Skill VARCHAR(100) NOT NULL,
    FOREIGN KEY (Employee_id) REFERENCES Employee(Employee_id) ON DELETE CASCADE
);

CREATE TABLE Pharmacist (
    Employee_id INT PRIMARY KEY,
    FOREIGN KEY (Employee_id) REFERENCES Employee(Employee_id) ON DELETE CASCADE
);

CREATE TABLE Patient (
    Patient_id INT PRIMARY KEY AUTO_INCREMENT,
    First_name VARCHAR(50) NOT NULL,
    Last_name VARCHAR(50) NOT NULL,
    Gender VARCHAR(10) NOT NULL CHECK (Gender IN ('Male', 'Female', 'Other')),
    DOB DATE NOT NULL,
    Mail VARCHAR(100),
    Contact VARCHAR(20) NOT NULL,
    Street VARCHAR(100),
    City VARCHAR(50),
    State VARCHAR(50),
    History TEXT
);

CREATE TABLE Appointment (
    Appointment_id INT PRIMARY KEY AUTO_INCREMENT,
    Patient_id INT NOT NULL,
    Doctor_id INT NOT NULL,
    Date DATE NOT NULL,
    Time TIME NOT NULL,
    Status VARCHAR(20) NOT NULL DEFAULT 'Scheduled' CHECK (Status IN ('Scheduled', 'Completed', 'Cancelled')),
    UNIQUE (Doctor_id, Date, Time),
    UNIQUE (Patient_id, Date, Time),
    FOREIGN KEY (Patient_id) REFERENCES Patient(Patient_id) ON DELETE RESTRICT,
    FOREIGN KEY (Doctor_id) REFERENCES Doctor(Employee_id) ON DELETE RESTRICT
);

CREATE TABLE Prescription (
    Pres_id INT PRIMARY KEY AUTO_INCREMENT,
    Appointment_id INT UNIQUE NOT NULL,
    Pres_date DATE NOT NULL,
    FOREIGN KEY (Appointment_id) REFERENCES Appointment(Appointment_id) ON DELETE RESTRICT
);

CREATE TABLE Medicine (
    Med_id INT PRIMARY KEY AUTO_INCREMENT,
    Med_name VARCHAR(100) NOT NULL,
    Price DECIMAL(10, 2) NOT NULL CHECK (Price >= 0)
);

CREATE TABLE Pres_Details (
    Pres_id INT NOT NULL,
    Med_id INT NOT NULL,
    Dosage VARCHAR(50) NOT NULL,
    Quantity INT NOT NULL CHECK (Quantity > 0),
    Frequency VARCHAR(50) NOT NULL,
    Unit_price DECIMAL(10, 2) NOT NULL DEFAULT 0 CHECK (Unit_price >= 0),
    PRIMARY KEY (Pres_id, Med_id),
    FOREIGN KEY (Pres_id) REFERENCES Prescription(Pres_id) ON DELETE CASCADE,
    FOREIGN KEY (Med_id) REFERENCES Medicine(Med_id) ON DELETE RESTRICT
);

CREATE TABLE Bill (
    Bill_id INT PRIMARY KEY AUTO_INCREMENT,
    Appointment_id INT UNIQUE NOT NULL,
    Consultation_fee DECIMAL(10, 2) NOT NULL DEFAULT 0 CHECK (Consultation_fee >= 0),
    Bill_amount DECIMAL(10, 2) NOT NULL DEFAULT 0 CHECK (Bill_amount >= 0),
    Bill_date DATE NOT NULL,
    Paid_date DATE NULL,
    Payment_status VARCHAR(10) NOT NULL DEFAULT 'Pending' CHECK (Payment_status IN ('Pending', 'Paid')),
    Payment_mode VARCHAR(50) NULL CHECK (Payment_mode IN ('Cash', 'Card', 'UPI', 'Insurance', 'NetBanking')),
    CHECK (Payment_status = 'Pending' OR Payment_mode IS NOT NULL),
    FOREIGN KEY (Appointment_id) REFERENCES Appointment(Appointment_id) ON DELETE RESTRICT
);

CREATE TABLE Ward (
    Ward_id INT PRIMARY KEY AUTO_INCREMENT,
    Ward_name VARCHAR(50) UNIQUE NOT NULL,
    Capacity INT NOT NULL CHECK (Capacity > 0)
);

CREATE TABLE Admission (
    Admission_id INT PRIMARY KEY AUTO_INCREMENT,
    Patient_id INT NOT NULL,
    Ward_id INT NOT NULL,
    Nurse_id INT NOT NULL,
    Admit_date DATE NOT NULL,
    Discharge_date DATE,
    CHECK (Discharge_date IS NULL OR Discharge_date >= Admit_date),
    FOREIGN KEY (Patient_id) REFERENCES Patient(Patient_id) ON DELETE RESTRICT,
    FOREIGN KEY (Ward_id) REFERENCES Ward(Ward_id) ON DELETE RESTRICT,
    FOREIGN KEY (Nurse_id) REFERENCES Nurse(Employee_id) ON DELETE RESTRICT
);