# Careflow — Hospital Database Management System

## Complete frontend design and AI implementation specification

Version 1.0 • 2 November 2026 • Web application • College-project scope

## 1. How to use this document

Give this entire Markdown file to a coding AI as project context, then use the implementation prompt in section 18. This is the authoritative design and interaction contract. It specifies the complete frontend; it is not a set of existing Figma screen frames or working source code. Implement every route, shared component, form, state and cross-module update described here.

If no repository exists, use React + TypeScript + Vite, React Router, Tailwind CSS, accessible headless UI primitives, Lucide icons and Recharts. These are proposed implementation choices, not version-specific API instructions. Use the versions already installed in an existing project. Keep domain logic in a mock repository layer so real APIs can replace it later. Do not introduce a server just to demonstrate the frontend.

Design intent: a calm, capable staff workspace. Make daily hospital administration easy to scan and act on. Use pale blue for orientation, lime for a few optimistic highlights, navy for readable content and blue for primary actions. Prioritize tables, clear forms and linked records.

Assumptions: one hospital, English interface, Indian context, INR amounts, Asia/Kolkata hospital timezone, staff-only desktop-first application. Name the example hospital “Careflow Community Hospital.” All sample people and records must be fictional.

## 2. Scope and roles

Build these modules: Overview, Patients, Appointments, Doctors, Admissions & beds, Billing, Reports and Settings. Include sign-in, access-denied and not-found screens.

Exclude from this first version: pharmacy inventory, labs, insurance claims, payroll, ambulance dispatch, patient portal, video consultation, diagnosis suggestions and clinical decision support. A patient history timeline contains administrative events and manually entered visit notes only.

| Role          | Allowed frontend actions                                                                                   |
| ------------- | ---------------------------------------------------------------------------------------------------------- |
| Administrator | All modules, doctor editing, reports and hospital settings                                                 |
| Receptionist  | Overview, patients, appointments, read-only doctors, admissions, billing; own profile settings             |
| Doctor        | Own schedule, patient records linked to own appointments/admissions, own visit notes; own profile settings |

Use role-based navigation and route guards. Doctors' dashboard counts must use their own authorized record set and replace hospital billing/occupancy cards with “My appointments” and “Patients seen.” Hidden controls are not backend authorization: the demo role switcher demonstrates UI behavior only. Mark the demo session clearly.

## 3. Visual direction and tokens

Use light mode only for v1. Avoid large gradient hero banners, glass effects, decorative medical photography, excessive charts and floating cards with heavy shadows. This is a practical operations app.

### Color contract

| CSS token                    | Value             | Purpose                                                |
| ---------------------------- | ----------------- | ------------------------------------------------------ |
| --canvas                     | #F5F9FC           | Main page background                                   |
| --surface                    | #FFFFFF           | Cards, tables, dialogs                                 |
| --surface-blue               | #EAF5FF           | Active navigation, icon tiles, secondary panels        |
| --blue-border                | #C9E5FA           | Selected rows and blue panel borders                   |
| --primary                    | #1768AC           | Primary actions and links                              |
| --primary-hover              | #12558E           | Primary hover                                          |
| --primary-pressed            | #0F4676           | Primary pressed                                        |
| --lime                       | #D9F279           | Accent strip, occupancy highlight, small accent button |
| --lime-hover                 | #CEE964           | Lime hover                                             |
| --lime-ink                   | #334513           | Text on lime backgrounds                               |
| --ink                        | #17324D           | Headings, body and lime-button text alternative        |
| --muted                      | #52677B           | Secondary text                                         |
| --border                     | #DCE6EE           | Subtle dividers                                        |
| --control-border             | #7A8FA3           | Input outlines and interactive boundaries              |
| --focus                      | #1768AC           | 2px focus outline with 2px white offset                |
| --success-bg / --success-ink | #EAF6ED / #24633A | Completed, paid, available                             |
| --warning-bg / --warning-ink | #FFF4D6 / #785400 | Waiting, partial payment                               |
| --danger-bg / --danger-ink   | #FDEDEE / #A12B35 | Cancelled, overdue, errors                             |
| --neutral-bg / --neutral-ink | #EDF2F6 / #43586B | Scheduled or archived                                  |

Blue buttons use white text. Lime buttons use lime-ink text; lime is never used as body text on white. Status is always written in words alongside any color. Surface borders are decorative; use control-border where the boundary identifies an input. Verify WCAG AA contrast during implementation.

### Type, spacing and shape

