# Enterprise Security Checklist & Audit (security-checklist.md)

**System:** AssetTrack (Enterprise IT Asset & Hardware Inventory Management System)  
**Standard:** OWASP Top 10 API Security, CIS Benchmark, Enterprise Physical IT Defense  
**Scope:** Complete Codebase, Mongoose Schemas, REST Endpoints, QR Barcode Subsystem, Excel Ingestion.

---

## 1. Security Domain Checklist

### 1. Authentication
- [x] Passwords hashed with Bcrypt (minimum 12 salt rounds).
- [x] Password complexity enforced on registration (min 8 chars, uppercase, lowercase, numbers, symbols).
- [x] Brute-force protection on login (max 5 failed attempts per 15-minute window).
- [ ] Multi-Factor Authentication (MFA / TOTP) support for Org Admins *(Recommendation)*.

### 2. Authorization / RBAC
- [x] 5-Tier explicit role-based access control (Admin, Asset Manager, Technician, Employee, Auditor).
- [x] Administrative endpoints protected with `requireRoles(['Admin'])`.
- [x] Technicians restricted from modifying specs outside authorized maintenance repair tickets.
- [x] Employee access restricted to viewing assigned hardware and filing repair requests.

### 3. Session & Token Security
- [x] JWT tokens signed with strong HMAC SHA-256 secret (`JWT_SECRET`).
- [x] Tokens delivered via `HttpOnly`, `SameSite=Strict`, `Secure` cookies.
- [x] Explicit token expiration enforced (`JWT_EXPIRES_IN=7d`).
- [ ] Server-side token invalidation / blocklist on logout *(Missing control)*.

### 4. Input Validation & Strict Typing
- [x] Zod validation middleware deployed across all API endpoints.
- [x] Hardware specifications strictly validated (disallowing unmodeled fields via `.strict()`).
- [x] Non-negative constraints enforced on RAM capacity, disk size, and monetary values.
- [x] Unique asset tag formatting validated via regex (`^AT-[0-9]{4}-[0-9]{4,}$`).

### 5. Injection Prevention (NoSQL, SQL & Command)
- [x] Express body parser sanitized to prevent NoSQL operator injection (`$gt`, `$ne`, `$where`).
- [x] Mongoose models enforce schema typing on all parameters.
- [x] Zero system command executions (`child_process.exec`) with unsanitized user inputs.

### 6. Cross-Site Scripting (XSS) & CSRF
- [x] DOMPurify sanitization applied to user-generated markdown notes and repair logs.
- [x] React JSX automatic string escaping protects client DOM.
- [x] SameSite cookie policy mitigates Cross-Site Request Forgery (CSRF).

### 7. API Security & BOLA/IDOR Defense
- [x] Universal multi-tenant isolation enforced via `{ organizationId: req.user.organizationId }`.
- [x] Cross-tenant asset tampering rejected with `403 Forbidden` or `404 Not Found`.
- [x] Compound unique indexes enforce tenant boundary at database engine level.

### 8. Rate Limiting & Abuse Prevention
- [x] Global rate limiter deployed (100 requests / 15 minutes per IP).
- [x] Strict auth rate limiter deployed (5 requests / 15 minutes per IP).
- [x] Export endpoint rate limiter deployed to prevent ExcelJS/PDFKit resource exhaustion.

### 9. File Upload Security
- [x] Multer configured with strict MIME-type whitelist (`application/pdf`, `image/png`, `image/jpeg`).
- [x] File size capped at 10 MB.
- [x] Uploaded files stored with randomized filenames (`crypto.randomUUID()`) outside public web root.

### 10. Database Security
- [x] TLS/SSL encryption enforced on MongoDB connection transport.
- [x] User password hashes excluded from default Mongoose projections (`select: false`).
- [x] Atomic transactions / session locks prevent race conditions in hardware handovers.

### 11. Secrets Management
- [x] Zero hardcoded API keys, passwords, or JWT secrets in source code.
- [x] All configuration loaded via environment variables from `.env`.
- [x] `.env` and `.env.local` strictly excluded in `.gitignore`.

### 12. Encryption & Transit Security
- [x] HTTPS enforced via Helmet HSTS header (`Strict-Transport-Security: max-age=31536000`).
- [x] Cookies marked with `secure: true` in production environments.

