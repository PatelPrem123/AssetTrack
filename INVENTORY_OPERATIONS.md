# AssetTrack — Inventory & Spare Parts Operations Guide

AssetTrack maintains a dual-tier separation between **Serialized Fixed Assets** (Laptops, Servers, Switches) and **Non-Serialized Bulk Consumables** (RAM sticks, SSDs, patch cables, thermal paste) (DEC-006).

---

## 1. Dual-Tier Inventory Model

| Dimension | Serialized Assets (`Asset`) | Spare Parts Consumables (`StockItem`) |
| :--- | :--- | :--- |
| **Tracking Level** | Individual serial number & unique asset tag | SKU / Item Code & quantity on hand |
| **Lifecycle** | State machine (Purchased -> Available -> Assigned -> ...) | Quantity movements (`IN`, `OUT`, `ADJUST`) |
| **Custody** | Assigned to specific employee | Stored in warehouse bins / technician lockers |
| **Physical Label** | Printable 2x1" vector QR sticker | Bin / Shelf barcode label |
| **Component Role** | Receives installed hardware components | Installed into assets during maintenance |

---

## 2. Atomic Component Evolution Workflow (DEC-005)

When a technician performs a hardware upgrade (e.g. adding 16GB DDR5 RAM to a workstation):
1. **Technician initiates Component Change** (`POST /api/v1/maintenance/:id/component-change`).
2. **Stock Deduction:** The selected consumable (`RAM-DDR5-16G`) is atomically decremented by 1 unit in `stock_items`.
   - A `StockMovement` entry (`type: 'OUT'`) is created recording the ticket reference.
3. **Hardware Spec Synchronization:** The `specifications.ram` subdocument of the target `Asset` is immediately updated with the new 16GB module in slot 2.
4. **Historical Audit Entry:** A permanent `ComponentChange` record is created linking the maintenance ticket, the old part, the new part, cost, and the technician ID.

---

## 3. Stock Movement Ledger & Invariants

All changes to inventory quantities must pass through `recordStockMovement`:
- **`IN` (Restock):** Increases `currentQuantity` upon purchase receipt or vendor shipment.
- **`OUT` (Issuance):** Decreases `currentQuantity` upon hardware repair or direct provisioning.
- **`ADJUST` (Reconciliation):** Sets `currentQuantity` to the counted physical balance following a stock audit.
- **Non-Negative Guard:** If an `OUT` movement would reduce `currentQuantity` below 0, the operation is rejected with `BadRequestError('Insufficient stock on hand')`.

---

## 4. Automated Reorder Alerts (DEC-012)

The background scheduler checks `StockItem.currentQuantity <= StockItem.minStockLevel` daily. When breached, high-priority notifications (`Low Stock Alert`) are broadcast to Administrators, Asset Managers, and Technicians.
