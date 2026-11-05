# AssetTrack — Installation & Setup Guide

This document provides complete instructions for provisioning, configuring, and running **AssetTrack** in development, testing, and production environments across Windows, Linux, and macOS.

---

## 1. System Requirements

| Component | Minimum Specification | Recommended Specification |
| :--- | :--- | :--- |
| **Node.js** | v18.18.0 LTS | v24.x LTS / v20.x LTS |
| **npm** | v9.x | v10.x / v11.x |
| **MongoDB** | v6.0 Community Edition | v7.0 Enterprise or Atlas Cluster |
| **RAM** | 4 GB | 8 GB+ |
| **Storage** | 1 GB free space | 10 GB+ SSD |
| **OS** | Windows 10/11, Ubuntu 22.04 LTS, macOS Ventura+ | Windows 11 / Linux Server |

---

## 2. Environment Configuration

### Backend (`server/.env`)
Copy `server/.env.example` to `server/.env`:
```bash
cp server/.env.example server/.env
```

Review and configure the variables:
```env
# Runtime Environment
NODE_ENV=development
PORT=5000

# Database Persistence
MONGODB_URI=mongodb://localhost:27017/assettrack

# Security Secrets (Must be min 32 characters in production)
JWT_SECRET=super_secret_jwt_key_assettrack_enterprise_2026_production_grade
JWT_EXPIRES_IN=7d
COOKIE_SECRET=super_secure_cookie_secret_assettrack_production_2026

# Gateway CORS Whitelist
CLIENT_URL=http://localhost:5173
```

---

## 3. Dependency Installation

### Step 1: Install Backend Packages
```bash
cd server
npm install
```
Installed core libraries:
- `express` (Web framework)
- `mongoose` (MongoDB Object Modeling)
- `jsonwebtoken` & `bcryptjs` (Cryptographic authentication)
- `zod` (Input boundary validation)
- `qrcode` & `pdfkit` (Label generation & vector printing)
- `exceljs` & `papaparse` (Streaming exports & CSV ingestion)
- `node-cron` (Automated warranty & inventory auditing)
- `vitest` & `supertest` (Testing suite)

### Step 2: Install Frontend Packages
```bash
cd ../client
npm install
```
Installed client libraries:
- `react` & `react-dom` (UI Library)
- `vite` (Lightning build tool)
- `@tanstack/react-query` (Data synchronization & cache)
- `zustand` (Lightweight state management)
- `tailwindcss` (Utility CSS styling)
- `lucide-react` (Accessible iconography)
- `recharts` (Responsive SVG charts)
- `html5-qrcode` (Webcam & mobile camera QR scanning)

---

## 4. Database Setup & Initialization

Ensure your local MongoDB daemon is running:
- **Windows (PowerShell as Admin):**
  ```powershell
  Get-Service MongoDB
  # If stopped:
  Start-Service MongoDB
  ```
- **Linux (systemd):**
  ```bash
  sudo systemctl status mongod
  # If stopped:
  sudo systemctl start mongod
  ```
- **macOS (Homebrew):**
  ```bash
  brew services start mongodb-community@7.0
  ```

---

## 5. Automated Verification (Test Suite)

Execute the full Vitest integration suite:
```bash
cd server
npm test
```

Expected Output:
```
 ✓ tests/security.test.js (6 tests)
 ✓ tests/assignments.test.js (7 tests)
 ✓ tests/auth.test.js (9 tests)
 ✓ tests/taxonomy.test.js (7 tests)
 ✓ tests/maintenanceStock.test.js (8 tests)
 ✓ tests/assets.test.js (9 tests)
 ✓ tests/health.test.js (3 tests)
 ✓ tests/reports.test.js (6 tests)

 Test Files  8 passed (8)
      Tests  55 passed (55)
```

---

## 6. Running Development Services

Start both servers concurrently in separate terminal sessions:

### Terminal 1: Backend Server
```bash
cd server
npm run dev
```
Server outputs:
```
[INFO]: 🚀 AssetTrack Server running in development mode on port 5000
[INFO]: 📡 API Health Check: http://localhost:5000/api/v1/health
[INFO]: [WarrantyScheduler] Background audit daemon initialized (0 0 * * *)
```

### Terminal 2: Frontend Client
```bash
cd client
npm run dev
```
Client outputs:
```
  VITE v6.0.11  ready in 450 ms

  ➜  Local:   http://localhost:5173/
  ➜  Network: use --host to expose
```

---

## 7. Verifying the Production Client Build

To verify that the frontend compiles cleanly for production:
```bash
cd client
npm run build
```
The optimized bundle will be generated in `client/dist/`.
