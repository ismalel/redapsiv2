# Manual Testing Checklist — Phase 5: Session Lifecycle & Clinical Workflow

> Includes all checks from TESTING_PHASE_4.md plus the following.

## 14. Session Lifecycle (API)

Get a SCHEDULED session ID from `GET /sessions`.

- [ ] `POST /sessions/:id/complete` (as psychologist) → status becomes COMPLETED
- [ ] `POST /sessions/:id/cancel` (as psychologist or consultant) with reason → status becomes CANCELLED, cancelled_by is set
- [ ] `POST /sessions/:id/postpone` with new_date → status becomes POSTPONED, postponed_to is set
- [ ] `POST /sessions/:id/confirm-postpone` → status back to SCHEDULED, scheduled_at = new date, postponed_to = null
- [ ] `GET /sessions/:id` always returns `effective_fee` (computed from session_fee ?? billing_plan.default_fee)
- [ ] `PATCH /sessions/:id` with session_fee=0 (as psychologist) → effective_fee is 0 on next GET
- [ ] `POST /sessions/:id/media` with `media_url` adds file path to session

### Status transitions (verify each is rejected):
- [ ] Cannot complete a CANCELLED session → 422
- [ ] Cannot cancel an already CANCELLED session → 422

## 15. Session Notes & Therapy Notes (API)

- [ ] `POST /sessions/:id/notes` (as psychologist) with is_private=false → note visible to both psychologist and consultant
- [ ] `POST /sessions/:id/notes` (as psychologist) with is_private=true → note NOT in consultant's `GET /sessions/:id/notes` response
- [ ] `POST /sessions/:id/notes` (as consultant) with is_private=false → visible to psychologist
- [ ] `PATCH /sessions/:id/notes/:noteId` — can only edit own notes (other's notes return 403)
- [ ] `DELETE /sessions/:id/notes/:noteId` — can only delete own notes
- [ ] `POST /therapies/:id/notes` (as psychologist) creates a structured note with title and content
- [ ] `GET /therapies/:id/notes` lists all private therapy notes
- [ ] `PATCH /therapies/:id/notes/:noteId` updates a private note
- [ ] `DELETE /therapies/:id/notes/:noteId` deletes a private note

## 16. Recurrence & Session Types (API)

- [ ] `POST /therapies/:id/recurrence` generates future RECURRENT sessions automatically
- [ ] `POST /therapies/:id/recurrence` creates a BLOCKED slot in the psychologist's calendar
- [ ] `POST /therapies/:id/propositions` with `type: "EXTRAORDINARY"` creates a proposition of that type
- [ ] Consultant accepting a proposition inherits the `INITIAL` or `EXTRAORDINARY` type into the new `TherapySession`
- [ ] `GET /therapies/:id` now includes the `recurrence_config` object if set

## 17. Web — Sessions & Clinical Workflow

Login as psy1@redapsi.app:
- [ ] `/sesiones` shows global agenda with session types and status chips
- [ ] Click a therapy in `/terapias` → Sesiones tab shows history + "Configurar Seguimiento" button
- [ ] "Configurar Seguimiento" button → opens form → save → sessions appear in list + calendar blocked
- [ ] "Sesión Extraordinaria" button exists (functional, opens proposition form)
- [ ] Session Detail -> "Archivos" tab -> "Subir Archivo" button works (opens file picker + uploads)
- [ ] Session Detail -> "Notas" tab -> "Nota Privada" toggle works
- [ ] Therapy Detail -> "Notas Privadas" tab -> "Nueva Nota" button works
- [ ] Therapy Detail -> "Notas Privadas" tab -> List shows notes with Title and Content
- [ ] Therapy Detail -> "Notas Privadas" tab -> Edit and Delete buttons work
- [ ] Therapy Detail -> "Notas Privadas" tab -> Search bar filters notes correctly

### Ownership Enforcement (Web):
- [ ] Login as **ADMIN_PSYCHOLOGIST** (adminpsy@redapsi.app)
- [ ] Navigate to a session owned by **PSY 1** (e.g., from the seed data)
- [ ] **Verify:** Action buttons (Completar, Cancelar, Posponer, Subir Archivo) are HIDDEN.
- [ ] **Verify:** "Notas Privadas" tab in Therapy Detail is HIDDEN for therapies not owned by you.

## 18. Notifications for sessions

- [ ] Completing a session triggers `SESSION_COMPLETED` for both parties
- [ ] Cancelling a session triggers `SESSION_CANCELLED` for both
- [ ] Postponing triggers `SESSION_POSTPONED` for both
- [ ] Adding a public note triggers `NOTE_ADDED` for the other party
- [ ] Adding a private note does NOT trigger any notification
