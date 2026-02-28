# REDAPSI v2 — Backend

## 1. Overview
The REDAPSI v2 Backend is a Node.js + Express + Prisma + PostgreSQL API. It handles authentication (JWT), role-based access control (RBAC), therapy management, session scheduling, and real-time chat via Socket.IO.

- **Port**: 3000
- **Health check URL**: `http://localhost:3000/health`
- **Architecture**: Clean Architecture / SOLID principles.

## 2. Prerequisites
- Docker (Desktop or Engine)
- Docker Compose v2.x or higher

## 3. Environment Setup
Copy the `.env.example` file from the project root into a `.env` file in the project root:

```bash
cp .env.example .env
```

Key environment variables:
- `DATABASE_URL`: Connection string for PostgreSQL.
- `JWT_SECRET`: Secret key for signing access tokens.
- `REFRESH_TOKEN_SECRET`: Secret key for signing refresh tokens.

## 4. Running the App
All services run inside Docker. Follow these steps to start the backend:

1. **Start infrastructure services**:
   ```bash
   docker compose up -d postgres redis pgadmin
   ```

2. **Run database migrations**:
   ```bash
   docker compose run --rm backend npx prisma migrate dev
   ```

3. **Seed the database (optional)**:
   ```bash
   docker compose run --rm backend npx prisma db seed
   ```

4. **Start the API**:
   ```bash
   docker compose up backend
   ```

Verify the service is running by visiting `http://localhost:3000/health`.

## 5. Running Tests
Tests are run using Jest and Supertest within a Docker container.

```bash
# Run all tests
docker compose run --rm backend npm test

# Run tests with coverage report
docker compose run --rm backend npm run test:coverage
```

Coverage report will be generated in `backend/coverage/index.html`.

## 6. API Reference
- **Swagger UI**: Accessible at `http://localhost:3000/api-docs` when the server is running.
- **Postman Collection**: Located at `backend/postman/redapsi.postman_collection.json`.
