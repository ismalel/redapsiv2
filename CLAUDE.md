# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

---

## Project Identity

**REDAPSI v2** — Plataforma de gestión de psicología feminista.
Rebuilding from scratch with a real production stack (replacing the previous mock-API prototype).
Reference project for design/branding: `../` (the parent folder — the old prototype).

**Language rules (strict separation):**

- **User-facing text → Spanish.** Every label, button, placeholder, error message, toast, navigation item, and screen title that the user reads must be in Spanish. Examples: "Iniciar sesión", "Crear terapia", "Eventos", "Perfil", "Consultantes".
- **Everything programmable → English.** All code must be written in English without exception: variable names, function names, class names, type/interface names, file names, folder names, database column names, Prisma model fields, API route paths, environment variable keys, Git branch names, test descriptions, and code comments.

---

## Architecture

```
redapsi/
├── backend/        Node.js + Express + Prisma + PostgreSQL
├── web/            React + TypeScript + Vite + TailwindCSS
├── mobile/         Kotlin Multiplatform Mobile (KMM): Android (Compose) + iOS (SwiftUI)
└── docker-compose.yml
```

All services run via Docker. No service should require local installation beyond Docker.

---

## Brand & Design System

Reuse the exact palette from the old project (do not invent new colors):

| Token | Hex | Usage |
|-------|-----|-------|
| `brand-purple` | `#7B2FBE` | Primary actions, active nav, headers |
| `brand-purple-dark` | `#5B2D8E` | Hover states, pressed states |
| `brand-cyan` | `#29B5E8` | Secondary actions, links, badges |
| `brand-yellow` | `#F5E042` | Highlights, warnings |
| `app-bg` | `#F0F1F8` | Page background |
| `app-surface` | `#FFFFFF` | Cards, modals, panels |

In Tailwind: configure these as custom colors in `tailwind.config.ts` under `theme.extend.colors`.
In KMM Android (Compose): define in `ui/theme/Color.kt` matching the old prototype.
In KMM iOS (SwiftUI): define in `Assets.xcassets` color set.

---

## Platform — Role Mapping

This is a hard architectural boundary. There is no crossover.

| Role | App | URL / Entry point |
|------|-----|-------------------|
| `ADMIN` | **Web only** | `http://localhost:5173` |
| `PSYCHOLOGIST` | **Web only** | `http://localhost:5173` |
| `ADMIN_PSYCHOLOGIST` | **Web only** | `http://localhost:5173` |
| `CONSULTANT` | **Mobile only** | Android app / iOS app |

### Valid role combinations

| Combination | Allowed | Notes |
|-------------|---------|-------|
| ADMIN only | ✅ | Platform administration, no therapy work |
| PSYCHOLOGIST only | ✅ | Full therapy management, no admin access |
| ADMIN + PSYCHOLOGIST | ✅ | Stored as `ADMIN_PSYCHOLOGIST` — sees everything on web |
| CONSULTANT + anything | ❌ | CONSULTANT is always exclusive |

**`CONSULTANT` is an exclusive role** — a user with this role can never also be admin or psychologist. Enforce this constraint at registration time (backend validation) and at the DB level via a check constraint.

### RBAC helper (backend)
Define a `hasRole()` helper that expands `ADMIN_PSYCHOLOGIST` correctly:
```ts
hasRole(user, 'ADMIN')        // true for ADMIN and ADMIN_PSYCHOLOGIST
hasRole(user, 'PSYCHOLOGIST') // true for PSYCHOLOGIST and ADMIN_PSYCHOLOGIST
hasRole(user, 'CONSULTANT')   // true only for CONSULTANT
```
All middleware and authorization checks must use `hasRole()`, never compare `user.role === 'ADMIN'` directly.

### Web UI by role
- `ADMIN` → sees: Dashboard (stats + Finanzas), Usuarios, Terapias (read), Pagos, Eventos, Perfil
- `PSYCHOLOGIST` → sees: Dashboard (own stats), Mis Terapias, Sesiones, Pagos (propios), Chat, Objetivos, Perfil
- `ADMIN_PSYCHOLOGIST` → sees union of both: full admin sections + full psychologist workflow

### Platform enforcement
- Web app rejects login from `CONSULTANT` (RoleGuard → error screen: "Usa la aplicación móvil").
- Mobile app rejects login from `ADMIN`, `PSYCHOLOGIST`, `ADMIN_PSYCHOLOGIST` (shows error: "Usa el portal web").
- No shared UI between web and mobile — completely separate frontends.

> Old project used "patient" — new system uses **"consultant"** (consultante).

---

## Domain Model (PostgreSQL via Prisma)

