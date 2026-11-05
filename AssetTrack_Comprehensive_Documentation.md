# 🖥️ ASSETTRACK (ENTERPRISE ITAM)
### IT Asset & Hardware Inventory Management System
**Complete System Architecture, Hardware Specifications, Lifecycle Workflows & QR Code Manual**  
*Version: 1.0.0 (Production Release) | Tech Stack: React 18, Vite, Node.js, Express, MongoDB, qrcode, html5-qrcode, ExcelJS, PDFKit*

---

> ### 📌 CORE MISSION & HARDWARE GOVERNANCE
> **AssetTrack** is a production-grade enterprise IT Asset and Inventory Management System engineered to eliminate chaotic spreadsheet tracking, untracked component cannibalization, and lost hardware across corporate offices, computer labs, and managed service environments. It provides deep architectural modeling of computer hardware (CPU, multi-slot RAM, storage drives, networking MACs), QR-code physical label binding, an immutable employee assignment chain of custody, component replacement tracking, and an auditable spare parts stock ledger in a secure, multi-tenant environment.

---

## 📋 System Metadata & Specifications

| Attribute | System Specification |
| :--- | :--- |
| **Project Name** | AssetTrack (Enterprise IT Asset Management Platform v1.0.0) |
| **System Architecture** | Decoupled Modern ITAM Architecture (RESTful API v1 + QR Code Engine + Stock Ledger) |
| **Frontend Tech Stack** | React 18, Vite, React Router v6, Tailwind CSS, TanStack Query, Zustand, html5-qrcode, Recharts |
| **Backend Tech Stack** | Node.js (LTS), Express.js, JWT, Bcrypt, Zod, qrcode, Multer, ExcelJS, PDFKit |
| **Database Layer** | MongoDB 7.x with Mongoose ODM (Multi-Tenant Org Isolation, Compound Indexes, Transactions) |
| **Hardware Granularity** | Structured Multi-Module RAM (DDR4/5), NVMe/SATA SSDs, S.M.A.R.T. Health, MAC/IP, Chipsets |
| **Target Capabilities** | Hardware Inventory, QR Tag Generation & Camera Scanning, Employee Chain of Custody, Component Evolution History, Spare Parts Stock Movements |

---

## 📑 Table of Contents

