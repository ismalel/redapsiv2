# Manual Testing Checklist — Phase 1: Infrastructure & Database

## Pre-conditions
- Run: `docker compose up -d`
- Wait ~30 seconds for all services to be healthy

## 1. Services health

- [x] `curl http://localhost:3000/health` returns `{"success":true,"data":{"status":"ok"}}`
- [ ] `http://localhost:5050` opens pgAdmin login page (email: admin@pgadmin.com, password: admin_pass)
- [ ] In pgAdmin: connect to `postgres` host → see database `redapsi` with all tables:
  - User, PsychologistProfile, ConsultantProfile, RefreshToken
  - Therapy, BillingPlan, TherapySession, SessionNote
  - ScheduleProposition, SessionRequest, AvailabilitySlot
  - Goal, GoalProgressEntry
  - TherapyRequest, Payment, Message
  - Event, EventRegistration, Notification
- [ ] `http://localhost:5173` loads correctly and shows "REDAPSI v2" title.

## 2. Seed data

Open pgAdmin query tool or use `psql` and run:
```sql
SELECT email, role FROM "User";
```
- [ ] 7 users are present with correct roles:
  - admin@redapsi.app (ADMIN)
  - adminpsy@redapsi.app (ADMIN_PSYCHOLOGIST)
  - psy1@redapsi.app (PSYCHOLOGIST)
  - psy2@redapsi.app (PSYCHOLOGIST)
  - consultant1@redapsi.app (CONSULTANT)
  - consultant2@redapsi.app (CONSULTANT)
  - consultant3@redapsi.app (CONSULTANT)

```sql
SELECT status, origin FROM "Therapy";
```
- [ ] 1 ACTIVE therapy exists (consultant1 ↔ psy1)

```sql
SELECT status FROM "TherapySession";
```
- [ ] 3 sessions: 1 COMPLETED, 1 SCHEDULED, 1 CANCELLED

```sql
SELECT * FROM "Event";
```
- [ ] 2 events: 1 free upcoming, 1 paid past