```prisma
// ─── Enums ────────────────────────────────────────────────────────────────────

enum Role                 { ADMIN PSYCHOLOGIST ADMIN_PSYCHOLOGIST CONSULTANT }
enum TherapyStatus        { PENDING ACTIVE COMPLETED CANCELLED }
enum TherapyOrigin        { PSYCHOLOGIST_INITIATED CONSULTANT_INITIATED }
enum SessionStatus        { SCHEDULED COMPLETED CANCELLED POSTPONED }
enum TherapyRequestStatus  { PENDING ACCEPTED REJECTED }  // consultant → psychologist therapy request
enum SessionRequestStatus  { PENDING ACCEPTED REJECTED }  // consultant → psychologist session slot request
enum PropositionStatus    { PENDING ACCEPTED REJECTED }
enum GoalStatus           { PENDING IN_PROGRESS COMPLETED }
enum RegistrationStatus   { PENDING CONFIRMED CANCELLED }
enum OnboardingStatus     { INCOMPLETE COMPLETED }
enum BillingType          { RECURRING PER_SESSION }
enum PaymentMethod        { CASH BANK_TRANSFER DIGITAL }
enum PaymentStatus        { PENDING PAID WAIVED }   // WAIVED = free / forgiven
enum PaymentScope         { THERAPY_SESSION EVENT }  // what the payment belongs to
enum NotificationType {
  // Therapy requests
  THERAPY_REQUEST_RECEIVED      // → psychologist
  THERAPY_REQUEST_ACCEPTED      // → consultant
  THERAPY_REQUEST_REJECTED      // → consultant
  // Session scheduling
  PROPOSITION_RECEIVED          // → consultant (psychologist proposed slots)
  PROPOSITION_ACCEPTED          // → psychologist (consultant chose a slot)
  SESSION_REQUEST_RECEIVED      // → psychologist (consultant requested a slot)
  SESSION_REQUEST_ACCEPTED      // → consultant
  SESSION_REQUEST_REJECTED      // → consultant
  // Session lifecycle
  SESSION_SCHEDULED             // → consultant
  SESSION_CANCELLED             // → both
  SESSION_POSTPONED             // → both
  SESSION_COMPLETED             // → both
  // Notes
  NOTE_ADDED                    // → other party (only if note is public)
  // Payments
  PAYMENT_REGISTERED            // → consultant
  PAYMENT_PENDING               // → consultant (reminder)
  // Goals
  GOAL_UPDATED                  // → consultant (psychologist updated progress)
  // Chat
  NEW_MESSAGE                   // → other party in therapy
  // Events
  EVENT_REGISTRATION_CONFIRMED  // → consultant
  EVENT_REGISTRATION_CANCELLED  // → consultant
}

// ─── Core user ────────────────────────────────────────────────────────────────

model User {
  id               String    @id @default(uuid())
  name             String
  email            String    @unique
  password_hash    String
  role                 Role    // ADMIN | PSYCHOLOGIST | ADMIN_PSYCHOLOGIST | CONSULTANT (exclusive)
  avatar_url           String?
  must_change_password Boolean  @default(false)
  deleted_at           DateTime? // soft delete — null means active
  created_at           DateTime  @default(now())
  updated_at           DateTime  @updatedAt

  psychologist_profile  PsychologistProfile?
  consultant_profile    ConsultantProfile?
  therapies_as_psychologist    Therapy[]        @relation("PsychologistTherapies")
  therapies_as_consultant      Therapy[]        @relation("ConsultantTherapies")
  therapy_requests_sent        TherapyRequest[] @relation("ConsultantTherapyRequests")
  therapy_requests_received    TherapyRequest[] @relation("PsychologistTherapyRequests")
  messages_sent                Message[]
  session_notes                SessionNote[]
  event_registrations          EventRegistration[]
  payments_registered          Payment[]
  notifications                Notification[]
  refresh_tokens               RefreshToken[]
  session_requests_sent        SessionRequest[] @relation("ConsultantSessionRequests")
}

// ─── Auth tokens ──────────────────────────────────────────────────────────────

model RefreshToken {
  id         String   @id @default(uuid())
  user_id    String
  token      String   @unique  // hashed value stored, not raw
  expires_at DateTime
  revoked    Boolean  @default(false)
  created_at DateTime @default(now())

  user User @relation(fields: [user_id], references: [id])
}

// ─── Extended profiles ────────────────────────────────────────────────────────

model PsychologistProfile {
  id               String   @id @default(uuid())
  user_id          String   @unique
  license_number   String
  specializations  String[] // e.g. ["anxiety", "trauma", "feminist therapy"]
  bio              String?
  session_fee      Decimal
  modalities       String[] // ["in_person", "virtual"]
  languages        String[] // ["es", "en"]
  years_experience Int      @default(0)

  user              User               @relation(fields: [user_id], references: [id])
  availability_slots AvailabilitySlot[]
}

model ConsultantProfile {
  id                String          @id @default(uuid())
  user_id           String          @unique
  birth_date        DateTime?
  phone             String?
  emergency_contact String?
  onboarding_status OnboardingStatus @default(INCOMPLETE)
  onboarding_step   Int              @default(1)  // 1–6
  onboarding_data   Json?            // stores partial step answers

  user User @relation(fields: [user_id], references: [id])
}

// ─── Therapy & scheduling ─────────────────────────────────────────────────────

model Therapy {
  id              String        @id @default(uuid())
  psychologist_id String
  consultant_id   String
  origin          TherapyOrigin // how the therapy was created
  modality        String        // in_person | virtual
  notes           String?       // general therapy notes — psychologist-only, not the same as SessionNote
  status          TherapyStatus @default(PENDING)
  deleted_at      DateTime?     // soft delete
  created_at      DateTime      @default(now())

  psychologist      User                  @relation("PsychologistTherapies", fields: [psychologist_id], references: [id])
  consultant        User                  @relation("ConsultantTherapies",   fields: [consultant_id],   references: [id])
  billing_plan      BillingPlan?
  sessions          TherapySession[]
  session_requests  SessionRequest[]
  propositions      ScheduleProposition[]
  goals             Goal[]
  messages          Message[]
}

// Consultant requests a session → psychologist accepts/rejects
model SessionRequest {
  id            String               @id @default(uuid())
  therapy_id    String
  consultant_id String
  proposed_at   DateTime             // the date/time the consultant wants
  notes         String?
  status        SessionRequestStatus @default(PENDING)
  created_at    DateTime             @default(now())

  therapy    Therapy @relation(fields: [therapy_id],    references: [id])
  consultant User    @relation("ConsultantSessionRequests", fields: [consultant_id], references: [id])
}

// Psychologist proposes one or more available time slots
model ScheduleProposition {
  id             String             @id @default(uuid())
  therapy_id     String
  proposed_slots DateTime[]         // list of options offered by the psychologist
  selected_slot  DateTime?          // the slot the consultant chose
  status         PropositionStatus  @default(PENDING)
  created_at     DateTime           @default(now())

  therapy  Therapy        @relation(fields: [therapy_id], references: [id])
  session  TherapySession?
}

// Psychologist's recurring weekly availability (used as public calendar)
model AvailabilitySlot {
  id                    String  @id @default(uuid())
  psychologist_profile_id String
  day_of_week           Int     // 0=Sunday … 6=Saturday
  start_time            String  // "09:00"
  end_time              String  // "10:00"

  profile PsychologistProfile @relation(fields: [psychologist_profile_id], references: [id])
}

model TherapySession {
  id              String        @id @default(uuid())
  therapy_id      String
  proposition_id  String?       @unique  // null if created directly by psychologist
  scheduled_at    DateTime
  duration        Int                    // minutes
  session_fee     Decimal?               // overrides BillingPlan.default_fee; null = use plan default; 0 = free
  status          SessionStatus @default(SCHEDULED)
  cancelled_at    DateTime?
  cancelled_by    String?                // user_id
  cancel_reason   String?
  postponed_to    DateTime?              // new proposed date when status=POSTPONED
  media_urls      String[]               // relative paths: /uploads/sessions/<filename>
  created_at      DateTime      @default(now())

  therapy     Therapy              @relation(fields: [therapy_id], references: [id])
  proposition ScheduleProposition? @relation(fields: [proposition_id], references: [id])
  notes       SessionNote[]
  payment     Payment?
}

// ─── Session notes ────────────────────────────────────────────────────────────

// Both psychologist and consultant can write notes on a session.
// Private notes are only visible to the author.
// Public notes are visible to both parties (web and mobile).
model SessionNote {
  id         String   @id @default(uuid())
  session_id String
  author_id  String
  content    String
  is_private Boolean  @default(false)  // true = only author sees it; false = both parties see it
  created_at DateTime @default(now())
  updated_at DateTime @updatedAt

  session TherapySession @relation(fields: [session_id], references: [id])
  author  User           @relation(fields: [author_id],  references: [id])
}

// ─── Billing & Payments ───────────────────────────────────────────────────────

// One billing plan per therapy — defines how sessions are charged
model BillingPlan {
  id           String      @id @default(uuid())
  therapy_id   String      @unique
  billing_type BillingType // RECURRING | PER_SESSION
  default_fee  Decimal     // base cost applied to each session unless overridden
  recurrence   String?     // "weekly" | "biweekly" | "monthly" — only used when RECURRING
  notes        String?
  created_at   DateTime    @default(now())
  updated_at   DateTime    @updatedAt

  therapy  Therapy   @relation(fields: [therapy_id], references: [id])
  payments Payment[]
}

// Unified payment model — covers both therapy sessions and event registrations
model Payment {
  id                    String        @id @default(uuid())
  scope                 PaymentScope  // THERAPY_SESSION | EVENT
  billing_plan_id       String?       // set when scope=THERAPY_SESSION
  session_id            String?       @unique  // set when scope=THERAPY_SESSION and billing_type=PER_SESSION
  event_registration_id String?       @unique  // set when scope=EVENT
  amount                Decimal       // actual amount charged (0 if waived)
  method                PaymentMethod
  status                PaymentStatus @default(PENDING)
  reference             String?       // transfer ID, receipt number, etc.
  notes                 String?
  paid_at               DateTime?
  created_at            DateTime      @default(now())
  registered_by         String        // user_id of whoever recorded the payment (psychologist or admin)

  billing_plan       BillingPlan?       @relation(fields: [billing_plan_id],       references: [id])
  session            TherapySession?    @relation(fields: [session_id],            references: [id])
  event_registration EventRegistration? @relation(fields: [event_registration_id], references: [id])
  registrar          User               @relation(fields: [registered_by],         references: [id])
}

// ─── Goals & progress tracking ────────────────────────────────────────────────

model Goal {
  id          String     @id @default(uuid())
  therapy_id  String
  title       String
  description String?
  progress    Int        @default(0) // current value 0–100
  status      GoalStatus @default(PENDING)

  therapy          Therapy              @relation(fields: [therapy_id], references: [id])
  progress_entries GoalProgressEntry[]
}

// Each time progress is updated a snapshot is saved — used for progress graphs
model GoalProgressEntry {
  id         String   @id @default(uuid())
  goal_id    String
  progress   Int      // 0–100 at the time of the entry
  notes      String?
  created_at DateTime @default(now())

  goal Goal @relation(fields: [goal_id], references: [id])
}

// ─── Therapy request (consultant-initiated flow) ──────────────────────────────

model TherapyRequest {
  id              String               @id @default(uuid())
  consultant_id   String
  psychologist_id String
  message         String?
  status          TherapyRequestStatus @default(PENDING)  // uses its own enum, not SessionRequestStatus
  created_at      DateTime             @default(now())

  // Both relations explicitly named to avoid Prisma ambiguity
  consultant   User @relation("ConsultantTherapyRequests",   fields: [consultant_id],   references: [id])
  psychologist User @relation("PsychologistTherapyRequests", fields: [psychologist_id], references: [id])
}

// ─── Chat ─────────────────────────────────────────────────────────────────────

model Message {
  id         String   @id @default(uuid())
  therapy_id String
  sender_id  String
  content    String
  media_url  String?  // relative path: /uploads/chat/<filename>
  created_at DateTime @default(now())

  therapy Therapy @relation(fields: [therapy_id], references: [id])
  sender  User    @relation(fields: [sender_id], references: [id])
}

// ─── Events ───────────────────────────────────────────────────────────────────

model Event {
  id               String   @id @default(uuid())
  title            String
  description      String?
  location         String?
  date             DateTime
  recurrence       String?  // null | weekly | monthly
  cost             Decimal  @default(0)
  max_participants Int?
  deleted_at       DateTime? // soft delete
  created_at       DateTime  @default(now())

  registrations EventRegistration[]
}

model EventRegistration {
  id            String             @id @default(uuid())
  event_id      String
  consultant_id String
  status        RegistrationStatus @default(PENDING)

  event      Event    @relation(fields: [event_id],      references: [id])
  consultant User     @relation(fields: [consultant_id], references: [id])
  payment    Payment? // populated when event.cost > 0
}

// ─── Notifications ────────────────────────────────────────────────────────────

model Notification {
  id         String           @id @default(uuid())
  user_id    String           // recipient
  type       NotificationType
  title      String           // short text (used as push title in future)
  body       String           // full message
  read       Boolean          @default(false)
  payload    Json?            // deep-link context: { therapy_id?, session_id?, event_id?, goal_id? }
  created_at DateTime         @default(now())

  user User @relation(fields: [user_id], references: [id])
}
```

