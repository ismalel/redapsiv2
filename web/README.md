# REDAPSI v2 — Web Portal

## 1. Overview
The REDAPSI v2 Web Portal is a React + TypeScript application built with Vite and TailwindCSS. It is designed for `ADMIN`, `PSYCHOLOGIST`, and `ADMIN_PSYCHOLOGIST` roles. `CONSULTANT` users are redirected to use the mobile applications.

- **Port**: 5173
- **Entry point**: `http://localhost:5173`

## 2. Prerequisites
- Docker (Desktop or Engine)
- Docker Compose v2.x or higher

## 3. Environment Setup
The web application uses the central `.env` file at the project root for development. Ensure the backend is running on port 3000 for the Vite proxy to work correctly.

## 4. Running the App
All services run inside Docker. Follow these steps to start the web portal:

1. **Start the web portal**:
   ```bash
   docker compose up web
   ```

2. **Access the application**:
   Visit `http://localhost:5173` in your browser.

## 5. Running Tests
Tests are run using Vitest within a Docker container.

```bash
# Run all tests
docker compose run --rm web npm test

# Run tests with coverage report
docker compose run --rm web npm run test:coverage
```

## 6. Login Credentials
Seed accounts are available for local development after running the seed script:

| Role | Email | Password |
|------|-------|----------|
| ADMIN | `admin@redapsi.app` | `Admin1234!` |
| ADMIN_PSYCHOLOGIST | `adminpsy@redapsi.app` | `Admin1234!` |
| PSYCHOLOGIST 1 | `psy1@redapsi.app` | `Psych1234!` |
| PSYCHOLOGIST 2 | `psy2@redapsi.app` | `Psych1234!` |

**Consultant users** (e.g., `consultant1@redapsi.app`) will be blocked from logging into the web portal with an error message in Spanish: *"Usa la aplicación móvil"*.