- [Chapter 1: Executive Overview & ITAM Philosophy](#chapter-1-executive-overview--itam-philosophy)
- [Chapter 2: High-Level System Topology & Architecture](#chapter-2-high-level-system-topology--architecture)
- [Chapter 3: Role-Based Access Control (5 Roles & Multi-Tenancy)](#chapter-3-role-based-access-control-5-roles--multi-tenancy)
- [Chapter 4: Granular Hardware Specifications Architecture](#chapter-4-granular-hardware-specifications-architecture)
- [Chapter 5: Asset Lifecycle State Machine & Chain of Custody](#chapter-5-asset-lifecycle-state-machine--chain-of-custody)
- [Chapter 6: QR Code Engine & Mobile Scanning Triage](#chapter-6-qr-code-engine--mobile-scanning-triage)
- [Chapter 7: Maintenance, Repair Operations & Component Evolution](#chapter-7-maintenance-repair-operations--component-evolution)
- [Chapter 8: Consumables & Spare Parts Stock Movement Ledger](#chapter-8-consumables--spare-parts-stock-movement-ledger)
- [Chapter 9: Database Architecture & Complete Mongoose Schemas](#chapter-9-database-architecture--complete-mongoose-schemas)
- [Chapter 10: Complete REST API Specification (/api/v1)](#chapter-10-complete-rest-api-specification-apiv1)
- [Chapter 11: Production Directory Architecture & Modular Inventory](#chapter-11-production-directory-architecture--modular-inventory)
- [Chapter 12: Enterprise Security Hardening & Physical IT Defense](#chapter-12-enterprise-security-hardening--physical-it-defense)
- [Chapter 13: QA Automation & Hardware Lifecycle Test Suite](#chapter-13-qa-automation--hardware-lifecycle-test-suite)
- [Chapter 14: 14-Phase Engineering Implementation Roadmap](#chapter-14-14-phase-engineering-implementation-roadmap)

---

## Chapter 1: Executive Overview & ITAM Philosophy

In corporate organizations, university campuses, and IT service providers, hardware assets represent substantial capital expenditure. However, organizations frequently suffer from "Ghost Assets" (devices recorded on paper but physically missing), unrecorded RAM/SSD cannibalization, untracked warranty expirations, and unreturned laptops post employee resignation.

**AssetTrack** provides an institutionalized IT Asset Management (ITAM) platform that codifies every physical asset, internal component, assignment transition, and maintenance intervention into an audited digital ledger:

1. **Deep Hardware Dissection:** Rather than storing specs in a single ambiguous text box, AssetTrack maintains structured schema models for individual CPU specs, multiple RAM modules (DDR4/DDR5 MT/s, DIMM/SODIMM), and multi-drive storage arrays.
2. **Immutable Chain of Custody:** When an employee returns a laptop, their historical record is never overwritten. The system records who held the device, handover condition, return condition, and exact dates.
3. **Physical-to-Digital QR Binding:** Every device receives an industrial QR asset label. Scanning the QR via any smartphone or handheld scanner immediately opens its authorized diagnostic profile.
4. **Component Evolution Tracking:** When a technician upgrades an 8GB RAM stick to 16GB or replaces a failing SSD, the swap is logged in `ComponentChange`, maintaining the lifetime upgrade history of the machine.
5. **Spare Parts Stock Ledger:** Separates serialized equipment (laptops, desktops) from bulk consumable inventory (cables, thermal paste, replacement mice, RAM sticks) using an audited movement ledger.

---

## Chapter 2: High-Level System Topology & Architecture

AssetTrack implements an enterprise 7-component architecture:

```
┌───────────────────────────────────────────────────────────────────────────────────┐
│                          CLIENT PRESENTATION TIER                                 │
│      React 18 + Vite SPA  •  Tailwind CSS  •  html5-qrcode  •  Recharts           │
│  [Hardware Inventory Grid] [Mobile QR Scanner] [Maintenance Timeline & Diagnostics]│
└────────────────────────┬──────────────────────────────────┬───────────────────────┘
                         │ HTTPS REST Requests (/api/v1)   │
                         ▼                                  ▼
┌───────────────────────────────────────────────────────────────────────────────────┐
│                     APPLICATION, GATEWAY & ITAM ENGINE                            │
│  Express.js API Gateway  •  Helmet / Rate Limiting  •  JWT Auth  •  Zod Guards   │
│  ├── Hardware Lifecycle Engine (State transitions, status guards)                 │
│  ├── Chain of Custody Service (Atomic handovers, return condition inspections)    │
│  ├── Component Evolution Engine (RAM/SSD swap logging, spec synchronization)     │
│  ├── Consumables Stock Ledger (IN, OUT, ADJUSTMENT movements, min-stock alerts)   │
│  ├── QR Code Engine (Opaque payload generation, printable label rendering)        │
│  └── Reporting Subsystem (ExcelJS inventory workbooks, PDFKit labels)            │
└────────────────────────┬──────────────────────────────────────────────────────────┘
                         │ Mongoose ODM Operations (Multi-Tenant Org Scoping & Compound Indexes)
                         ▼
┌───────────────────────────────────────────────────────────────────────────────────┐
│                           DATA PERSISTENCE TIER                                   │
│  MongoDB 7.x Database Cluster (Multi-Tenant Organization Isolation)               │
│  ├── Organizations & Users           ├── Assets (Deep Specs: CPU, RAM, Drives)    │
│  ├── AssetAssignments (Custody Trail)├── MaintenanceRecords & ComponentChanges    │
│  ├── StockItems & StockMovements     ├── Locations (Campus/Floor/Lab) & Depts     │
│  └── Vendors & PurchaseRecords       └── AuditLogs & Notifications                │
└───────────────────────────────────────────────────────────────────────────────────┘
```

---

## Chapter 3: Role-Based Access Control (5 Roles & Multi-Tenancy)

### The Five System Personas
1. **Organization Administrator:** Full corporate authority. Manages organization profile, user accounts, locations, departments, and global configuration.
2. **IT Asset Manager:** Manages inventory intake, registers new assets, assigns devices to employees, processes returns, monitors warranty expirations, and generates QR labels.
3. **IT Technician:** Hardware repair specialist. Inspects malfunctioning equipment, logs diagnostic findings, replaces components, and marks repairs as resolved.
4. **Employee:** End-user. Views their assigned devices, acknowledges device handovers, views hardware specs, and submits repair requests.
5. **Auditor / Viewer:** Read-only inventory inspector. Reviews asset registers, assignment trails, and maintenance logs for financial or security audits.

### RBAC Permission Matrix

| System Capability | Org Admin | Asset Manager | IT Technician | Employee | Auditor |
| :--- | :---: | :---: | :---: | :---: | :---: |
| **Register New Assets** | ✅ Allowed | ✅ Allowed | ❌ Denied | ❌ Denied | ❌ Denied |
| **Modify Hardware Specs** | ✅ Allowed | ✅ Allowed | ⚠️ Allowed* | ❌ Denied | ❌ Denied |
| **Assign / Return Assets** | ✅ Allowed | ✅ Allowed | ❌ Denied | ❌ Denied | ❌ Denied |
| **Create Maintenance Job** | ✅ Allowed | ✅ Allowed | ✅ Allowed | ✅ Allowed (Own) | ❌ Denied |
| **Record Component Swap** | ✅ Allowed | ✅ Allowed | ✅ Allowed | ❌ Denied | ❌ Denied |
| **Scan Asset QR Code** | ✅ Allowed | ✅ Allowed | ✅ Allowed | ⚠️ Allowed (Ltd) | ✅ Allowed |
| **Manage Stock / Consumables** | ✅ Allowed | ✅ Allowed | ⚠️ Allowed (Issue) | ❌ Denied | ❌ Denied |
| **View Purchase & Invoices** | ✅ Allowed | ✅ Allowed | ❌ Denied | ❌ Denied | ✅ Allowed |
| **Export Inventory Reports** | ✅ Allowed | ✅ Allowed | ❌ Denied | ❌ Denied | ✅ Allowed |
| **Retire / Scrap Assets** | ✅ Allowed | ✅ Allowed | ❌ Denied | ❌ Denied | ❌ Denied |
| **Manage Users & Roles** | ✅ Allowed | ❌ Denied | ❌ Denied | ❌ Denied | ❌ Denied |

*\*Technicians may only modify hardware specifications as part of an authorized maintenance component replacement action.*

---

## Chapter 4: Granular Hardware Specifications Architecture

Rather than generic text descriptions, AssetTrack codifies hardware components into structured Mongoose schema documents:

### Deep Hardware Component Matrix

```
                      ┌─────────────────────────────────┐
                      │          ASSET RECORD           │
                      │   (AssetTag: AT-2026-0042)      │
                      └──────────────┬──────────────────┘
                                     │
     ┌───────────────────────────────┼───────────────────────────────┐
     │                               │                               │
     ▼                               ▼                               ▼
┌──────────────┐             ┌──────────────┐             ┌──────────────┐
│  PROCESSOR   │             │    MEMORY    │             │   STORAGE    │
│ Intel Core i7│             │ 32 GB DDR5   │             │ Array (2x)   │
│ 16 Cores     │             │ Slot 1: 16GB │             │ Drive 0: NVMe│
│ 24 Threads   │             │ Slot 2: 16GB │             │ Drive 1: SATA│
│ 5.4 GHz Max  │             │ 5600 MT/s    │             │ S.M.A.R.T. OK│
└──────────────┘             └──────────────┘             └──────────────┘
```

1. **Processor (CPU):** Manufacturer (Intel, AMD), model string, generation, physical cores, logical threads, base frequency GHz, boost frequency GHz.
2. **Memory (RAM Array):** Total capacity GB, generation (DDR3, DDR4, DDR5), form factor (DIMM, SODIMM), and an array of installed modules:
   ```javascript
   modules: [
     { slot: 1, capacityGb: 16, speedMts: 5600, make: 'Kingston', serial: 'KHX5600-01' },
     { slot: 2, capacityGb: 16, speedMts: 5600, make: 'Kingston', serial: 'KHX5600-02' }
   ]
   ```
3. **Storage Array (Drives):** Array supporting multiple NVMe and SATA drives simultaneously, capturing serial numbers and health indicators:
   ```javascript
   drives: [
     { driveIndex: 0, driveType: 'SSD', interface: 'NVMe', capacityGb: 512, make: 'Samsung', model: '980 Pro', serial: 'S6B0NS0W1', healthStatus: 'Good' },
     { driveIndex: 1, driveType: 'SSD', interface: 'SATA', capacityGb: 1024, make: 'Crucial', model: 'MX500', serial: '2138E5A7B', healthStatus: 'Good' }
   ]
   ```
4. **Motherboard & Chipset:** Manufacturer, model, chipset, CPU socket, total RAM slots, total PCIe expansion slots.
5. **Graphics (GPU):** Integrated vs Dedicated, manufacturer, model, dedicated VRAM GB.
6. **Networking:** Ethernet MAC, Wi-Fi MAC, link speed Mbps, assigned switch port, static/DHCP IP address.
7. **Operating System:** OS name, edition, version, 32-bit/64-bit architecture, build number, installation date.

---

## Chapter 5: Asset Lifecycle State Machine & Chain of Custody

### Asset Status Lifecycle
* `Purchased` — Acquired from vendor; awaiting physical delivery and barcode tagging.
* `Registered` — Specifications documented, asset tag assigned, QR label generated. In store room.
* `Available / In Stock` — Imaged, tested, and ready in IT store room for immediate employee deployment.
* `Assigned` — De-allocated from store room and currently in active custody of designated employee.
* `Under Repair` — Malfunctioning or damaged; removed from employee and in technician diagnostic queue.
* `Retired` — End-of-life, depreciated, or replaced. Kept in storage or archived for disposal.
* `Disposed / Scrapped` — Physically auctioned, recycled, or destroyed with certificate of disposal.
* `Lost / Stolen` — Unaccounted for during audit; security incident investigation flagged.

### Employee Chain of Custody (`AssetAssignment`)
1. **Pre-condition Check:** Asset must have `status === 'Available'`. If `status === 'Assigned'`, assignment is rejected.
2. **Assignment Record:** Creates new `AssetAssignment` document with `assignedAt = new Date()`, `conditionAtHandover: 'Good'`, accessories list (Charger, Bag, Mouse), and expected return date.
3. **Status Mutation:** Updates parent Asset: `status = 'Assigned'`, `assignedTo = employeeId`.
4. **Permanent History:** When employee returns device, the existing assignment record is updated with `returnedAt = new Date()` and `conditionAtReturn`. The record is **never deleted**, preserving a lifetime audit trail of all previous users.

---

## Chapter 6: QR Code Engine & Mobile Scanning Triage

```
Admin Registers Asset               QR Engine Generates Label               Technician Scans Physical QR
         │                                      │                                         │
         ├───── POST /api/v1/assets ───────────►│                                         │
         │      (Generates AT-2026-0042)        ├───── Renders QR (qrcode) ──────────────►│
         │                                      │      Payload: /q/AT-ORG01-0042          ├─► 1. Camera captures QR
         │                                      │                                         ├─► 2. Authenticates JWT
         │                                      │                                         ├─► 3. Verifies Org & Role
         │                                      │                                         ├─► 4. Opens Diagnostic UI
         │                                      │◄──── Printable SVG/PNG Label ───────────┤   (Full CPU/RAM/SSD Specs)
```

1. **Non-Sensitive Opaque Payloads:** QR labels contain only non-sensitive tokens (e.g. `https://assettrack.domain.com/q/AT-ORG01-0042`). Physical stickers reveal zero employee names, IP addresses, or internal configurations to passersby.
2. **Authentication Barrier & Role Views:** Scanning the QR code prompts authentication:
   - **Employee Scan:** Shows basic device name, manufacturer, and a "Report Malfunction" button.
   - **Technician Scan:** Shows complete CPU/RAM/SSD specs, active repair tickets, and "Commence Inspection" actions.
   - **Asset Manager Scan:** Displays purchase price, vendor invoice, warranty dates, and reassign modals.
3. **Printable Industrial Labels:** Generates standard 2x1 inch and 3x2 inch SVG/PNG layouts containing Organization Logo, Asset Tag, Serial Number, Category, and high-density QR code.

---

## Chapter 7: Maintenance, Repair Operations & Component Evolution

### Maintenance Classification
* **Corrective Maintenance:** Acute hardware troubleshooting (overheating, blown power supply, broken screen).
* **Preventive Maintenance:** Scheduled proactive servicing (quarterly dust blow-out, thermal paste renewal).
* **Hardware Upgrade:** Performance enhancements (RAM expansion, adding secondary NVMe drive).
* **Component Replacement:** Replacing damaged parts with spare inventory.
* **Diagnostic Inspection:** Benchmarking and evaluating suspected hardware faults.

### Component Evolution Tracking (`ComponentChange`)
When a technician upgrades an 8GB RAM module to 16GB or replaces a failing SSD, AssetTrack logs a dedicated `ComponentChange` record:
```javascript
{
  assetId: '64f2c1...',
  componentType: 'RAM',
  previousSpecification: '1x 8GB DDR4 2666MHz Kingston',
  newSpecification: '2x 16GB DDR4 3200MHz Corsair',
  technicianId: req.user.id,
  maintenanceRecordId: '64f2d5...',
  replacedAt: new Date()
}
```
* **Auto-Sync:** The parent Asset's `specifications.ram` object is automatically updated.
* **Stock Deduction:** The Consumables Stock Ledger automatically issues an `OUT` movement for the replacement parts consumed.

---

## Chapter 8: Consumables & Spare Parts Stock Movement Ledger

AssetTrack distinguishes between **Individual Fixed Assets** (serialized devices like laptops and switches) and **Consumable Inventory** (unserialized or bulk components like patch cables, thermal paste, spare keyboards, RAM sticks).

### Audited Stock Movements
* **IN (Stock Receipt):** Intake of new components from vendor purchase orders. Increments available quantity.
* **OUT (Stock Issue):** Issuance of component to a repair job or deployment to a user. Decrements available stock.
* **ADJUSTMENT (Audit Correction):** Administrative correction following physical inventory audit reconciliation.

$$\text{Available Stock}(\text{Item}) = \sum \text{Movements IN} - \sum \text{Movements OUT} \pm \sum \text{Adjustments}$$

*Stock quantities are prevented from dropping below zero unless an explicit negative-stock policy is enabled.*

---

## Chapter 9: Database Architecture & Complete Mongoose Schemas

### 14 Normalized Mongoose Schemas:
1. **Organization** — Enterprise tenant profile, unique `orgCode`, global preferences.
2. **User** — System users, Bcrypt credentials, role (Admin, Manager, Tech, Employee, Auditor).
3. **AssetCategory** — Taxonomy: Desktops, Laptops, Switches, Routers, Monitors, Printers.
4. **Asset** — Core inventory item: `assetTag`, serial, specs object, status, condition, `qrCodeReference`.
5. **AssetAssignment** — Immutable chain of custody tracking employee assignment, return dates, conditions.
6. **MaintenanceRecord** — Diagnostic tickets, repair actions, technician assignment, costs.
7. **ComponentChange** — Permanent ledger of RAM/SSD/GPU upgrades and hardware component swaps.
8. **StockItem** — Consumables catalog (cables, thermal paste, RAM sticks) with `minStockLevel`.
9. **StockMovement** — Append-only ledger of stock `IN`, `OUT`, and `ADJUSTMENT` operations.
10. **Vendor** — Hardware suppliers, AMC providers, contact details, `vendorCode`.
11. **Location** — Campus hierarchy: Building, Floor, Room, Lab.
12. **Department** — Organizational units: IT, Engineering, Accounts, HR.
13. **PurchaseRecord** — Invoice metadata, purchase amounts, warranty start/end dates, documents.
14. **Notification** — Alerts for warranty expiration, low stock, and overdue device returns.

---

## Chapter 10: Complete REST API Specification (/api/v1)

### Authentication & Asset Registration
* `POST /api/v1/auth/register` — Register organization and root Administrator account.
* `POST /api/v1/auth/login` — Authenticate user; returns HttpOnly secure JWT cookie.
* `GET /api/v1/assets` — Paginated asset inventory with multi-filters (`category`, `status`, `dept`).
* `POST /api/v1/assets` — Register asset; validates specs; generates QR reference.
* `GET /api/v1/assets/:id` — Retrieve full hardware specs, warranty, and active assignment.
* `PATCH /api/v1/assets/:id` — Update asset metadata, location, or department.
* `POST /api/v1/assets/:id/retire` — Retire asset; sets status to `'Retired'`.
* `GET /api/v1/assets/:id/qr` — Generate high-density SVG/PNG printable QR asset label.
* `GET /api/v1/assets/scan/:qrRef` — Resolve scanned QR token; render role-tailored profile.

### Assignments, Maintenance & Stock
* `POST /api/v1/assignments` — Assign available asset to employee with handover condition.
* `POST /api/v1/assignments/:id/return` — Return assigned asset to store room; record return condition.
* `GET /api/v1/assignments` — List assignment audit trail filtered by asset or employee.
* `GET /api/v1/maintenance` — List active maintenance and repair jobs.
* `POST /api/v1/maintenance` — Create repair ticket for malfunctioning hardware.
* `POST /api/v1/maintenance/:id/component-change` — Log hardware component replacement and sync specs.
* `POST /api/v1/maintenance/:id/complete` — Mark repair completed; update condition to `'Good'`.
* `GET /api/v1/stock/items` — List spare parts inventory with available stock levels.
* `POST /api/v1/stock/items` — Register new consumable/spare part with `minStockLevel`.
* `POST /api/v1/stock/movements` — Record stock movement (`IN`, `OUT`, `ADJUSTMENT`).

### Reports & Analytics
* `GET /api/v1/reports/assets` — Inventory status and department distribution report.
* `GET /api/v1/reports/warranty` — Assets with warranties expiring in 30/60/90 days.
* `GET /api/v1/reports/export` — Stream formatted Excel workbook of complete inventory.

---

## Chapter 11: Production Directory Architecture & Modular Inventory

```
assettrack/
├── server/
│   ├── src/
│   │   ├── config/              # DB connection, env loader, QR label layouts
│   │   ├── controllers/         # HTTP request handlers (assets, assignments, maintenance, stock)
│   │   ├── services/
│   │   │   ├── asset/           # Registration, hardware spec validation, status machine
│   │   │   ├── assignment/      # Custody manager: atomic handovers, return validations
│   │   │   ├── maintenance/     # Repair operations, diagnostic logger, component sync
│   │   │   ├── inventory/       # Stock movement calculator, low-stock threshold daemon
│   │   │   └── qr/              # QR code synthesis (qrcode), label layout generator
│   │   ├── models/              # 14 Mongoose schemas
│   │   ├── middleware/          # JWT auth, multi-tenant org scoping, RBAC guards, Multer
│   │   ├── validators/          # Zod validation schemas for CPU, RAM, storage, network
│   │   ├── imports/             # Bulk CSV/Excel inventory ingestion pipeline
│   │   └── exports/             # ExcelJS inventory workbooks, PDFKit asset reports
│   └── tests/                   # Vitest & Supertest automated test suites
│
├── client/
│   ├── src/
│   │   ├── features/
│   │   │   ├── assets/          # Asset catalog table, register wizard, spec editor
│   │   │   ├── qr/              # html5-qrcode camera scanner modal, printable label layout
│   │   │   ├── maintenance/     # Maintenance ticket queue, repair modal, component swap form
│   │   │   ├── inventory/       # Spare parts grid, stock level gauges, issue/receive dialog
│   │   │   ├── assignments/     # Employee assignment drawer, handover acknowledgement
│   │   │   └── dashboard/       # Recharts category distribution, status cards, warranty alerts
│   │   ├── store/               # Zustand UI stores (useFilterStore, useThemeStore)
│   │   ├── hooks/               # TanStack Query hooks: useAssets, useAssignments, useStock
│   │   ├── services/            # Axios API client singleton
│   │   └── pages/               # AssetsPage, AssetDetailPage, ScannerPage, MaintenancePage
│   ├── tailwind.config.js
│   └── vite.config.js
```

---

## Chapter 12: Enterprise Security Hardening & Physical IT Defense

| Threat / Attack Vector | Severity | Hardened Defense Implementation |
| :--- | :---: | :--- |
| **Cross-Tenant Data Leakage** | **CRITICAL** | Every query enforces `organizationId: req.user.organizationId`. Multi-tenant boundaries are verified on every route. |
| **Physical QR Code Snooping** | **HIGH** | QR labels contain only non-sensitive opaque tokens. Unauthenticated scans reveal zero employee names or network IPs. |
| **Ghost Asset / Tag Collision** | **HIGH** | Asset tags enforced unique per organization via compound unique index `{ organizationId: 1, assetTag: 1 }`. |
| **Unrecorded Hardware Theft** | **HIGH** | `ComponentChange` ledger tracks all RAM/SSD swaps. Disassembling a PC without an authorized repair ticket leaves an audit trail. |
| **Negative Stock Corruption** | **MEDIUM** | `StockMovement` service enforces atomic checks; prevents stock issuance exceeding available on-hand quantities. |
| **Unauthorized Document Access** | **MEDIUM** | Purchase invoices and warranty contracts restricted strictly to Org Admins and Asset Managers. |

---

## Chapter 13: QA Automation & Hardware Lifecycle Test Suite

Automated test suites executed with **Vitest** and **Supertest**:
* **Asset Registration Suite:** Validates structured CPU, RAM, and storage payloads; verifies duplicate asset tag rejection.
* **Assignment Integrity Suite:** Attempts to assign an asset currently "Under Repair"; confirms strict 400 Bad Request rejection.
* **Return & History Suite:** Assigns device to Employee A, returns device, assigns to Employee B; verifies 2 intact assignment history records.
* **Component Replacement Suite:** Logs 16GB RAM upgrade; confirms parent Asset specs update and ComponentChange record is logged.
* **Stock Ledger Integrity:** Simulates stock receipt (IN: 10), issue (OUT: 7); asserts available balance is 3; verifies rejection of OUT: 5.
* **QR Scan Resolution Suite:** Scans valid QR token as unauthenticated guest; asserts 401 redirect; scans as Tech; asserts full specs.
* **Warranty Alert Daemon:** Tests 90/30/7-day threshold calculations; asserts notifications dispatched for expiring equipment.

---

## Chapter 14: 14-Phase Engineering Implementation Roadmap

```
Phase 1: Architecture & Monorepo Setup (Vite + Express monorepo, Tailwind, Recharts, Vitest)
   │
   ▼
Phase 2: Authentication & Organizations (Multi-tenant org schema, user registration, RBAC)
   │
   ▼
Phase 3: Categories, Locations & Depts (Asset taxonomy, campus buildings/rooms, departments)
   │
   ▼
Phase 4: Asset Registration Core (Asset intake wizard, asset tag generation, Zod validation)
   │
   ▼
Phase 5: Hardware Specifications Engine (Structured CPU, multi-slot RAM, NVMe storage models)
   │
   ▼
Phase 6: Assignments & Chain of Custody (Employee handovers, return condition logging, history)
   │
   ▼
Phase 7: QR Code Generation & Scanning (qrcode label layout engine, html5-qrcode mobile scanner)
   │
   ▼
Phase 8: Maintenance & Service Center (Repair ticket intake, technician logs, maintenance types)
   │
   ▼
Phase 9: Component Evolution Ledger (Hardware upgrade form, ComponentChange tracking, spec sync)
   │
   ▼
Phase 10: Warranty & Purchase Management (Vendor directory, invoice attachments, expiry alerts)
   │
   ▼
Phase 11: Spare Parts & Stock Movement (Consumables catalog, IN/OUT/ADJUST ledger, low-stock alerts)
   │
   ▼
Phase 12: Dashboard & Visual Analytics (Recharts asset category charts, status distribution)
   │
   ▼
Phase 13: Import, Export & Security Audit (Bulk CSV import with duplicate checks, ExcelJS exports)
   │
   ▼
Phase 14: Documentation & Production Release (Runbooks, hardware spec guide, seed test data)
```

---

### Definition of Done (DoD)
The platform is complete when:
1. Administrator registers an enterprise laptop with structured specifications (Intel Core i7, 32GB DDR5 dual-channel RAM, 512GB NVMe SSD).
2. Unique asset tag `AT-2026-0042` is generated and a printable QR asset label is produced.
3. Asset is assigned to an employee with recorded handover condition and accessories.
4. Employee reports thermal throttling issue → technician scans physical QR label with mobile camera.
5. Technician inspects laptop, replaces thermal paste and swaps RAM stick → `ComponentChange` record logged and Asset specs update automatically.
6. Spare parts inventory deducts consumed components via audited `OUT` movement.
7. Laptop condition updated to "Good" and returned to available inventory.
8. Entire hardware and custody lifecycle is permanently preserved in MongoDB with zero data deletion.