---

## Docker Infrastructure

**`docker-compose.yml`** must define:

| Service | Image | Port | Notes |
|---------|-------|------|-------|
| `postgres` | `postgres:16-alpine` | 5432 | volume for persistence, healthcheck |
| `backend` | custom Dockerfile | 3000 | depends_on postgres healthy |
| `web` | custom Dockerfile | 5173 | depends_on backend |
| `pgadmin` | `dpage/pgadmin4` | 5050 | optional, dev only |
| `redis` | `redis:7-alpine` | 6379 | optional, for WebSocket pub/sub |

All services share a custom bridge network. Use `.env` for secrets (never hardcode).

**Named volumes required:**
- `postgres_data` — database persistence
- `uploads_data` — media files, mounted at `backend:/app/uploads` and served as static files at `http://localhost:3000/uploads/*`. Both web and mobile consume files from this URL.

`.env.example` must include:
```
DATABASE_URL=postgresql://redapsi:redapsi@postgres:5432/redapsi
JWT_SECRET=change_me
JWT_REFRESH_SECRET=change_me_refresh
JWT_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d
PORT=3000
UPLOADS_DIR=/app/uploads
MAX_FILE_SIZE_MB=10
ALLOWED_ORIGINS=http://localhost:5173
```

---

## Business Flows

