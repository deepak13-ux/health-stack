-- complete BILL
START TRANSACTION
select Payment_status FROM Bill WHERE Bill_id = %s FOR UPDATE

-- IF NOT ROWS OR BILL != Pending - Paid and ROLLBACK
ROLLBACK;
UPDATE Bill SET Payment_status = 'Paid' Payment_mode = 'Cash'
COMMIT;

