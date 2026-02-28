# DEV.md

Development cycle and progress log for **REDAPSI v2**.

---

## How to use this file

Every agent session must follow this order:

1. **Read `DEV.md` first** — understand current project state, what is already built, and what decisions were locked in.
2. **Read `CLAUDE.md` second** — load the full architecture spec, domain model, and constraints.
3. **Read `PLAN.md` third** — identify which phase is currently in progress, what its scope is, and which phases are already marked `[DONE]`. Never implement something outside the current phase's scope without user confirmation.
4. **Execute the 7-step cycle** described below.
5. **Append a log entry** to the [Development Log](#development-log) section at the end of Step 7, before closing the session. If the work completes a PLAN.md phase, also mark it done (see Step 7).

> Never start coding without reading all three files. Never close a session without writing a log entry and updating PLAN.md if a phase was completed.

### Important: this file is local-only

`DEV.md` and `CLAUDE.md` are listed in `.gitignore` and must **never be committed**. They exist only on the developer's machine to guide the agent. Agent IDs may be recorded here in the log for local tracking purposes — that information must never appear in any committed file, commit message, or source code comment.

---

## Development Cycle

This cycle is **mandatory** for every change. Never skip or reorder steps.

```
1. ANALYZE  →  2. CLARIFY  →  3. BRANCH  →  4. DEVELOP  →  5. TEST  →  6. BUILD  →  7. PR + LOG
                                                                ↑                             |
                                                                └──── fix & retry ────────────┘
```

---

### Step 1 — Analyze

Read `DEV.md`, `CLAUDE.md`, and `PLAN.md` in full before touching any file.

- Check the [Development Log](#development-log) below: know what is already implemented, what branches exist, and what decisions were made in previous sessions.
- Check `PLAN.md`: find the first phase not marked `[DONE]` — that is the current phase. Read its full scope before starting anything.
- Identify all files affected by the current task. Read each one.
- Understand the current behavior before planning the new behavior.

Do not assume the project state from memory — always verify against the actual files.

---

### Step 2 — Clarify

Before touching any file, ask the user about **anything that could lead to a wrong implementation**:

- Ambiguous scope ("does this affect mobile too, or only web?")
- Conflicting constraints ("the spec says X but the existing code does Y")
- Design decisions with more than one valid approach and irreversible consequences

Ask all questions in a **single message**. Wait for answers. Do not start coding with unresolved doubts.

---

### Step 3 — Branch

Branch off from `main`. Naming convention:

| Type | Pattern | Example |
|------|---------|---------|
| Feature | `feature/<short-description>` | `feature/event-registrations` |
| Bug fix | `fix/<short-description>` | `fix/auth-token-refresh` |
| Chore / infra | `chore/<short-description>` | `chore/docker-healthchecks` |

```bash
git checkout main
git pull origin main
git checkout -b feature/<short-description>
```

---

### Step 4 — Develop

Implement only what was agreed in Step 2. Follow Clean Architecture — no business logic in controllers or route handlers.

Keep commits small and descriptive:

```bash
git add <specific files>   # never git add -A blindly
git commit -m "feat: add event registration endpoint"
```

Update the Postman collection and README if the change affects the API or run steps.

---

### Step 5 — Test

Write tests **before** marking the task done. Run them inside Docker:

```bash
# Backend
docker compose run --rm backend npm test
docker compose run --rm backend npm run test:coverage   # must stay ≥ 80%

# Web
docker compose run --rm web npm test

# Mobile shared
./gradlew shared:test
```

If any test fails → fix, then re-run from Step 5. Never proceed with failing tests.

---

### Step 6 — Build & verify

```bash
# Backend (TypeScript compile)
docker compose run --rm backend npm run build

# Web
docker compose run --rm web npm run build

# Android
./gradlew androidApp:assembleDebug

# iOS (macOS only)
# xcodebuild -scheme iosApp -configuration Debug
```

Build failure → go back to Step 4, fix, repeat Steps 5–6. **Never open a PR with a failing build.**

---

### Step 7 — PR + Log

Only open a PR when Steps 5 and 6 pass with zero errors.

```bash
gh pr create \
  --base main \
  --title "<type>: <short description>" \
  --body "$(cat <<'EOF'
## What changed
- <bullet points>

## How to test
- <step-by-step>

## Checklist
- [ ] Tests pass (≥ 80% coverage)
- [ ] Build succeeds
- [ ] README updated (if applicable)
- [ ] Postman collection updated (if API changed)
EOF
)"
```

**Do not merge the PR.** The user reviews and merges manually.

**No AI trace rule:** Commit messages must never include `Co-Authored-By: Claude`, `Generated by`, or any AI model/agent reference. Source files must not contain `// Generated by Claude` or equivalent comments. Code comments must describe logic, not authorship. Only this `DEV.md` log may record agent IDs, and that information must never appear in any committed artifact.

**Update `PLAN.md`:** If the PR completes a full phase, edit that phase's header in `PLAN.md` to add `[DONE — PR #N]`. Example: `## Phase 1 — Infrastructure & Database [DONE — PR #12]`. Also create the `TESTING_PHASE_N.md` file at the project root if not already done (it is a required deliverable of every phase).

After opening the PR, **append a log entry** to the [Development Log](#development-log) below using the template:

```markdown
### [YYYY-MM-DD] — <branch-name>

**Agent:** <model-id, e.g. claude-sonnet-4-6>
**PR:** <PR number and URL>
**Execution order steps covered:** <e.g. Steps 1–4>

#### Implemented
- <bullet: what was built>

#### Key decisions
- <bullet: any non-obvious choice made and why>

#### Current system state
- <what is working end-to-end right now>

#### Next step
- <execution order step number and description>
```

---

## Agent Autonomy

Execute and verify autonomously whenever possible. Only stop and flag the user (`⚠️ USER INPUT REQUIRED`) when:

- A design decision has more than one valid approach with irreversible consequences
- A secret, credential, or external service config is needed that cannot be inferred
- A test or build fails after two retry attempts and the root cause is unclear
- The requirement itself is ambiguous after reading all related files

For everything else — running commands, reading output, fixing lint errors, retrying failed steps — proceed without asking. Report what was done in a concise summary after each step.

---

## Execution Order

When building from scratch, implement in this sequence. Check the Development Log below to know which steps are already done.

1. `docker-compose.yml` + `.env.example`
2. `backend/prisma/schema.prisma`
3. Migrations: `npx prisma migrate dev --name init`
4. Seed script: `prisma/seed.ts`
5. File storage: `uploads/` + Express static serving + `POST /upload` (multer)
6. Backend auth: register, login, refresh, logout (JWT + bcrypt)
7. Password change on first login (`must_change_password` enforcement)
8. RBAC middleware: `requireRole()`
9. Psychologist profile routes (CRUD + availability slots)
10. Consultant profile routes (CRUD) + onboarding steps 1–6
11. Notification service module (`src/application/notifications/`)
12. `PUT /auth/change-password` endpoint
13. Therapy routes — Flow A (psychologist creates + invites consultant + BillingPlan)
14. Therapy routes — Flow B (consultant self-registers → therapy request → accept → therapy + BillingPlan)
15. Session scheduling routes (propositions + session requests + availability calendar)
16. Session routes (CRUD, complete, cancel, postpone, fee override, media upload)
17. Session notes routes (CRUD with privacy filter)
18. Goals routes (CRUD + progress update → GoalProgressEntry snapshot)
19. `GET /therapies/:id/progress` endpoint
20. Payment routes — therapy (register, view per session / therapy / global)
21. Events routes (CRUD + registrations + auto payment for paid events)
22. Payment routes — events (`GET /admin/payments?scope=EVENT`)
23. Admin payment dashboard (`GET /admin/payments` with all filters)
24. Chat: Socket.IO + Message persistence
25. Swagger/OpenAPI spec (`GET /api-docs`)
26. Postman collection (`backend/postman/`) — folders: Auth, Profiles, Therapies, Sessions, Notes, Goals, Payments, Events, Notifications, Chat
27. Backend tests (Jest + Supertest, ≥80% coverage)
28. `backend/README.md`
29. Web app (auth, dashboard, terapias, sesiones, progreso, pagos, eventos, notificaciones, perfil)
30. Web tests (Vitest + Testing Library)
31. `web/README.md`
32. KMM shared module (networking, auth, models, onboarding, notification polling)
33. Android UI — all screens (Jetpack Compose)
34. iOS UI — all screens (SwiftUI)
35. KMM shared tests
36. `mobile/README.md`

---

## Development Log

> Entries are appended here by agents at Step 7 (newest at the top).
> Each entry must be self-contained enough for the next agent to understand what exists without reading commit history.

<!-- ─── ADD NEW ENTRIES ABOVE THIS LINE ─────────────────────────────────────── -->

### [2026-02-27] — Initial setup

**Agent:** claude-sonnet-4-6
**PR:** N/A — initial spec, no code yet
**Execution order steps covered:** None (pre-implementation)

#### Implemented
- Created `redapsi/redapsi/CLAUDE.md` — full architecture spec (Prisma schema, business rules, execution order, platform mapping, notifications, payments, session lifecycle, onboarding, file storage, web/mobile screen lists)
- Created `redapsi/redapsi/DEV.md` — this file (dev cycle + log)

#### Key decisions
- Spanish UI text only; all code in English — hard rule across all projects
- CONSULTANT is an exclusive role (cannot be combined with ADMIN or PSYCHOLOGIST)
- ADMIN_PSYCHOLOGIST is a valid combined role stored as a single enum value; `hasRole()` expands it
- Admin + Psychologist → Web only; Consultant → Mobile only — no crossover
- Two therapy creation flows: psychologist-initiated (invites consultant) and consultant-initiated (requests a psychologist)
- BillingPlan per therapy (not per session); per-session fee override via `TherapySession.session_fee`
- Unified Payment model covering both therapy sessions and events via `PaymentScope` enum
- Notifications are synchronous (same DB transaction), no queues in v1
- Chat read status deferred to v2 — Message model has no `read` field in v1
- Soft delete on User, Therapy, Event via `deleted_at`; Prisma global middleware for list queries
- Therapy.notes is psychologist-private — stripped from CONSULTANT API responses
- Only psychologist can create/update Goals; consultant has read-only access
- One active therapy per consultant at a time (409 CONSULTANT_HAS_ACTIVE_THERAPY)
- Event capacity enforced at registration time (409 EVENT_FULL)

#### Current system state
- Spec complete. No code written yet. `redapsi/redapsi/` folder contains only `CLAUDE.md`, `DEV.md`, and the source spec text file.

#### Next step
- Execution order Step 1: `docker-compose.yml` + `.env.example`
- Execution order Step 2: `backend/prisma/schema.prisma`
- Execution order Step 3: run initial migration
- Execution order Step 4: `prisma/seed.ts`
