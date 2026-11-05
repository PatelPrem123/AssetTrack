# Attack Surface Mapping (attack-surface.md)

**System:** AssetTrack (Enterprise IT Asset & Hardware Inventory Management System)  
**Maintained For:** Senior Security Reviewers, Penetration Testers, DevOps Engineers  
**Architecture Scope:** Ingress Gateway, REST API (`/api/v1`), Static Web Assets, Mobile QR Scanner, MongoDB Persistence.

---

## 1. Public Ingress & Unauthenticated Endpoints

| Endpoint Route | HTTP Method | Expected Input Payload | Function & Risk Surface | Protection Mechanism |
| :--- | :---: | :--- | :--- | :--- |
| `/api/v1/health` | `GET` | None | Service liveness probe. | Express rate limiting; returns only `{ status: 'OK' }` without system metrics. |
| `/api/v1/auth/login` | `POST` | `{ email, password }` | Authenticates user and issues JWT. Attack surface: Credential stuffing & brute force. | Strict rate limiter (5 req / 15 min per IP), Zod email validation, Bcrypt constant-time comparison. |
| `/api/v1/auth/register` | `POST` | `{ orgName, orgCode, email, password }` | Registers root organization administrator. | Public registration can be restricted or protected with administrative invitation tokens. |
| `/api/v1/assets/scan/:qrRef` | `GET` | URL param `:qrRef` | Scanned QR label endpoint. Unauthenticated callers are challenged for login. | Returns 401 with redirect header if no active JWT session exists (`DEC-004`). |

---

## 2. Authenticated Endpoints & RBAC Authorization Surfaces

All endpoints below require valid `Bearer <JWT>` or signed HttpOnly JWT cookie, and enforce multi-tenant isolation via `{ organizationId: req.user.organizationId }`.

| Endpoint Group | Permitted Roles | Sensitivity | Vulnerability Target | Security Defense |
| :--- | :--- | :---: | :--- | :--- |
| `POST /api/v1/assets` | Admin, Asset Manager | High | Malformed hardware payloads, duplicate tags | Zod deep schema validation, compound unique index on `{ organizationId, assetTag }`. |
| `PATCH /api/v1/assets/:id` | Admin, Asset Manager | High | Unauthorized status changes | State machine lifecycle guard (`DEC-001`, `DEC-003`). |
| `POST /api/v1/assets/:id/retire` | Admin, Asset Manager | Critical | Premature asset scrapping | Explicit audit log generation, status transition check. |
| `POST /api/v1/assignments` | Admin, Asset Manager | Critical | Double-assignment of in-use hardware | State check (`status === 'Available'`), atomic MongoDB transaction. |
| `POST /api/v1/assignments/:id/return` | Admin, Asset Manager | Critical | Condition tampering | Mandatory `conditionAtReturn` recording, immutable assignment history. |
| `POST /api/v1/maintenance/:id/component-change` | Admin, Asset Manager, Tech | High | Untracked component theft | Atomic sync between `ComponentChange`, `Asset.specifications`, and `StockMovement`. |
| `POST /api/v1/stock/movements` | Admin, Asset Manager, Tech | High | Negative inventory balance manipulation | Atomic `$inc` with non-negative stock verification. |
| `GET /api/v1/reports/export` | Admin, Asset Manager, Auditor | High | Memory exhaustion DoS | Streaming ExcelJS pipeline, rate limited. |
| `GET /api/v1/users` | Org Admin | Critical | Privilege escalation & account hijacking | Role gate `requireRoles(['Admin'])`, password hashes omitted from projections. |

---

## 3. User Input & Validation Surfaces

| Input Channel | Location | Input Type | Potential Vulnerability | Validation & Mitigation |
| :--- | :--- | :--- | :--- | :--- |
| **Hardware Specs** | `POST /api/v1/assets` | Nested JSON object | NoSQL injection, negative values, type pollution | Zod schema with `.strict()`, rejecting unmodeled keys; integer core/RAM constraints. |
| **Asset Tags & Serials** | Asset intake form | Strings | XSS, SQL/NoSQL operator injection (`{ $ne: null }`) | Regex validation `^[A-Z0-9_-]+$`; Mongo sanitization. |
| **Condition & Repair Notes** | Handover / Maintenance forms | Free text / Markdown | Stored Cross-Site Scripting (XSS) | DOMPurify sanitization before database persistence. |
| **QR Barcode Scan Input** | Camera scanner / USB reader | Alphanumeric string | Format string exploits, path traversal | Strict regex token match `^[A-Za-z0-9_-]+$`. |

---

## 4. File Upload & Document Storage Surface

| Surface | Allowed Types | Max Size | Storage Destination | Security Controls |
| :--- | :--- | :---: | :--- | :--- |
| **Purchase Invoices & Receipts** | `.pdf`, `.png`, `.jpg` | 10 MB | Dedicated secure upload folder / S3 bucket | Multer file type filtering (magic bytes), filename randomization (`crypto.randomUUID()`), non-executable storage directory. |
| **Bulk CSV/Excel Inventory Import**| `.csv`, `.xlsx` | 15 MB | Ephemeral disk memory | Streaming parsing with Papa Parse / ExcelJS, formula injection sanitization (`DEC-006`). |

---

## 5. Database Access & Persistence Surface

- **Driver:** Mongoose ODM on MongoDB 7.x.
- **Connection Transport:** TLS/SSL encrypted connection to MongoDB cluster.
- **Query Hardening:**
  - Every controller query mandates `{ organizationId: req.user.organizationId }`.
  - Disallows `$where`, `$regex` without length limits, and raw `req.body` injection into query operators.
  - Projection restrictions: User password hashes (`password`) are globally omitted via `select: false`.

---

## 6. Physical & Barcode Attack Surface

- **Physical Equipment Labels:** Barcode stickers affixed to laptops and servers.
- **Information Leakage Defense:** Labels display only human-readable Asset Tag (`AT-2026-0042`), Serial Number, and an opaque QR code URL (`DEC-004`).
- **Network Reconnaissance Defense:** Zero IP addresses, Wi-Fi passwords, internal subnet routes, or employee details are printed on physical labels.

---

## 7. Dependencies & External Surface

| Dependency Category | Core Packages | Attack Surface | Mitigation |
| :--- | :--- | :--- | :--- |
| **Web Server & Routing** | `express`, `helmet`, `cors`, `cookie-parser` | HTTP protocol vulnerabilities, header injection | Helmet security headers enabled, CORS restricted to verified origins. |
| **Authentication & Tokens**| `jsonwebtoken`, `bcryptjs` | Algorithm downgrade attacks, timing attacks | Hardcoded `algorithm: 'HS256'`, constant-time Bcrypt comparisons. |
| **Data Parsing & Generation**| `zod`, `qrcode`, `exceljs`, `pdfkit`, `multer` | Prototype pollution, DoS via oversized files | Zod strict mode, streaming file writers, Multer size caps. |
| **Client UI & Scanning** | `react`, `vite`, `html5-qrcode`, `tanstack/react-query` | XSS, DOM injection, camera permission abuse | React automatic JSX escaping, DOMPurify, explicit camera permissions. |
