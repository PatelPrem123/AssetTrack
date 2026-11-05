# Architecture & Project Decisions (DECISIONS.md)

**Project:** AssetTrack (Enterprise IT Asset & Hardware Inventory Management System)  
**Maintained For:** Senior Engineers, Software Architects, AI Coding Agents, QA Engineers, Security Reviewers  
**Document Version:** 1.0.0  
**Repository State:** Verified against `AssetTrack_Comprehensive_Documentation.md`  

---

## Purpose

This document records and preserves foundational architectural, technical, security, hardware modeling, API, infrastructure, and business-logic decisions for **AssetTrack**. Its primary objective is to guarantee that future developers, system maintainers, and autonomous AI coding agents do not repeatedly re-infer, contradict, or accidentally dismantle intentionally chosen ITAM engineering patterns.

---

## Rules for Future AI Agents

1. **Mandatory Pre-Flight Read:** Always consult this document before proposing, designing, or implementing architecture-level or inventory-level changes.
2. **Treat "CONFIRMED" Decisions as Hard Constraints:** Never bypass or contradict a `CONFIRMED` decision without explicit human review and approval.
3. **Structured Hardware Non-Negotiable:** Under no circumstance shall hardware specifications (CPU, RAM, Storage, Network MACs) be collapsed into unstructured string blobs (`DEC-002`). Granular schema arrays must be preserved.
4. **Preserve Immutable Chain of Custody:** Never overwrite or delete historical asset assignment records when a device is returned or transferred (`DEC-003`).
5. **No Sensitive Data on Physical QR Tags:** QR code payloads must remain opaque URL references (`/q/AT-...`) and never embed employee names, IP addresses, or internal configurations (`DEC-004`).
6. **Automatic Component Evolution Synchronization:** Any component replacement logged in `ComponentChange` must atomically synchronize the parent `Asset.specifications` and deduct spare parts from the `StockMovement` ledger (`DEC-005`).
7. **Strict Multi-Tenant Scoping:** Every database query, mutation, and aggregation must strictly enforce `{ organizationId: req.user.organizationId }` (`DEC-007`).
8. **Preserve Rationale:** When modifying or superseding an architecture decision, preserve the historical entry, mark it as `SUPERSEDED`, and cross-reference the replacement.
9. **No Speculative Fabrications:** Only document decisions supported by repository evidence. If evidence is lacking, label the item as `INFERRED — NOT CONFIRMED`.

---

## Decision Index

| ID | Decision Name | Status | Area |
| :--- | :--- | :---: | :--- |
| **DEC-001** | Decoupled Modern ITAM Architecture (React 18 SPA + Node.js Express REST API v1 + MongoDB 7.x) | CONFIRMED | Architecture |
| **DEC-002** | Structured Multi-Module Hardware Specifications (Granular CPU, RAM Array, NVMe/SATA Array, MACs) | CONFIRMED | Data Model / Hardware |
| **DEC-003** | Immutable Employee Chain of Custody (`AssetAssignment` Historical Ledger) | CONFIRMED | Business Logic / Audit |
| **DEC-004** | Non-Sensitive Opaque QR Code Engine & Role-Tailored Scanning Triage | CONFIRMED | Security / QR Engine |
| **DEC-005** | Audited Component Evolution Tracking (`ComponentChange` & Automatic Spec Synchronization) | CONFIRMED | Hardware / Inventory |
| **DEC-006** | Dual-Tier Inventory Separation: Serialized Fixed Assets vs Consumable Stock Ledger | CONFIRMED | Database / Inventory |
| **DEC-007** | Strict Multi-Tenant Enterprise Isolation & Compound Indexing (`organizationId: req.user.organizationId`) | CONFIRMED | Security / Auth |
| **DEC-008** | Strict 5-Tier Role-Based Access Control (Admin, Manager, Technician, Employee, Auditor) | CONFIRMED | Security / RBAC |
| **DEC-009** | Dual-Layer Validation & Sanitization (Zod Schema Validation + NoSQL Injection Defense) | CONFIRMED | Security / API |
| **DEC-010** | Automated Background Warranty Expiry & Low-Stock Alert Daemons | CONFIRMED | Backend / Scheduling |
| **DEC-011** | Streaming ExcelJS Inventory Export & PDFKit Industrial Asset Label Generation | CONFIRMED | Reporting / Export |
| **DEC-012** | Forensic Append-Only System Audit Ledger (`AuditLog`) | CONFIRMED | Compliance / Security |
| **DEC-013** | Vitest and Supertest Automated Testing Suite with Isolated ITAM Test Fixtures | CONFIRMED | QA / Testing |

