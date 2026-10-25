-- Disable foreign key checks during creation (if needed for database setup)
-- -----------------------------------------------------
-- Table: Department
-- -----------------------------------------------------
CREATE TABLE Department (
    Dept_id INT PRIMARY KEY AUTO_INCREMENT,
    Dept_name VARCHAR(100) NOT NULL,
    Description TEXT
);

-- -----------------------------------------------------
-- Table: Employee (Superclass)
-- -----------------------------------------------------
CREATE TABLE Employee (
    Employee_id INT PRIMARY KEY AUTO_INCREMENT,
    First_name VARCHAR(50) NOT NULL,
    Last_name VARCHAR(50) NOT NULL,
    Gender VARCHAR(10) CHECK (Gender IN ('Male', 'Female', 'Other')),
    DOB DATE NOT NULL,
    Date_join DATE NOT NULL,
    Mail VARCHAR(100) UNIQUE NOT NULL,
    Salary DECIMAL(10, 2) NOT NULL CHECK (Salary >= 0)
);

-- -----------------------------------------------------
-- Subclass Tables (Inherit from Employee)
-- -----------------------------------------------------
CREATE TABLE Doctor (
    Employee_id INT PRIMARY KEY,
    License_no VARCHAR(50) UNIQUE NOT NULL,
    Dept_id INT,
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
    Gender VARCHAR(10) CHECK (Gender IN ('Male', 'Female', 'Other')),
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
-- -----------------------------------------------------
CREATE TABLE Appointment (
    Appointment_id INT PRIMARY KEY AUTO_INCREMENT,
    Patient_id INT NOT NULL,
    Doctor_id INT NOT NULL,
    Date DATE NOT NULL,
    Time TIME NOT NULL,
    FOREIGN KEY (Patient_id) REFERENCES Patient(Patient_id) ON DELETE CASCADE,
    FOREIGN KEY (Doctor_id) REFERENCES Doctor(Employee_id) ON DELETE CASCADE
);

-- -----------------------------------------------------
-- Table: Prescription
-- -----------------------------------------------------
CREATE TABLE Prescription (
    Pres_id INT PRIMARY KEY AUTO_INCREMENT,
    Appointment_id INT UNIQUE NOT NULL,
    Pres_date DATE NOT NULL,
    FOREIGN KEY (Appointment_id) REFERENCES Appointment(Appointment_id) ON DELETE CASCADE
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
-- -----------------------------------------------------
CREATE TABLE Pres_Details (
    Pres_id INT NOT NULL,
    Med_id INT NOT NULL,
    Dosage VARCHAR(50) NOT NULL,
    Quantity INT NOT NULL CHECK (Quantity > 0),
    Frequency VARCHAR(50) NOT NULL,
    PRIMARY KEY (Pres_id, Med_id),
    FOREIGN KEY (Pres_id) REFERENCES Prescription(Pres_id) ON DELETE CASCADE,
    FOREIGN KEY (Med_id) REFERENCES Medicine(Med_id) ON DELETE RESTRICT
);

-- -----------------------------------------------------
-- Table: Bill (Invoice relationship with Prescription)
-- -----------------------------------------------------
CREATE TABLE Bill (
    Bill_id INT PRIMARY KEY AUTO_INCREMENT,
    Pres_id INT UNIQUE NOT NULL,
    Bill_amount DECIMAL(10, 2) NOT NULL CHECK (Bill_amount >= 0),
    Bill_date DATE NOT NULL,
    Payment_mode VARCHAR(50) NOT NULL CHECK (Payment_mode IN ('Cash', 'Card', 'UPI', 'Insurance', 'NetBanking')),
    FOREIGN KEY (Pres_id) REFERENCES Prescription(Pres_id) ON DELETE RESTRICT
);