Use Inter with system sans-serif fallback; the layout must remain usable without a webfont.
| Style | Size / line height | Weight |
| --- | --- | --- |
| Page title | 28 / 36px | 600 |
| Section title | 18 / 26px | 600 |
| Card metric | 30 / 38px | 600 |
| Body and controls | 14 / 22px | 400; controls 500 |
| Table header / label | 12 / 18px | 600 |
| Helper text | 12 / 18px | 400 |

Use tabular numbers for metrics, money, IDs and times. Spacing scale: 4, 8, 12, 16, 20, 24, 32, 40, 48px. Card radius 16px; inputs/buttons 10px; badges fully rounded; dialogs 20px. Border 1px. Default cards have no shadow; floating menus use 0 8px 24px rgba(23,50,77,0.12). Use 20px outline icons with consistent stroke weight.

## 4. Global layout

At the 1440 × 1000 reference viewport:

- Sidebar: fixed 232px wide, full viewport height, white, 1px right divider.
- Topbar: fixed height 72px, begins after sidebar, white, bottom divider.
- Main: begins at x=232, y=72; padding 32px; usable width 1144px. Maximum inner width 1440px on larger screens, centered.
- Sidebar logo: 36px rounded blue tile with white plus, “Careflow” at 20px semibold, “Hospital workspace” at 11px muted.
- Nav item height 44px, horizontal margin 16px, gap 4px; icon then label. Active: surface-blue, primary text, 3px blue inset stripe. Order: Overview, Patients, Appointments, Doctors, Admissions & beds, Billing, Reports; Settings anchored near bottom.
- Bottom sidebar: pale lime “Demo workspace” panel, small “Fictional data” label, then account summary.
- Topbar left: breadcrumb. Right: “Asia/Kolkata” timezone label and avatar menu containing My profile and Sign out. Do not add a notification icon with no implemented destination.
- Page header: title and one sentence on the left; one blue primary CTA and at most one secondary action on the right; bottom margin 24px.

Use CSS grid for page composition and flex for aligned groups. Tables sit inside white bordered cards. Keep the main viewport vertically scrollable; sticky table headers are allowed inside bounded table containers.

### Responsive contract

| Width       | Behavior                                                                                                          |
| ----------- | ----------------------------------------------------------------------------------------------------------------- |
| ≥1280px     | 232px sidebar; 4 KPI columns; two-column detail layouts                                                           |
| 1024–1279px | 80px icon sidebar with tooltips and accessible names; 24px content padding                                        |
| 768–1023px  | Sidebar replaced by menu drawer; 2 KPI columns; detail layouts stack                                              |
| <768px      | 16px padding; one column; 56px topbar; full-screen form dialogs; filters collapse into a button with active count |

At 390px, page headers stack and primary CTA stretches to width. Convert patient and doctor lists to record cards. Billing/report tables may scroll horizontally inside a labelled region; the whole page must not overflow. Appointment day view becomes a chronological list. Bed cards become one column. Touch targets at least 44px.

## 5. Reusable component contract

| Component                   | Required behavior                                                                                                                          |
| --------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------ |
| AppShell / Sidebar / Topbar | Route-aware nav, responsive drawer, avatar menu, demo-role label                                                                           |
| PageHeader                  | Title, description, optional breadcrumb, primary and secondary CTA slots                                                                   |
| Button                      | Primary blue, secondary white outlined, ghost, danger; lime only for designated dashboard quick action; pending spinner and disabled state |
| FormField                   | Persistent label, required marker, helper/error text, correctly associated input                                                           |
| SearchableSelect            | Keyboard navigation, typed filtering, empty result, clear selection                                                                        |
| SearchInput                 | Label or accessible name, clear button, 250ms debounced local filtering                                                                    |
| DataTable                   | Sorting, pagination, no results, loading skeleton, error and retry; labelled row actions                                                   |
| FilterBar                   | Search, dropdowns/date range, active filter chips, Clear filters                                                                           |
| StatusBadge                 | Human-readable text and semantic colors                                                                                                    |
| MetricCard                  | Label, value, short explanation, icon tile; clickable only if it navigates                                                                 |
| Tabs                        | Keyboard accessible; active indicator blue; content follows route/query state                                                              |
| Dialog / Drawer             | Focus trap, Escape, close button, return focus to trigger; dirty-form confirmation                                                         |
| ConfirmDialog               | Specific action label; contextual explanation; default focus on Cancel for destructive actions                                             |
| Toast                       | Saved confirmation via aria-live; actionable errors also appear inline                                                                     |
| EmptyState                  | Specific explanation and appropriate CTA                                                                                                   |
| DatePicker / TimeSlotPicker | Keyboard input alternative and hospital timezone                                                                                           |
| MoneyInput / Currency       | Store paise integers; format en-IN INR; no floating-point total drift                                                                      |
| ChartCard                   | Legend, labelled tooltip, equivalent text summary/data table                                                                               |
| PatientIdentity             | Initials avatar, full name, record ID, demographic secondary line                                                                          |
| ErrorBoundary               | Friendly error, Reload view action; no stack trace in product UI                                                                           |

