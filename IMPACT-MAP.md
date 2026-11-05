# AssetTrack — System Impact Map (IMPACT-MAP.md)

**System:** AssetTrack (Enterprise IT Asset & Hardware Inventory Management Platform)  
**Evaluated Architecture:** Decoupled 3-Tier ITAM Architecture (React 18 SPA + Node.js Express REST API v1 + MongoDB 7.x)  
**Maintenance Rule:** This document maps verified dependencies and ripples across the codebase. Review this document BEFORE modifying any shared service, controller, model, middleware, or background scheduler.

---

## 1. Purpose

This Impact Map protects AssetTrack against:
1. **Hardware Spec Desynchronization:** Flattening structured RAM/SSD arrays or corrupting component evolution history.
2. **Chain of Custody Data Loss:** Accidentally overwriting previous employee assignment records during device handovers or returns.
3. **Cross-Tenant Data Exposure (BOLA/IDOR):** Inadvertently omitting `organizationId: req.user.organizationId` filters in queries, updates, or aggregations.
4. **Physical QR Code Invalidation:** Modifying QR code URL schemas or payload formats, rendering printed physical labels unreadable in the field.
5. **Negative Consumable Stock Corruption:** Bypassing atomic checks during component replacement, causing stock balances to plunge below zero.
6. **Privilege Escalation:** Weakening RBAC guards that allow employees or technicians to alter procurement records or user accounts.

Whenever an engineer or AI agent modifies a core file or function, this map provides an auditable, pre-verified breakdown of direct and indirect consumers, security boundaries, and required test suites.

---

## 2. Component Impact Maps

### Component 1: `server/src/services/asset/assetService.js` → `registerAsset()`, `updateAssetSpecs()`, `transitionStatus()`
- **Role:** Centralized lifecycle engine governing asset intake, unique asset tag generation (`AT-YYYY-XXXX`), deep hardware specification validation, and status lifecycle state transitions.
- **Directly affected:**
  - `server/src/controllers/assetController.js` (`createAsset`, `updateAsset`, `getAssetById`, `listAssets`)
  - `server/src/models/Asset.js`
  - `server/src/services/qr/qrService.js` (generates QR label binding upon registration)
- **Potentially affected:**
  - `client/src/features/assets/AssetListPage.jsx` (inventory table, status filter badges).
  - `client/src/features/assets/AssetDetailPage.jsx` (spec overview, custody history).
  - `server/src/services/reports/exportService.js` (Excel inventory workbook generation).
- **API impact:** Affects `POST /api/v1/assets`, `GET /api/v1/assets`, `PATCH /api/v1/assets/:id`, `POST /api/v1/assets/:id/retire`. Changing response payloads breaks TanStack Query cache bindings in the client SPA.
- **Data impact:** Mutates `Asset` collection. Enforces compound uniqueness on `{ organizationId: 1, assetTag: 1 }` and `{ organizationId: 1, serialNumber: 1 }`.
- **Security impact:** Must strictly scope all operations to `organizationId: req.user.organizationId`. Prohibits status transitions by unauthorized roles (`requireRoles(['Admin', 'Asset Manager'])`).
- **Runtime impact:** Executes synchronously on intake; triggers asynchronous QR label generation. Must utilize indexed fields (`organizationId`, `assetTag`, `status`, `category`).
- **Frontend impact:** Updates TanStack Query keys `['assets']` and `['asset', id]`; triggers toast notifications and auto-generates printable QR preview modal.
- **Tests to review:** `server/tests/assetLifecycle.test.js`, `server/tests/hardwareValidation.test.js`, `server/tests/duplicateTagDefense.test.js`.
- **Infrastructure impact:** None. Operations run within standard MongoDB cluster limits.
- **Confidence:** Verified.
- **Evidence:** `AssetTrack_Comprehensive_Documentation.md` (Chapter 4: Granular Hardware Specifications Architecture; Chapter 5; Chapter 10).

---