### Flow A — Psychologist creates therapy and invites consultant
```
Psychologist fills form:
  → POST /therapies  (creates therapy with status=PENDING, origin=PSYCHOLOGIST_INITIATED)
    → system creates User(role=CONSULTANT, must_change_password=true) + temp password
    → system creates ConsultantProfile with onboarding_status=INCOMPLETE
    → system emails temp credentials to consultant   ← (email sending is out of scope for v1, log to console)

Consultant receives credentials → logs in → is forced to change password
  → then enters the 6-step onboarding flow (see Onboarding section below)
  → after onboarding completes → therapy becomes status=ACTIVE
```

### Flow B — Consultant self-registers and requests therapy
```
Consultant downloads mobile app → registers (role=CONSULTANT)
  → ConsultantProfile is created automatically with onboarding_status=INCOMPLETE
  → 6-step onboarding flow runs immediately after registration

After onboarding → consultant lands on psychologist discovery screen
  → GET /psychologists?available=true  (returns PsychologistProfile list with availability)
  → Consultant picks a psychologist → POST /therapy-requests
  → Psychologist receives request → PATCH /therapy-requests/:id  { status: ACCEPTED | REJECTED }
  → On ACCEPTED → system creates Therapy(status=ACTIVE, origin=CONSULTANT_INITIATED)
```

### Session scheduling (after a therapy is ACTIVE)

Two parallel options — both can coexist within the same therapy:

**Option 1 — Psychologist proposes slots:**
```
Psychologist → POST /therapies/:id/propositions  { proposed_slots: [DateTime, DateTime, ...] }
Consultant   → GET  /therapies/:id/propositions  (sees list of options)
Consultant   → PATCH /propositions/:id           { selected_slot: DateTime }
  → system creates TherapySession linked to the proposition
```

**Option 2 — Consultant picks from psychologist's public calendar:**
```
Consultant → GET /psychologists/:id/availability  (returns AvailabilitySlots as weekly calendar)
Consultant → POST /therapies/:id/session-requests { proposed_at: DateTime, notes? }
Psychologist → PATCH /session-requests/:id        { status: ACCEPTED | REJECTED }
  → On ACCEPTED → system creates TherapySession
```

---

## Notifications

Every meaningful action in the system must trigger a `Notification` record for the appropriate recipient(s). The notification service must be a separate module (`src/application/notifications/`) called from within each use case — never from controllers.

### Trigger map

| Action | Who triggers | Recipient(s) | Type |
|--------|-------------|-------------|------|
| Consultant sends therapy request | Consultant | Psychologist | `THERAPY_REQUEST_RECEIVED` |
| Psychologist accepts therapy request | Psychologist | Consultant | `THERAPY_REQUEST_ACCEPTED` |
| Psychologist rejects therapy request | Psychologist | Consultant | `THERAPY_REQUEST_REJECTED` |
| Psychologist proposes schedule slots | Psychologist | Consultant | `PROPOSITION_RECEIVED` |
| Consultant accepts a slot | Consultant | Psychologist | `PROPOSITION_ACCEPTED` |
| Consultant requests a session slot | Consultant | Psychologist | `SESSION_REQUEST_RECEIVED` |
| Psychologist accepts session request | Psychologist | Consultant | `SESSION_REQUEST_ACCEPTED` |
| Psychologist rejects session request | Psychologist | Consultant | `SESSION_REQUEST_REJECTED` |
| Session is scheduled (any flow) | System | Consultant | `SESSION_SCHEDULED` |
| Session is cancelled | Either party | Both parties | `SESSION_CANCELLED` |
| Session is postponed | Either party | Both parties | `SESSION_POSTPONED` |
| Session is marked completed | Psychologist | Both parties | `SESSION_COMPLETED` |
| Public note added to session | Author | Other party | `NOTE_ADDED` |
| Payment is registered | Psychologist | Consultant | `PAYMENT_REGISTERED` |
| Goal progress updated | Psychologist | Consultant | `GOAL_UPDATED` |
| New chat message | Sender | Other party | `NEW_MESSAGE` |
| Event registration confirmed | Admin/System | Consultant | `EVENT_REGISTRATION_CONFIRMED` |
| Event registration cancelled | System | Consultant | `EVENT_REGISTRATION_CANCELLED` |

### API endpoints
- `GET /notifications` — list for the authenticated user, paginated, filterable by `read`
- `PATCH /notifications/:id/read` — mark single as read
- `PATCH /notifications/read-all` — mark all as read
- `GET /notifications/unread-count` — returns `{ count: N }` for badge display

### Implementation rules
- `payload` JSON must contain enough IDs for the frontend to deep-link to the relevant screen.
- Notifications are created synchronously within the same DB transaction as the triggering action — do not use queues in v1.
- Private `SessionNote` additions must NOT trigger a notification to the other party.
- `NEW_MESSAGE` notifications should be debounced at the service level: if the recipient already has an unread `NEW_MESSAGE` notification for the same therapy in the last 60 seconds, skip creating a duplicate.

---

## Session Lifecycle

### Status transitions
```
SCHEDULED → COMPLETED   (psychologist marks session done)
SCHEDULED → CANCELLED   (either party cancels)
SCHEDULED → POSTPONED   (either party postpones — new date is proposed)
POSTPONED → SCHEDULED   (new date confirmed)
POSTPONED → CANCELLED   (cancelled while postponed)
```