---

## Documented Architectural Decisions

### DEC-001 — Decoupled Modern ITAM Architecture (React 18 SPA + Node.js Express REST API v1 + MongoDB 7.x)
- **Status:** CONFIRMED
- **Date:** 2026-11-05
- **Area:** Architecture
- **Decision:** Architect AssetTrack as three decoupled tiers:
  1. Client Presentation Tier: React 18 SPA built with Vite, React Router v6, Tailwind CSS, TanStack Query, Zustand, html5-qrcode, and Recharts.
  2. Application & Gateway Tier: Node.js LTS with Express.js REST API (`/api/v1`), JWT authentication via HttpOnly cookies, Zod schema validation, qrcode generation engine, Multer file handling, ExcelJS workbook generation, and PDFKit printable label generation.
  3. Data Persistence Tier: MongoDB 7.x cluster with Mongoose ODM (Multi-tenant organization isolation, compound unique indexes, and atomic document updates).
- **Why:** Decouples high-density desktop asset grids and mobile QR camera scanning from the server API, enabling rapid field diagnostics for technicians on mobile browsers while maintaining centralized server-side access control.
- **Problem Solved:** Prevents monolithic server-rendered lag and enables offline-resilient caching of asset catalogs via TanStack Query.
- **Alternatives Considered:** Monolithic Next.js SSR; Python Django with PostgreSQL.
- **Why Alternatives Were Rejected:** A decoupled Vite + Express architecture provides instant mobile camera QR integration (`html5-qrcode`) and lightweight, predictable deployment across standard Node.js hosting environments.
- **Constraints:** All client-server communication must occur via authenticated HTTPS JSON endpoints under `/api/v1/*`.
- **Impact:** Entire repository structure (`client/`, `server/`).
- **Evidence:** `AssetTrack_Comprehensive_Documentation.md` (Chapter 2: High-Level System Topology & Architecture; Chapter 11).
- **Change Risk:** Critical. Changing tiers breaks the REST contract and API client integration.
- **Related Decisions:** DEC-004, DEC-007, DEC-011.

---

### DEC-002 — Structured Multi-Module Hardware Specifications (Granular CPU, RAM Array, NVMe/SATA Array, MACs)
- **Status:** CONFIRMED
- **Date:** 2026-11-05
- **Area:** Data Model / Hardware
- **Decision:** Hardware specifications must never be stored as generic free-text notes. AssetTrack codifies hardware components into structured Mongoose schema documents:
  - Processor: make, model, generation, physical cores, logical threads, base/boost GHz.
  - RAM Array: generation (DDR4/DDR5), form factor (DIMM/SODIMM), and installed modules array `[{ slot, capacityGb, speedMts, make, serial }]`.
  - Storage Array: drives array `[{ driveIndex, driveType, interface, capacityGb, make, model, serial, healthStatus }]`.
  - Motherboard & Networking: Ethernet MAC, Wi-Fi MAC, static/DHCP IP, switch port, link speed.
- **Why:** Unstructured text fields make it impossible to query inventory capabilities (e.g. "Find all laptops with DDR5 RAM and >16GB capacity eligible for Windows 11 upgrade") or detect missing RAM sticks and swapped drives during physical audits.
- **Problem Solved:** Eliminates spreadsheet ambiguity, unrecorded hardware cannibalization, and enables granular search and compliance reporting.
- **Alternatives Considered:** Single text field `specs: "Intel i7, 16GB RAM, 512GB SSD"`; Key-value metadata array `[{ key: 'ram', value: '16GB' }]`.
- **Why Alternatives Were Rejected:** Free-text cannot be indexed or validated. Key-value pairs lack schema validation and type safety, leading to data corruption and inconsistent units.
- **Constraints:** Zod schema validators must strictly validate nested hardware payloads on asset registration and updates.
- **Impact:** `Asset` model, `assetValidator.js`, `assetService.js`, `AssetDetailPage.jsx`.
- **Evidence:** `AssetTrack_Comprehensive_Documentation.md` (Chapter 4: Granular Hardware Specifications Architecture; Chapter 9).
- **Change Risk:** Critical. Flattening specs will break hardware search filters and upgrade history tracking.
- **Related Decisions:** DEC-005, DEC-009.