### Component 2: `server/src/services/assignment/assignmentService.js` → `assignAssetToEmployee()`, `processAssetReturn()`
- **Role:** Chain of custody manager executing atomic employee device handovers and returns, enforcing availability pre-conditions, and permanently preserving historical assignment records.
- **Directly affected:**
  - `server/src/controllers/assignmentController.js` (`createAssignment`, `returnAssignment`, `getAssignmentHistory`)
  - `server/src/models/AssetAssignment.js`
  - `server/src/models/Asset.js` (`status`, `assignedTo`)
- **Potentially affected:**
  - `client/src/features/assignments/AssignmentModal.jsx` (device checkout drawer).
  - `client/src/features/assignments/ReturnModal.jsx` (condition inspection checklist).
  - `client/src/features/assets/AssetDetailPage.jsx` (chain of custody timeline).
  - `client/src/features/dashboard/DashboardPage.jsx` (assigned vs in-stock asset gauges).
- **API impact:** Affects `POST /api/v1/assignments`, `POST /api/v1/assignments/:id/return`, `GET /api/v1/assignments`. Expects `{ assetId, employeeId, conditionAtHandover, accessories, expectedReturnDate }`.
- **Data impact:** Creates new `AssetAssignment` document and updates `Asset.status` to `'Assigned'`. On return, updates `returnedAt` and `conditionAtReturn` while resetting `Asset.status` to `'Available'`. **Never deletes or overwrites prior documents.**
- **Security impact:** Critical. Prevents double-assignment (rejects assignment if asset status is not `'Available'`). Verifies both asset and employee belong to caller's `organizationId`.
- **Runtime impact:** Employs MongoDB atomic session transaction or conditional `$set` to prevent race conditions during concurrent checkouts.
- **Frontend impact:** Invalidates query keys `['assignments']`, `['assets']`, and `['dashboard']`, instantly updating UI inventory counts.
- **Tests to review:** `server/tests/chainOfCustody.test.js`, `server/tests/assignmentConflict.test.js`, `server/tests/returnConditionInspection.test.js`.
- **Infrastructure impact:** None.
- **Confidence:** Verified.
- **Evidence:** `AssetTrack_Comprehensive_Documentation.md` (Chapter 5: Asset Lifecycle State Machine & Chain of Custody; Chapter 13).

---

### Component 3: `server/src/services/maintenance/maintenanceService.js` → `logComponentChange()`, `completeRepairTicket()`
- **Role:** Component evolution and repair operations engine. Logs diagnostic tickets, tracks hardware upgrades (RAM/SSD/GPU), updates parent asset specifications, and triggers stock deduction for consumed parts.
- **Directly affected:**
  - `server/src/controllers/maintenanceController.js` (`createTicket`, `logSwap`, `completeTicket`)
  - `server/src/models/MaintenanceRecord.js`
  - `server/src/models/ComponentChange.js`
  - `server/src/models/Asset.js` (`specifications`, `condition`)
  - `server/src/services/inventory/stockLedgerService.js` (deducts replacement components)
- **Potentially affected:**
  - `client/src/features/maintenance/MaintenanceQueuePage.jsx` (repair ticket triage).
  - `client/src/features/maintenance/ComponentSwapDialog.jsx` (spec evolution form).
  - `client/src/features/assets/AssetDetailPage.jsx` (hardware spec table + upgrade log).
- **API impact:** Affects `POST /api/v1/maintenance/:id/component-change`, `POST /api/v1/maintenance/:id/complete`. Payload requires `{ componentType, previousSpec, newSpec, stockItemId, quantity }`.
- **Data impact:** Inserts into `ComponentChange`, updates `Asset.specifications`, and appends an `OUT` movement to `StockMovement`.
- **Security impact:** Technicians are permitted to alter asset specs *only* through an authorized repair ticket. Prevents unrecorded hardware cannibalization.
- **Runtime impact:** Multi-document write operation requiring atomic execution to ensure spec update and stock deduction succeed or fail together.
- **Frontend impact:** Triggers real-time cache refresh across maintenance queues and hardware spec sheets.
- **Tests to review:** `server/tests/componentEvolution.test.js`, `server/tests/maintenanceWorkflow.test.js`, `server/tests/stockDeductionSync.test.js`.
- **Infrastructure impact:** None.
- **Confidence:** Verified.
- **Evidence:** `AssetTrack_Comprehensive_Documentation.md` (Chapter 7: Maintenance, Repair Operations & Component Evolution).

