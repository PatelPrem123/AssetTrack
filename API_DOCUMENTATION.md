# AssetTrack — REST API Specification (`/api/v1`)

All endpoints are prefixed with `/api/v1`. Authentication is passed via the standard `Authorization: Bearer <token>` header or signed HttpOnly session cookie.

---

## 1. Authentication & Tenant Management (`/api/v1/auth`)

### `POST /api/v1/auth/register`
Provisions a new organization tenant and its root Administrator user.
- **Access:** Public
- **Request Body:**
  ```json
  {
    "orgName": "Acme Global Corp",
    "orgCode": "ACME",
    "name": "Jane Doe",
    "email": "admin@acmeglobal.com",
    "password": "SecurePassword123!",
    "assetTagPrefix": "ACM"
  }
  ```
- **Response `201 Created`:**
  ```json
  {
    "success": true,
    "data": {
      "organization": { "id": "...", "name": "Acme Global Corp", "code": "ACME" },
      "user": { "id": "...", "name": "Jane Doe", "role": "Admin" },
      "token": "eyJhbGciOi..."
    }
  }
  ```

### `POST /api/v1/auth/login`
Authenticates an organization member.
- **Access:** Public
- **Request Body:** `{ "email": "...", "password": "..." }`
- **Response `200 OK`:** Returns user profile, organization metadata, and JWT token.

### `GET /api/v1/auth/me`
Fetches the currently authenticated session user profile and tenant details.
- **Access:** Authenticated (Any role)

### `POST /api/v1/auth/users`
Creates a new user within the current organization.
- **Access:** Admin only
- **Request Body:** `{ "name": "...", "email": "...", "password": "...", "role": "Technician|Employee|...", "employeeId": "..." }`

---

## 2. Hardware Asset Management (`/api/v1/assets`)

### `GET /api/v1/assets`
Lists assets with multi-parameter filtering and pagination.
- **Access:** Authenticated
- **Query Parameters:** `search`, `categoryId`, `status`, `departmentId`, `page`, `limit`
- **Response `200 OK`:** `{ "success": true, "data": [...], "pagination": { "total": 150, "page": 1, "pages": 10 } }`

### `POST /api/v1/assets`
Registers a new hardware asset with automated sequential tag generation.
- **Access:** Admin, Asset Manager
- **Request Body:**
  ```json
  {
    "name": "Dell Precision 5820 Workstation",
    "categoryId": "673...",
    "manufacturer": "Dell",
    "model": "Precision 5820",
    "serialNumber": "SN-DL-998877",
    "departmentId": "673...",
    "locationId": "673...",
    "purchaseCostMinor": 18500000,
    "warrantyExpiry": "2027-12-31T00:00:00.000Z",
    "specifications": {
      "cpu": { "manufacturer": "Intel", "model": "Xeon W-2245", "cores": 8, "threads": 16 },
      "ram": {
        "totalCapacityGb": 32,
        "modules": [{ "slot": 1, "capacityGb": 16, "speedMts": 3200, "make": "Crucial" }, { "slot": 2, "capacityGb": 16, "speedMts": 3200, "make": "Crucial" }]
      },
      "storage": [{ "capacityGb": 1000, "driveType": "NVMe SSD", "manufacturer": "Samsung", "serialNumber": "S4X1..." }]
    }
  }
  ```

### `GET /api/v1/assets/:id`
Retrieves comprehensive asset details including nested hardware architecture.

### `PATCH /api/v1/assets/:id`
Updates asset metadata, lifecycle status, or specifications.

### `GET /api/v1/assets/:id/label.pdf`
Streams an industrial 2x1" vector printable PDF asset label.
- **Content-Type:** `application/pdf`
- **Content-Disposition:** `attachment; filename="Asset-Label-<tag>.pdf"`

### `GET /api/v1/assets/scan/:token`
Resolves an opaque QR token (`qr_...`) to its authorized asset profile.

---