### 13. CORS Configuration
- [x] CORS restricted to explicit whitelisted frontend domains (`BASE_URL`).
- [x] Wildcard CORS (`*`) strictly prohibited when credentials are enabled.

### 14. Dependency Security
- [x] Automated dependency vulnerability scanning (`npm audit`).
- [x] Lockfile committed (`package-lock.json`) for reproducible builds.

### 15. Logging, Monitoring & Auditability
- [x] Append-only `AuditLog` collection captures administrative actions and asset status shifts.
- [x] Application logs strip sensitive fields (passwords, JWT tokens, full card/bank numbers).

### 16. Physical QR Code Security
- [x] Physical QR labels contain only non-sensitive opaque tokens (`/q/AT-ORG-XXXX`).
- [x] Scanning physical QR barcode requires authenticated login before displaying internal specs.

### 17. Deployment & Infrastructure
- [x] Dockerfile / process manager executes as non-root user (`node`).
- [x] Production builds strip development source maps and debug routes.

### 18. Data Privacy & Compliance
- [x] Hardware inventory records comply with enterprise IT governance standards.
- [x] Employee assignment history tracks corporate property custody without storing personal PII.

### 19. Error Handling
- [x] Centralized Express error handler catches unhandled rejections.
- [x] Internal database stack traces masked in production JSON responses.

### 20. Backup & Disaster Recovery
- [x] Database architecture supports automated point-in-time snapshots.
- [x] Historical assignment records are immutable, preventing accidental data deletion.

---

## 2. Categorized Security Findings

### Missing Controls

#### Finding MC-01: Absence of Server-Side Token Revocation (Blacklist)
- **Severity:** Medium
- **Evidence:** `server/src/middleware/authMiddleware.js` (JWT verified statelessly).
- **Risk:** If a technician or administrator's device is stolen, an active JWT token remains valid until expiration (`7d`).
- **Affected Location:** `authMiddleware.js`, `authController.js`.
- **Why It Matters:** Enterprise ITAM systems handle high-value physical assets; compromised credentials must be revocable immediately.
- **Recommended Fix:** Implement Redis-backed token blacklist or store `tokenVersion` on the `User` schema, invalidating all tokens on password reset or explicit logout.

#### Finding MC-02: Absence of Photo Attachment for Physical Device Condition
- **Severity:** Low
- **Evidence:** `AssetAssignment` schema currently tracks condition as textual notes (`conditionAtHandover`, `conditionAtReturn`).
- **Risk:** Employees may dispute condition notes regarding physical screen cracks or liquid damage without photographic evidence.
- **Affected Location:** `AssetAssignment.js`, `assignmentController.js`.
- **Why It Matters:** Non-repudiation in enterprise hardware custody disputes.
- **Recommended Fix:** Add optional `handoverPhotos: [String]` and `returnPhotos: [String]` array fields to `AssetAssignment`, linked to secure Multer upload.

---

### Security Weaknesses

#### Finding SW-01: Startup Environment Variable Assertion Missing
- **Severity:** Low
- **Evidence:** `server/src/index.js` boots using `process.env.JWT_SECRET` without asserting minimum entropy.
- **Risk:** Inexperienced administrators might deploy production with weak default secrets ("secret123").
- **Affected Location:** `server/src/index.js`, `server/src/config/db.js`.
- **Why It Matters:** Weak JWT secrets are susceptible to offline dictionary brute-force attacks.
- **Recommended Fix:** Add mandatory pre-flight check on boot:
  ```javascript
  if (!process.env.JWT_SECRET || process.env.JWT_SECRET.length < 32) {
    throw new Error('FATAL: JWT_SECRET must be at least 32 characters long');
  }
  ```

---

### Confirmed Protections & Mitigations

1. **Confirmed Multi-Tenant Boundary:** Every single database query strictly enforces `{ organizationId: req.user.organizationId }`, mitigating BOLA/IDOR vulnerabilities (`DEC-007`).
2. **Confirmed Physical Barcode Privacy:** QR codes contain only opaque URL references and never print sensitive employee names or internal IP subnets on physical labels (`DEC-004`).
3. **Confirmed Immutable History:** Asset custody handovers and hardware component swaps are strictly append-only, ensuring forensic integrity (`DEC-003`, `DEC-005`).
4. **Confirmed NoSQL Defense:** All hardware specs and status fields are guarded by Zod validation, rejecting unknown operator fields (`DEC-009`).
