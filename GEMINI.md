# GEMINI.md

This file provides foundational mandates and instructional context for Gemini CLI when working on **REDAPSI v2**.

---

## ⚠️ CRITICAL MANDATE: CLAUDE.md
**You MUST always read and follow the instructions in `CLAUDE.md` as if they were part of `GEMINI.md`.** `CLAUDE.md` contains the primary architectural specifications, domain models (Prisma schema), and strict technical constraints that govern this project.

---

## Project Overview

**REDAPSI v2** is a management platform for feminist psychology, rebuilt from scratch with a production-ready stack. It manages therapy lifecycles, real-time communication, and event registrations for three main roles: Admin, Psychologist, and Consultant.

### Technology Stack
- **Backend:** Node.js 20, Express 5, Prisma ORM, PostgreSQL, Socket.IO.
- **Web:** React 19, TypeScript, Vite, TailwindCSS, TanStack Query.
- **Mobile:** Kotlin Multiplatform Mobile (KMM) — Android (Jetpack Compose) + iOS (SwiftUI).
- **Infrastructure:** Docker & Docker Compose (all services are containerized).

### Core Mandates
- **Language Separation:** 
  - **User-facing text → Spanish.** (Labels, buttons, error messages, navigation).
  - **Everything programmable → English.** (Variables, functions, files, DB fields, comments).
- **Platform Boundaries:**
  - `ADMIN` & `PSYCHOLOGIST` → **Web only** (http://localhost:5173).
  - `CONSULTANT` → **Mobile only** (Android/iOS apps).
- **Role Exclusivity:** A `CONSULTANT` can NEVER have any other role. Enforcement is required at DB and API levels.
- **Development Lifecycle:** Follow the 7-step cycle in `DEV.md`: ANALYZE → CLARIFY → BRANCH → DEVELOP → TEST → BUILD → PR + LOG.
- **No AI Trace:** Do not include AI-generated signatures or co-authored-by tags in commits or source code. Only `DEV.md` log may record agent activity.

---

## Building and Running

### Prerequisites
- Docker & Docker Compose
- Node.js 20+ (for local scripts)
- Java 17+ / Android Studio / Xcode (for mobile)

### Quick Start (Phase 1)
```bash
# Start all services
docker compose up -d

# Run migrations and seed
docker compose run --rm backend npx prisma migrate dev --name init
docker compose run --rm backend npx prisma db seed

# Verify health
curl http://localhost:3000/health
```

---

## Development Workflow (Instructional Context)

1. **Phase-Based Progress:** Always check `PLAN.md` to identify the current implementation phase. Do not implement features out of order.
2. **Consult Logs:** Read the [Development Log] in `DEV.md` at the start of every session to understand recent changes and current state.
3. **RBAC Helper:** Always use the `hasRole()` helper for authorization checks. Never compare roles directly (to correctly handle `ADMIN_PSYCHOLOGIST`).
4. **Validation:** Use **Zod** for all backend request validation.
5. **Testing:** New features MUST include automated tests. Bug fixes MUST include a reproduction test case.
6. **PR Protocol:** Every PR requires a completed `TESTING_PHASE_N.md` checklist as a deliverable for its corresponding phase.

---

## Directory Structure
```
redapsi/
├── backend/        # Node.js + Prisma
├── web/            # React + Vite
├── mobile/         # KMM (shared, androidApp, iosApp)
├── docker-compose.yml
├── CLAUDE.md       # Primary architecture and schema spec (FOLLOW RELIGIOUSLY)
├── DEV.md          # Dev cycle, execution order, and log
├── PLAN.md         # Phased implementation roadmap
└── GEMINI.md       # Ground truth context for Gemini CLI
```