---

### DEC-003 — Immutable Employee Chain of Custody (`AssetAssignment` Historical Ledger)
- **Status:** CONFIRMED
- **Date:** 2026-11-05
- **Area:** Business Logic / Audit
- **Decision:** When an asset is assigned to an employee or returned to inventory, the system must never overwrite existing assignment records. It creates an explicit `AssetAssignment` record containing `assignedAt`, `conditionAtHandover`, accessories checklist, and expected return date. Upon return, the record is updated with `returnedAt`, `conditionAtReturn`, and return notes. The record is permanently preserved in the database.
- **Why:** Overwriting user assignment fields destroys the historical chain of custody. When a device is returned damaged, IT departments must know who possessed the device previously and what condition was certified at handover.
- **Problem Solved:** Guarantees an immutable, verifiable chain of custody for every enterprise asset throughout its operational lifecycle.
- **Alternatives Considered:** Storing only `currentAssignedTo` on the `Asset` document; Overwriting a single assignment document.
- **Why Alternatives Were Rejected:** Fails enterprise security and financial audits. Leaves zero evidence of prior custody or device mishandling.
- **Constraints:** Only assets with `status: 'Available'` can be assigned. If `status === 'Assigned'` or `'Under Repair'`, assignment requests must be rejected (`400 Bad Request`).
- **Impact:** `AssetAssignment` model, `assignmentService.js`, `assignmentController.js`, `AssetDetailPage.jsx`.
- **Evidence:** `AssetTrack_Comprehensive_Documentation.md` (Chapter 5: Asset Lifecycle State Machine & Chain of Custody).
- **Change Risk:** High. Any query mutating historical records destroys audit trail integrity.
- **Related Decisions:** DEC-001, DEC-008, DEC-012.

---

### DEC-004 — Non-Sensitive Opaque QR Code Engine & Role-Tailored Scanning Triage
- **Status:** CONFIRMED
- **Date:** 2026-11-05
- **Area:** Security / QR Engine
- **Decision:** Physical QR labels affixed to hardware must only encode non-sensitive opaque URL references (e.g. `https://assettrack.domain.com/q/AT-ORG01-0042`). The QR code payload must never embed employee names, network MACs, IP addresses, serial numbers, or internal credentials. Scanning the QR code prompts user authentication and serves role-tailored diagnostic views:
  - Employee: Basic asset info + "Report Malfunction" button.
  - Technician: Full CPU/RAM/SSD diagnostic specs + active repair tickets + component swap actions.
  - Asset Manager / Admin: Purchase prices, vendor invoices, warranty status, and reassignment controls.
- **Why:** Physical asset labels can be photographed or inspected by visitors, contractors, or unauthorized personnel. Embedding internal network parameters or user data into physical barcodes represents a severe information disclosure vulnerability.
- **Problem Solved:** Protects enterprise physical and network security while providing frictionless mobile camera triage for IT staff.
- **Alternatives Considered:** Embedding full JSON hardware payload directly in QR code; Public unprotected scan URLs.
- **Why Alternatives Were Rejected:** Barcode capacity limits; high risk of credential/data leakage if physical device is lost, stolen, or photographed.
- **Constraints:** Unauthenticated QR scans must return 401 and redirect to the secure login gateway.
- **Impact:** `qrService.js`, `assetController.js`, `ScannerPage.jsx`, `html5-qrcode`.
- **Evidence:** `AssetTrack_Comprehensive_Documentation.md` (Chapter 6: QR Code Engine & Mobile Scanning Triage; Chapter 12).
- **Change Risk:** Critical. Changing payload format invalidates printed physical QR labels.
- **Related Decisions:** DEC-001, DEC-007, DEC-008.

---

