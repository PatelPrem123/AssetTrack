# AssetTrack — Enterprise IT Asset & Hardware Inventory Management System

[![Node.js](https://img.shields.io/badge/Node.js-v24.x_LTS-green.svg)](https://nodejs.org/)
[![React](https://img.shields.io/badge/React-v18.3-blue.svg)](https://react.dev/)
[![MongoDB](https://img.shields.io/badge/MongoDB-v7.x-emerald.svg)](https://www.mongodb.com/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-v3.4-cyan.svg)](https://tailwindcss.com/)
[![Vitest](https://img.shields.io/badge/Vitest-55_Tests_Passing-brightgreen.svg)](https://vitest.dev/)
[![License](https://img.shields.io/badge/License-Proprietary-red.svg)]()

> **AssetTrack** is an enterprise-grade IT Asset Management (ITAM), hardware lifecycle tracking, and custody governance platform built for high-scale enterprise infrastructure. It pairs strict multi-tenant isolation with deep hardware specification tracking, atomic component swaps, printable vector QR asset tags, camera scanning, and streaming Excel/PDF analytics.

---

## Key Capabilities

- **Deep Hardware Architecture Tracking:** Structured tracking of multi-core CPUs, multi-slot DDR4/DDR5 RAM arrays, multi-drive NVMe/SATA storage volumes, GPUs, mainboards, network interfaces (MAC/IP), and operating systems.
- **Physical QR Engine & Mobile Scanner:** Automatic generation of 128-bit cryptographic opaque QR tokens (`qr_...`). Printable industrial 2x1" vector labels via PDFKit and live camera scanning via `html5-qrcode`.
- **Immutable Chain of Custody (DEC-003):** Non-destructive asset assignment history. Handover and return condition inspections, accessories checklist verification, expected return date tracking, and overdue return alarms.
- **Component Evolution & Stock Ledger (DEC-005, DEC-006):** Atomic component upgrades and repairs that simultaneously deduct parts from the spare parts inventory, log the hardware evolution, and update the device specifications.
- **Multi-Tenant Isolation (DEC-007):** Hard boundary multi-tenancy where all assets, users, assignments, maintenance records, and spare parts are partitioned strictly by `organizationId`.
- **Automated Background Auditing (DEC-012):** Background scheduler monitoring 90-day/30-day/7-day warranty expiration horizons, minimum spare parts inventory levels, and overdue device returns.
- **Streaming Export & Ingest Pipelines (DEC-011):** Multi-sheet industrial Excel workbooks streamed directly via `ExcelJS` and bulk CSV onboarding with formula injection protection (`PapaParse`).

---

## Technology Stack

| Layer | Technologies |
| :--- | :--- |
| **Frontend** | React 18, Vite 6, Tailwind CSS, TanStack Query (React Query v5), Zustand, Lucide Icons, Recharts |
| **Backend** | Node.js 24 LTS, Express.js 4.x REST API (`/api/v1`), Zod 3.x Schema Validation, Helmet, CORS |
| **Database** | MongoDB 7.x, Mongoose 8.x ODM, Compound Unique Indexing, Transactions |
| **Security & Auth** | JWT Authentication, HttpOnly Cookie Sessions, Bcrypt (Salt rounds: 12), RBAC Authorization |
| **Media & Output** | PDFKit (Industrial 2x1" labels), QRCode, HTML5-QRCode (Webcam/Mobile scanner), ExcelJS |
| **Testing** | Vitest 3.x, Supertest 7.x (55 integration tests passing with exit code 0) |

---

## Role-Based Access Control (RBAC) Matrix

AssetTrack enforces five discrete user roles:

| Capability | Org Admin | Asset Manager | IT Technician | Employee | Auditor / Viewer |
| :--- | :---: | :---: | :---: | :---: | :---: |
| **Manage Users & Departments** | ✅ | ❌ | ❌ | ❌ | ❌ |
| **Register & Retire Assets** | ✅ | ✅ | ❌ | ❌ | ❌ |
| **Deploy & Check Out Devices** | ✅ | ✅ | ✅ | ❌ | ❌ |
| **Log Maintenance & Swap Parts** | ✅ | ✅ | ✅ | ❌ | ❌ |
| **Record Stock Movements** | ✅ | ✅ | ✅ | ❌ | ❌ |
| **Export Master Excel Workbooks** | ✅ | ✅ | ❌ | ❌ | ✅ |
| **Bulk Import CSV Assets** | ✅ | ✅ | ❌ | ❌ | ❌ |
| **View Assigned Hardware (Self)**| ✅ | ✅ | ✅ | ✅ | ✅ |
| **Trigger Warranty Audit Scan** | ✅ | ✅ | ❌ | ❌ | ❌ |

---

## Quickstart Guide

### 1. Prerequisites
- **Node.js**: v18.x or v20.x or v24.x LTS
- **MongoDB**: v6.x or v7.x running locally on `mongodb://localhost:27017`

### 2. Installation
```bash
# Clone the repository
git clone <repository-url>
cd AssetTrack

# Install server dependencies
cd server
npm install

# Install client dependencies
cd ../client
npm install
```

### 3. Running Backend Tests (Vitest)
```bash
cd server
npm test
# Result: 8 passed (8), 55 passed (55)
```

### 4. Starting the Application
```bash
# Terminal 1: Start Backend API (Port 5000)
cd server
npm run dev

# Terminal 2: Start Frontend Client (Port 5173)
cd client
npm run dev
```

Visit `http://localhost:5173` in your browser.

---

## Project Structure

```
AssetTrack/
├── DECISIONS.md                   # Architecture & Decision Governance (13 Confirmed)
├── IMPACT-MAP.md                  # Blast Radius & Service Interaction Topology
├── GITHUB_REPOSITORIES.md         # Integrated Tooling & Repositories Guide
├── AGENTS.md / GEMINI.md          # Master Autonomous Engineering Contracts
├── security/                      # Threat Modeling, Attack Surface & Secret Policies
│   ├── threat-model.md
│   ├── secrets.md
│   ├── attack-surface.md
│   └── security-checklist.md
├── server/                        # Node.js + Express + Mongoose Backend
│   ├── src/
│   │   ├── config/                # Environment, constants, MongoDB connection
│   │   ├── models/                # 11 Mongoose Schemas (Asset, Org, User, etc.)
│   │   ├── controllers/           # Route controller handlers
│   │   ├── services/              # Core business logic & integrations
│   │   ├── routes/                # Express API routes mounted under /api/v1
│   │   ├── middleware/            # JWT protect, RBAC authorize, error handlers
│   │   ├── jobs/                  # Automated warranty & stock audit cron daemon
│   │   └── utils/                 # Tag generator, PDFKit engine, logger, AppError
│   └── tests/                     # 8 Vitest integration test suites (55 tests)
└── client/                        # React 18 + Vite + Tailwind CSS Frontend
    ├── src/
    │   ├── components/            # Layout (Navbar, Sidebar, NotificationDrawer)
    │   ├── features/              # Assets, QR, Assignments, Maintenance, Inventory
    │   ├── pages/                 # Full responsive views (Dashboard, Assets, etc.)
    │   ├── services/              # Axios API client with interceptors
    │   └── store/                 # Zustand stores (AuthStore, ThemeStore)
    └── package.json
```

---

## Documentation Index

- [Installation & Environment Guide](file:///e:/vs%20code/All%20Main%20Main%20Projects/AssetTrack/INSTALLATION.md)
- [System Architecture & Topologies](file:///e:/vs%20code/All%20Main%20Main%20Projects/AssetTrack/ARCHITECTURE.md)
- [Database Schema & Data Models](file:///e:/vs%20code/All%20Main%20Main%20Projects/AssetTrack/DATABASE_SCHEMA.md)
- [REST API Contract Documentation](file:///e:/vs%20code/All%20Main%20Main%20Projects/AssetTrack/API_DOCUMENTATION.md)
- [Hardware Specifications Guide](file:///e:/vs%20code/All%20Main%20Main%20Projects/AssetTrack/HARDWARE_SPECIFICATIONS.md)
- [Asset Lifecycle & State Transitions](file:///e:/vs%20code/All%20Main%20Main%20Projects/AssetTrack/ASSET_LIFECYCLE.md)
- [Inventory & Spare Parts Operations](file:///e:/vs%20code/All%20Main%20Main%20Projects/AssetTrack/INVENTORY_OPERATIONS.md)
- [Testing & Quality Assurance Guide](file:///e:/vs%20code/All%20Main%20Main%20Projects/AssetTrack/TESTING.md)
- [Production Deployment & DevOps](file:///e:/vs%20code/All%20Main%20Main%20Projects/AssetTrack/DEPLOYMENT.md)
