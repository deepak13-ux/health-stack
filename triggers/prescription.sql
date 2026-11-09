use healthstack;

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