Controls: default height 44px, horizontal padding 16px; compact table controls may be 36px on pointer devices. Textarea minimum height 96px. Inputs show 1px control-border; focus adds the specified outline. Disabled buttons use native disabled plus visible text, not opacity alone.

Pagination: 10/25/50 page size, default 10; “1–10 of 48”; previous/next buttons. Reset page to 1 after filtering. Sort defaults are specified per screen. Store search, filters, tab, sort and page in URL query parameters; browser Back restores them.

## 6. Routes and screen inventory

| Route                    | Screen                                    | Access                                      |
| ------------------------ | ----------------------------------------- | ------------------------------------------- |
| /login                   | Demo sign-in                              | Public                                      |
| /overview                | Overview                                  | All roles, scoped                           |
| /patients                | Patient directory                         | Admin, receptionist                         |
| /patients/:patientId     | Patient profile                           | Admin, receptionist, assigned doctor        |
| /appointments            | Day/list schedule                         | All roles, scoped                           |
| /doctors                 | Doctor directory                          | Admin, receptionist                         |
| /doctors/:doctorId       | Doctor profile                            | Admin, receptionist; own profile for doctor |
| /admissions              | Admissions and beds tabs                  | Admin, receptionist                         |
| /admissions/:admissionId | Admission details                         | Admin, receptionist, assigned doctor        |
| /billing                 | Invoice directory                         | Admin, receptionist                         |
| /billing/:invoiceId      | Invoice details                           | Admin, receptionist                         |
| /reports                 | Operational reports                       | Admin                                       |
| /settings                | Profile; hospital configuration for admin | All roles                                   |
| /403                     | Access denied                             | Signed in                                   |
| /\*                      | Not found                                 | Any                                         |

Navigate / to the authorized overview. Direct URLs must resolve correctly on refresh. Missing records show “Record not found” with a relevant back action; unauthorized records show access denied without revealing their name.

## 7. Screen-by-screen design

### 7.1 Sign-in

Use a 45/55 split desktop layout. Left: pale blue field, Careflow logo, “A clearer day at the hospital.” and a short list: Patients organized; Appointments coordinated; Billing connected. Add a small lime rounded shape as decoration, not a large illustration.
Right: centered 400px-wide white form panel with “Welcome to Careflow”, hospital name, role selector and “Enter demo workspace.” Default role Receptionist; options Administrator, Receptionist, Doctor. Doctor role additionally chooses one seeded doctor. No password field because this version has no real authentication. Show “Demo access · fictional data” below.
At mobile widths show only logo, intro sentence and form. Selecting a role changes no records. Sign out clears the session and returns here; persisted demo records remain.

### 7.2 Overview

Header: “Overview”; description “Here’s what’s happening at the hospital today.” CTA “Book appointment”. Today means hospital-local date from one shared clock helper.
First row: four equal metric cards, 16px gaps:

1. Today’s appointments: all non-cancelled appointments today; sublabel checked-in count.
2. Registered patients: count of active patients; sublabel “Active records”.
3. Beds available: available bed count; sublabel occupied / total.
4. Collected today: sum of payments recorded today; sublabel “Recorded payments”.
   No fabricated percentage comparisons.

Second row: 24px gap; 744px left and 376px right at reference size.
Left card “Today’s appointments”: time, patient, doctor, department, status; up to 5 rows; “View schedule” link.
Right card pale blue “Bed occupancy”: occupied/total number, 10px progress bar with blue occupied fill and neutral remaining track; per-ward counts, “View beds”.
Third row: same columns. Left “Appointments this week” compact seven-day bar chart in blue, lime only for today. Right “Quick actions”: Register patient (lime button), Book appointment, Create invoice (white outlined).
Doctor variant: four KPIs My appointments today, Waiting patients, Patients seen today, Upcoming appointments (next 7 days); own schedule replaces bed panel; quick actions are View my schedule and Open patient record via a scoped patient picker.

### 7.3 Patient directory and registration