---

### Component 4: `server/src/services/inventory/stockLedgerService.js` → `recordStockMovement()`, `checkLowStockAlert()`
- **Role:** Manages bulk consumables and spare parts stock movements (`IN`, `OUT`, `ADJUSTMENT`), computes on-hand balances, enforces non-negative stock policies, and evaluates low-stock notification triggers.
- **Directly affected:**
  - `server/src/controllers/stockController.js` (`createMovement`, `listStockItems`, `getStockItemById`)
  - `server/src/models/StockItem.js`
  - `server/src/models/StockMovement.js`
  - `server/src/models/Notification.js` (generates low stock warnings)
- **Potentially affected:**
  - `server/src/services/maintenance/maintenanceService.js` (consumes replacement parts).
  - `client/src/features/inventory/StockGridPage.jsx` (stock levels, low stock warning badges).
  - `client/src/features/inventory/StockMovementModal.jsx` (intake/issuance form).
- **API impact:** Affects `POST /api/v1/stock/movements`, `GET /api/v1/stock/items`. Expects `{ stockItemId, movementType, quantity, referenceType, referenceId, notes }`.
- **Data impact:** Appends immutable movement to `StockMovement` and atomically updates `StockItem.currentQuantity`.
- **Security impact:** Restricted to Org Admins, Asset Managers, and authorized Technicians (for part issuance). Scoped strictly to `organizationId`.
- **Runtime impact:** High-concurrency safety: atomic `$inc` prevents race conditions from driving inventory negative.
- **Frontend impact:** Updates stock level gauges and displays warning toasts if `currentQuantity <= minStockLevel`.
- **Tests to review:** `server/tests/stockLedger.test.js`, `server/tests/negativeStockPrevention.test.js`, `server/tests/lowStockAlert.test.js`.
- **Infrastructure impact:** None.
- **Confidence:** Verified.
- **Evidence:** `AssetTrack_Comprehensive_Documentation.md` (Chapter 8: Consumables & Spare Parts Stock Movement Ledger).

---

### Component 5: `server/src/services/qr/qrService.js` → `generateQRCode()`, `resolveQRToken()`, `renderPrintableLabel()`
- **Role:** Synthesizes non-sensitive opaque QR labels (`/q/AT-ORG-XXXX`), renders high-density printable labels (SVG/PNG/PDF), and resolves scanned barcodes into role-tailored diagnostic payloads.
- **Directly affected:**
  - `server/src/controllers/assetController.js` (`getAssetQR`, `resolveScannedQR`)
  - `server/src/services/asset/assetService.js` (called on asset registration)
- **Potentially affected:**
  - `client/src/features/qr/QRScannerModal.jsx` (mobile camera scanning triage).
  - `client/src/features/assets/PrintLabelModal.jsx` (printable PDF/SVG preview).
  - `server/src/services/reports/exportService.js` (batch label printing).
- **API impact:** Affects `GET /api/v1/assets/:id/qr`, `GET /api/v1/assets/scan/:qrRef`. Must return 401 for unauthenticated visitors and tailored payloads for Employees vs Techs vs Managers.
- **Data impact:** Reads `qrCodeReference` on `Asset`. QR payload itself contains zero sensitive fields.
- **Security impact:** Critical. Physical asset tags must never expose internal network parameters or employee identities. Unauthenticated scans redirect to the login portal.
- **Runtime impact:** In-memory vector/raster rendering using `qrcode` and `pdfkit`. Low CPU footprint.
- **Frontend impact:** Drives mobile barcode camera reader and opens role-appropriate modal.
- **Tests to review:** `server/tests/qrEngine.test.js`, `server/tests/qrTriageSecurity.test.js`, `server/tests/labelDimensions.test.js`.
- **Infrastructure impact:** None.
- **Confidence:** Verified.
- **Evidence:** `AssetTrack_Comprehensive_Documentation.md` (Chapter 6: QR Code Engine & Mobile Scanning Triage; Chapter 12).

---

