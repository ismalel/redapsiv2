# REDAPSI v2 — Phased Implementation Plan

> **For any AI agent**: Read `DEV.md` and `CLAUDE.md` before starting any phase.
> At the end of each phase, create the testing checklist file described in that phase's "Deliverable" section.
> Update `DEV.md` with a log entry after completing each phase.

---

## How to use this plan

1. Work through phases in order — each one builds on the previous.
2. A phase is **not complete** until:
   - All listed items are implemented.
   - The verification commands pass.
   - The testing checklist file (`TESTING_PHASE_N.md`) is written to the project root.
   - A log entry is appended to `DEV.md`.
3. Never start the next phase if the current one has failing builds or tests.
4. Each testing checklist is **cumulative** — it covers everything testable up to that phase.

---

## Seed accounts (used in every checklist)

These are created by `prisma/seed.ts` (implemented in Phase 1):

| Role | Email | Password |
|------|-------|----------|
| ADMIN | admin@redapsi.app | Admin1234! |
| ADMIN_PSYCHOLOGIST | adminpsy@redapsi.app | Admin1234! |
| PSYCHOLOGIST 1 | psy1@redapsi.app | Psych1234! |
| PSYCHOLOGIST 2 | psy2@redapsi.app | Psych1234! |
| CONSULTANT 1 (onboarded, active therapy) | consultant1@redapsi.app | Consult1234! |
| CONSULTANT 2 (onboarding incomplete, step 3) | consultant2@redapsi.app | Consult1234! |
| CONSULTANT 3 (onboarded, no therapy) | consultant3@redapsi.app | Consult1234! |

---

## Phase 1 — Infrastructure & Database

**Goal**: All Docker services start healthy, the database schema is migrated, and seed data is available.

### Scope

**Infrastructure:**
- `docker-compose.yml` — services: `postgres`, `backend`, `web`, `pgadmin`, `redis`; all with healthchecks; named volumes `postgres_data`, `uploads_data`; custom bridge network
- `.env.example` — all variables listed in CLAUDE.md
- `.env` — copy of `.env.example` with dev values (gitignored)
- `backend/Dockerfile` — Node 20, multi-stage
- `web/Dockerfile` — Node 20 with Vite dev server
- `backend/.gitignore`, `web/.gitignore`

**Backend:**
- `backend/package.json` — dependencies: express, prisma, @prisma/client, typescript, ts-node, bcrypt, jsonwebtoken, zod, multer, cors, helmet, morgan, socket.io, jest, supertest, swagger-ui-express, swagger-jsdoc
- `backend/tsconfig.json`
- `backend/prisma/schema.prisma` — exact schema from CLAUDE.md (all models, enums, relations)
- `backend/prisma/seed.ts` — all seed data listed in CLAUDE.md "Seed script" section
- `backend/src/shared/apiError.ts` — `ApiError` class
- `backend/src/shared/response.ts` — `sendSuccess()`, `sendPaginated()` helpers
- `backend/src/shared/pagination.ts` — parse `page`/`per_page` from query
- `backend/src/infrastructure/database/prismaClient.ts` — singleton + soft-delete middleware (`deleted_at IS NULL` on User, Therapy, Event)
- `backend/src/infrastructure/http/app.ts` — Express app setup (cors, helmet, morgan, json body parser, static /uploads)
- `backend/src/infrastructure/http/server.ts` — starts HTTP server on PORT
- `backend/src/infrastructure/http/routes/health.ts` — `GET /health → { status: "ok" }`
- `backend/src/infrastructure/http/middleware/errorHandler.ts` — global error handler returning `{ error: { code, message, details } }`
- `backend/uploads/` — directories: avatars/, sessions/, chat/, events/ (created by Dockerfile or entrypoint)

**Web:**
- `web/package.json` — dependencies: react, react-dom, react-router-dom, @tanstack/react-query, axios, react-hook-form, zod, @hookform/resolvers, tailwindcss, recharts, socket.io-client
- `web/tsconfig.json`
- `web/vite.config.ts` — proxy `/api/*` → `http://backend:3000`
- `web/tailwind.config.ts` — custom color tokens (brand-purple, brand-purple-dark, brand-cyan, brand-yellow, app-bg, app-surface)
- `web/src/main.tsx`, `web/src/App.tsx` (shell only, TanStack Query provider)
- `web/src/api/client.ts` — axios instance (base URL `/api`, Bearer token injection, 401 handler, redirect to `/iniciar-sesion`)
- `web/src/utils/query-keys.ts` — centralized query key factory (stub, add keys per feature)

**Migrations & seed:**
```bash
docker compose run --rm backend npx prisma migrate dev --name init
docker compose run --rm backend npx prisma db seed
```

### Verification commands
```bash
docker compose up -d
curl http://localhost:3000/health          # → { "status": "ok" }
# pgAdmin at http://localhost:5050 — verify all tables exist and seed rows are present
docker compose run --rm backend npx prisma studio   # optional visual check
```

### Deliverable
Create `TESTING_PHASE_1.md` at the project root (content template at end of this phase).

---

### TESTING_PHASE_1.md template

```markdown
# Manual Testing Checklist — Phase 1: Infrastructure & Database

## Pre-conditions
- Run: `docker compose up -d`
- Wait ~30 seconds for all services to be healthy

## 1. Services health

- [ ] `curl http://localhost:3000/health` returns `{"status":"ok"}`
- [ ] `http://localhost:5050` opens pgAdmin login page (email: admin@pgadmin.com, password: from .env)
- [ ] In pgAdmin: connect to `postgres` host → see database `redapsi` with all tables:
  - User, PsychologistProfile, ConsultantProfile, RefreshToken
  - Therapy, BillingPlan, TherapySession, SessionNote
  - ScheduleProposition, SessionRequest, AvailabilitySlot
  - Goal, GoalProgressEntry
  - TherapyRequest, Payment, Message
  - Event, EventRegistration, Notification
- [ ] `http://localhost:5173` loads (even if it shows a blank page or placeholder)

## 2. Seed data

Open pgAdmin query tool and run:
```sql
SELECT email, role FROM "User";
```
- [ ] 7 users are present with correct roles (ADMIN, ADMIN_PSYCHOLOGIST, 2× PSYCHOLOGIST, 3× CONSULTANT)

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
```
```

---

## Phase 2 — Authentication & File Upload

**Goal**: Real JWT auth works on the API. File uploads work. The web app shows a login form and rejects unauthorized access.

### Scope

**Backend — Auth:**
- `backend/src/domain/interfaces/auth.ts` — `IAuthRepository`, `TokenPair`, `AuthUser`
- `backend/src/application/auth/` — use cases: `RegisterUseCase`, `LoginUseCase`, `RefreshTokenUseCase`, `LogoutUseCase`, `ChangePasswordUseCase`
- `backend/src/infrastructure/http/routes/auth.ts`:
  - `POST /auth/register` — body: `{ email, password, name, role }` (rejects CONSULTANT + another role)
  - `POST /auth/login` → `{ data: { access_token, refresh_token, token_type, expires_in, user: { id, email, role, must_change_password } } }`
  - `POST /auth/refresh` — body: `{ refresh_token }` → new token pair
  - `POST /auth/logout` — revokes refresh token in DB
  - `PUT /auth/change-password` — body: `{ current_password, new_password }` (authenticated)
- `backend/src/infrastructure/http/middleware/auth.ts` — `requireAuth()` middleware (verifies JWT, attaches `req.user`)
- `backend/src/infrastructure/http/middleware/rbac.ts` — `requireRole('ADMIN' | 'PSYCHOLOGIST' | 'CONSULTANT')` using `hasRole()` helper
- `backend/src/shared/hasRole.ts` — `hasRole(user, role)` expands ADMIN_PSYCHOLOGIST correctly

**Backend — File Upload:**
- `backend/src/infrastructure/http/middleware/upload.ts` — multer config (10 MB limit, allowed types: jpg/png/webp/pdf/mp4, stores in uploads/<subfolder>/)
- `backend/src/infrastructure/http/routes/upload.ts`:
  - `POST /upload?folder=avatars|sessions|chat|events` → `{ data: { url: "/uploads/<folder>/<filename>" } }`
- Express static middleware: `app.use('/uploads', express.static(UPLOADS_DIR))`

**Web — Auth UI:**
- `web/src/context/AuthContext.tsx` — stores user + tokens in localStorage, exposes `login()`, `logout()`, `user`, `isAuthenticated`
- `web/src/guards/AuthGuard.tsx` — redirects to `/iniciar-sesion` if not authenticated
- `web/src/guards/RoleGuard.tsx` — shows error screen "Usa la aplicación móvil" if role === CONSULTANT
- `web/src/guards/GuestGuard.tsx` — redirects authenticated users to `/dashboard`
- `web/src/pages/auth/LoginPage.tsx` — form: email + password, calls `POST /api/auth/login`, on success stores tokens + redirects by role
- `web/src/pages/auth/ChangePasswordPage.tsx` — shown automatically when `must_change_password === true`
- `web/src/routes/index.tsx` — lazy-loaded React Router routes with guards
- `web/src/components/layout/AppShell.tsx` — sidebar + topbar shell (stub, no links yet)
- `web/src/components/layout/Sidebar.tsx` — placeholder (no nav items yet)
- `web/src/components/layout/TopBar.tsx` — shows user email + logout button