Header “Patients”; description “Find records and manage patient details.” CTA “Register patient”.
Filter bar: search name/record ID/phone; status Active/Archived/All; gender; Clear filters.
Columns: patient identity (name + ID), age/gender, phone, latest non-cancelled visit date, record status, actions. Default sort newest created first. Name opens profile. Row menu: View, Edit, Archive. Archive disabled while patient has active admission; no hard-delete action.

Register/edit: right drawer 560px wide desktop, full-screen mobile. Sections:

- Personal: full name required (2–80 trimmed characters); date of birth required (not future); gender required (Female, Male, Other, Prefer not to say); blood group optional including Unknown.
- Contact: phone required (10 digits for this demo, optional +91 normalized); email optional valid format; address optional multiline.
- Emergency contact: name, relationship, phone; all optional, but if any entered require name and phone.
- Medical summary: allergies optional text; chronic conditions optional text. Empty allergies means “Not recorded”, not “No known allergies”.
  Footer sticky Cancel / Register patient or Save changes. Generate immutable MRN on creation, e.g. CF-P-0001; no manual MRN input. Compute age from DOB.
  Duplicate phone: show matching record names and require explicit “Continue as separate patient”; never assume phone uniquely identifies a person.
  Successful registration closes drawer, shows toast and opens new patient profile.

### 7.4 Patient profile

Breadcrumb Patients / CF-P-0001. Header contains avatar, name, ID, computed age, gender, blood group or Not recorded. Buttons Edit details, Book appointment; overflow Archive/Restore.
Below: allergy panel if allergies recorded, using a small warning icon and text.
Desktop grid: 320px left patient summary card and flexible right panel. Left includes contact, emergency contact, medical summary, registration date and record status.
Right tabs:

- Overview: upcoming appointment card and administrative/visit-note timeline sorted newest first.
- Appointments: patient-filtered appointment table with Book appointment.
- Admissions: prior/active admissions with ward, bed, dates, status.
- Billing: linked invoices with amounts and balances (admin/receptionist only).
  Doctor sees notes composer “Add visit note” with required visit date and free text, only on assigned patient. Author and time are immutable. Notes are plain text, no diagnosis generation. Receptionist cannot create/edit notes.
  Do not show fake vital signs or random clinical graphs.

### 7.5 Appointments

Header “Appointments”; description “Coordinate visits and keep the day moving.” CTA Book appointment.
Toolbar: date picker with Today/previous/next; Day/List segmented switch; doctor and department filters; status filter; patient search.
Default Day is selected hospital-local date. Day view has 30-minute slots, 09:00–17:00, one column per filtered doctor, max 4 columns visible with internal horizontal scrolling. Appointment cards contain start time, patient name, type and status. List view columns: date/time, patient, doctor, department, visit type, status, actions.
Appointment types: New consultation, Follow-up. Duration fixed 30 minutes.
Book dialog 640px: patient searchable select (required), link Register patient, department required, doctor required filtered by department, date required, available time slot required, visit type required, optional reason (max 300 characters). If opened from patient profile prefill patient. Registration opened from booking returns the new patient selection to the booking form.
Only offer slots within doctor's configured weekly schedule, excluding lunch and occupied slots. Reject double booking both for same doctor and overlapping appointments for same patient. Recheck when saving, not only when opening picker. Block booking archived patients and inactive doctors.
No past booking from normal flow; reschedule must choose a future slot. Seed completed past visits separately.
State transitions: Scheduled → Checked in → In consultation → Completed. Scheduled or Checked in → Cancelled; Scheduled → No-show only after appointment end. Terminal statuses cannot be reopened in v1. Cancel requires confirmation and optional reason; cancellation frees the slot.
Reschedule preserves appointment ID and changes date/time after validation. Row actions vary by status and role. Receptionist checks in/cancels/reschedules; doctors start/complete their own visits; admin can perform all transitions. Cancellation does not erase invoice history.
Empty day: “No appointments for this day.” CTA Book appointment. Fully occupied doctor: “No available slots. Choose another doctor or date.”

### 7.6 Doctor directory and profile

Header Doctors; CTA Add doctor (admin only). Filters name/specialty, department, Active/Inactive.
Use table with initials avatar, name, specialty, department, consultation fee, today’s booked slots, status. Default alphabetical. Read-only row opens profile.
Profile has contact/qualification summary, weekly availability card and upcoming appointments table.
Admin form: name, department, specialty, qualification, phone, email, consultation fee (nonnegative), status. Required: name, department, specialty, phone, fee. Weekly editor: Mon–Sat rows, day enabled checkbox, start/end (default 09:00–17:00), lunch 13:00–14:00; Sunday off. Require ordered, non-overlapping ranges and multiples of 30 minutes.
Updating availability cannot silently invalidate future bookings: block conflicting changes and list affected appointments to reschedule. Deactivating doctor blocked while they have future non-terminal appointments or active admissions. Receptionist sees no edit control.

