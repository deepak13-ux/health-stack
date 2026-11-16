use Healthstack;

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