### DEC-005 — Audited Component Evolution Tracking (`ComponentChange` & Automatic Spec Synchronization)
- **Status:** CONFIRMED
- **Date:** 2026-11-05
- **Area:** Hardware / Inventory
- **Decision:** Every hardware component modification (RAM upgrade, SSD replacement, GPU change) must be recorded in an immutable `ComponentChange` ledger document linking `assetId`, `componentType`, `previousSpecification`, `newSpecification`, `technicianId`, and `maintenanceRecordId`. The service must atomically synchronize the parent `Asset.specifications` object and issue an audited `OUT` movement from the `StockMovement` ledger for consumed parts.
- **Why:** Untracked component cannibalization (stealing RAM or replacing high-grade NVMe SSDs with degraded drives) is a major vector of IT asset loss.
- **Problem Solved:** Maintains a permanent chronological upgrade history of the machine and prevents discrepancy between physical components and database records.
- **Alternatives Considered:** Manual manual edits to the asset's spec page by technicians without audit logging.
- **Why Alternatives Were Rejected:** Destroys forensic accountability. Prevents tracking which technician made the swap and which repair ticket authorized it.
- **Constraints:** Technicians may only alter hardware specifications as part of an authorized maintenance component replacement action.
- **Impact:** `ComponentChange` model, `maintenanceService.js`, `StockMovement` model, `Asset` model.
- **Evidence:** `AssetTrack_Comprehensive_Documentation.md` (Chapter 7: Maintenance, Repair Operations & Component Evolution).
- **Change Risk:** High. Spec desynchronization will cause inventory discrepancies.
- **Related Decisions:** DEC-002, DEC-006, DEC-012.

---

### DEC-006 — Dual-Tier Inventory Separation: Serialized Fixed Assets vs Consumable Stock Ledger
- **Status:** CONFIRMED
- **Date:** 2026-11-05
- **Area:** Database / Inventory
- **Decision:** AssetTrack enforces a strict architectural boundary between:
  1. Serialized Fixed Assets (`Asset`): Laptops, desktops, servers, managed switches with unique asset tags and serials.
  2. Bulk Consumables & Spare Parts (`StockItem` & `StockMovement`): Unserialized or bulk items (patch cables, thermal paste, replacement mice, spare RAM sticks) managed via an append-only ledger of `IN`, `OUT`, and `ADJUSTMENT` transactions.
- **Why:** Tracking 500 patch cables or tubes of thermal paste as individual serialized assets creates immense overhead. Conversely, treating laptops as bulk counts destroys individual chain of custody.
- **Problem Solved:** Optimizes inventory management workflows by matching the data model to physical inventory realities.
- **Alternatives Considered:** Unifying all items into a single `Asset` table with a `quantity` column.
- **Why Alternatives Were Rejected:** Degrades schema cleanliness; causes null-field bloat for bulk consumables and complicates QR tag generation.
- **Constraints:** Consumable stock quantities cannot drop below zero unless explicitly overridden by an administrator.
- **Impact:** `StockItem` model, `StockMovement` model, `inventoryService.js`, `InventoryPage.jsx`.
- **Evidence:** `AssetTrack_Comprehensive_Documentation.md` (Chapter 8: Consumables & Spare Parts Stock Movement Ledger).
- **Change Risk:** High. Merging schemas will disrupt stock calculations and asset assignment workflows.
- **Related Decisions:** DEC-002, DEC-005.

---

### DEC-007 — Strict Multi-Tenant Enterprise Isolation & Compound Indexing (`organizationId: req.user.organizationId`)
- **Status:** CONFIRMED
- **Date:** 2026-11-05
- **Area:** Security / Auth
- **Decision:** Every database collection (Assets, Assignments, Maintenance, Stock, Categories, Locations, Departments) must enforce multi-tenant organization scoping via `organizationId: req.user.organizationId`. Compound unique indexes such as `{ organizationId: 1, assetTag: 1 }` and `{ organizationId: 1, serialNumber: 1 }` must be registered on all tenant-specific tables.
- **Why:** In a multi-tenant enterprise system, a Broken Object Level Authorization (BOLA/IDOR) vulnerability could expose sensitive hardware architectures, employee assignments, and serial numbers across corporate boundaries.
- **Problem Solved:** Guarantees mathematical isolation of corporate hardware inventories and prevents asset tag collisions between independent organizations.
- **Alternatives Considered:** Separate database per tenant; Filter purely at application routing level.
- **Why Alternatives Were Rejected:** Database-per-tenant adds significant infrastructure complexity and connection pool overhead. Routing-level filtering without database-layer scoping invites catastrophic data leakage if an endpoint omits an authorization check.
- **Constraints:** All Mongoose query helpers and aggregation pipelines must include `organizationId: new ObjectId(req.user.organizationId)`.
- **Impact:** All 14 Mongoose models, all controllers, and authentication middleware.
- **Evidence:** `AssetTrack_Comprehensive_Documentation.md` (Chapter 9: Database Architecture; Chapter 12).
- **Change Risk:** Critical. Omitting `organizationId` results in immediate cross-tenant data exposure.
- **Related Decisions:** DEC-001, DEC-008, DEC-009.