### 7.7 Admissions & beds

Header “Admissions & beds”; CTA Admit patient.
Tabs Admissions / Bed board.
Admissions table: admission ID, patient, attending doctor, ward/bed, admitted date, length of stay, status. Filters ward, status, patient; default active first, then latest admitted.
Bed board: compact summary row Available / Occupied / Maintenance; ward segmented filters; 3-column bed-card grid desktop. Each card shows bed code, ward, type, status and nightly rate. Occupied card includes patient initials/name and View admission. Available card includes Admit here. Maintenance is disabled with text reason.
Admit drawer: patient required, attending doctor required, ward required, available bed required, admitted date/time default now (admin may backdate within last 7 days), admission reason required max 300 characters. Prevent future admission dates; one active admission per patient; one active occupant per bed.
Available → Occupied on save. Transfer opens dialog with available target bed and reason; atomically free old bed, occupy new and append transfer event. Reject same-bed transfer. Bed maintenance can only be toggled by admin when unoccupied.
Admission detail: status and patient header; summary cards for doctor, ward/bed, admitted time, elapsed stay; transfer timeline; actions Transfer bed, Prepare discharge (authorized staff).
Prepare discharge shows confirmation drawer: discharge time, summary, pending invoice links and optional Create invoice. Require time ≥ admission; release bed and mark Discharged only on confirmation. Outstanding invoices remain visible and may remain unpaid. Do not automatically mark them paid.
Room billing v1: one room-charge line with manually confirmed quantity and rate; transfers are recorded but do not automatically calculate multiple rate periods. Pre-fill quantity as max(1, ceil(elapsed hours / 24)) and label it “Suggested billable days—confirm before saving.”

### 7.8 Billing

Header Billing; CTA Create invoice. Four slim summary tiles: Issued amount, Collected, Outstanding, Overdue; all derived from current date-filtered non-void invoices and their payments.
Filters search invoice ID/patient; issue date range; status Draft/Unpaid/Partially paid/Paid/Overdue/Void.
Table: invoice ID, patient, issue date, due date, total, balance, derived status, actions. Default newest issue date.
Create/edit invoice page: patient required; optional linked appointment OR admission; issue date default today; due date ≥ issue date; line items description, quantity, unit price, computed amount; Add item / remove item; optional flat discount and notes. Default consultation fee from selected doctor when linked appointment exists. Tax is 0 in demo; do not invent tax rules.
Quantity >0, unit price ≥0, at least one item; discount 0..subtotal. Store paise integers and round line totals once. Total = subtotal − discount. Never allow negative total.
Footer Save draft / Issue invoice. Drafts are editable and excluded from revenue metrics. Issuing freezes line items. Zero-total issued invoice is Paid; otherwise status derived from payment total and due date.
Invoice detail: invoice number and badge top left; Print invoice and Record payment top right. White printable invoice sheet with hospital details, fictional patient billing info, line items, subtotal, discount, total, paid and outstanding. Payment history below sheet.
Record payment dialog: amount default balance, method Cash/Card/UPI, payment date/time default now, reference optional. Amount must be >0 and ≤ balance; reject future payment dates. Saving appends a payment and recalculates all linked views. Duplicate submit cannot record twice.
Void allowed only for issued invoices with no payments, requires reason. No deleting issued invoices and no refund flow in v1. Print uses browser print with shell/navigation/actions hidden.

### 7.9 Reports

Admin-only screen. Header Reports; Export CSV secondary action. Date range default last 7 hospital-local calendar days with presets Today / Last 7 days / This month / Custom.
Three tabs:

- Appointments: count by day (blue bars), completion/no-show/cancellation summary, department breakdown table.
- Collections: daily recorded payments (blue line), payment method breakdown, invoice balance table.
- Occupancy: current occupancy by ward and active admission table. Clearly label “Current snapshot”; do not imply historical occupancy is available.
  Display calculation descriptions beneath metrics. Include accessible data tables for every chart. CSV exports the currently active tab's filtered table, with headers, UTF-8, escaped values and no hidden extra records. Prevent spreadsheet formula execution from user-entered cells beginning =, +, - or @.
  Empty range shows zero-state, not random placeholder charts. Reports and dashboard must use the same selectors.

