# Manual Testing Checklist — Phase 3: Profiles & Onboarding

> Includes all checks from TESTING_PHASE_2.md plus the following.

## 6. Psychologist Profiles (API)

- [x] `GET /psychologists` returns list of psychologists with profiles (unauthenticated OK)
- [x] `GET /psychologists/:id` returns full profile including availability slots
- [x] `GET /psychologists/:id/availability` returns weekly slots array
- [x] `GET /psychologists/me/profile` (as psy1) returns own profile
- [x] `PUT /psychologists/me/profile` (as psy1) updates bio and session_fee — verify with GET
- [x] `PUT /psychologists/me/availability` (as psy1) replaces availability — verify with GET
- [x] CONSULTANT token cannot access `PUT /psychologists/me/profile` → 403

## 7. Consultant Onboarding (API)

Using consultant2@redapsi.app (stuck at step 3 in seed):

- [x] `GET /consultants/me/profile` (as consultant2) returns own profile
- [x] `GET /consultants/:id/onboarding` returns `{ current_step: 3, onboarding_data: {...}, onboarding_status: "INCOMPLETE" }`
- [x] `PUT /consultants/:id/onboarding/4` submits step 4 data → returns updated onboarding state
- [x] `PUT /consultants/:id/onboarding/5` submits step 5 data → returns updated state
- [x] `PUT /consultants/:id/onboarding/6` submits step 6 (confirm) → `onboarding_status` becomes "COMPLETED"
- [x] After step 6, `GET /consultants/:id/onboarding` shows `onboarding_status: "COMPLETED"`

## 8. Web — Psychologist Profile Page

Login as psy1@redapsi.app (Psych1234!):
- [x] Sidebar shows "Mi Perfil" link and remains fixed at full height.
- [x] Navigate to `/perfil` → shows tab-based interface (Información / Disponibilidad).
- [x] Edit "Biografía Profesional" field and save → visual feedback (success toast).
- [x] Click Camera icon → Upload new avatar → Image updates immediately in profile, sidebar, and top bar.
- [x] Switch to "Disponibilidad" tab → Weekly Calendar grid is displayed (6:00 - 22:00).
- [x] Click empty grid slot → Modal opens to create new available/blocked block.
- [x] Attempt to create overlapping slot → System prevents it with a clear error message.
- [x] Click "Guardar Agenda" → Success message and data persists on reload.