### Verification commands
```bash
# Register a new psychologist
curl -X POST http://localhost:3000/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"test@test.com","password":"Test1234!","name":"Test User","role":"PSYCHOLOGIST"}'

# Login as admin
curl -X POST http://localhost:3000/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@redapsi.app","password":"Admin1234!"}'

# File upload (save the access_token from login above)
curl -X POST http://localhost:3000/upload?folder=avatars \
  -H "Authorization: Bearer <access_token>" \
  -F "file=@/path/to/image.jpg"
```

### Deliverable
Create `TESTING_PHASE_2.md` (cumulative, includes Phase 1 items + new items below).

---

### TESTING_PHASE_2.md additions (add to Phase 1 checklist)

```markdown
# Manual Testing Checklist — Phase 2: Auth & File Upload

> Includes all checks from TESTING_PHASE_1.md plus the following.

## 3. API Authentication

### 3.1 Login
- [ ] `POST /auth/login` with admin@redapsi.app / Admin1234! returns 200 with `access_token` and `refresh_token`
- [ ] `POST /auth/login` with wrong password returns 401 with `{ error: { code: "INVALID_CREDENTIALS" } }`
- [ ] `POST /auth/login` with consultant1@redapsi.app / Consult1234! returns 200 (note: CONSULTANT role)

### 3.2 Registration
- [ ] `POST /auth/register` with a new email + role=PSYCHOLOGIST returns 201
- [ ] `POST /auth/register` with an already-used email returns 409 `EMAIL_ALREADY_EXISTS`
- [ ] `POST /auth/register` attempting to set role=CONSULTANT on a user that already exists as PSYCHOLOGIST returns 422 `INVALID_ROLE_COMBINATION`

### 3.3 Token refresh
- [ ] `POST /auth/refresh` with a valid refresh_token returns a new token pair
- [ ] `POST /auth/refresh` with an expired/invalid token returns 401

### 3.4 Logout
- [ ] `POST /auth/logout` with Bearer token returns 200
- [ ] After logout, the same refresh_token is revoked (subsequent refresh attempts return 401)

### 3.5 Change password
- [ ] `PUT /auth/change-password` with correct current_password changes the password
- [ ] After change, old password no longer works
- [ ] Wrong current_password returns 401 `INVALID_CURRENT_PASSWORD`

### 3.6 RBAC
- [ ] A request to any protected endpoint without Bearer token returns 401
- [ ] `requireRole('ADMIN')` endpoint (e.g. a future admin route) is inaccessible to PSYCHOLOGIST token — returns 403

## 4. File Upload

- [ ] `POST /upload?folder=avatars` with a valid .jpg file (≤10MB) returns `{ "data": { "url": "/uploads/avatars/<filename>" } }`
- [ ] `GET http://localhost:3000/uploads/avatars/<filename>` serves the file
- [ ] Uploading a file >10MB returns 413
- [ ] Uploading an unsupported type (e.g. .exe) returns 422

## 5. Web — Login

- [ ] Open `http://localhost:5173` → redirects to `/iniciar-sesion` (not authenticated)
- [ ] Login with admin@redapsi.app / Admin1234! → redirects to `/dashboard` (placeholder page is OK)
- [ ] Login with psy1@redapsi.app / Psych1234! → redirects to `/dashboard`
- [ ] Login with consultant1@redapsi.app / Consult1234! → shows error screen "Usa la aplicación móvil"
- [ ] Bad credentials → shows inline error message in Spanish
- [ ] Clicking "Cerrar sesión" in TopBar logs out and redirects to `/iniciar-sesion`
- [ ] After logout, accessing `/dashboard` directly redirects to `/iniciar-sesion`
```

---

## Phase 3 — Profiles & Onboarding

**Goal**: Psychologist profiles are editable with availability slots. Consultant onboarding completes in 6 steps via API.

### Scope

**Backend — Psychologist Profile:**
- `backend/src/application/psychologists/` — use cases: `GetPsychologistProfileUseCase`, `UpdatePsychologistProfileUseCase`, `SetAvailabilityUseCase`, `ListPsychologistsUseCase`
- `backend/src/infrastructure/http/routes/psychologists.ts`:
  - `GET /psychologists` — public list (available=true filter), includes profile + availability
  - `GET /psychologists/:id` — public profile detail
  - `GET /psychologists/:id/availability` — weekly availability slots
  - `GET /psychologists/me/profile` — own profile (PSYCHOLOGIST role)
  - `PUT /psychologists/me/profile` — update own profile: `{ license_number, specializations, bio, session_fee, modalities, languages, years_experience }`
  - `PUT /psychologists/me/availability` — replace availability slots: `[{ day_of_week, start_time, end_time }]`

**Backend — Consultant Profile:**
- `backend/src/application/consultants/` — use cases: `GetConsultantProfileUseCase`, `UpdateConsultantProfileUseCase`, `GetOnboardingUseCase`, `SubmitOnboardingStepUseCase`
- `backend/src/infrastructure/http/routes/consultants.ts`:
  - `GET /consultants/me/profile` — own profile (CONSULTANT role)
  - `PUT /consultants/me/profile` — update: `{ birth_date, phone, emergency_contact }`
  - `GET /consultants/:id/onboarding` — current step + saved data (PSYCHOLOGIST or ADMIN or own)
  - `PUT /consultants/:id/onboarding/:step` — submit step 1–6; step 6 sets `onboarding_status=COMPLETED`

**Web — Psychologist Profile Page:**
- `web/src/api/psychologists.api.ts`
- `web/src/hooks/usePsychologist.ts` — TanStack Query hooks
- `web/src/pages/perfil/PsychologistProfilePage.tsx` — editable form: license, specializations (tags), bio, session_fee, modalities, languages, years_experience
- `web/src/pages/perfil/AvailabilityEditor.tsx` — weekly schedule grid (Mon–Fri rows, time range inputs)
- Route: `/perfil` (PSYCHOLOGIST + ADMIN_PSYCHOLOGIST role, guarded)

### Verification commands
```bash
# Get psychologist list (public)
curl http://localhost:3000/psychologists