### 7.10 Settings, access denied and not found

Settings tabs Profile / Hospital (admin only) / Demo data.
Profile: display name and contact details; initials avatar; Save changes.
Hospital: hospital name, address, contact phone, invoice prefix and default consultation fee. Currency INR and timezone Asia/Kolkata displayed read-only in v1. Changes apply to newly generated invoices; issued invoices retain their hospital snapshot.
Demo data: explain fictional data and provide Reset demo data. Only admin can reset; require confirmation “Reset demo records?” and typed RESET. Reset domain state and reseed relative to current hospital date; no network action.
403: “You don’t have access to this page.” CTA Back to overview.
404: “We couldn’t find that page.” CTA Back to overview; public session returns to sign-in instead.

## 8. Critical end-to-end workflows

1. Register patient → profile → Book appointment → schedule shows booking → check in → doctor starts/completes visit → Create linked invoice → record payment → paid invoice and updated dashboard.
2. Admit patient into available bed → occupied board → transfer bed → old bed available/new bed occupied → confirm room charge → discharge → bed available; linked bill retains outstanding balance.
3. Filter patients → open record → Back → same search, filters and page preserved.
4. Start booking → patient missing → register inside nested flow → return with patient preselected; rest of booking values retained.
5. Administrator changes role by signing out/in → route access and scopes update; domain data remains unchanged.
6. Two open booking forms compete for one slot → first saves; second save shows conflict and refreshes available slots without losing other fields.

## 9. State and validation rules

All list routes support initial loading (matching skeleton), loaded, empty dataset, empty filter result and error with Retry. Detail routes support loading, missing and forbidden. All mutations support pending, success and inline error. Use a mock repository delay around 300ms; expose an explicit development-only error toggle rather than random failures.

Optimistic updates are unnecessary; commit related changes together after success. Disable Save while pending. Keep user input on failure. Errors appear beside relevant fields and in a focusable summary at top on failed submit. Focus the first invalid field. Do not close dialogs on failed save.
Dirty forms prompt before Cancel, Escape, backdrop dismissal or route change. Resetting filters never resets domain records. Clear filters returns defaults; user search should be visually distinct from a truly empty database.

Single source of truth: relationships reference immutable IDs. Do not copy patient names into appointment state or maintain independent metric numbers. Exceptions: issued invoice snapshots intentionally preserve billing identity and prices. Use functional/transactional state updates to avoid stale forms overwriting newer records. Check record revision before edit; conflict message “This record changed. Reload the latest version before saving.”
Local demo persistence survives refresh under a versioned localStorage key (careflow.demo.v1). Handle corrupt storage by showing a recovery action. Use storage events or reload-before-commit revision checks to avoid silently overwriting another tab. A real backend will need server-enforced permissions and transactions.

## 10. Frontend data contracts

These are UI data contracts rather than a production SQL schema. Optional fields are nullable; use string IDs and ISO timestamps with offsets/UTC. Represent hospital dates as YYYY-MM-DD and times as HH:mm; convert consistently at boundaries.

| Entity           | Core fields                                                                                                                                                                           |
| ---------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| UserSession      | userId, role, displayName, doctorId?                                                                                                                                                  |
| Patient          | id, mrn, fullName, dob, gender, bloodGroup?, phone, email?, address?, emergencyContact?, allergies?, chronicConditions?, status(active/archived), createdAt, revision                 |
| Department       | id, name                                                                                                                                                                              |
| Doctor           | id, name, departmentId, specialty, qualification?, phone, email?, feePaise, status(active/inactive), weeklyAvailability[], revision                                                   |
| Appointment      | id, patientId, doctorId, startsAt, endsAt, type, reason?, status, cancellationReason?, createdAt, revision                                                                            |
| VisitNote        | id, patientId, appointmentId?, authorDoctorId, visitDate, body, createdAt                                                                                                             |
| Ward             | id, name, type                                                                                                                                                                        |
| Bed              | id, wardId, code, nightlyRatePaise, status(available/occupied/maintenance), maintenanceReason?, revision                                                                              |
| Admission        | id, patientId, doctorId, bedId, admittedAt, dischargedAt?, reason, dischargeSummary?, status(active/discharged), transfers[], revision                                                |
| Transfer         | id, fromBedId, toBedId, transferredAt, reason                                                                                                                                         |
| Invoice          | id, number, patientId, appointmentId?, admissionId?, issueDate, dueDate, items[], discountPaise, state(draft/issued/void), patientSnapshot?, hospitalSnapshot?, voidReason?, revision |
| InvoiceItem      | id, description, quantity, unitPricePaise                                                                                                                                             |
| Payment          | id, invoiceId, amountPaise, method(cash/card/upi), paidAt, reference?, idempotencyKey                                                                                                 |
| HospitalSettings | name, address, phone, currency(INR), timezone(Asia/Kolkata), invoicePrefix, defaultFeePaise                                                                                           |

