# Employee Compensation Service

Azure Functions (Node.js/TypeScript) + PostgreSQL backend service for managing employee records and generating compensation reports.

## Prerequisites

- [Node.js 18.x](https://nodejs.org/) — use `nvm install 18 && nvm use 18` if you have nvm
- [Azure Functions Core Tools v4](https://learn.microsoft.com/en-us/azure/azure-functions/functions-run-local) — `npm install -g azure-functions-core-tools@4 --unsafe-perm true`
- [PostgreSQL 14+](https://www.postgresql.org/)

> **Note:** Azure Functions v4 supports Node 18, 20, and 22. This project is tested on Node 18.x.

## Setup

### 1. Create database user and DB (one-time, as postgres superuser)

```bash
psql -U postgres
```

```sql
CREATE USER emp_comp_app WITH PASSWORD 'emp_comp@1234';
CREATE DATABASE employee_compensation OWNER emp_comp_app;
```

### 2. Install and run

```bash
npm install
cp .env.example .env    # edit credentials if needed
npm run dev             # auto-migrates tables + seeds data
```

That's it. The `predev` hook checks the database, applies pending migrations, and seeds sample data on first run. API starts at `http://localhost:7071/api/`.

## Available Scripts

| Script | Description |
|--------|-------------|
| `npm run dev` | Build + start (auto-runs db:setup first) |
| `npm run db:setup` | Migrate + seed (idempotent) |
| `npm run db:migrate` | Run pending SQL migrations only |
| `npm run db:seed` | Insert sample data |
| `npm run db:reset` | Drop all tables, re-migrate, re-seed (dev only) |
| `npm run build` | Compile TypeScript to dist/ |
| `npm start` | Start Azure Functions runtime (requires build) |

## Architecture

```
Controller → Service → Repository → PostgreSQL
(HTTP)       (Logic)   (SQL)        (Data)
```

**Controller** (`src/controllers/`): Parses HTTP requests, validates input, calls service, formats HTTP response. No SQL, no business rules.

**Service** (`src/services/`): Business logic — validation rules like "bonus cannot exceed salary", existence checks, data transformation. Throws typed `ServiceError` for known failure cases.

**Repository** (`src/repositories/`): Raw parameterized SQL queries. No HTTP awareness, no business logic. Only talks to the database.

**Middleware** (`src/middleware/`): Centralized error handler wraps all controllers. Maps `ServiceError` codes and PostgreSQL error codes to HTTP status codes.

**Config** (`src/config/`): Environment loading (`.env`), DB connection pool (singleton for Azure Functions warm instances).

**Scripts** (`src/scripts/`): Auto-migration system — numbered SQL files in `sql/` are tracked in a `_migrations` table and applied in order.

## Project Structure

```
├── src/
│   ├── controllers/
│   │   ├── employee.controller.ts    # CRUD endpoints (Part A)
│   │   └── report.controller.ts      # Reporting endpoints (Part B+C)
│   ├── services/
│   │   ├── employee.service.ts       # Employee business logic
│   │   └── report.service.ts         # Report business logic
│   ├── repositories/
│   │   ├── employee.repository.ts    # Employee SQL queries
│   │   └── report.repository.ts      # Report SQL queries
│   ├── config/
│   │   ├── env.ts                    # Environment config
│   │   └── database.ts               # Connection pool
│   ├── middleware/
│   │   └── errorHandler.ts           # Error → HTTP status mapping
│   ├── utils/
│   │   └── validation.ts             # Input validation
│   └── scripts/
│       ├── setup-db.ts               # Auto DB setup (predev hook)
│       ├── migrate.ts                # Migration runner
│       ├── seed.ts                   # Seed data loader
│       └── reset-db.ts              # Full reset (dev only)
├── sql/
│   ├── 001_create_tables.sql         # Schema DDL
│   └── seed.sql                      # Sample data
├── .env                              # Environment variables
├── host.json                         # Azure Functions config
└── package.json
```

## API Endpoints

### Part A — CRUD

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/employees` | Create employee |
| GET | `/api/employees/{id}` | Get by ID |
| GET | `/api/employees?departmentId=N` | List (optional filter) |
| PUT/PATCH | `/api/employees/{id}` | Partial update |
| DELETE | `/api/employees/{id}` | Delete employee |

### Part B — Reports

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/reports/total-bonus` | Company-wide total bonus |
| GET | `/api/reports/no-bonus` | Employees without bonus |
| GET | `/api/reports/bonus-percentages` | Bonus as % of salary |
| GET | `/api/reports/departments-high-bonus` | Depts where bonus > avg salary |
| GET | `/api/reports/bonus-ranking` | Ranked by bonus (NULL last) |
| GET | `/api/reports/highest-compensation` | Highest salary vs total comp |
| GET | `/api/reports/effective-bonus` | With default 5% bonus applied |

### Example Requests

```bash
# Create
curl -X POST http://localhost:7071/api/employees \
  -H "Content-Type: application/json" \
  -d '{"firstName":"Raj","lastName":"Kumar","departmentId":1,"salary":950000}'

# Read
curl http://localhost:7071/api/employees/1

# Update bonus
curl -X PUT http://localhost:7071/api/employees/1 \
  -H "Content-Type: application/json" \
  -d '{"bonus":120000}'

# Delete
curl -X DELETE http://localhost:7071/api/employees/3

# Reports
curl http://localhost:7071/api/reports/total-bonus
curl http://localhost:7071/api/reports/bonus-ranking
curl http://localhost:7071/api/reports/highest-compensation
```

## Design Decisions

**No ORM:** Raw parameterized SQL (`$1, $2`) for full control, readability, and SQL injection prevention. The interview panel can see exactly what queries run.

**Read-time default bonus:** `COALESCE(Bonus, Salary * 0.05)` computed on SELECT, not written to the table. Preserves original data — NULL still means "no bonus awarded." Policy changes don't require data migration.

**Connection pooling:** Singleton pool persists across Azure Functions warm invocations. Avoids per-request connection overhead and prevents DB connection exhaustion.

**Auto-migration:** Numbered SQL files tracked in `_migrations` table. `npm run dev` auto-applies pending migrations — zero manual DB setup.

**Layered architecture:** Controller → Service → Repository separation keeps HTTP, business logic, and data access independent and testable.