### Component 6: `server/src/middleware/authMiddleware.js` & `roleMiddleware.js`
- **Role:** Validates JWT bearer/cookie tokens, extracts `userId`, `role`, and `organizationId`, injects `req.user`, and enforces RBAC permission gates across all 5 system personas.
- **Directly affected:**
  - Every route file in `server/src/routes/` (`authRoutes`, `assetRoutes`, `assignmentRoutes`, `maintenanceRoutes`, `stockRoutes`, `reportRoutes`)
- **Potentially affected:**
  - Entire client navigation stack (protected route wrappers, role-based button visibility).
- **API impact:** Global gateway guard. Returns 401 Unauthorized for missing/expired tokens; returns 403 Forbidden for unauthorized role attempts.
- **Data impact:** None directly. Populates `req.user` which scopes all subsequent queries.
- **Security impact:** Fundamental foundation of system security. Any flaw compromises multi-tenant isolation and role segregation.
- **Runtime impact:** Executes on every authenticated HTTP request. Must be microsecond-fast using fast JWT verification.
- **Frontend impact:** Determines user permissions stored in Zustand auth store (`useAuthStore`).
- **Tests to review:** `server/tests/authMiddleware.test.js`, `server/tests/roleMatrix.test.js`, `server/tests/tokenExpiration.test.js`.
- **Infrastructure impact:** Depends on `JWT_SECRET` environment variable.
- **Confidence:** Verified.
- **Evidence:** `AssetTrack_Comprehensive_Documentation.md` (Chapter 3: Role-Based Access Control; Chapter 12).

---

## 3. Critical Change Paths

| Component / File | Downstream Affected Areas | Failure Reason | System Risk |
| :--- | :--- | :--- | :---: |
| **`server/src/middleware/authMiddleware.js`** | All controllers, all database queries | Flawed token parsing or missing `organizationId` injection | **CRITICAL** (Cross-tenant data leakage) |
| **`server/src/models/Asset.js`** | Asset registration, QR engine, maintenance, assignments | Altering `specifications` schema from structured arrays to string | **CRITICAL** (Hardware query & upgrade failure) |
| **`server/src/services/assignment/assignmentService.js`** | Asset custody, return inspections, audit logs | Overwriting rather than appending historical assignments | **HIGH** (Destruction of regulatory chain of custody) |
| **`server/src/services/qr/qrService.js`** | Physical label stickers, mobile scanner, asset lookup | Changing QR reference format or endpoint path | **HIGH** (Renders physical QR stickers unreadable) |
| **`server/src/services/inventory/stockLedgerService.js`** | Spare parts ledger, maintenance component swaps | Race condition in quantity deduction | **MEDIUM** (Negative stock balances & audit discrepancy) |

---

## 4. Change-Impact Checklist

Before modifying any mapped component, verify:
- [ ] **Direct consumers checked:** All calling controllers and services identified.
- [ ] **Indirect consumers checked:** Background daemons, report generators, and client stores reviewed.
- [ ] **API contracts checked:** Request and response schemas validated with Zod.
- [ ] **Database / data dependencies checked:** Index impacts and schema migrations evaluated.
- [ ] **Authentication / authorization checked:** `organizationId` scoping and RBAC roles strictly enforced.
- [ ] **Physical QR compatibility checked:** QR token format and URL resolution backward-compatible.
- [ ] **Chain of custody checked:** Historical records confirmed non-destructive and append-only.
- [ ] **Tests checked:** Corresponding test suites in `server/tests/` executed and passing.
- [ ] **Configuration / infrastructure checked:** Environment variables (`JWT_SECRET`, `BASE_URL`) intact.
- [ ] **Critical user/admin workflows checked:** Device intake, QR scanning, checkout, and repair workflows tested end-to-end.

---

## 5. Unknown / Potential Dependencies

- **Hardware Auto-Discovery Agent (Future / Potential):** Planned integration with SNMP/WMI network scans to automatically populate hardware specs. Not yet implemented in v1.0.0.
- **Third-Party SAML/SSO Integration (Future / Potential):** Enterprise Okta / Azure AD integration for employee identity sync. Planned for v1.1.0; current implementation relies on native JWT and Bcrypt credentials.