---

### DEC-008 — Strict 5-Tier Role-Based Access Control (Admin, Manager, Technician, Employee, Auditor)
- **Status:** CONFIRMED
- **Date:** 2026-11-05
- **Area:** Security / RBAC
- **Decision:** Access permissions are partitioned into five explicit personas:
  1. `Org Admin`: Full authority over users, locations, departments, and organization profile.
  2. `IT Asset Manager`: Inventory intake, asset assignments, returns, QR label generation, purchase/warranty tracking.
  3. `IT Technician`: Hardware repair diagnostics, component swaps, stock part issuance.
  4. `Employee`: End-user view of assigned devices, handover acknowledgements, and repair request creation.
  5. `Auditor`: Read-only inspector of inventory, chain of custody, and maintenance logs.
- **Why:** Prevents unauthorized assignment modifications, component tampering, or privilege escalation across IT tiers.
- **Problem Solved:** Codifies the principle of least privilege across all operational ITAM workflows.
- **Alternatives Considered:** Simple 2-role system (Admin / User).
- **Why Alternatives Were Rejected:** Fails enterprise governance; technicians do not need user administration access, and employees must not access hardware procurement invoices.
- **Constraints:** Enforced via `requireRoles(['Admin', 'Asset Manager'])` middleware.
- **Impact:** `roleMiddleware.js`, route declarations, client-side navigation guards.
- **Evidence:** `AssetTrack_Comprehensive_Documentation.md` (Chapter 3: Role-Based Access Control).
- **Change Risk:** High. Changing permission mappings could expose restricted procurement or user data.
- **Related Decisions:** DEC-004, DEC-007.

---

### DEC-009 — Dual-Layer Validation & Sanitization (Zod Schema Validation + NoSQL Injection Defense)
- **Status:** CONFIRMED
- **Date:** 2026-11-05
- **Area:** Security / API
- **Decision:** Incoming API requests are validated through two distinct security layers:
  1. Zod Schema Validation: Deep validation of hardware payloads (rejecting non-integer RAM capacity, invalid MAC formats, and unexpected fields via `.strict()`).
  2. NoSQL Injection & Sanitization: Rejection of MongoDB operator objects (`$gt`, `$ne`, `$where`) in query parameters and body payloads, plus DOMPurify sanitization of user-submitted notes.
- **Why:** Express and MongoDB applications that parse un-sanitized JSON bodies are susceptible to NoSQL operator injection and payload manipulation.
- **Problem Solved:** Ensures type safety, prevents schema corruption, and guarantees that untrusted input cannot alter database queries.
- **Alternatives Considered:** Manual inline if-else validation; Joi validation.
- **Why Alternatives Were Rejected:** Inline checks are brittle and error-prone. Zod integrates seamlessly with TypeScript/JavaScript and provides composable, reusable schemas for deep hardware objects.
- **Constraints:** All route controllers must pass request payloads through `validate(schema)` middleware before invoking service logic.
- **Impact:** `validators/` directory, route handlers, error handling middleware.
- **Evidence:** `AssetTrack_Comprehensive_Documentation.md` (Chapter 10: Complete REST API Specification; Chapter 12).
- **Change Risk:** Medium. Loose validation risks malformed hardware data entering the database.
- **Related Decisions:** DEC-002, DEC-007.

---

### DEC-010 — Automated Background Warranty Expiry & Low-Stock Alert Daemons
- **Status:** CONFIRMED
- **Date:** 2026-11-05
- **Area:** Backend / Scheduling
- **Decision:** AssetTrack executes scheduled background daemons (via `node-cron` or agenda) to monitor:
  1. Warranty Expiry: Daily checks for assets whose vendor warranty expires in 90, 30, or 7 days, generating in-app `Notification` documents for Asset Managers.
  2. Low Stock Alerts: Evaluates `StockItem` available balances against `minStockLevel` following any `OUT` movement, immediately notifying IT inventory managers.