### Cancel endpoint
`POST /sessions/:id/cancel`
- Body: `{ reason?: string }`
- Both psychologist and consultant can cancel.
- Sets `status = CANCELLED`, `cancelled_at = now()`, `cancelled_by = req.user.id`.
- Triggers `SESSION_CANCELLED` notification to both parties.
- A cancelled session's `Payment` (if exists) is NOT automatically waived — psychologist decides separately.

### Postpone endpoint
`POST /sessions/:id/postpone`
- Body: `{ new_date: DateTime, reason?: string }`
- Both psychologist and consultant can postpone.
- Sets `status = POSTPONED`, `postponed_to = new_date`.
- The original `scheduled_at` is preserved for audit.
- Triggers `SESSION_POSTPONED` notification to both parties.
- To confirm the new date, use `POST /sessions/:id/confirm-postpone` → sets `scheduled_at = postponed_to`, `status = SCHEDULED`, `postponed_to = null`.

---

## Session Notes

- Both psychologist and consultant can add notes to any session in their shared therapy.
- `is_private = true` → only the author (`author_id`) can read it. The other party's API response omits private notes.
- `is_private = false` → both parties can read it on web (psychologist) and mobile (consultant).
- Psychologist can edit or delete their own notes. Consultant can edit or delete their own notes. Neither can touch the other's.
- Backend filter rule: when returning `GET /sessions/:id/notes`, only include notes where `is_private = false OR author_id = req.user.id`.

### Endpoints
- `GET  /sessions/:id/notes` — list (filtered by visibility rule above)
- `POST /sessions/:id/notes` — create `{ content, is_private }`
- `PATCH /sessions/:id/notes/:noteId` — update own note
- `DELETE /sessions/:id/notes/:noteId` — delete own note

---

## Therapy Progress Graphs

Based on `GoalProgressEntry` snapshots, the API exposes a progress timeline per therapy.

### Endpoint
`GET /therapies/:id/progress`

Response:
```json
{
  "data": {
    "therapy_id": "...",
    "goals": [
      {
        "id": "...",
        "title": "Reduce anxiety",
        "current_progress": 60,
        "status": "IN_PROGRESS",
        "entries": [
          { "progress": 10, "notes": "...", "created_at": "2025-01-01T..." },
          { "progress": 30, "notes": "...", "created_at": "2025-02-01T..." },
          { "progress": 60, "notes": "...", "created_at": "2025-03-01T..." }
        ]
      }
    ]
  }
}
```

- The web app renders this as a **line chart per goal** (use Recharts, already in the web stack).
- Each point on the line = one `GoalProgressEntry`.
- The mobile app shows a **simple progress bar** per goal (no full chart needed).
- Updating goal progress (`PATCH /goals/:id`) must atomically create a `GoalProgressEntry` snapshot.

---

## Payments

### Billing plan rules
- Every therapy must have exactly one `BillingPlan`, created at the same time as the therapy.
- `billing_type = RECURRING` → payment is expected on a fixed cadence (weekly, biweekly, monthly) regardless of how many sessions occurred in that period.
- `billing_type = PER_SESSION` → one `Payment` record is created per `TherapySession` when the session is marked completed.
- `BillingPlan.default_fee` is the base cost. The psychologist can override it per session via `TherapySession.session_fee` at any point before or after the session (even setting it to `0` to mark it as free).

### Effective fee resolution (backend logic, not in DB)
```
effective_fee = session.session_fee ?? therapy.billing_plan.default_fee
```
This computed value must be returned in all session API responses as `effective_fee`.

### Payment registration
- Only the **psychologist** can create/edit payment records — consultants have read-only visibility of their own payment history on mobile.
- When registering a payment the psychologist provides: `amount`, `method`, `reference?`, `notes?`, `paid_at`.
- `status = WAIVED` is set when the psychologist explicitly forgives the payment (amount stays recorded for audit, effective charge = 0).

### Payment history views

| Consumer | Scope | Endpoint |
|----------|-------|----------|
| Psychologist | All payments for a specific session | `GET /sessions/:id/payment` |
| Psychologist | All payments for a specific therapy | `GET /therapies/:id/payments` |
| Psychologist | Full payment history across all their therapies | `GET /payments?psychologist_id=me` |
| Admin | All transactions system-wide, filterable by psychologist / therapy / date range | `GET /admin/payments` |
| Consultant (mobile) | Own payment history | `GET /payments/me` |

### Event payments
- When `Event.cost > 0`, registering for the event automatically creates a `Payment` record with `scope = EVENT`, `status = PENDING`, linked to the `EventRegistration`.
- Free events (`cost = 0`) do not create a Payment record.
- The admin confirms or registers event payments the same way as therapy payments (same `Payment` model, same endpoints with `scope` filter).
- `EventRegistration.status` transitions: `PENDING → CONFIRMED` once payment is `PAID` (or immediately if free).

### Change password endpoint
`PUT /auth/change-password` — authenticated, no role restriction.
Body: `{ current_password: string, new_password: string }`.
- Validates `current_password` against the stored hash before accepting the change.
- After success, sets `must_change_password = false` if it was true.
- Does not invalidate existing refresh tokens (that is a future improvement).

### Admin financial dashboard
The admin dashboard must include a **Finanzas** section with:
- Total revenue (sum of PAID payments) per period (week / month / year), split by `scope` (therapy vs events)
- Breakdown by psychologist → therapy → session
- Event revenue summary by event
- Payments pending collection (`status = PENDING`)
- Waived payments report
- Exportable table with all columns: date, scope, psychologist/admin, consultant, therapy/event, session/registration, amount, method, reference, status

---

## Onboarding (Consultant — 6 steps)

Mirrors the implementation in the old prototype. Runs on mobile after first login or self-registration.

| Step | Content | Skippable |
|------|---------|-----------|
| 1 | Personal info (birth date, phone, emergency contact) | Yes |
| 2 | Medical history | Yes |
| 3 | Mental health background | Yes |
| 4 | Current concerns / reason for seeking therapy | Yes |
| 5 | Preferences (modality, language, psychologist gender) | Yes |
| 6 | Review & confirm all answers | **No** |

