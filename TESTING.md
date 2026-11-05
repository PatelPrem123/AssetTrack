# AssetTrack — Automated Testing & Quality Assurance Contract

This document details the test suites, execution procedures, and quality contracts governing AssetTrack.

---

## 1. Quality & Master Testing Rules

1. **No Mock Testing for Business Logic:** All integration tests execute against a real, running MongoDB test database instance.
2. **Deterministic Data Scoping:** Each test suite creates, isolates, and cleans up its own tenants (`Organization`) without leaving stale records.
3. **Exit Code Verification:** Every test reported must have passed with exit code 0 via the command-line interface.

---

## 2. Vitest Test Suites Summary

AssetTrack includes **8 test files** with **55 comprehensive integration tests**:

| Test Suite | File | Tests | Key Scenarios Covered |
| :--- | :--- | :---: | :--- |
| **Phase 1: Gateway & Health** | `server/tests/health.test.js` | 3 | Health endpoint, uptime, JSON structured 404 handler |
| **Phase 2: Auth & Tenancy** | `server/tests/auth.test.js` | 9 | Multi-tenant registration, duplicate org code rejection, bcrypt verification, 5 RBAC roles, tenant isolation |
| **Phase 3: Taxonomy** | `server/tests/taxonomy.test.js` | 7 | Auto-seeding 14 categories, compound location uniqueness, department creation, RBAC authorization blocks |
| **Phase 4: Assets & Specs** | `server/tests/assets.test.js` | 9 | Structured specs (CPU/RAM/Storage), unique asset tags, duplicate serial prevention, filters, pagination, QR scan triage |
| **Phase 5 & 6: Custody & PDF** | `server/tests/assignments.test.js` | 7 | Check out, double-booking rejection, transfer, non-destructive return history, BOLA scoping, binary 2x1" PDF streaming |
| **Phase 7, 8 & 9: Maintenance & Stock** | `server/tests/maintenanceStock.test.js` | 8 | Consumables catalog, atomic IN/OUT movements, component evolution with stock deduction and spec sync, repair completion |
| **Phase 10 & 11: Reports & Ingest** | `server/tests/reports.test.js` | 6 | Dashboard aggregation, category distribution, 90-day warranty horizon, streaming ExcelJS workbook, bulk CSV ingestion |
| **Phase 12: Security & Schedulers** | `server/tests/security.test.js` | 6 | NoSQL injection rejection, RBAC restrictions, background warranty & low stock audit alerts, deduplication, tenant BOLA isolation |
| **Total** | | **55** | **100% Pass Rate** |

---

## 3. Running Automated Tests

To execute the complete Vitest test suite:
```bash
cd server
npm test
```

To run a specific test suite:
```bash
cd server
npx vitest run tests/security.test.js
```

To run in watch mode during development:
```bash
cd server
npm run test:watch
```