- **Why:** Without proactive automated alerting, IT departments miss warranty renewal windows, resulting in costly out-of-warranty hardware replacements.
- **Problem Solved:** Eliminates forgotten warranties and prevents stockouts of critical replacement parts (cables, thermal paste, RAM).
- **Alternatives Considered:** Manual weekly dashboard inspection by managers; Client-side calculation on login.
- **Why Alternatives Were Rejected:** Relies on human memory. Client-side evaluation fails if managers do not log in and does not generate persistent system notification records.
- **Constraints:** Cron jobs must be idempotent, preventing duplicate alert generation on successive runs.
- **Impact:** `warrantyScheduler.js`, `stockThresholdDaemon.js`, `Notification` model.
- **Evidence:** `AssetTrack_Comprehensive_Documentation.md` (Chapter 13: QA Automation; Chapter 14: Phase 10 & 11).
- **Change Risk:** Medium. Daemon bugs could flood users with duplicate notifications or fail to alert on critical expirations.
- **Related Decisions:** DEC-006, DEC-012.

---

### DEC-011 — Streaming ExcelJS Inventory Export & PDFKit Industrial Asset Label Generation
- **Status:** CONFIRMED
- **Date:** 2026-11-05
- **Area:** Reporting / Export
- **Decision:** Asset exports and label printing utilize specialized streaming libraries:
  - ExcelJS: Generates multi-tab formatted Excel workbooks (Asset Register, Hardware Specs, Assignment Custody, Stock Movements) with styling and headers.
  - PDFKit: Synthesizes industrial 2x1 inch and 3x2 inch vector asset labels containing organization branding, asset tags, human-readable serials, and high-density QR barcodes.
- **Why:** IT departments require structured Excel reports for external financial audits, and printable vector PDF labels for physical label applicators.
- **Problem Solved:** Provides professional, print-ready asset labels and audit-ready spreadsheets without client-side rendering bottlenecks.
- **Alternatives Considered:** CSV only; Browser print CSS (`window.print()`).
- **Why Alternatives Were Rejected:** CSV cannot preserve multiple sheets, formulas, or formatting. Browser print CSS cannot guarantee precise millimetric dimensions required for physical barcode label printers (Zebra, Brother).
- **Constraints:** PDFKit label layouts must maintain standard industrial label dimensions (203 DPI / 300 DPI scaling).
- **Impact:** `exportService.js`, `pdfLabelService.js`, `reportsController.js`.
- **Evidence:** `AssetTrack_Comprehensive_Documentation.md` (Chapter 6: QR Code Engine; Chapter 10; Chapter 11).
- **Change Risk:** Low. Independent export pipeline.
- **Related Decisions:** DEC-001, DEC-004.

---

### DEC-012 — Forensic Append-Only System Audit Ledger (`AuditLog`)
- **Status:** CONFIRMED
- **Date:** 2026-11-05
- **Area:** Compliance / Security
- **Decision:** Critical administrative, asset lifecycle, custody, and stock actions must write an immutable record to the `AuditLog` collection, logging `action`, `entityType`, `entityId`, `performedBy`, `organizationId`, `ipAddress`, `userAgent`, and `diff: { previousState, newState }`. Records in `AuditLog` are strictly append-only; update and delete operations are prohibited.
- **Why:** Enterprise compliance standards (ISO 27001, SOC 2) mandate unalterable audit trails for hardware custody transfers and security configuration changes.
- **Problem Solved:** Guarantees non-repudiation and forensic accountability across all asset operations.
- **Alternatives Considered:** Standard server logging to files; Application-level console logs.
- **Why Alternatives Were Rejected:** File logs are unstructured, rotate out quickly, and cannot be queried easily from the administrative web UI during security audits.
- **Constraints:** The `AuditLog` Mongoose schema must omit update and delete methods and enforce indexing on `{ organizationId: 1, createdAt: -1 }`.
- **Impact:** `AuditLog` model, `auditService.js`, all controller mutation operations.
- **Evidence:** `AssetTrack_Comprehensive_Documentation.md` (Chapter 9: Database Architecture; Chapter 12).
- **Change Risk:** High. Any failure in audit logging must not corrupt the primary transaction but must be reported to monitoring.
- **Related Decisions:** DEC-003, DEC-005, DEC-007.

