# Threat Model Analysis (threat-model.md)

**System:** AssetTrack (Enterprise IT Asset & Hardware Inventory Management System)  
**Methodology:** STRIDE (Spoofing, Tampering, Repudiation, Information Disclosure, Denial of Service, Elevation of Privilege)  
**Scope:** Client SPA (React 18 + Vite), Mobile Camera QR Scanner (`html5-qrcode`), REST API Gateway (Node.js / Express), Barcode/Label Synthesis Engine (`qrcode`, `pdfkit`), Persistence Tier (MongoDB 7.x).

---

## 1. System Assets

| Asset ID | Asset Name | Description & Classification |
| :--- | :--- | :--- |
| **AST-01** | **User Credentials & Auth Tokens** | Bcrypt password hashes, active JWT tokens stored in HttpOnly secure cookies. *(Confidential / Critical)* |
| **AST-02** | **Physical Hardware Inventory** | Serialized enterprise laptops, desktops, servers, switches, and deep component specs (CPU, RAM, NVMe/SATA). *(Confidential / High)* |
| **AST-03** | **Employee Chain of Custody Trail** | Historical `AssetAssignment` records tracking who held what laptop, handover dates, and condition reports. *(Integrity / Critical)* |
| **AST-04** | **Component Evolution Ledger** | `ComponentChange` records tracking RAM/SSD swaps, serial replacements, and technician accountability. *(Integrity / High)* |
| **AST-05** | **Consumables Stock Ledger** | Spare parts inventory counts (RAM sticks, cables, thermal paste) and audited movement logs. *(Integrity / High)* |
| **AST-06** | **Purchase & Warranty Contracts** | Vendor invoices, purchase prices, depreciation values, and AMC contracts. *(Confidential / High)* |
| **AST-07** | **Physical QR Barcode Labels** | Printed physical labels affixed to equipment; must not leak internal network parameters or employee identities. *(Confidential / High)* |
| **AST-08** | **System Audit Logs** | Append-only forensic `AuditLog` records of all administrative actions. *(Integrity / Critical)* |

---

## 2. Trust Boundaries

```
[ Public Internet / Untrusted Client Browser / Mobile Camera Scanner ]
                     │  (HTTPS / TLS 1.3)
                     ▼
┌────────────────────────────────────────────────────────────────────────┐
│ Trust Boundary 1: API Gateway & Security Ingress                       │
│ - Helmet Security Headers (HSTS, CSP, X-Frame-Options)                 │
│ - Express Rate Limiting (Brute-Force & Scrape Defense)                 │
│ - CORS Origin Validation (Whitelisted SPA Domains Only)                │
└────────────────────────────────────┬───────────────────────────────────┘
                                     │  (HttpOnly SameSite JWT Cookie)
                                     ▼
┌────────────────────────────────────────────────────────────────────────┐
│ Trust Boundary 2: Application Layer & Multi-Tenant Scoping             │
│ - JWT Authentication Middleware (`req.user`)                           │
│ - Strict Tenant Boundary Enforcement (`organizationId: req.user.orgId`)│
│ - 5-Tier RBAC Guards (`requireRoles(['Admin', 'Asset Manager'])`)      │
│ - Zod Hardware Schema Validation (Integer GB, Valid MAC/IP formats)    │
│ - DOMPurify Text Sanitization (Condition Notes, Diagnostic Logs)       │
└────────────────────────────────────┬───────────────────────────────────┘
                                     │  (Encrypted Internal Mongoose Connection)
                                     ▼
┌────────────────────────────────────────────────────────────────────────┐
│ Trust Boundary 3: Data Persistence Tier (MongoDB 7.x)                  │
│ - Compound Unique Indexing (`{ organizationId: 1, assetTag: 1 }`)      │
│ - Immutable Append-Only Ledger (`AssetAssignment`, `ComponentChange`)  │
│ - Atomic Session Transactions for Handovers and Part Consumption       │
└────────────────────────────────────┬───────────────────────────────────┘
                                     │
                                     ▼
┌────────────────────────────────────────────────────────────────────────┐
│ Trust Boundary 4: Physical Hardware & Barcode Interface                │
│ - Opaque QR Payloads (`/q/AT-ORG-XXXX`) without embedded credentials   │
│ - Authentication barrier required before displaying hardware specs     │
└────────────────────────────────────────────────────────────────────────┘
```

---

## 3. Threat Actors

| Actor ID | Actor Class | Motivation & Capability |
| :--- | :--- | :--- |
| **ACT-01** | **External Anonymous Attacker** | Opportunistic attacker attempting credential stuffing, brute-force logins, physical QR scanning to discover network IPs, or API abuse. |
| **ACT-02** | **Malicious Authenticated User (Tenant)** | Authenticated user from Tenant A attempting BOLA/IDOR attacks to view or tamper with Tenant B's hardware inventory or employee custody records. |
| **ACT-03** | **Rogue Employee** | End-user attempting to deny possession of a damaged or missing laptop by manipulating assignment records. |
| **ACT-04** | **Rogue Technician** | Hardware technician attempting untracked component cannibalization (stealing 32GB RAM sticks or swapping high-grade NVMe drives with degraded drives). |
| **ACT-05** | **Physical Office Visitor / Cleaner** | Physical passerby using a smartphone camera to scan QR barcodes on unattended laptops to extract corporate employee info or network topography. |