Appointment status enum: scheduled, checked_in, in_consultation, completed, cancelled, no_show.
Invoice display status is derived: Draft/Void from state; Paid when balance=0; Partially paid when payment sum>0 and balance>0 unless overdue; Overdue when balance>0 and dueDate < today; otherwise Unpaid. Show partial-payment amount separately even when badge is Overdue.
Available bed count derives from bed states; occupying/freeing beds must stay consistent with active admissions. Payment list is the source for collected revenue, never invoice totals.

## 11. Seed data and fixture consistency

Generate fixtures relative to one demo clock when seeding:

- 24 fictional patients, 6 doctors, 4 departments (General Medicine, Cardiology, Orthopedics, Pediatrics).
- 3 wards × 8 beds = 24; 15 occupied, 7 available, 2 maintenance; exactly 15 active admissions.
- 36 appointments spread across prior 6 days, today and next 7 days; at least 8 today; no slot overlap; completed/no-show dates only in past.
- 12 invoices covering draft, unpaid, partial, paid, overdue, void; payments agree with displayed balances. Use clear fictional amounts such as consultation ₹500 and room ₹1,500/day.
- Sample names may include Aarav Mehta, Isha Rao, Kabir Shah, Naina Desai, Rohan Kulkarni and Tara Menon, all explicitly fictional.
  Use synthetic phone strings such as 9000000001 in demo fixtures only; do not imply they are verified unassigned numbers or contact anyone.
  Do not hardcode dashboard values: derive them from the seed records and current filters. Keep a canonical generateDemoData(clock) function and deterministic IDs for repeatable resets.

## 12. Precise first-screen composition

This table gives the coding AI spatial guidance rather than an aesthetic adjective.
| Region at 1440px viewport | Coordinates / size | Content |
| --- | --- | --- |
| Sidebar | x0 y0 w232 h1000 | Logo, nav, demo panel, account |
| Topbar | x232 y0 w1208 h72 | Breadcrumb and avatar menu |
| Page header | x264 y104 w1144 h64 | Overview title, subtitle, Book appointment |
| KPI row | x264 y192 w1144 h116 | Four 274px cards, 16px gaps |
| Schedule card | x264 y332 w744 h316 | Header + five 48px rows + footer |
| Bed card | x1032 y332 w376 h316 | Occupancy number, bar, ward rows, link |
| Weekly chart | x264 y672 w744 h256 | Header, chart, textual summary |
| Quick actions | x1032 y672 w376 h256 | Three actions and helper text |

This is a composition target, not a command to absolutely position the whole UI. Achieve it with responsive grid. Card padding 20px; table horizontal padding 20px; row hover #F3F8FC. Keep heading baselines aligned. Content may grow vertically without clipping.

## 13. Microcopy

Use direct, task-specific text:

- “Register patient”, “Book appointment”, “Admit patient”, “Record payment”.
- Save success: “Patient registered.” / “Appointment booked.” / “Payment recorded.”
- Collision: “This slot was just booked. Choose another time.”
- Missing field: “Select a patient.” / “Enter a valid phone number.”
- Patient empty result: “No patients match these filters.” → Clear filters.
- Empty directory: “No patient records yet.” → Register patient.
- Unsaved: “Discard your changes?” → Keep editing / Discard changes.
  Avoid “Something went wrong” as the only actionable feedback; include a safe cause and Retry when possible.

## 14. Accessibility and motion

Use semantic landmarks, one H1 per page, real links for navigation and buttons for actions. Provide a skip-to-content link. All inputs have visible labels; placeholders only show examples. Keyboard-operable menus/selects/date pickers; modal focus trap and restoration. Do not rely on hover to expose critical actions. Row menu buttons are named “Actions for [record]”.
Tables have captions, column headers and aria-sort; row links are focusable independently. Skeletons use aria-busy, errors use appropriate live announcements, icons decorative unless labelled.
Use color plus labels, visible focus, readable contrast and 200% zoom support. Respect prefers-reduced-motion. Default transitions 150ms ease; dialogs fade/translate up at most 8px; no looping animation after loading. Charts have nonvisual equivalents.