- Partial answers are saved to `ConsultantProfile.onboarding_data` (JSON) on each step so progress survives app restarts.
- `ConsultantProfile.onboarding_step` tracks the last completed step.
- Step 6 submission sets `onboarding_status = COMPLETED`.
- API: `PUT /consultants/:id/onboarding/:step` — body varies per step.
- GET `/consultants/:id/onboarding` — returns current step + saved data.

---

## File Storage

All uploaded files are stored on the backend server inside the `uploads/` directory, which is persisted via Docker volume and served as static files.

**Directory structure inside the container:**
```
/app/uploads/
├── avatars/          # profile pictures (users)
├── sessions/         # files attached to therapy sessions
├── chat/             # media sent through the chat
└── events/           # event banners / promotional images
```

**Serving:** Express must serve `GET /uploads/*` as static with `express.static(UPLOADS_DIR)`.

**Upload endpoint convention:**
- `POST /upload` — generic multipart upload, returns `{ url: "/uploads/<subfolder>/<filename>" }`
- The returned relative URL is what gets stored in `media_urls[]` or `media_url` fields.
- File size limit: 10 MB (`MAX_FILE_SIZE_MB` env var). Allowed types: images (jpg, png, webp) + pdf + video (mp4).

**Access from web and mobile:**
- Web: `axios.get(file.url)` where base URL is `http://localhost:3000`
- Mobile Android: `http://10.0.2.2:3000/uploads/...`
- Mobile iOS simulator: `http://localhost:3000/uploads/...`

Use `multer` for multipart handling in Express.

---

## Backend (`backend/`)

**Stack**: Node.js 20 + Express 5 + Prisma + PostgreSQL + TypeScript

**Architecture (Clean Architecture)**:
```
backend/
├── src/
│   ├── domain/               # Interfaces, domain models, enums
│   ├── application/          # Use cases / service layer (one file per use case)
│   ├── infrastructure/
│   │   ├── database/         # Prisma client singleton
│   │   ├── http/
│   │   │   ├── routes/       # One file per resource
│   │   │   ├── controllers/  # Thin — calls use cases only
│   │   │   ├── middleware/   # auth, rbac, upload, error handler
│   │   │   └── validators/   # Zod schemas per route
│   │   └── websocket/        # Socket.IO chat server
│   └── shared/               # ApiError, pagination, response helpers
├── uploads/                  # Served as static — persisted via Docker volume
│   ├── avatars/
│   ├── sessions/
│   └── chat/
├── prisma/
│   ├── schema.prisma
│   ├── seed.ts               # Dev seed: 1 admin, 2 psychologists, 3 consultants
│   └── migrations/
├── postman/
│   ├── redapsi.postman_collection.json
│   ├── redapsi.postman_environment.json
│   └── README.md
├── tests/
│   ├── auth.test.ts
│   ├── therapies.test.ts
│   ├── sessions.test.ts
│   ├── onboarding.test.ts
│   ├── events.test.ts
│   ├── upload.test.ts
│   ├── permissions.test.ts
│   └── chat.test.ts
├── Dockerfile
└── package.json
```

**Seed script** (`prisma/seed.ts`) must create on `prisma db seed`:
- 1 `ADMIN` user (`admin@redapsi.app` / `Admin1234!`)
- 1 `ADMIN_PSYCHOLOGIST` user (to test combined role)
- 2 `PSYCHOLOGIST` users with full `PsychologistProfile` + `AvailabilitySlot` entries (Mon–Fri, 9–18h)
- 3 `CONSULTANT` users:
  - consultant-1: onboarding complete, has active therapy with psychologist-1
  - consultant-2: onboarding incomplete (step 3)
  - consultant-3: onboarding complete, no therapy yet
- For the active therapy (psychologist-1 + consultant-1):
  - 1 `BillingPlan` (PER_SESSION, default_fee = 500)
  - 3 `TherapySession`s: 1 COMPLETED with payment PAID, 1 SCHEDULED, 1 CANCELLED
  - 2 `Goal`s with 2–3 `GoalProgressEntry` snapshots each
  - 2 `SessionNote`s on the completed session (1 public, 1 private)
  - 1 PAID `Payment` linked to the completed session
- 1 pending `TherapyRequest` from consultant-3 to psychologist-2
- 2 `Event`s: 1 free upcoming, 1 paid past
- 5 `Notification`s for consultant-1 (mix of read/unread)

**Auth**: Real JWT (access token 15 min + refresh token 7 days). Passwords hashed with bcrypt (salt rounds 12). Store refresh tokens in DB (revocable).

**RBAC middleware**: `requireRole('ADMIN')`, `requireRole('PSYCHOLOGIST')`, etc. Apply at route level.

**Validation**: Use Zod for all request body/query validation.

**Pagination**: All list endpoints return `{ data: [...], meta: { page, per_page, total, total_pages } }`.

**Error format**: `{ error: { code: "SNAKE_CASE", message: "...", details?: [] } }`.

**WebSocket Chat**: Socket.IO on the same Express server. Events: `join_therapy`, `send_message`, `message_received`. Authenticate via JWT on handshake.

**Commands** (run inside backend container or locally with Node 20):
```bash
# First time / migrations
docker compose up -d postgres
docker compose run backend npx prisma migrate dev

# Start
docker compose up backend

# Tests (min 80% coverage)
docker compose run backend npm test
```

Health check: `GET /health` → `{ status: "ok" }`.

---

## Web Application (`web/`)

**Stack**: React 19 + TypeScript + Vite + TailwindCSS + React Query + React Router + react-hook-form + Zod + axios + Socket.IO-client

**Structure**:
```
web/src/
├── api/            # Per-entity axios modules
├── hooks/          # TanStack Query hooks
├── context/        # AuthContext (JWT + role), NotificationContext
├── routes/         # React Router 7 with lazy loading
├── guards/         # AuthGuard, RoleGuard (ADMIN | PSYCHOLOGIST only)
├── pages/          # One folder per feature
│   ├── auth/       # Iniciar sesión
│   ├── dashboard/  # Admin vs Psychologist dashboard
│   ├── terapias/   # Gestión de terapias
│   ├── sesiones/   # Gestión de sesiones
│   ├── eventos/    # Gestión de eventos
│   ├── chat/       # Chat en tiempo real
│   └── perfil/     # Perfil de usuario
├── components/
│   ├── layout/     # AppShell, Sidebar, TopBar (use brand colors)
│   └── ui/         # Shared primitives (Button, Input, Badge, etc.)
├── theme/          # tailwind.config.ts with brand color tokens
└── utils/          # format.ts, query-keys.ts, role-permissions.ts
```

