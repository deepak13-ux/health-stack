-- LOGIN TRANSACTION
START TRANSACTION

SELECT Account_id, Password_hash, Role FROM AuthAccount WHERE Email = <email> AND Role = <role>;

-- IF Not rows - not registered.
ROLLBACK;
-- IF Not verify Password - Incorrect Password
ROLLBACK;

-- Generate token, and hash
INSERT INTO AuthSession (Token_hash, Account_id, Expires_at)
VALUES (<token>, <account_id>, DATE_ADD(UTC_TIMESTAMP(), INTERVAL 1 DAY))
COMMIT; -- Commit when passed


-- Register Transaction
START TRANSACTION
SELECT Patient_id FROM Patient WHERE Mail = <email>
-- IF exisiting email
ROLLBACK;
INSERT INTO Patient (First_name,Last_name,Mail,Contact,DOB,Gender) VALUES (%s,%s,%s,%s,%s,%s)
INSERT INTO AuthAccount (Email,Password_hash,Role,User_id) VALUES (%s,%s,'patient',%s)
INSERT INTO AuthSession (Token_hash,Account_id,Expires_at) VALUES (%s,%s,DATE_ADD(UTC_TIMESTAMP(), INTERVAL 1 DAY))


-- LOGOUT Transaction
-- token = data.get("token")
DELETE FROM AuthSession WHERE Token_hash = token