## 15. Recommended code organization

Keep a small, comprehensible project:

- src/app: router, providers, role guards, AppShell.
- src/components/ui: button, field, dialog, table, badge, tabs, toast.
- src/components/shared: page header, patient identity, metric card, filter bar.
- src/features/{patients,appointments,doctors,admissions,billing,reports,settings}: pages, forms, domain selectors.
- src/data: repository interface, mock repository, deterministic seeds, persistence.
- src/lib: hospital clock/date helpers, INR/paise utilities, validation, CSV export.
- src/styles: design tokens and global styles.

Expose repository operations such as listPatients, savePatient, bookAppointment, transitionAppointment, admitPatient, transferBed, dischargePatient, issueInvoice and recordPayment. Components must not directly alter localStorage.
Read route/query state via the router; use one domain store or query cache for records and derived selectors. Prefer accessible primitives to building complex interaction behavior from scratch.
Use existing repo conventions when supplied. Do not add a second router, styling framework or state system unnecessarily.

## 16. Delivery phases for the coding AI

Phase 1: tokens, shell, routing, demo sign-in, shared components and deterministic repository.
Phase 2: patient directory, forms, profile and appointment booking/status flow.
Phase 3: doctor schedule, admissions, bed transfer/discharge.
Phase 4: invoices, payments, print, reports, settings.
Phase 5: responsive polish, keyboard/accessibility audit and critical workflow checks.
Finish every phase into working behavior; do not substitute inert buttons or screenshots for implementation. If context limits require multiple passes, keep a checked implementation checklist and continue from it.

## 17. Acceptance criteria

The frontend is complete when:

- Every route in section 6 renders, refreshes and has appropriate access control and missing-record handling.
- At 1440px, the overview follows section 12 and uses the exact tokens.
- At 390px and 768px, forms, navigation and lists remain usable with no page-wide horizontal overflow.
- Register → book → check in → consult → complete → invoice → payment works and updates all related views.
- Admit → transfer → discharge keeps bed availability consistent.
- Search, sort, filters and pagination work; browser Back restores list state.
- Past/overlapping bookings, negative amounts, overpayments and invalid state transitions are blocked.
- Refresh preserves records; reset creates consistent current-date fixtures.
- Loading, error, empty, missing, forbidden and pending states are implemented.
- Keyboard reaches all controls, dialog focus behaves correctly and errors are understandable.
- CSV downloads actual filtered rows; printing produces a readable invoice without app chrome.
- No control promises unsupported behavior; no invented API success or decorative fake metrics.
- Role scopes apply to direct URLs and related record pickers as well as navigation.
- No console errors occur in the core workflows.

Test domain invariants with focused tests: appointment collision/status transitions, admission/bed atomic updates, paise totals/payment bounds and role scoping. Add an end-to-end smoke test for the two critical workflows if the project already has browser-test tooling. Avoid tests that only restate component markup.

## 18. Ready-to-paste implementation prompt

> Build the complete Careflow Hospital Database Management System frontend using the attached specification as the source of truth. Read the whole document first. Implement all routes, responsive layouts, design tokens, forms, role scopes, component states and cross-module workflows. Keep this suitable for a college project. Use the existing stack if present; otherwise React, TypeScript, Vite and the libraries proposed in section 1. Start with a persistent, deterministic mock repository and a clearly labelled demo sign-in. Use the exact light-blue, navy and lime palette and the overview composition in section 12. Build a functioning staff workspace with linked records and derived metrics. Keep business operations behind a repository interface so a backend can be connected later. Follow the delivery phases and verify the acceptance criteria. Do not stop after building only the dashboard. Do not add scope beyond this spec. Before finishing, run the available build/type checks, verify critical workflows and report any remaining gaps honestly.

## 19. Backend connection boundary

When a real backend is introduced, preserve the UI contracts and replace repository implementations. Use server-enforced authentication, authorization, validation, unique slot/bed constraints, immutable payment records and transactions. localStorage and role selectors are demo mechanisms only; use synthetic information throughout the college demo.
The design deliberately avoids claiming production readiness, clinical safety certification or legal compliance. Those are separate implementation and operational concerns beyond this frontend blueprint.

## 20. Handoff reference

Native Figma spec: https://www.figma.com/spec/a5m7vW9hY858gyJCNwegcR
Portable handoff filename: Careflow-Frontend-Blueprint.md
The Markdown copy works with tools that cannot read Figma. If a coding assistant cannot open a Figma spec link, attach the Markdown file or paste its complete contents.
