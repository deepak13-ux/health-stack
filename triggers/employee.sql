use healthstack;

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

create trigger trg_technician_role_bi
before insert on Technician
for each row call check_employee_role(new.Employee_id, 'Technician')//

create trigger trg_technician_role_bu
before update on Technician
for each row call check_employee_role(new.Employee_id, 'Technician')//

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
        or exists (select 1 from Technician where Employee_id = old.Employee_id)
        or exists (select 1 from Pharmacist where Employee_id = old.Employee_id)
    ) then
        signal sqlstate '45000'
            set message_text = 'remove the employee from their subclass table before changing role';
    end if;
end//

delimiter ;


