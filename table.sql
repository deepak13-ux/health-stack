-- Requires MySQL 8.0.16+ (CHECK constraints are silently ignored on older versions)
CREATE DATABASE IF NOT EXISTS healthstack;
USE healthstack;

-- Drop in reverse dependency order so the script can be re-run
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

-- -----------------------------------------------------
-- Table: Department
-- -----------------------------------------------------
CREATE TABLE Department (
    Dept_id INT PRIMARY KEY AUTO_INCREMENT,
    Dept_name VARCHAR(100) UNIQUE NOT NULL,
    Description TEXT
);

-- -----------------------------------------------------
-- Table: Employee (Superclass)
-- Role says which subclass table the employee belongs to (enforced by triggers.sql)
-- -----------------------------------------------------
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

-- -----------------------------------------------------
-- Subclass Tables (Inherit from Employee)
-- -----------------------------------------------------
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

-- -----------------------------------------------------
-- Table: Patient
-- -----------------------------------------------------
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

-- -----------------------------------------------------
-- Table: Appointment (Junction between Patient and Doctor)
-- Medical records are kept: a patient or doctor with appointments cannot be deleted
-- -----------------------------------------------------
CREATE TABLE Appointment (
    Appointment_id INT PRIMARY KEY AUTO_INCREMENT,
    Patient_id INT NOT NULL,
    Doctor_id INT NOT NULL,
    Date DATE NOT NULL,
    Time TIME NOT NULL,
    UNIQUE (Doctor_id, Date, Time),
    UNIQUE (Patient_id, Date, Time),
    FOREIGN KEY (Patient_id) REFERENCES Patient(Patient_id) ON DELETE RESTRICT,
    FOREIGN KEY (Doctor_id) REFERENCES Doctor(Employee_id) ON DELETE RESTRICT
);

-- -----------------------------------------------------
-- Table: Prescription
-- -----------------------------------------------------
CREATE TABLE Prescription (
    Pres_id INT PRIMARY KEY AUTO_INCREMENT,
    Appointment_id INT UNIQUE NOT NULL,
    Pres_date DATE NOT NULL,
    FOREIGN KEY (Appointment_id) REFERENCES Appointment(Appointment_id) ON DELETE RESTRICT
);

-- -----------------------------------------------------
-- Table: Medicine
-- -----------------------------------------------------
CREATE TABLE Medicine (
    Med_id INT PRIMARY KEY AUTO_INCREMENT,
    Med_name VARCHAR(100) NOT NULL,
    Price DECIMAL(10, 2) NOT NULL CHECK (Price >= 0)
);

-- -----------------------------------------------------
-- Table: Pres_Details (Junction between Prescription & Medicine)
-- Unit_price is the medicine price when prescribed (set by triggers.sql),
-- so later price changes don't alter old bills
-- -----------------------------------------------------
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

-- -----------------------------------------------------
-- Table: Bill (Invoice for an Appointment)
-- Bill_amount = Consultation_fee + medicine total, computed by triggers.sql;
-- an appointment without a prescription is billed for the consultation only
-- -----------------------------------------------------
CREATE TABLE Bill (
    Bill_id INT PRIMARY KEY AUTO_INCREMENT,
    Appointment_id INT UNIQUE NOT NULL,
    Consultation_fee DECIMAL(10, 2) NOT NULL DEFAULT 0 CHECK (Consultation_fee >= 0),
    Bill_amount DECIMAL(10, 2) NOT NULL DEFAULT 0 CHECK (Bill_amount >= 0),
    Bill_date DATE NOT NULL,
    Payment_mode VARCHAR(50) NOT NULL CHECK (Payment_mode IN ('Cash', 'Card', 'UPI', 'Insurance', 'NetBanking')),
    FOREIGN KEY (Appointment_id) REFERENCES Appointment(Appointment_id) ON DELETE RESTRICT
);