**Axios client**: Bearer token from localStorage, 401 refresh queue, redirect to `/iniciar-sesion` on auth failure. Proxy `/api/*` → `http://backend:3000` in `vite.config.ts`.

**Commands**:
```bash
docker compose up web      # Dev server → http://localhost:5173
docker compose run web npm test
```

**Pages available to each role**:

| Page | Admin | Psicólogo | Notes |
|------|-------|-----------|-------|
| Dashboard | ✅ stats + Finanzas | ✅ own stats | Different views per role |
| Usuarios | ✅ | — | |
| Terapias | ✅ read-only | ✅ full CRUD | |
| Sesiones | ✅ read-only | ✅ full CRUD | Includes cancel/postpone actions |
| Notas de sesión | — | ✅ | Private/public toggle |
| Progreso de terapia | — | ✅ | Recharts line chart per goal |
| Pagos (terapia) | ✅ global | ✅ own therapies | |
| Pagos (eventos) | ✅ global | — | |
| Objetivos | — | ✅ | |
| Notificaciones | ✅ | ✅ | Bell icon + badge in TopBar |
| Eventos | ✅ full CRUD | — | |
| Chat | — | ✅ | Per therapy |
| Perfil psicólogo | — | ✅ editable | License, specializations, bio, fee, availability |

**Web pages folder structure additions:**
```
pages/
├── sesiones/
│   ├── SessionDetailPage.tsx   # includes notes tab + cancel/postpone buttons
├── notas/                      # SessionNote management (tab within session detail)
├── pagos/
│   ├── TherapyPaymentsPage.tsx
│   └── EventPaymentsPage.tsx   # admin only
├── progreso/                   # Therapy progress charts (line charts via Recharts)
├── notificaciones/
│   └── NotificationsPage.tsx
```

---

## Mobile Application (`mobile/`)

**Stack**: Kotlin Multiplatform Mobile (KMM)
Targets: `androidApp` (Jetpack Compose) + `iosApp` (SwiftUI)

**Shared module** (`shared/`):
- Networking (Ktor HTTP client)
- Domain models (matching Prisma schema — all field names in English)
- Auth logic (JWT storage via DataStore on Android, Keychain on iOS)
- Chat (WebSocket via Ktor)
- Repository interfaces + use cases

**Android target** (`androidApp/`): MVVM + Jetpack Compose. Follow exact same Color.kt tokens as the old prototype.
**iOS target** (`iosApp/`): SwiftUI views. Match brand colors via `Color` extensions.

**Complete mobile screen list (all in Spanish UI):**

| Screen | Description |
|--------|-------------|
| Splash | Token check → routing |
| Iniciar sesión | Login |
| Registrarse | Self-registration |
| Cambiar contraseña | Forced on first login |
| Onboarding (pasos 1–6) | Profile setup |
| Inicio / Dashboard | Summary: next session, unread notifications badge, goals summary |
| Buscar psicólogos | List with filters: specialization, modality, language |
| Perfil del psicólogo | Detail + availability calendar + request therapy button |
| Mis terapias | List of active/past therapies |
| Detalle de terapia | Sessions, goals, chat, payment history |
| Sesiones | Session list with status chips (Programada / Cancelada / Pospuesta / Completada) |
| Detalle de sesión | Notes (public ones), media, status actions (cancel/postpone) |
| Chat | Per-therapy real-time chat with media support |
| Objetivos | Goal list with progress bars |
| Mis pagos | Own payment history (read-only) — scope: therapy + events |
| Eventos | Event list with filter (upcoming / past / free / paid) |
| Detalle de evento | Info, location, cost, register button |
| Notificaciones | List with read/unread state, deep-link on tap |
| Mi perfil | View + edit consultant profile (photo, phone, emergency contact, preferences) |

**New screens requiring custom design (no reference in old prototype):**
- **Buscar psicólogos** + **Perfil del psicólogo** — discovery flow
- **Eventos** + **Detalle de evento** — event browsing and registration
- **Mi perfil (edit mode)** — consultant profile editing
- **Notificaciones** — notification center with deep-link routing
- **Mis pagos** — payment history list

**Commands**:
```bash
# Shared tests
./gradlew shared:test

# Android: open in Android Studio → run androidApp
# iOS: open iosApp/iosApp.xcworkspace in Xcode → run iosApp
```

API base URL (Android emulator → Docker backend): `http://10.0.2.2:3000`
API base URL (iOS simulator → Docker backend): `http://localhost:3000`

---

## README Requirements

Every sub-project **must** have its own `README.md`. These are mandatory deliverables, not optional documentation. Each README must be written in English and cover exactly the sections below.

### `backend/README.md`
1. **Overview** — what the backend does, port, health check URL
2. **Prerequisites** — Docker + Docker Compose version required
3. **Environment setup** — copy `.env.example` → `.env`, explain each variable
4. **Running the app** — exact commands in order:
   ```bash
   docker compose up -d postgres     # 1. start database
   docker compose run --rm backend npx prisma migrate dev  # 2. run migrations
   docker compose up backend         # 3. start API
   # Verify: http://localhost:3000/health
   ```
5. **Running tests** — exact command + how to see coverage report:
   ```bash
   docker compose run --rm backend npm test
   docker compose run --rm backend npm run test:coverage
   ```
6. **API reference** — link to Swagger UI (`http://localhost:3000/api-docs`) and to the Postman collection file location

### `web/README.md`
1. **Overview** — roles supported, port, screenshots folder if any
2. **Prerequisites** — Docker + Docker Compose
3. **Environment setup** — `.env.example` explanation
4. **Running the app**:
   ```bash
   docker compose up web
   # Access: http://localhost:5173
   ```
5. **Running tests**:
   ```bash
   docker compose run --rm web npm test
   docker compose run --rm web npm run test:coverage
   ```
6. **Login credentials** — seed accounts per role with email/password for local dev