---

### DEC-013 — Vitest and Supertest Automated Testing Suite with Isolated ITAM Test Fixtures
- **Status:** CONFIRMED
- **Date:** 2026-11-05
- **Area:** QA / Testing
- **Decision:** Automated testing is structured around Vitest (fast, modern test runner) and Supertest (HTTP assertions) using an in-memory MongoDB server (`mongodb-memory-server`) for hermetic, repeatable integration test execution. Test suites specifically target:
  - Deep hardware spec validation (CPU, multi-slot RAM, storage arrays).
  - State machine transitions (prohibiting assignment of broken or retired assets).
  - Chain of custody history integrity across multiple reassignments.
  - Component evolution auto-sync and stock deduction.
  - Multi-tenant isolation and BOLA boundary penetration checks.
- **Why:** ITAM business rules have complex state dependencies. Regressions in status transitions or tenant scoping can cause physical inventory discrepancies and data leaks.
- **Problem Solved:** Ensures all lifecycle invariants are mathematically verified before deployment.
- **Alternatives Considered:** Jest; Manual Postman testing.
- **Why Alternatives Were Rejected:** Vitest provides native ESM support and instant execution speed with Vite. Manual Postman tests are slow and prone to human error.
- **Constraints:** Tests must run hermetically without requiring external database instances or network access.
- **Impact:** `server/tests/` directory, CI/CD pipelines.
- **Evidence:** `AssetTrack_Comprehensive_Documentation.md` (Chapter 13: QA Automation & Hardware Lifecycle Test Suite).
- **Change Risk:** Low. Test code isolated from production runtime.
- **Related Decisions:** DEC-001, DEC-002, DEC-003, DEC-007.

---

## Decision Dependency Analysis

```
       ┌───────────┐
       │  DEC-001  │  (Decoupled Modern ITAM Architecture)
       └─────┬─────┘
             │
     ┌───────┴───────┬───────────────┐
     ▼               ▼               ▼
┌───────────┐ ┌───────────┐   ┌───────────┐
│  DEC-007  │ │  DEC-008  │   │  DEC-002  │ (Structured Hardware Specs)
│ (Tenant   │ │  (5-Tier  │   └─────┬─────┘
│  Scoping) │ │   RBAC)   │         │
└─────┬─────┘ └─────┬─────┘         ├─────────────────┐
      │             │               ▼                 ▼
      │             │         ┌───────────┐     ┌───────────┐
      │             │         │  DEC-005  │     │  DEC-006  │ (Dual-Tier
      │             │         │ (Component│     │  Inventory│  Inventory)
      │             │         │ Evolution)│     │  Ledger)  │
      │             │         └─────┬─────┘     └───────────┘
      │             │               │
      ▼             ▼               ▼
┌─────────────────────────────────────────┐
│  DEC-003: Immutable Chain of Custody   │
│  DEC-004: Opaque QR Code Engine         │
│  DEC-012: Forensic Append-Only Ledger   │
└─────────────────────────────────────────┘
```

- **DEC-003 & DEC-005 depend on DEC-002:** Component evolution and handover inspections require structured hardware models.
- **DEC-005 depends on DEC-006:** Hardware component replacements deduct spare parts from the stock movement ledger.
- **DEC-004, DEC-007, DEC-008 form the core security triad:** QR scanning triage depends on multi-tenant scoping and role-based access.
- **DEC-012 audits mutations across DEC-002, DEC-003, DEC-005, and DEC-006.**

---

## Change Protocol for Future Agents

Before changing an established decision:
1. Locate the decision entry and review its architectural rationale.
2. Cross-reference `IMPACT-MAP.md` for affected consumers, APIs, and models.
3. Formulate an explicit technical justification for why the current decision is no longer sufficient.
4. Prepare an impact and migration analysis detailing potential breaking changes.
5. **Request explicit human approval before modifying architecture or data schemas.**
6. Upon approval, update the decision status to `SUPERSEDED`, record the new decision, and commit the corresponding code and tests.
