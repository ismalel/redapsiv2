# Manual Testing Checklist — Phase 2: Auth & File Upload

> Includes all checks from TESTING_PHASE_1.md plus the following.

## 3. API Authentication

### 3.1 Login
- [ ] `POST /auth/login` with admin@redapsi.app / Admin1234! returns 200 with `access_token` and `refresh_token`.
- [ ] `POST /auth/login` with wrong password returns 401 with `{ error: { code: "INVALID_CREDENTIALS" } }`.
- [ ] `POST /auth/login` with consultant1@redapsi.app / Consult1234! returns 200.

### 3.2 Registration
- [ ] `POST /auth/register` with a new email + role=PSYCHOLOGIST returns 201.
- [ ] `POST /auth/register` with an already-used email returns 409 `EMAIL_ALREADY_EXISTS`.

### 3.3 Token refresh
- [ ] `POST /auth/refresh` with a valid refresh_token returns a new token pair.
- [ ] `POST /auth/refresh` with an expired/invalid token returns 401.

### 3.4 Logout
- [ ] `POST /auth/logout` with Bearer token returns 200.
- [ ] After logout, the same refresh_token is revoked (subsequent refresh attempts return 401).

### 3.5 Change password
- [ ] `PUT /auth/change-password` with correct current_password changes the password.
- [ ] After change, old password no longer works.
- [ ] Wrong current_password returns 401 `INVALID_CURRENT_PASSWORD`.

### 3.6 RBAC
- [ ] A request to any protected endpoint without Bearer token returns 401.
- [ ] Accessing a protected route with a valid token works.

## 4. File Upload

- [ ] `POST /upload?folder=avatars` with a valid .jpg file (≤10MB) returns `{ "data": { "url": "/uploads/avatars/<filename>" } }`.
- [ ] `GET http://localhost:3000/uploads/avatars/<filename>` serves the file correctly.
- [ ] Uploading a file >10MB returns 413 or appropriate error.
- [ ] Uploading an unsupported type (e.g. .exe) returns 422.

## 5. Web — Login

- [ ] Open `http://localhost:5173` → redirects to `/iniciar-sesion`.
- [ ] Login with admin@redapsi.app / Admin1234! → redirects to `/dashboard`.
- [ ] Login with psy1@redapsi.app / Psych1234! → redirects to `/dashboard`.
- [ ] Login with consultant1@redapsi.app / Consult1234! → shows error screen "Usa la aplicación móvil".
- [ ] Bad credentials → shows inline error message: "Correo o contraseña incorrectos."
- [ ] Clicking "Cerrar sesión" in TopBar logs out and redirects to `/iniciar-sesion`.
- [ ] A user with `must_change_password: true` is redirected to `/cambiar-contrasena` after login.
