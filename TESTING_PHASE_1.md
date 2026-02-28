# Manual Testing Checklist — Phase 1: Infrastructure & Database

## Pre-conditions
- Run: `docker compose up -d`
- Wait ~30 seconds for all services to be healthy

## 1. Services health

- [x] `curl http://localhost:3000/health` returns `{"success":true,"data":{"status":"ok"}}`
- [x] `docker compose ps` shows all 5 services as `Up` or `Healthy`:
  - `redapsi_postgres`
  - `redapsi_redis`
  - `redapsi_backend`
  - `redapsi_web`
  - `redapsi_pgadmin`
- [x] `http://localhost:5050` opens pgAdmin login page (email: admin@pgadmin.com, password: admin_pass)
- [x] In pgAdmin: connect to `postgres` host → see database `redapsi` with all tables.
- [x] `http://localhost:5173` loads correctly and shows "REDAPSI v2" title.

## 2. Seed data

Open pgAdmin query tool or use `psql` and run the following checks:

### 2.1 Users & Profiles
```sql
SELECT email, role FROM "User";
```
- [x] 7 users are present with correct roles (ADMIN, ADMIN_PSYCHOLOGIST, 2× PSYCHOLOGIST, 3× CONSULTANT).

```sql
SELECT count(*) FROM "AvailabilitySlot";
```
- [x] 10 slots exist (5 days × 2 psychologists).

### 2.2 Therapy & Sessions
```sql
SELECT status, origin FROM "Therapy";
```
- [x] 1 ACTIVE therapy exists (consultant1 ↔ psy1).

```sql
SELECT status FROM "TherapySession";
```
- [x] 3 sessions exist (1 COMPLETED, 1 SCHEDULED, 1 CANCELLED).

```sql
SELECT count(*) FROM "SessionNote";
```
- [x] 2 notes exist on the completed session (1 public, 1 private).

### 2.3 Payments & Finance
```sql
SELECT amount, status, scope FROM "Payment";
```
- [x] 1 PAID payment linked to the completed therapy session.

### 2.4 Goals
```sql
SELECT title, progress FROM "Goal";
```
- [x] 2 goals exist: "Reducir ansiedad social" (40%) and "Mejorar asertividad" (10%).

```sql
SELECT count(*) FROM "GoalProgressEntry";
```
- [x] 4 progress snapshots exist (2 per goal).

### 2.5 Requests & Notifications
```sql
SELECT status FROM "TherapyRequest";
```
- [x] 1 PENDING request exists from consultant3 to psychologist2.

```sql
SELECT count(*) FROM "Notification";
```
- [x] 5 notifications exist for consultant1 (mixed read/unread).

### 2.6 Events
```sql
SELECT title, cost FROM "Event";
```
- [x] 2 events exist (1 free, 1 paid).

---

## 3. PR Review Fixes Verification

### 3.1 Schema Fixes
- [x] `Payment` table has `billing_plan_id` and `event_registration_id` with proper `@relation`.
- [x] `Payment` table has `registered_by` (non-nullable) and `method` (non-nullable).
- [x] `TherapySession` table has `proposition_id` and `cancelled_at`.
- [x] `EventRegistration` status default is `PENDING`.
- [x] `AvailabilitySlot` uses `psychologist_profile_id`.

### 3.2 Backend Fixes
- [x] `backend/src/shared/response.ts`: `sendPaginated` returns `total_pages`.
- [x] `backend/src/shared/apiError.ts`: `notebook()` corrected to `notFound()`.
- [x] `backend/src/infrastructure/database/prismaClient.ts`: Soft-delete handlers use correct camelCase properties and avoid self-reference recursion.

### 3.3 Infrastructure & Seed
- [x] `docker-compose.yml`: services `web` and `pgadmin` have healthchecks.
- [x] `backend/prisma/seed.ts`: Password hashing uses 12 bcrypt rounds.
- [x] `backend/prisma/seed.ts`: Seed is fully idempotent (all entities use upsert or stable IDs).
- [x] `.env.example`: Updated with `ALLOWED_ORIGINS`, `UPLOADS_DIR`, `MAX_FILE_SIZE_MB`, and correct JWT keys.

### 3.4 Architecture
- [x] `backend/src/shared/hasRole.ts`: `hasRole()` helper exists.
- [x] `backend/src/infrastructure/http/middleware/errorHandler.ts`: Handles Prisma errors (P2002, P2025).
- [x] `backend/src/domain/` and `backend/src/application/` directories established.