# Get own profile (as psy1)
PSY_TOKEN=$(curl -s -X POST http://localhost:3000/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"psy1@redapsi.app","password":"Psych1234!"}' | jq -r '.data.access_token')

curl -H "Authorization: Bearer $PSY_TOKEN" http://localhost:3000/psychologists/me/profile

# Update profile
curl -X PUT -H "Authorization: Bearer $PSY_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"bio":"Especialista en terapia feminista","session_fee":600}' \
  http://localhost:3000/psychologists/me/profile

# Submit onboarding step 1 (as consultant2)
C2_TOKEN=$(curl -s -X POST http://localhost:3000/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"consultant2@redapsi.app","password":"Consult1234!"}' | jq -r '.data.access_token')

curl -X PUT -H "Authorization: Bearer $C2_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"birth_date":"1990-05-15","phone":"+52-555-0123","emergency_contact":"María López +52-555-9876"}' \
  http://localhost:3000/consultants/me/onboarding/1
```

### Deliverable
Create `TESTING_PHASE_3.md` (cumulative).

---

### TESTING_PHASE_3.md additions

```markdown
# Manual Testing Checklist — Phase 3: Profiles & Onboarding

> Includes all checks from TESTING_PHASE_2.md plus the following.

## 6. Psychologist Profiles (API)

- [ ] `GET /psychologists` returns list of psychologists with profiles (unauthenticated OK)
- [ ] `GET /psychologists/:id` returns full profile including availability slots
- [ ] `GET /psychologists/:id/availability` returns weekly slots array
- [ ] `PUT /psychologists/me/profile` (as psy1) updates bio and session_fee — verify with GET
- [ ] `PUT /psychologists/me/availability` (as psy1) replaces availability — verify with GET
- [ ] CONSULTANT token cannot access `PUT /psychologists/me/profile` → 403

## 7. Consultant Onboarding (API)

Using consultant2@redapsi.app (stuck at step 3):

- [ ] `GET /consultants/:id/onboarding` returns `{ current_step: 3, onboarding_data: {...}, onboarding_status: "INCOMPLETE" }`
- [ ] `PUT /consultants/:id/onboarding/4` submits step 4 data → returns updated onboarding state
- [ ] `PUT /consultants/:id/onboarding/5` submits step 5 data → returns updated state
- [ ] `PUT /consultants/:id/onboarding/6` submits step 6 (confirm) → `onboarding_status` becomes "COMPLETED"
- [ ] After step 6, `GET /consultants/:id/onboarding` shows `onboarding_status: "COMPLETED"`

## 8. Web — Psychologist Profile Page

Login as psy1@redapsi.app:
- [ ] Navigate to `/perfil` → shows editable form with current profile data
- [ ] Edit "Bio" field and save → toast success message in Spanish
- [ ] Edit session fee and save → reload page, new fee is shown
- [ ] In the Availability Editor, toggle a time slot and save → persists on reload
- [ ] Upload an avatar photo → avatar appears in TopBar
```

---

## Phase 4 — Therapy Management

**Goal**: Psychologists can create therapies (Flow A), consultants can request therapies (Flow B), and sessions can be scheduled via propositions or session requests. Notifications are triggered for each action.

### Scope

**Backend — Notification Service:**
- `backend/src/application/notifications/NotificationService.ts` — `createNotification(userId, type, title, body, payload?)` — wraps Prisma create, called within same transaction as triggering action
- `backend/src/application/notifications/notificationMessages.ts` — Spanish title/body templates per NotificationType

**Backend — Therapies:**
- `backend/src/application/therapies/` — use cases: `CreateTherapyUseCase` (Flow A — creates user + BillingPlan + ConsultantProfile), `GetTherapyUseCase`, `ListTherapiesUseCase`, `UpdateTherapyUseCase`
- `backend/src/infrastructure/http/routes/therapies.ts`:
  - `GET /therapies` — list (ADMIN: all; PSYCHOLOGIST: own; CONSULTANT: own) — strips `notes` from CONSULTANT response
  - `GET /therapies/:id` — detail (strips `notes` for CONSULTANT)
  - `POST /therapies` — PSYCHOLOGIST only: `{ consultant_email, consultant_name, modality, billing_plan: { billing_type, default_fee, recurrence? }, notes? }` → creates User(CONSULTANT, must_change_password=true) + ConsultantProfile + Therapy(PENDING) + BillingPlan; logs temp password to console
  - `PATCH /therapies/:id` — PSYCHOLOGIST: update modality/notes/status

**Backend — Therapy Requests (Flow B):**
- `backend/src/application/therapy-requests/` — use cases: `CreateTherapyRequestUseCase`, `RespondTherapyRequestUseCase`
- `backend/src/infrastructure/http/routes/therapy-requests.ts`:
  - `GET /therapy-requests` — PSYCHOLOGIST: pending requests for them; CONSULTANT: own requests
  - `POST /therapy-requests` — CONSULTANT: `{ psychologist_id, message? }` → creates TherapyRequest; notifies psychologist `THERAPY_REQUEST_RECEIVED`
  - `PATCH /therapy-requests/:id` — PSYCHOLOGIST: `{ status: "ACCEPTED" | "REJECTED" }` → on ACCEPTED: creates Therapy(ACTIVE, CONSULTANT_INITIATED) + BillingPlan (fee from psychologist profile); notifies consultant

**Backend — Session Scheduling:**
- `backend/src/application/propositions/` — use cases: `CreatePropositionUseCase`, `SelectPropositionSlotUseCase`
- `backend/src/application/session-requests/` — use cases: `CreateSessionRequestUseCase`, `RespondSessionRequestUseCase`
- `backend/src/infrastructure/http/routes/propositions.ts`:
  - `GET /therapies/:id/propositions` — list for therapy
  - `POST /therapies/:id/propositions` — PSYCHOLOGIST: `{ proposed_slots: [DateTime] }` → notifies consultant `PROPOSITION_RECEIVED`
  - `PATCH /propositions/:id` — CONSULTANT: `{ selected_slot: DateTime }` → creates TherapySession; notifies psychologist `PROPOSITION_ACCEPTED`; notifies consultant `SESSION_SCHEDULED`
- `backend/src/infrastructure/http/routes/session-requests.ts`:
  - `GET /therapies/:id/session-requests` — list
  - `POST /therapies/:id/session-requests` — CONSULTANT: `{ proposed_at, notes? }` → notifies psychologist `SESSION_REQUEST_RECEIVED`
  - `PATCH /session-requests/:id` — PSYCHOLOGIST: `{ status: "ACCEPTED" | "REJECTED" }` → on ACCEPTED: creates TherapySession; notifies consultant

**Business rule enforcement:**
- `POST /therapies` and `PATCH /therapy-requests/:id` (on ACCEPT) must check: if consultant already has an ACTIVE therapy → 409 `CONSULTANT_HAS_ACTIVE_THERAPY`

**Web — Terapias Pages:**
- `web/src/api/therapies.api.ts`, `therapy-requests.api.ts`
- `web/src/hooks/useTherapies.ts`
- `web/src/pages/terapias/TerapiasListPage.tsx` — table of therapies with status badges; ADMIN sees all, PSYCHOLOGIST sees own
- `web/src/pages/terapias/TerapiaDetailPage.tsx` — detail with sessions tab + scheduling section
- `web/src/pages/terapias/CreateTerapiaPage.tsx` — PSYCHOLOGIST only: form (consultant email, name, modality, billing plan)
- `web/src/pages/terapias/TherapyRequestsPage.tsx` — PSYCHOLOGIST: list of pending requests with Accept/Reject buttons
- Sidebar: add "Terapias" link (ADMIN + PSYCHOLOGIST); "Solicitudes" link (PSYCHOLOGIST)

### Verification commands
```bash
PSY1_TOKEN=... # login as psy1
C3_TOKEN=...   # login as consultant3

# Flow A: psychologist creates therapy for a new consultant
curl -X POST -H "Authorization: Bearer $PSY1_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"consultant_email":"new.patient@test.com","consultant_name":"Nueva Consultante","modality":"virtual","billing_plan":{"billing_type":"PER_SESSION","default_fee":500}}' \
  http://localhost:3000/therapies

# Flow B: consultant3 requests therapy with psy2
PSY2_ID=$(curl -s http://localhost:3000/psychologists | jq -r '.data[] | select(.email=="psy2@redapsi.app") | .id')
curl -X POST -H "Authorization: Bearer $C3_TOKEN" \
  -H "Content-Type: application/json" \
  -d "{\"psychologist_id\":\"$PSY2_ID\",\"message\":\"Me gustaría iniciar terapia\"}" \
  http://localhost:3000/therapy-requests

# Psychologist proposes slots
THERAPY_ID=$(curl -s -H "Authorization: Bearer $PSY1_TOKEN" http://localhost:3000/therapies | jq -r '.data[0].id')
curl -X POST -H "Authorization: Bearer $PSY1_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"proposed_slots":["2026-03-10T10:00:00Z","2026-03-11T15:00:00Z"]}' \
  http://localhost:3000/therapies/$THERAPY_ID/propositions
```

### Deliverable
Create `TESTING_PHASE_4.md` (cumulative).

---

### TESTING_PHASE_4.md additions

```markdown
# Manual Testing Checklist — Phase 4: Therapy Management

> Includes all checks from TESTING_PHASE_3.md plus the following.

## 9. Therapy Flow A — Psychologist creates therapy (API)

Login as psy1@redapsi.app:
- [ ] `POST /therapies` with a new consultant email creates: therapy (status=PENDING), a new User (role=CONSULTANT, must_change_password=true), ConsultantProfile, BillingPlan
- [ ] Console shows the temp password for the new consultant
- [ ] `GET /therapies` (as ADMIN) shows the new therapy with status=PENDING
- [ ] `GET /therapies/:id` (as CONSULTANT assigned to therapy) returns therapy WITHOUT `notes` field
- [ ] `GET /therapies/:id` (as PSYCHOLOGIST) returns therapy WITH `notes` field
- [ ] Attempting Flow A when the target consultant already has an ACTIVE therapy → 409 `CONSULTANT_HAS_ACTIVE_THERAPY`

## 10. Therapy Flow B — Consultant requests therapy (API)

Login as consultant3@redapsi.app:
- [ ] `POST /therapy-requests` with a valid psychologist_id creates a TherapyRequest (status=PENDING)
- [ ] Psychologist can see the request via `GET /therapy-requests`
- [ ] `PATCH /therapy-requests/:id` with status=ACCEPTED (as psychologist) creates Therapy(ACTIVE, CONSULTANT_INITIATED)
- [ ] `PATCH /therapy-requests/:id` with status=REJECTED notifies consultant and does NOT create a therapy
- [ ] Consultant cannot accept/reject their own therapy request → 403

## 11. Session Scheduling (API)

Using the active therapy between psy1 and consultant1:
- [ ] `POST /therapies/:id/propositions` (as psy1) with 2 proposed slots creates a proposition
- [ ] `GET /therapies/:id/propositions` (as consultant1) shows the pending proposition
- [ ] `PATCH /propositions/:id` (as consultant1) selecting a slot creates a TherapySession and sets proposition status=ACCEPTED
- [ ] `POST /therapies/:id/session-requests` (as consultant1) creates a session request
- [ ] `PATCH /session-requests/:id` (as psy1) with status=ACCEPTED creates a TherapySession

## 12. Notifications triggered (API)

After each of the above actions, check notifications:
- [ ] After consultant sends therapy request → `GET /notifications` (as psy1) shows `THERAPY_REQUEST_RECEIVED`
- [ ] After psychologist accepts → `GET /notifications` (as consultant3) shows `THERAPY_REQUEST_ACCEPTED`
- [ ] After psychologist proposes slots → `GET /notifications` (as consultant1) shows `PROPOSITION_RECEIVED`
- [ ] After consultant selects slot → `GET /notifications` (as psy1) shows `PROPOSITION_ACCEPTED`; consultant1 shows `SESSION_SCHEDULED`

## 13. Web — Terapias Pages

Login as psy1@redapsi.app:
- [ ] Sidebar shows "Terapias" link → navigate to `/terapias`
- [ ] List shows existing therapies with status badges
- [ ] "Nueva Terapia" button → form → fill in consultant email, name, modality, billing plan → submit → new therapy appears in list
- [ ] Click therapy → detail page shows therapy info + "Sesiones" tab (empty initially)
- [ ] Sidebar shows "Solicitudes" link → pending therapy requests list → Accept button creates therapy in the list

Login as admin@redapsi.app:
- [ ] `/terapias` shows ALL therapies (read-only — no create button)
```

---

## Phase 5 — Session Lifecycle

**Goal**: Full session lifecycle works (complete, cancel, postpone). Session notes support public/private visibility. Media can be attached to sessions.

### Scope

**Backend — Sessions:**
- `backend/src/application/sessions/` — use cases: `ListSessionsUseCase`, `GetSessionUseCase`, `CompleteSessionUseCase`, `CancelSessionUseCase`, `PostponeSessionUseCase`, `ConfirmPostponeUseCase`, `UpdateSessionFeeUseCase`, `AttachSessionMediaUseCase`
- `backend/src/infrastructure/http/routes/sessions.ts`:
  - `GET /sessions` — list (PSYCHOLOGIST: own therapy sessions; ADMIN: all) — query: `therapy_id`, `status`
  - `GET /sessions/:id` — detail with `effective_fee` computed field
  - `PATCH /sessions/:id` — PSYCHOLOGIST: update `session_fee`, `scheduled_at` (if SCHEDULED), `duration`
  - `POST /sessions/:id/complete` — PSYCHOLOGIST only: sets status=COMPLETED; triggers `SESSION_COMPLETED` notification to both
  - `POST /sessions/:id/cancel` — PSYCHOLOGIST or CONSULTANT: body `{ reason? }` → sets status=CANCELLED, cancelled_by; triggers `SESSION_CANCELLED` to both
  - `POST /sessions/:id/postpone` — PSYCHOLOGIST or CONSULTANT: body `{ new_date, reason? }` → sets status=POSTPONED, postponed_to; triggers `SESSION_POSTPONED` to both
  - `POST /sessions/:id/confirm-postpone` — PSYCHOLOGIST: sets scheduled_at=postponed_to, status=SCHEDULED, postponed_to=null
  - `POST /sessions/:id/media` — multipart, adds URL to media_urls array

**Backend — Session Notes:**
- `backend/src/application/session-notes/` — use cases: `ListNotesUseCase`, `CreateNoteUseCase`, `UpdateNoteUseCase`, `DeleteNoteUseCase`
- `backend/src/infrastructure/http/routes/session-notes.ts`:
  - `GET /sessions/:id/notes` — returns notes where `is_private=false OR author_id=req.user.id`
  - `POST /sessions/:id/notes` — body: `{ content, is_private }` (both PSYCHOLOGIST and CONSULTANT)
  - `PATCH /sessions/:id/notes/:noteId` — own notes only
  - `DELETE /sessions/:id/notes/:noteId` — own notes only
  - Creating a public note triggers `NOTE_ADDED` notification to the other party

**Web — Sessions Pages:**
- `web/src/api/sessions.api.ts`, `session-notes.api.ts`
- `web/src/pages/sesiones/SesionesListPage.tsx` — session list with status chips (Programada / Completada / Cancelada / Pospuesta)
- `web/src/pages/sesiones/SessionDetailPage.tsx` — tabs: Info | Notas | Archivos
  - Info tab: scheduled_at, duration, effective_fee, status; Cancel/Postpone/Complete buttons (role-appropriate)
  - Notas tab: list of visible notes; "Nueva Nota" form with is_private toggle
  - Archivos tab: media_urls list + upload button
- Sidebar: add "Sesiones" link (PSYCHOLOGIST)

### Verification commands
```bash
SESSION_ID=... # get from GET /sessions

# Complete a session
curl -X POST -H "Authorization: Bearer $PSY1_TOKEN" http://localhost:3000/sessions/$SESSION_ID/complete

# Cancel a session
curl -X POST -H "Authorization: Bearer $PSY1_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"reason":"Consultante no se presentó"}' \
  http://localhost:3000/sessions/$SESSION_ID/cancel

# Add a public note
curl -X POST -H "Authorization: Bearer $PSY1_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"content":"Sesión muy productiva. Avance en objetivos.","is_private":false}' \
  http://localhost:3000/sessions/$SESSION_ID/notes

# Add a private note (should not appear for consultant)
curl -X POST -H "Authorization: Bearer $PSY1_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"content":"Observación clínica privada","is_private":true}' \
  http://localhost:3000/sessions/$SESSION_ID/notes

# Verify consultant cannot see private note
curl -H "Authorization: Bearer $C1_TOKEN" http://localhost:3000/sessions/$SESSION_ID/notes
```

### Deliverable
Create `TESTING_PHASE_5.md` (cumulative).

---

### TESTING_PHASE_5.md additions

```markdown
# Manual Testing Checklist — Phase 5: Session Lifecycle

> Includes all checks from TESTING_PHASE_4.md plus the following.

## 14. Session lifecycle (API)

Get a SCHEDULED session ID from `GET /sessions`.

- [ ] `POST /sessions/:id/complete` (as psychologist) → status becomes COMPLETED
- [ ] `POST /sessions/:id/cancel` (as psychologist or consultant) with reason → status becomes CANCELLED, cancelled_by is set
- [ ] `POST /sessions/:id/postpone` with new_date → status becomes POSTPONED, postponed_to is set
- [ ] `POST /sessions/:id/confirm-postpone` → status back to SCHEDULED, scheduled_at = new date, postponed_to = null
- [ ] `GET /sessions/:id` always returns `effective_fee` (computed from session_fee ?? billing_plan.default_fee)
- [ ] `PATCH /sessions/:id` with session_fee=0 (as psychologist) → effective_fee is 0 on next GET

### Status transitions (verify each is rejected):
- [ ] Cannot complete a CANCELLED session → 422
- [ ] Cannot cancel an already CANCELLED session → 422

## 15. Session notes (API)

- [ ] `POST /sessions/:id/notes` (as psychologist) with is_private=false → note visible to both psychologist and consultant
- [ ] `POST /sessions/:id/notes` (as psychologist) with is_private=true → note NOT in consultant's `GET /sessions/:id/notes` response
- [ ] `POST /sessions/:id/notes` (as consultant) with is_private=false → visible to psychologist
- [ ] `PATCH /sessions/:id/notes/:noteId` — can only edit own notes (other's notes return 403)
- [ ] `DELETE /sessions/:id/notes/:noteId` — can only delete own notes

## 16. Notifications for sessions

- [ ] Completing a session triggers `SESSION_COMPLETED` in notifications for both psychologist and consultant
- [ ] Cancelling a session triggers `SESSION_CANCELLED` for both parties
- [ ] Postponing triggers `SESSION_POSTPONED` for both parties
- [ ] Adding a public note triggers `NOTE_ADDED` for the other party
- [ ] Adding a private note does NOT trigger any notification

## 17. Web — Sessions Pages

Login as psy1@redapsi.app:
- [ ] `/sesiones` shows session list with colored status chips
- [ ] Click a SCHEDULED session → detail page, Info tab shows date/time and effective_fee
- [ ] "Cancelar" button → confirmation dialog → session status becomes Cancelada in the list
- [ ] "Posponer" button → date picker → confirm → session status becomes Pospuesta
- [ ] "Confirmar nueva fecha" button on postponed session → status back to Programada
- [ ] "Completar" button on scheduled session → status becomes Completada

### Notas tab:
- [ ] Notas tab shows existing notes with author + date
- [ ] "Nueva Nota" form → write content → toggle "Nota privada" → save → note appears in list
- [ ] Private notes show a lock icon (or visual indicator)
- [ ] A note by consultant1 appears in psychologist's notes tab (public notes only)

### Archivos tab:
- [ ] Upload a .jpg file → file URL appears in the list
- [ ] Click URL → file opens/downloads
```

---

## Phase 6 — Goals, Payments & Events

**Goal**: Psychologists can track therapy goals with progress snapshots. Payments can be registered against sessions. Events can be created and joined.

### Scope

**Backend — Goals:**
- `backend/src/application/goals/` — use cases: `CreateGoalUseCase`, `ListGoalsUseCase`, `UpdateGoalUseCase`, `DeleteGoalUseCase`
- `backend/src/infrastructure/http/routes/goals.ts`:
  - `GET /therapies/:id/goals` — PSYCHOLOGIST + CONSULTANT (own therapy only)
  - `POST /therapies/:id/goals` — PSYCHOLOGIST only: `{ title, description? }`
  - `PATCH /goals/:id` — PSYCHOLOGIST only: `{ title?, description?, status?, progress? }` — if `progress` changes → atomically creates `GoalProgressEntry`; triggers `GOAL_UPDATED` notification to consultant
  - `DELETE /goals/:id` — PSYCHOLOGIST only
  - `GET /therapies/:id/progress` — returns goals array with `entries` timeline (for charts)

**Backend — Payments:**
- `backend/src/application/payments/` — use cases: `RegisterPaymentUseCase`, `ListPaymentsUseCase`, `GetSessionPaymentUseCase`
- `backend/src/infrastructure/http/routes/payments.ts`:
  - `GET /sessions/:id/payment` — PSYCHOLOGIST
  - `POST /sessions/:id/payment` — PSYCHOLOGIST: `{ amount, method, reference?, notes?, paid_at }` — links to session + billing_plan
  - `PATCH /payments/:id` — PSYCHOLOGIST: update amount/method/reference/status (including WAIVED)
  - `GET /therapies/:id/payments` — PSYCHOLOGIST
  - `GET /payments?scope=THERAPY_SESSION` — PSYCHOLOGIST (own) or ADMIN (all), filterable by date range
  - `GET /payments/me` — CONSULTANT: own payment history (read-only)

**Backend — Events:**
- `backend/src/application/events/` — use cases: `CreateEventUseCase`, `ListEventsUseCase`, `GetEventUseCase`, `UpdateEventUseCase`, `DeleteEventUseCase`, `RegisterForEventUseCase`, `CancelEventRegistrationUseCase`
- `backend/src/infrastructure/http/routes/events.ts`:
  - `GET /events` — public list, filter: upcoming/past/free/paid; respects soft delete
  - `GET /events/:id` — detail + registrations count
  - `POST /events` — ADMIN only: `{ title, description?, location?, date, recurrence?, cost, max_participants? }`
  - `PUT /events/:id` — ADMIN only
  - `DELETE /events/:id` — ADMIN only (soft delete)
  - `PATCH /events/:id/restore` — ADMIN only
  - `GET /events/:id/registrations` — ADMIN only
  - `POST /events/:id/register` — CONSULTANT: registers; if event is full → 409 `EVENT_FULL`; if cost>0 → creates Payment(PENDING); notifies consultant `EVENT_REGISTRATION_CONFIRMED`
  - `DELETE /events/:id/registrations/:id` — CONSULTANT: cancel own registration; triggers `EVENT_REGISTRATION_CANCELLED`

**Backend — Admin Payment Dashboard:**
- `backend/src/infrastructure/http/routes/admin.ts`:
  - `GET /admin/payments` — ADMIN only: all payments, filters: psychologist_id, therapy_id, scope, status, date range; returns paginated list + summary totals
  - `GET /admin/payments/summary` — ADMIN: totals by period (week/month/year), split by scope, split by status

**Web — Goals:**
- `web/src/pages/objetivos/ObjetivosPage.tsx` — list of goals for a therapy with progress bars; "Nuevo Objetivo" form (psychologist only); "Actualizar progreso" slider; line chart per goal using Recharts
- Route: `/terapias/:id/objetivos` (PSYCHOLOGIST)

**Web — Pagos:**
- `web/src/pages/pagos/TerapiaPagosPage.tsx` — per-therapy payment list, "Registrar Pago" form (psychologist)
- `web/src/pages/pagos/FinanzasPage.tsx` — ADMIN: summary cards (total PAID / PENDING / WAIVED), paginated transactions table with all filters
- Sidebar: add "Pagos" link (PSYCHOLOGIST + ADMIN), "Finanzas" link (ADMIN)

**Web — Eventos:**
- `web/src/pages/eventos/EventosListPage.tsx` — event list with upcoming/past filter; ADMIN sees "Nuevo Evento" button
- `web/src/pages/eventos/EventoDetailPage.tsx` — event info + registration count
- `web/src/pages/eventos/CreateEventoPage.tsx` — ADMIN: event creation form
- Sidebar: add "Eventos" link (ADMIN)

### Deliverable
Create `TESTING_PHASE_6.md` (cumulative).

---

### TESTING_PHASE_6.md additions

```markdown
# Manual Testing Checklist — Phase 6: Goals, Payments & Events

> Includes all checks from TESTING_PHASE_5.md plus the following.

## 18. Goals (API)

Using the active therapy (psy1 + consultant1):
- [ ] `POST /therapies/:id/goals` (as psy1) creates a goal
- [ ] `GET /therapies/:id/goals` (as psy1 and as consultant1) both see the goal
- [ ] `PATCH /goals/:id` with `progress: 50` creates a GoalProgressEntry snapshot
- [ ] `PATCH /goals/:id` with `progress: 80` creates a second snapshot
- [ ] `GET /therapies/:id/progress` returns goals array with `entries` having 2 snapshots
- [ ] CONSULTANT token cannot `POST /therapies/:id/goals` → 403
- [ ] `PATCH /goals/:id` triggers `GOAL_UPDATED` notification for consultant1

## 19. Payments — Therapy (API)

- [ ] `POST /sessions/:id/payment` (as psy1) with amount=500, method=CASH → payment created with status=PENDING
- [ ] `PATCH /payments/:id` with status=PAID → status updated
- [ ] `PATCH /payments/:id` with status=WAIVED → waived
- [ ] `GET /sessions/:id/payment` returns the payment linked to the session
- [ ] `GET /therapies/:id/payments` lists all payments for the therapy
- [ ] `GET /payments/me` (as consultant1) returns own payment history (read-only)
- [ ] `GET /payments?scope=THERAPY_SESSION` (as ADMIN) returns all therapy payments

## 20. Events (API)

- [ ] `POST /events` (as ADMIN) creates an event with cost=0 (free)
- [ ] `POST /events` with cost=200 and max_participants=5 creates a paid event with capacity
- [ ] `GET /events` (unauthenticated) lists both events
- [ ] `POST /events/:id/register` (as consultant1, free event) → registration CONFIRMED immediately; no Payment record created
- [ ] `POST /events/:id/register` (as consultant1, paid event) → registration CONFIRMED + Payment(PENDING) created
- [ ] Register 5 consultants for the capacity-limited event → 6th registration returns 409 `EVENT_FULL`
- [ ] `DELETE /events/:id/registrations/:id` (as consultant1) cancels registration
- [ ] `DELETE /events/:id` (as ADMIN) soft-deletes event → no longer in `GET /events` list
- [ ] `PATCH /events/:id/restore` (as ADMIN) restores it

## 21. Admin Payment Dashboard (API)

- [ ] `GET /admin/payments` (as ADMIN) returns all payments with pagination
- [ ] Filter by `scope=EVENT` returns only event payments
- [ ] Filter by `status=PENDING` returns only pending payments
- [ ] `GET /admin/payments/summary` returns totals by scope and status

## 22. Web — Goals (Objetivos tab in Terapia detail)

Login as psy1@redapsi.app → navigate to terapia detail → Objetivos tab:
- [ ] Goal list is shown with progress bars
- [ ] "Nuevo Objetivo" form → create goal "Reducir ansiedad"
- [ ] Progress slider → set to 40% → save → progress bar updates
- [ ] Set progress to 70% again → Recharts line chart shows 2 data points

## 23. Web — Pagos Pages

Login as psy1@redapsi.app:
- [ ] `/terapias/:id/pagos` shows payment list for the therapy
- [ ] "Registrar Pago" form → amount, method (select), reference → save → appears in list
- [ ] "Marcar como condonado" (WAIVED) button → status badge changes

Login as admin@redapsi.app:
- [ ] `/finanzas` shows summary cards: Total recaudado, Pendiente, Condonado
- [ ] Transactions table shows all payments with filters
- [ ] Filter by scope=EVENT shows only event payments

## 24. Web — Eventos Pages

Login as admin@redapsi.app:
- [ ] `/eventos` shows event list with upcoming/past tabs
- [ ] "Nuevo Evento" → form → create event with future date, cost=0 → appears in list
- [ ] Click event → detail page shows info + registration count
- [ ] Edit event → change title → save → updated in list
- [ ] "Eliminar" → soft delete → removed from list
```

---

## Phase 7 — Notifications & Chat

**Goal**: Users see real-time-ish notifications in the web UI. Psychologist and consultant can chat per therapy in real time.

### Scope

**Backend — Notification API:**
- `backend/src/infrastructure/http/routes/notifications.ts`:
  - `GET /notifications` — authenticated user's notifications, paginated, filter `?read=false`
  - `GET /notifications/unread-count` — returns `{ data: { count: N } }`
  - `PATCH /notifications/:id/read` — marks one as read
  - `PATCH /notifications/read-all` — marks all as read

**Backend — Chat (Socket.IO):**
- `backend/src/infrastructure/websocket/chatServer.ts` — Socket.IO attached to Express server
  - Auth via JWT on handshake: `socket.handshake.auth.token`
  - Events: `join_therapy(therapy_id)`, `send_message({ therapy_id, content, media_url? })`, `message_received({ id, therapy_id, sender_id, content, media_url, created_at })`
  - Persists Message to DB on `send_message`
  - Triggers `NEW_MESSAGE` notification (with 60-second debounce check)
  - Emits `message_received` to all sockets in the therapy room
- `backend/src/infrastructure/http/routes/messages.ts`:
  - `GET /therapies/:id/messages` — paginated message history (PSYCHOLOGIST or CONSULTANT in the therapy)

**Web — Notifications:**
- `web/src/context/NotificationContext.tsx` — polls `GET /notifications/unread-count` every 30 seconds; provides count + markRead helpers
- `web/src/components/layout/TopBar.tsx` — add bell icon with unread badge (pulls from NotificationContext)
- `web/src/pages/notificaciones/NotificacionesPage.tsx` — paginated list; "Marcar todas leídas" button; each item shows type icon, title, body, created_at, read state
- Sidebar: add "Notificaciones" link for all roles
- Route: `/notificaciones`

**Web — Chat:**
- `web/src/api/messages.api.ts`
- `web/src/pages/chat/ChatPage.tsx` — PSYCHOLOGIST only; per-therapy chat; Socket.IO client; message bubbles (own right / other left); media_url attachment support; loads history from `GET /therapies/:id/messages` on mount
- Sidebar: add "Chat" link (PSYCHOLOGIST only)
- Route: `/terapias/:id/chat`

### Deliverable
Create `TESTING_PHASE_7.md` (cumulative).

---

### TESTING_PHASE_7.md additions

```markdown
# Manual Testing Checklist — Phase 7: Notifications & Chat

> Includes all checks from TESTING_PHASE_6.md plus the following.

## 25. Notification API

Login as consultant1@redapsi.app:
- [ ] `GET /notifications` returns list of notifications (created by previous phase actions)
- [ ] `GET /notifications?read=false` returns only unread ones
- [ ] `GET /notifications/unread-count` returns `{ data: { count: N } }`
- [ ] `PATCH /notifications/:id/read` marks one as read → `read=true` on next GET
- [ ] `PATCH /notifications/read-all` → all read; unread-count returns 0

## 26. Chat via Socket.IO (API-level test)

Use a Socket.IO client (e.g. Postman WebSocket or custom script):
```js
const socket = io("http://localhost:3000", { auth: { token: "<psy1_access_token>" } });
socket.emit("join_therapy", "<therapy_id>");
socket.emit("send_message", { therapy_id: "<id>", content: "Hola consultante" });
socket.on("message_received", (msg) => console.log(msg));
```
- [ ] Psychologist connects and joins therapy room
- [ ] Consultant (second connection) joins same room and receives `message_received` when psychologist sends
- [ ] `GET /therapies/:id/messages` (REST) returns the persisted message
- [ ] Sending a message triggers `NEW_MESSAGE` notification for the recipient
- [ ] Sending a second message within 60 seconds does NOT create a duplicate `NEW_MESSAGE` notification

## 27. Web — Notification Bell

Login as consultant1@redapsi.app (if role allowed on web — use psy1 for this):

Login as psy1@redapsi.app:
- [ ] TopBar shows bell icon with a red badge showing the unread count
- [ ] Badge count updates within 30 seconds of a new notification being created
- [ ] Click bell → navigates to `/notificaciones`
- [ ] Notifications list shows type, title, body, date
- [ ] Click "Marcar todas leídas" → badge count goes to 0; all items show as read

## 28. Web — Chat Page

Login as psy1@redapsi.app:
- [ ] Sidebar shows "Chat" link
- [ ] Navigate to `/terapias/:id/chat` → chat interface loads with message history
- [ ] Type a message and press Enter → bubble appears on the right side
- [ ] Open a second browser tab/window with consultant1 (conceptual — on mobile this is tested in Phase 10)
- [ ] Messages received from consultant appear as bubbles on the left
- [ ] Attaching a file to a message sends it (media_url visible in the bubble)
```

---

## Phase 8 — Admin Dashboard & Web Polish

**Goal**: Admin users see meaningful statistics. The web app has a complete, polished sidebar with all role-appropriate links. Change-password enforcement works.

### Scope

**Backend — Admin Stats:**
- `backend/src/infrastructure/http/routes/admin.ts` — add:
  - `GET /admin/stats` — ADMIN: `{ total_therapies, active_therapies, total_sessions, sessions_by_status: {...}, total_consultants, total_psychologists, upcoming_sessions, revenue_this_month }`
- `backend/src/infrastructure/http/routes/psychologist-stats.ts`:
  - `GET /stats/me` — PSYCHOLOGIST: own stats: `{ active_therapies, total_sessions, upcoming_sessions, pending_payments, revenue_this_month }`

**Web — Dashboards:**
- `web/src/pages/dashboard/AdminDashboardPage.tsx` — stat cards using brand colors; links to Terapias / Finanzas / Eventos
- `web/src/pages/dashboard/PsychologistDashboardPage.tsx` — own stats cards: terapias activas, sesiones este mes, cobros pendientes
- Route: `/dashboard` → renders AdminDashboardPage or PsychologistDashboardPage based on role

**Web — Change Password Enforcement:**
- `web/src/context/AuthContext.tsx` — after login, if `must_change_password=true` → redirect to `/cambiar-contrasena`
- `web/src/pages/auth/ChangePasswordPage.tsx` — form; on success, re-fetches user and continues to dashboard

**Web — Sidebar final:**
- Complete all sidebar links for each role with icons (use any icon library already installed or heroicons via CDN)
- ADMIN links: Dashboard, Usuarios (stub page), Terapias, Finanzas, Eventos, Notificaciones, Perfil
- PSYCHOLOGIST links: Dashboard, Mis Terapias, Sesiones, Pagos, Chat, Objetivos, Notificaciones, Perfil
- ADMIN_PSYCHOLOGIST links: union of both

**Web — Usuarios Page (admin):**
- `web/src/pages/usuarios/UsuariosPage.tsx` — ADMIN: table of all users with role badges, soft-delete button, restore button; read-only user detail modal

### Verification commands
```bash
ADMIN_TOKEN=...
curl -H "Authorization: Bearer $ADMIN_TOKEN" http://localhost:3000/admin/stats

PSY1_TOKEN=...
curl -H "Authorization: Bearer $PSY1_TOKEN" http://localhost:3000/stats/me
```

### Deliverable
Create `TESTING_PHASE_8.md` (cumulative).

---

### TESTING_PHASE_8.md additions

```markdown
# Manual Testing Checklist — Phase 8: Admin Dashboard & Web Polish

> Includes all checks from TESTING_PHASE_7.md plus the following.

## 29. Admin & Psychologist Stats (API)

- [ ] `GET /admin/stats` (as ADMIN) returns object with all stat fields, numbers make sense relative to seed data
- [ ] `GET /stats/me` (as psy1) returns psychologist's own stats

## 30. Change Password Enforcement (Web)

- [ ] Create a new consultant via Flow A (psychologist creates therapy) → note the temp password from console
- [ ] Open a new browser → login with the temp credentials → redirected to `/cambiar-contrasena` instead of dashboard
- [ ] Fill the form with new password → submit → redirected to `/dashboard`
- [ ] `must_change_password` is now false (verify via `GET /auth/me` or next login skips the redirect)

## 31. Web — Admin Dashboard

Login as admin@redapsi.app:
- [ ] `/dashboard` shows Admin Dashboard with stat cards (terapias activas, sesiones, consultantes, psicólogos)
- [ ] Revenue card shows this month's total
- [ ] Each stat card links to the relevant section

## 32. Web — Psychologist Dashboard

Login as psy1@redapsi.app:
- [ ] `/dashboard` shows own stats: active therapies count, sessions this month, pending payments

## 33. Web — Sidebar completeness

Login as admin@redapsi.app → check sidebar has: Dashboard, Usuarios, Terapias, Finanzas, Eventos, Notificaciones, Perfil
Login as psy1@redapsi.app → check sidebar has: Dashboard, Mis Terapias, Sesiones, Pagos, Chat, Objetivos, Notificaciones, Perfil
Login as adminpsy@redapsi.app → check sidebar has all links from both roles

## 34. Web — Usuarios Page (admin)

Login as admin@redapsi.app:
- [ ] `/usuarios` shows table of all users with role badges
- [ ] "Desactivar" (soft delete) a user → user disappears from active list
- [ ] "Restaurar" → user reappears
- [ ] Click user row → modal shows user details (read-only)
```

---

## Phase 9 — Backend API Documentation & Tests

**Goal**: The backend is fully documented (Swagger + Postman). Automated test coverage is ≥ 80%.

### Scope

**Backend — Swagger:**
- Install `swagger-jsdoc` + `swagger-ui-express` (already in package.json from Phase 1)
- Add JSDoc `@swagger` comments to every route handler
- `GET /api-docs` serves Swagger UI

**Backend — Postman Collection:**
- `backend/postman/redapsi.postman_collection.json` — one folder per resource, every endpoint with example request + saved responses (success + error)
- `backend/postman/redapsi.postman_environment.json` — `base_url`, `access_token`, `refresh_token` variables
- `backend/postman/README.md` — import instructions + end-to-end flow order

**Backend — Tests (Jest + Supertest):**
- `backend/tests/auth.test.ts` — register, login, refresh, logout, change-password
- `backend/tests/permissions.test.ts` — RBAC enforcement for every protected route
- `backend/tests/therapies.test.ts` — Flow A, Flow B, therapy request, scheduling
- `backend/tests/sessions.test.ts` — complete, cancel, postpone, fee override
- `backend/tests/notes.test.ts` — public/private visibility, CRUD
- `backend/tests/goals.test.ts` — CRUD, progress snapshot, consultant read-only
- `backend/tests/payments.test.ts` — register, waive, history views
- `backend/tests/events.test.ts` — CRUD, registration, capacity, auto-payment
- `backend/tests/notifications.test.ts` — unread count, mark read, debounce
- `backend/tests/upload.test.ts` — file upload, size limit, type validation
- `backend/tests/chat.test.ts` — message persistence via REST + notification debounce
- Test script: `npm test` runs all; `npm run test:coverage` outputs coverage report
- Coverage gate: configure Jest to fail if overall line coverage < 80%

**backend/README.md** — all sections as specified in CLAUDE.md.

**Web — Tests:**
- `web/src/pages/auth/__tests__/LoginPage.test.tsx` — renders, submits, shows errors
- `web/src/context/__tests__/AuthContext.test.tsx` — login/logout state
- At least 3 additional test files covering critical paths (TerapiasListPage, NotificacionesPage, etc.)
- `npm test` uses Vitest

**web/README.md** — all sections as specified in CLAUDE.md.

### Verification commands
```bash
# Backend tests
docker compose run --rm backend npm test
docker compose run --rm backend npm run test:coverage
# → coverage must be ≥ 80% on all metrics

# Web tests
docker compose run --rm web npm test

# Swagger UI
# Open http://localhost:3000/api-docs → all endpoints are documented with schemas and example responses
```

### Deliverable
Create `TESTING_PHASE_9.md` (cumulative).

---

### TESTING_PHASE_9.md additions

```markdown
# Manual Testing Checklist — Phase 9: API Documentation & Tests

> Includes all checks from TESTING_PHASE_8.md plus the following.

## 35. Swagger UI

- [ ] Open `http://localhost:3000/api-docs`
- [ ] All resource groups visible: Auth, Psychologists, Consultants, Therapies, TherapyRequests, Sessions, Notes, Goals, Payments, Events, Notifications, Upload, Chat, Admin
- [ ] Click "POST /auth/login" → "Try it out" → enter credentials → execute → 200 response with tokens
- [ ] Click "GET /therapies" → Authorize with access_token → execute → returns therapy list
- [ ] Every endpoint shows at least one 2xx and one 4xx example response

## 36. Postman Collection

- [ ] Import `backend/postman/redapsi.postman_collection.json` into Postman
- [ ] Import `backend/postman/redapsi.postman_environment.json` and select it
- [ ] Run "Auth → Login (admin)" → `access_token` variable auto-populated
- [ ] Run the end-to-end flow from `backend/postman/README.md` in order:
  - Register → Login → Create Therapy → Schedule Session → Add Note → Add Goal → Register Payment → Create Event → Register for Event

## 37. Automated Tests

```bash
docker compose run --rm backend npm run test:coverage
```
- [ ] All test files pass (0 failing tests)
- [ ] Coverage report shows ≥ 80% lines, functions, branches
- [ ] `docker compose run --rm web npm test` passes with 0 failures
```

---

## Phase 10 — Android Mobile App

**Goal**: Consultant journey is complete on Android. All screens from the CLAUDE.md mobile screen list are implemented.

### Scope

**KMM Shared Module (`mobile/shared/`):**
- `commonMain/kotlin/com/redapsi/shared/` — networking (Ktor HTTP client), auth logic, JWT storage, domain models (matching Prisma schema field names in English), repository interfaces, use cases
- DataStore on Android for token persistence
- WebSocket client (Ktor) for chat
- API base URL config: Android → `http://10.0.2.2:3000`, iOS → `http://localhost:3000`

**Android App (`mobile/androidApp/`):**
- `ui/theme/Color.kt` — brand colors matching CLAUDE.md
- `ui/theme/Theme.kt`, `ui/theme/Type.kt`
- Navigation: `Screen` sealed class + `NavGraph.kt` (all routes)
- All screens (user-facing text in Spanish, code in English):

| Screen | Route | Notes |
|--------|-------|-------|
| SplashScreen | / | Token check → routing |
| LoginScreen | /login | Email + password form |
| RegisterScreen | /register | Self-registration |
| ChangePasswordScreen | /change-password | Shown when must_change_password=true |
| OnboardingIntroScreen | /onboarding/intro | 3 HorizontalPager slides |
| OnboardingScreen | /onboarding | 6-step flow, shared ViewModel |
| OnboardingConfirmationScreen | /onboarding/confirm | Summary + confirm |
| HomeScreen | /home | Bottom nav shell |
| DashboardScreen | /home/dashboard | Next session, unread badge, goals summary |
| BuscarPsicologosScreen | /psychologists | List with filters |
| PsychologistDetailScreen | /psychologists/:id | Profile + availability + request button |
| MisTerapiasScreen | /home/therapies | Therapy list |
| TerapiaDetailScreen | /therapies/:id | Tabs: Sesiones, Objetivos, Chat, Pagos |
| SesionesScreen | /home/sessions | Session list with status chips |
| SesionDetailScreen | /sessions/:id | Notes (public), media, cancel/postpone |
| ChatScreen | /therapies/:id/chat | Real-time chat |
| ObjetivosScreen | /therapies/:id/goals | Goal list with progress bars |
| MisPagosScreen | /home/payments | Payment history read-only |
| EventosScreen | /home/events | Event list with filters |
| EventoDetailScreen | /events/:id | Info, cost, register button |
| NotificacionesScreen | /home/notifications | List with deep-link on tap |
| MiPerfilScreen | /home/profile | View + edit consultant profile |

### Verification
Run on Android emulator (API 28+) with backend running via Docker:
```bash
./gradlew androidApp:assembleDebug
# Install APK on emulator, run through manual checklist
```

### Deliverable
Create `TESTING_PHASE_10.md` (cumulative).

---

### TESTING_PHASE_10.md additions

```markdown
# Manual Testing Checklist — Phase 10: Android Mobile App

> Includes all checks from TESTING_PHASE_9.md plus the following.
> Pre-condition: Backend running via `docker compose up -d`. Android emulator (API 28+) running.

## 38. Auth & Routing (Android)

- [ ] App opens → SplashScreen → if no token → LoginScreen
- [ ] SplashScreen with valid token + onboarded → HomeScreen (Dashboard tab)
- [ ] SplashScreen with valid token + NOT onboarded → OnboardingScreen (skipping intro)
- [ ] Login with psy1@redapsi.app → shows error "Usa el portal web"
- [ ] Login with admin@redapsi.app → shows error "Usa el portal web"
- [ ] Login with consultant1@redapsi.app / Consult1234! → HomeScreen
- [ ] Login with consultant2@redapsi.app → Onboarding at step 3 (resumes, not restarted)

## 39. Onboarding (Android)

Login with a fresh CONSULTANT account (must_change_password flow not yet complete):
- [ ] After registration → OnboardingIntroScreen with 3 swipeable slides
- [ ] Swipe through all 3 → "Comenzar" button → OnboardingScreen (step 1)
- [ ] Steps 1–5 each have a "Omitir" button
- [ ] Step progress tracker shows correct state (filled / check / empty circles)
- [ ] Step 6 has NO "Omitir" button
- [ ] Complete step 6 → OnboardingConfirmationScreen shows summary of all answers
- [ ] "Confirmar" → API call → HomeScreen
- [ ] On app restart → goes directly to HomeScreen (onboarding complete)

## 40. Dashboard (Android)

Login as consultant1@redapsi.app:
- [ ] Dashboard tab shows: next scheduled session card, notification badge in TopBar
- [ ] Unread notification count badge matches API `GET /notifications/unread-count`

## 41. Mis Terapias (Android)

- [ ] "Terapias" tab shows active therapy with psychologist name and status
- [ ] Tap therapy → TerapiaDetailScreen with tabs: Sesiones, Objetivos, Chat, Pagos

## 42. Sesiones (Android)

- [ ] "Sesiones" tab shows session list with colored status chips: Programada / Completada / Cancelada / Pospuesta
- [ ] Tap a SCHEDULED session → detail screen
- [ ] "Cancelar" button visible → confirm → session status updates

## 43. Chat (Android)

In TerapiaDetailScreen → Chat tab:
- [ ] Chat history loads from API
- [ ] Type a message → send → bubble appears (right side)
- [ ] Message received from psychologist (send from web) → appears (left side) in real time

## 44. Objetivos (Android)

In TerapiaDetailScreen → Objetivos tab:
- [ ] Goal list with progress bar for each goal
- [ ] Progress percentages match what was set via web

## 45. Mis Pagos (Android)

- [ ] "Pagos" tab (or bottom nav) shows payment list: date, amount, method, status badge
- [ ] No edit controls — read-only

## 46. Eventos (Android)

- [ ] "Eventos" tab shows event list with upcoming/past filter
- [ ] Tap event → EventoDetailScreen: title, date, location, cost
- [ ] "Inscribirse" button on free event → success message
- [ ] "Inscribirse" on paid event → payment created (status PENDING) + success message
- [ ] "Inscribirse" on full event → error message "Evento completo"

## 47. Notificaciones (Android)

- [ ] "Notificaciones" tab shows notification list with read/unread visual difference
- [ ] Tap a `SESSION_SCHEDULED` notification → navigates to the session detail
- [ ] Tap a `THERAPY_REQUEST_ACCEPTED` notification → navigates to therapy detail

## 48. Mi Perfil (Android)

- [ ] Profile screen shows name, email, phone, emergency contact
- [ ] "Editar" → edit mode → change phone → save → updated
- [ ] "Cambiar foto" → select from gallery → avatar updated
```

---

## Phase 11 — iOS Mobile App

**Goal**: Consultant journey is complete on iOS (SwiftUI), matching all Android screens.

### Scope

**iOS App (`mobile/iosApp/`):**
- `Assets.xcassets` — brand color sets (matching CLAUDE.md)
- SwiftUI views for all screens (identical feature set to Android)
- Uses KMM shared module via Kotlin/Native framework
- API base URL: `http://localhost:3000`

All screens listed in Phase 10 implemented in SwiftUI.

**KMM Shared Tests:**
- `mobile/shared/src/commonTest/` — use case + repository tests
- `./gradlew shared:test` → all pass

**mobile/README.md** — all sections as specified in CLAUDE.md (Android + iOS setup).

### Verification
Run on iOS Simulator (iPhone 15+, iOS 17+) with backend running:
```bash
# Open iosApp/iosApp.xcworkspace in Xcode
# Select iosApp scheme → Run on Simulator
./gradlew shared:test  # shared module tests
```

### Deliverable
Create `TESTING_PHASE_11.md` (cumulative — final checklist).

---

### TESTING_PHASE_11.md additions

```markdown
# Manual Testing Checklist — Phase 11: iOS Mobile App (FINAL)

> Complete checklist covering ALL implemented features across all platforms.
> This is the definitive QA checklist for the full system.
> Pre-conditions:
>   - `docker compose up -d` (backend + db + web running)
>   - Android emulator running (API 28+)
>   - iOS Simulator running (iOS 17+)

## 49. iOS — Auth & Routing

Repeat all checks from Section 38 (Android) on iOS Simulator:
- [ ] Splash → routing
- [ ] ADMIN/PSYCHOLOGIST login rejected with "Usa el portal web"
- [ ] Consultant login → HomeScreen

## 50. iOS — Onboarding

Repeat Section 39 on iOS Simulator:
- [ ] 3-slide intro (SwiftUI TabView)
- [ ] 6-step flow with progress indicator
- [ ] Step 6 cannot be skipped
- [ ] Confirmation → API call → HomeScreen

## 51. iOS — All screens

Repeat Sections 40–48 on iOS Simulator:
- [ ] Dashboard (40)
- [ ] Mis Terapias (41)
- [ ] Sesiones (42)
- [ ] Chat (43)
- [ ] Objetivos (44)
- [ ] Mis Pagos (45)
- [ ] Eventos (46)
- [ ] Notificaciones (47)
- [ ] Mi Perfil (48)

## 52. KMM Shared Tests
```bash
./gradlew shared:test
```
- [ ] All shared tests pass
- [ ] `./gradlew shared:koverReport` shows coverage ≥ 60%

## 53. Full End-to-End Flow (all platforms)

This test covers the complete lifecycle of a REDAPSI therapy:

### Step 1 — Admin setup
On Web (admin@redapsi.app):
- [ ] Create a new event "Taller de mindfulness" with cost=150, max_participants=10, date = next week

### Step 2 — Psychologist creates therapy (Flow A)
On Web (psy1@redapsi.app):
- [ ] Create therapy for a new consultant: newconsultant@test.com
- [ ] Note the temp password from console logs
- [ ] Create billing plan: PER_SESSION, default_fee=500

### Step 3 — Consultant onboarding
On Android OR iOS with newconsultant@test.com:
- [ ] Login → change password (forced) → onboarding intro → complete all 6 steps → confirm → HomeScreen

### Step 4 — Session scheduling
On Web (psy1@redapsi.app):
- [ ] Propose 2 session slots for the therapy

On Mobile (newconsultant@test.com):
- [ ] See proposition → select one slot → TherapySession created

### Step 5 — Session + payment
On Web (psy1@redapsi.app):
- [ ] See scheduled session in Sesiones list
- [ ] Complete the session
- [ ] Register payment: amount=500, method=CASH, status=PAID

On Mobile (newconsultant@test.com):
- [ ] Sesiones tab shows COMPLETED session
- [ ] Mis Pagos shows PAID entry

### Step 6 — Goals
On Web (psy1@redapsi.app):
- [ ] Create goal "Gestión emocional" for the therapy
- [ ] Set progress to 30%

On Mobile (newconsultant@test.com):
- [ ] Objetivos tab shows goal with 30% progress bar

### Step 7 — Chat
On Web (psy1@redapsi.app):
- [ ] Send message "Hola, ¿cómo estás?"

On Mobile:
- [ ] Message appears in Chat tab in real time (within 2 seconds)
- [ ] Reply from mobile → psychologist sees it on web

### Step 8 — Event registration
On Mobile (newconsultant@test.com):
- [ ] Eventos tab → tap "Taller de mindfulness" → "Inscribirse" → success
- [ ] Mis Pagos shows new PENDING payment for 150

On Web (admin@redapsi.app):
- [ ] Finanzas → filter by scope=EVENT → payment appears in list
- [ ] Register payment as PAID

### Step 9 — Notifications
On Mobile (newconsultant@test.com):
- [ ] Notificaciones tab shows: SESSION_COMPLETED, PAYMENT_REGISTERED, GOAL_UPDATED, EVENT_REGISTRATION_CONFIRMED, NEW_MESSAGE
- [ ] Tap SESSION_COMPLETED → navigates to session detail
- [ ] Tap PAYMENT_REGISTERED → navigates to payment/therapy detail

### Step 10 — Consultant self-registration (Flow B)
On Mobile (new device / new account):
- [ ] Register as new consultant (selfregistered@test.com)
- [ ] Complete onboarding
- [ ] Buscar Psicólogos → select psy2 → "Solicitar terapia" → sends therapy request

On Web (psy2@redapsi.app):
- [ ] Solicitudes page shows pending request → "Aceptar" → therapy created
- [ ] New therapy appears in Mis Terapias list

---

## Summary of all TESTING files

| File | Phase | What it covers |
|------|-------|----------------|
| TESTING_PHASE_1.md | Infrastructure | Docker services, DB schema, seed data |
| TESTING_PHASE_2.md | Auth & Upload | Login, JWT, RBAC, file upload, web login page |
| TESTING_PHASE_3.md | Profiles | Psychologist profile, availability, consultant onboarding |
| TESTING_PHASE_4.md | Therapy | Flow A, Flow B, session scheduling, notifications wired |
| TESTING_PHASE_5.md | Session lifecycle | Complete/cancel/postpone, session notes, media |
| TESTING_PHASE_6.md | Goals, Payments, Events | Goal progress, therapy payments, admin finance, events |
| TESTING_PHASE_7.md | Notifications & Chat | Notification API, Socket.IO chat, web bell + chat page |
| TESTING_PHASE_8.md | Dashboard & Polish | Admin stats, psychologist stats, sidebar complete, change-password enforcement |
| TESTING_PHASE_9.md | Tests & Docs | Swagger, Postman, ≥80% backend coverage, web tests |
| TESTING_PHASE_10.md | Android | All screens, full consultant journey on Android |
| TESTING_PHASE_11.md | iOS + Full E2E | All iOS screens + complete 9-step end-to-end flow |
```

---

## Agent Instructions Summary

For each phase, the agent must:

1. Read `DEV.md` and `CLAUDE.md` fully.
2. Create a git branch: `feature/phase-N-<short-name>`.
3. Implement everything listed in the phase scope.
4. Run all verification commands and confirm they pass.
5. Run `docker compose run --rm backend npm test` — fix any failures.
6. Run `docker compose run --rm backend npm run build` and `docker compose run --rm web npm run build` — fix any failures.
7. Create `TESTING_PHASE_N.md` in the project root with the cumulative checklist.
8. Open a PR against `main`.
9. Append a log entry to `DEV.md`.
10. Report: PR URL + summary of what was built.

**Never open a PR with a failing build or failing tests.**
**Never skip creating the `TESTING_PHASE_N.md` file — it is a required deliverable.**