---

## 4. Entry Points

1. `POST /api/v1/auth/login` & `POST /api/v1/auth/register` (Public ingress).
2. `GET /api/v1/assets/scan/:qrRef` (Physical QR barcode resolution).
3. `POST /api/v1/assets` & `PATCH /api/v1/assets/:id` (Hardware spec intake).
4. `POST /api/v1/assignments` & `POST /api/v1/assignments/:id/return` (Custody handovers).
5. `POST /api/v1/maintenance/:id/component-change` (Hardware modification).
6. `POST /api/v1/stock/movements` (Spare parts intake and issuance).
7. `GET /api/v1/reports/export` (Bulk Excel report streaming).
8. Physical QR Barcodes on hardware casings.

---

## 5. Threats (STRIDE Classification)

### S — Spoofing Identity
- **Threat:** Attacker crafts counterfeit JWT tokens or brute-forces technician credentials to authorize component swaps.
- **Risk Severity:** High.
- **Existing Mitigations:** Bcrypt password hashing (12 rounds), HttpOnly SameSite JWT cookies, login rate limiting (5 attempts/15 mins).
- **Missing Mitigations:** Multi-Factor Authentication (MFA / TOTP) for administrative accounts; JWT token revoking via Redis blocklist.

### T — Tampering with Data
- **Threat:** Malicious technician swaps RAM/SSD and manually deletes the `ComponentChange` record or edits `Asset.specifications` directly.
- **Risk Severity:** High.
- **Existing Mitigations:** `ComponentChange` schema is append-only; specification updates are permitted only via authorized maintenance actions; system audit logs record all mutations.
- **Missing Mitigations:** Cryptographic hash chaining on `AuditLog` documents to detect manual MongoDB shell edits.

### R — Repudiation
- **Threat:** Employee claims they never received a laptop or returned it in pristine condition despite severe physical liquid damage.
- **Risk Severity:** High.
- **Existing Mitigations:** Immutable `AssetAssignment` records track `assignedAt`, `conditionAtHandover`, checklist of accessories, and `conditionAtReturn` with technician signatures.
- **Missing Mitigations:** Digital signature or photo upload attachment of device condition during handover.

### I — Information Disclosure
- **Threat:** Attacker scans physical QR labels on laptops in an airport or coffee shop to read corporate employee names, IP addresses, or MAC addresses.
- **Risk Severity:** Critical.
- **Existing Mitigations:** Non-sensitive opaque QR payloads (`DEC-004`). QR codes contain only opaque tokens; server enforces authentication before revealing hardware specs.
- **Missing Mitigations:** Dynamic expiring QR tokens for ultra-high-security environments.

### D — Denial of Service
- **Threat:** Attacker uploads massive CSV inventory dumps or floods Excel export endpoints, exhausting server RAM and disk I/O.
- **Risk Severity:** Medium.
- **Existing Mitigations:** Multer file size limits (10MB), Express rate limiting (100 req/15 mins per IP), ExcelJS streaming writer instead of in-memory buffering.
- **Missing Mitigations:** Dedicated background queue worker (BullMQ / RabbitMQ) for massive bulk imports exceeding 10,000 assets.

### E — Elevation of Privilege
- **Threat:** An Employee crafts an API request to `POST /api/v1/assets/:id/retire` or changes their own user role to `Org Admin`.
- **Risk Severity:** Critical.
- **Existing Mitigations:** Strict RBAC middleware (`requireRoles(['Admin', 'Asset Manager'])`); Zod schemas disallow `role` mutation on user profile updates.
- **Missing Mitigations:** Periodic role auditing scripts and dual-administrator authorization for asset disposal.

---

## 6. Attack Scenarios & Risk Matrix

| Attack Scenario | Threat Category | Likelihood | Impact | Risk Severity | Mitigations Status |
| :--- | :--- | :---: | :---: | :---: | :--- |
| **Cross-Tenant Asset Tampering (BOLA)** | Elevation of Privilege | Low | Critical | **HIGH** | Mitigated via universal `organizationId` scoping on all Mongoose queries (`DEC-007`). |
| **Physical Barcode Reconnaissance** | Information Disclosure | High | High | **HIGH** | Mitigated via opaque token architecture; scan requires authentication (`DEC-004`). |
| **Unrecorded Hardware Theft (RAM Cannibalization)** | Tampering | Medium | High | **HIGH** | Mitigated via mandatory `ComponentChange` logging linked to maintenance repair tickets (`DEC-005`). |
| **Double Assignment Race Condition** | Tampering / Logic | Low | Medium | **MEDIUM** | Mitigated via atomic state machine status checks (`status === 'Available'`) (`DEC-003`). |
| **Negative Spare Parts Stock Exploitation** | Integrity / Tampering | Low | Medium | **MEDIUM** | Mitigated via atomic `$inc` with non-negative constraints in `StockMovement` service (`DEC-006`). |

---

## 7. Security Action Items & Recommendations

1. **Short-Term (P0):** Enforce strict Zod validation on all hardware nested objects to prevent operator injection.
2. **Medium-Term (P1):** Implement camera stream encryption and digital image capture for physical device condition handovers.
3. **Long-Term (P2):** Integrate WebAuthn/FIDO2 hardware security keys for IT Asset Manager and Administrator authentications.