### `mobile/README.md`
1. **Overview** — KMM targets (Android + iOS), minimum SDK versions
2. **Prerequisites** — Android Studio version, Xcode version, JDK version
3. **Environment setup** — where to set the API base URL per target
4. **Running Android**:
   ```
   Open Android Studio → select androidApp configuration → Run
   Backend must be running. Emulator connects via http://10.0.2.2:3000
   ```
5. **Running iOS**:
   ```
   Open iosApp/iosApp.xcworkspace in Xcode → select iosApp scheme → Run
   Backend must be running. Simulator connects via http://localhost:3000
   ```
6. **Running shared tests**:
   ```bash
   ./gradlew shared:test
   ./gradlew shared:koverReport   # coverage report
   ```

---

## Postman Collection

A Postman collection file **must** be maintained at `backend/postman/redapsi.postman_collection.json`.

### Collection requirements

- **One folder per resource**: Auth, Users, Therapies, Sessions, Goals, Messages, Events, Registrations
- **Every endpoint** in the backend must have a corresponding request (including error cases)
- **Collection-level variables**:
  - `{{base_url}}` — default `http://localhost:3000`
  - `{{access_token}}` — populated automatically by the Login request's test script
  - `{{refresh_token}}` — populated automatically by the Login request's test script
- **Pre-request / test scripts on the Login request**:
  ```js
  // Tests tab — runs after login succeeds
  const res = pm.response.json();
  pm.collectionVariables.set("access_token", res.data.access_token);
  pm.collectionVariables.set("refresh_token", res.data.refresh_token);
  ```
- **Authorization**: set at collection level as `Bearer {{access_token}}`; individual requests inherit it unless overridden
- **Example responses**: every request must include at least one saved example (success) and one error example (e.g. 401, 422)
- Include a `backend/postman/redapsi.postman_environment.json` with local dev values as a companion environment file

Also export a `backend/postman/README.md` explaining:
1. How to import the collection and environment into Postman
2. The correct order to run requests for a full end-to-end flow (register → login → create therapy → add session → send message → create event → register for event)

---

## AI Agent Development Workflow & Execution Order

> Full 7-step cycle (Analyze → Clarify → Branch → Develop → Test → Build → PR+Log), agent autonomy rules, and the numbered build execution order are defined in **`DEV.md`**. Read that file first at the start of every session.

---

## Business Rules

### Goals
- Only **psychologist** can create, update, and change the status of goals.
- **Consultant** has read-only access to goals (can view list and progress from mobile).
- `PATCH /goals/:id` is restricted to `PSYCHOLOGIST` role. Consultant endpoints only expose `GET`.
- Every `PATCH /goals/:id` that changes `progress` must atomically create a `GoalProgressEntry` snapshot.
- `GOAL_UPDATED` notification goes from psychologist → consultant (not the other way).

### Concurrent therapies
- A consultant can have **only one `ACTIVE` therapy at a time**.
- Before creating a new therapy (either flow), the backend must check: if `EXISTS therapy WHERE consultant_id = X AND status = ACTIVE` → return `409 CONFLICT` with code `CONSULTANT_HAS_ACTIVE_THERAPY`.
- Past therapies (`COMPLETED` or `CANCELLED`) do not block a new one.

### Soft delete
- `User`, `Therapy`, and `Event` support soft delete via `deleted_at DateTime?`.
- **Soft delete rules:**
  - Soft-deleted users cannot log in. Their data (therapies, payments, notes) is preserved for audit.
  - Soft-deleted therapies are hidden from all list endpoints but still returned when queried by ID (admin only).
  - Soft-deleted events stop accepting new registrations immediately.
- All list queries must add `WHERE deleted_at IS NULL` by default. The Prisma client singleton should apply this as a global middleware (soft-delete middleware pattern).
- Admin can restore a soft-deleted record via `PATCH /:resource/:id/restore`.

### Event capacity
- When `Event.max_participants` is set, registering must first count existing `EventRegistration`s with `status != CANCELLED`.
- If `count >= max_participants` → return `409 CONFLICT` with code `EVENT_FULL`.
- If `max_participants` is null → unlimited registrations allowed.

### Therapy notes visibility
- `Therapy.notes` is **psychologist-private**. It must never be included in API responses to `CONSULTANT` role.
- The API serialization layer must strip `notes` from therapy responses when `req.user.role === CONSULTANT`.

### Chat (v1 scope)
- Message read status (`read` field) is **deferred to v2**. Do not add it to the `Message` model now.
- In v1, unread message awareness is handled only through the `NEW_MESSAGE` notification with its debounce rule.
- The v2 upgrade path: add `read Boolean @default(false)` + `read_at DateTime?` to `Message`, and a `mark_read` Socket.IO event.

---

## Key Constraints

- No mock data or in-memory databases — everything goes through Prisma + PostgreSQL.
- No hardcoded secrets — use environment variables via Docker Compose `env_file`.
- UI labels, buttons, placeholders, error messages, and navigation items in **Spanish**. All code (variables, functions, classes, files, routes, DB fields, env keys, comments) in **English**.
- Role `consultant` (not `patient`) — this is the new naming convention.
- `CONSULTANT` is an exclusive role — backend must reject any attempt to assign it alongside `ADMIN` or `PSYCHOLOGIST`, and vice versa.
- All authorization checks must go through the `hasRole()` helper — never compare `user.role === 'ADMIN'` directly, since `ADMIN_PSYCHOLOGIST` would be missed.
- `ADMIN_PSYCHOLOGIST` users see the full union of both role interfaces on web — no features hidden from them.
- `must_change_password=true` users must be redirected to a change-password screen on every login — enforce on both web and mobile.
- Never store uploaded files outside the `uploads/` Docker volume — no cloud storage, no base64 in the DB.
- Minimum test coverage: **80%** on backend.
- All Docker services must have **healthchecks** defined.
- Follow SOLID and Clean Architecture strictly — no business logic in controllers or route handlers.
- Each sub-project must ship with a complete `README.md`. A feature is not done until its README reflects it.
- The Postman collection must be kept in sync with the API — every new endpoint requires a new Postman request.
- Session/workflow rules (read order, log entries, gitignore, no AI trace in commits) are defined in **`DEV.md`**.
