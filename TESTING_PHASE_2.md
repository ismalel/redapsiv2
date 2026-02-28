# Manual Testing Checklist — Phase 2: Auth & File Upload

> Includes all checks from TESTING_PHASE_1.md plus the following.

## 3. API Authentication

### 3.1 Login
- [x] `POST /auth/login` with admin@redapsi.app / Admin1234! returns 200 with flat `access_token` and `refresh_token` (no nested tokens object).
- [x] `POST /auth/login` with wrong password returns 401 with `{ error: { code: "INVALID_CREDENTIALS" } }`.
- [x] `POST /auth/login` with consultant1@redapsi.app / Consult1234! returns 200.

### 3.2 Registration
- [x] `POST /auth/register` with a new email + role=PSYCHOLOGIST returns 201.
- [x] `POST /auth/register` with an already-used email returns 409 `EMAIL_ALREADY_EXISTS`.
- [x] `POST /auth/register` with role=ADMIN or ADMIN_PSYCHOLOGIST returns 403 `INVALID_REGISTRATION_ROLE`.

### 3.3 Token refresh
- [x] `POST /auth/refresh` with a valid refresh_token returns a new token pair.
- [x] `POST /auth/refresh` with an expired/invalid token returns 401.

### 3.4 Logout
- [x] `POST /auth/logout` with `refresh_token` in body returns 200.
- [x] After logout, the same refresh_token is revoked (subsequent refresh attempts return 401).

### 3.5 Change password
- [x] `PUT /auth/change-password` with correct current_password changes the password.
- [x] After change, old password no longer works.
- [x] Wrong current_password returns 401 `INVALID_CURRENT_PASSWORD`.

### 3.6 RBAC
- [x] A request to any protected endpoint without Bearer token returns 401.
- [x] Accessing a protected route with a valid token works.
- [x] `hasRole()` correctly handles `ADMIN_PSYCHOLOGIST` when checking for specific or combined roles.

### 3.7 Password Enforcement (Backend)
- [x] Authenticated user with `must_change_password: true` receiving 403 `PASSWORD_CHANGE_REQUIRED` on protected routes (except `/change-password` and `/logout`).

## 4. File Upload

- [x] `POST /upload?folder=avatars` with a valid .jpg file (≤10MB) and key `file` returns 201.
- [x] `GET http://localhost:3000/uploads/avatars/<filename>` serves the file correctly.
- [x] Uploading a file >10MB returns 413 `FILE_TOO_LARGE`.
- [x] Uploading an unsupported type (e.g. .exe) returns 422.
- [x] Using wrong field name returns 400 `UPLOAD_ERROR`.

## 5. Web — Login

- [x] Open `http://localhost:5173` → redirects to `/iniciar-sesion`.
- [x] Login with admin@redapsi.app / Admin1234! → redirects to `/dashboard`.
- [x] Login with psy1@redapsi.app / Psych1234! → redirects to `/dashboard`.
- [x] Login with consultant1@redapsi.app / Consult1234! → shows styled error screen "Usa la aplicación móvil".
- [x] "Volver al inicio" on rejection screen logs out correctly.
- [x] Bad credentials → shows inline error message: "Correo o contraseña incorrectos."
- [x] Clicking "Cerrar sesión" in TopBar logs out and redirects to `/iniciar-sesion`.
- [x] A user with `must_change_password: true` is redirected to `/cambiar-contrasena` component.
- [x] After successful password change, `must_change_password` state is updated and user goes to `/dashboard`.
- [x] TanStack Query uses `staleTime: 30000`.
