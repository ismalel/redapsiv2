# Manual Testing Checklist — Phase 4: Therapy Management

> Includes all checks from TESTING_PHASE_3.md plus the following.

## 9. Notification Service (Internal)

- [x] Every action below generates a record in the `Notification` table.
- [x] Messages are in Spanish.
- [x] `NEW_MESSAGE` notifications are debounced (max 1 every 60 seconds per therapy).

## 10. Therapy Management — Flow A (Psychologist Initiated)

- [ ] `POST /therapies` (as psy1):
    - Body: `{ consultant_email: "new@test.com", consultant_name: "Test Name", modality: "virtual", billing_plan: { billing_type: "PER_SESSION", default_fee: 500 } }`
    - Returns 201.
    - Check logs: Temp password for `new@test.com` is printed.
    - DB: `User`, `ConsultantProfile`, `Therapy` (PENDING), and `BillingPlan` are created.
- [ ] Attempt to create a second therapy for the same consultant while the first is ACTIVE → returns 409 `CONSULTANT_HAS_ACTIVE_THERAPY`.

## 11. Therapy Requests — Flow B (Consultant Initiated)

- [ ] `POST /therapy-requests` (as consultant3):
    - Body: `{ psychologist_id: "<psy2_id>", message: "Hola, quiero iniciar." }`
    - Returns 201.
    - Psychologist receives `THERAPY_REQUEST_RECEIVED` notification.
- [ ] `PATCH /therapy-requests/:id` (as psy2):
    - Body: `{ status: "ACCEPTED" }`
    - Returns 200.
    - DB: `Therapy` (ACTIVE) and `BillingPlan` are created.
    - Consultant receives `THERAPY_REQUEST_ACCEPTED` notification.

## 12. Session Scheduling — Option 1 (Propositions)

- [ ] `POST /propositions/therapy/:id` (as psy1):
    - Body: `{ proposed_slots: ["2026-03-01T10:00:00Z"] }`
    - Validation: Horario debe coincidir con `AvailabilityType.AVAILABLE` del psicólogo. Si no, retorna 400 `SLOT_NOT_AVAILABLE`.
    - Consultant receives `PROPOSITION_RECEIVED`.
- [ ] `PATCH /propositions/:id/select` (as consultant1):
    - Body: `{ selected_slot: "2026-03-01T10:00:00Z" }`
    - DB: `TherapySession` (SCHEDULED) is created.
    - Psychologist receives `PROPOSITION_ACCEPTED`.

## 13. Session Scheduling — Option 2 (Requests)

- [ ] `POST /session-requests` (as consultant1):
    - Body: `{ therapy_id: "<id>", proposed_at: "2026-03-02T11:00:00Z" }`
    - Validation: Debe coincidir con disponibilidad del psicólogo.
    - Psychologist receives `SESSION_REQUEST_RECEIVED`.
- [ ] `PATCH /session-requests/:id` (as psy1):
    - Body: `{ status: "ACCEPTED" }`
    - DB: `TherapySession` (SCHEDULED) created.
    - Consultant receives `SESSION_REQUEST_ACCEPTED`.

## 14. Notifications API

- [ ] `GET /notifications` returns paginated notifications for the user.
- [ ] `GET /notifications/unread-count` returns correct number.
- [ ] `PATCH /notifications/:id/read` marks one as read.
- [ ] `PATCH /notifications/read-all` marks all as read.

## 15. Privacy & Permissions

- [ ] `GET /therapies/:id` (as consultant1): Verify `notes` field is NULL or missing.
- [ ] `GET /therapies/:id` (as psy1): Verify `notes` field is present.
- [ ] Accessing a therapy ID where the user is not participant nor ADMIN → returns 403.
