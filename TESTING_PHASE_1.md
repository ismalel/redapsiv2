# Manual Testing Checklist — Phase 1: Infrastructure & Database

## Pre-conditions
- Run: `docker compose up -d`
- Wait ~30 seconds for all services to be healthy

## 1. Services health

- [x] `curl http://localhost:3000/health` returns `{"success":true,"data":{"status":"ok"}}`
- [x] `http://localhost:5050` opens pgAdmin login page (email: admin@pgadmin.com, password: admin_pass)
- [x] In pgAdmin: connect to `postgres` host → see database `redapsi` with all tables:
  - User, PsychologistProfile, ConsultantProfile, RefreshToken
  - Therapy, BillingPlan, TherapySession, SessionNote
  - ScheduleProposition, SessionRequest, AvailabilitySlot
  - Goal, GoalProgressEntry
  - TherapyRequest, Payment, Message
  - Event, EventRegistration, Notification
- [x] `http://localhost:5173` loads correctly and shows "REDAPSI v2" title.

## 2. Seed data

Open pgAdmin query tool or use `psql` and run:
```sql
SELECT email, role FROM "User";
```
- [x] 7 users are present with correct roles:
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
- [x] 1 ACTIVE therapy exists (consultant1 ↔ psy1)

```sql
SELECT status FROM "TherapySession";
```
- [x] 3 sessions: 1 COMPLETED, 1 SCHEDULED, 1 CANCELLED

```sql
SELECT * FROM "Event";
```
- [x] 2 events: 1 free upcoming, 1 paid past

---

## 3. PR Review Fixes Verification

### 3.1 Schema Fixes (Severity 1)
- [ ] `Payment` table has `billing_plan_id` and `event_registration_id`.
- [ ] `Payment` table has `registered_by` (non-nullable) and `method` (non-nullable).
- [ ] `TherapySession` table has `proposition_id` and `cancelled_at`.
- [ ] `EventRegistration` status default is `PENDING`.

### 3.2 Backend Fixes (Severity 1)
- [ ] `backend/src/shared/response.ts`: `sendPaginated` returns `total_pages`.
- [ ] `backend/src/shared/apiError.ts`: `notebook()` corrected to `notFound()`.

### 3.3 Infrastructure & Seed (Severity 2)
- [ ] `docker-compose.yml`: services `web` and `pgadmin` have healthchecks.
- [ ] `backend/prisma/seed.ts`: `AvailabilitySlot` records created for both psychologists (Mon-Fri 9-18h).
- [ ] `backend/prisma/seed.ts`: Password hashing uses 12 bcrypt rounds.
- [ ] `backend/prisma/seed.ts`: Seed is idempotent (uses upsert or checks existence).
- [ ] `.env.example`: Updated with `ALLOWED_ORIGINS`, `UPLOADS_DIR`, `MAX_FILE_SIZE_MB`.

### 3.4 Architecture (Severity 3)
- [ ] `backend/src/shared/hasRole.ts`: `hasRole()` helper exists.
- [ ] `backend/src/infrastructure/database/prismaClient.ts`: Migrated to Prisma Extensions (`$extends`) for soft-delete.
- [ ] `backend/src/infrastructure/http/middleware/errorHandler.ts`: Handles Prisma errors (P2002, P2025).
