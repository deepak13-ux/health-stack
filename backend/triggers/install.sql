-- Optional reinstall only: table.sql already installs these triggers.
-- Run from the project root.
use Healthstack;

source backend/triggers/employee.sql;
source backend/triggers/date_validation.sql;
source backend/triggers/prescription.sql;
source backend/triggers/billing.sql;
source backend/triggers/appointment.sql;

