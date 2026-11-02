use healthstack;

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