## 3. Custody & Handover Management (`/api/v1/assignments`)

### `GET /api/v1/assignments`
Lists active and past assignment records.
- **Query Parameters:** `assetId`, `employeeId`, `status` (`Active` or `Returned`)

### `POST /api/v1/assignments`
Deploys an available asset to an employee.
- **Access:** Admin, Asset Manager, Technician
- **Request Body:**
  ```json
  {
    "assetId": "673...",
    "employeeId": "673...",
    "conditionAtHandover": "Good",
    "expectedReturnDate": "2026-12-31T00:00:00.000Z",
    "accessories": [
      { "name": "Power Adapter 65W", "verified": true },
      { "name": "Backpack", "verified": true }
    ],
    "notes": "Assigned for development work"
  }
  ```

### `PATCH /api/v1/assignments/:id/return`
Processes the physical return and inspection of an assigned asset.
- **Request Body:**
  ```json
  {
    "conditionAtReturn": "Good",
    "notes": "Returned intact with all verified accessories."
  }
  ```

---

## 4. Maintenance & Component Evolution (`/api/v1/maintenance`)

### `GET /api/v1/maintenance`
Lists maintenance work orders. Supports `?status=Open` or `?assetId=...`.

### `POST /api/v1/maintenance`
Logs a new diagnostic maintenance ticket for a device.

### `POST /api/v1/maintenance/:id/component-change`
Commits an atomic component swap (DEC-005). Deducts consumed spare part from stock and updates asset hardware specs.
- **Request Body:**
  ```json
  {
    "componentType": "RAM",
    "action": "Upgrade",
    "oldComponentDetails": "8GB DDR4 OEM",
    "newPartStockItemId": "673...",
    "newComponentDetails": "16GB DDR5 5600 Crucial",
    "costMinor": 480000,
    "reason": "Developer RAM upgrade",
    "updatedHardwareSpecs": {
      "ram": {
        "totalCapacityGb": 16,
        "modules": [{ "slot": 1, "capacityGb": 16, "speedMts": 5600, "make": "Crucial" }]
      }
    }
  }
  ```

### `PATCH /api/v1/maintenance/:id/complete`
Closes a maintenance work order, restoring the asset status to `Available`.

---

## 5. Spare Parts & Stock Ledger (`/api/v1/stock`)

### `GET /api/v1/stock/items`
Lists spare parts inventory with stock levels and reorder thresholds.

### `POST /api/v1/stock/items`
Registers a new consumable SKU.

### `POST /api/v1/stock/movements`
Records stock transaction movements (`IN`, `OUT`, `ADJUST`) with non-negative stock guards.

---

## 6. Reports & Bulk Pipelines (`/api/v1/reports`, `/api/v1/dashboard`)

### `GET /api/v1/dashboard/summary`
Returns aggregate summary metrics (total assets, acquisition value, available, assigned, under repair, low stock parts).

### `GET /api/v1/reports/categories`
Returns grouping counts across hardware categories.

### `GET /api/v1/reports/status`
Returns counts partitioned by asset lifecycle status.

### `GET /api/v1/reports/warranty?days=90`
Lists assets whose warranties expire within the specified horizon.

### `GET /api/v1/reports/export.xlsx`
Streams the multi-sheet formatted master Excel workbook.
- **Content-Type:** `application/vnd.openxmlformats-officedocument.spreadsheetml.sheet`

### `POST /api/v1/reports/import`
Ingests bulk CSV assets with formula macro protection (`PapaParse`).

---

## 7. Proactive Notifications (`/api/v1/notifications`)

### `GET /api/v1/notifications`
Lists notifications for the user's role and organization.

### `PATCH /api/v1/notifications/:id/read`
Marks a single notification as read.

### `PATCH /api/v1/notifications/read-all`
Marks all notifications as read.

### `POST /api/v1/notifications/audit`
Triggers an on-demand audit scan for warranty horizons, stock breaches, and overdue returns.
