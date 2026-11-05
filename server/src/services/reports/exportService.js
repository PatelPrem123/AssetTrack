import ExcelJS from 'exceljs';
import { Asset } from '../../models/Asset.js';
import { AssetAssignment } from '../../models/AssetAssignment.js';
import { StockItem } from '../../models/StockItem.js';
import { DashboardService } from './dashboardService.js';

export class ExportService {
  /**
   * Generates a multi-sheet formatted Excel workbook (DEC-011)
   */
  static async generateInventoryWorkbook(organizationId, organizationName = 'AssetTrack') {
    const workbook = new ExcelJS.Workbook();
    workbook.creator = 'AssetTrack Enterprise ITAM';
    workbook.created = new Date();

    const [metrics, assets, assignments, stockItems] = await Promise.all([
      DashboardService.getSummaryMetrics(organizationId),
      Asset.find({ organizationId })
        .populate('categoryId', 'name code')
        .populate('departmentId', 'name')
        .populate('locationId', 'name building room')
        .populate('assignedTo', 'name email employeeId')
        .sort({ assetTag: 1 })
        .lean(),
      AssetAssignment.find({ organizationId, status: 'Active' })
        .populate('assetId', 'assetTag name model serialNumber')
        .populate('employeeId', 'name email employeeId')
        .lean(),
      StockItem.find({ organizationId, isActive: true }).sort({ category: 1, name: 1 }).lean(),
    ]);

    // ================= SHEET 1: EXECUTIVE SUMMARY =================
    const summarySheet = workbook.addWorksheet('Executive Summary');
    summarySheet.columns = [
      { header: 'Metric', key: 'metric', width: 35 },
      { header: 'Value', key: 'value', width: 25 },
    ];

    summarySheet.addRows([
      { metric: 'Organization Name', value: organizationName },
      { metric: 'Report Generation Date', value: new Date().toISOString().split('T')[0] },
      { metric: 'Total Tracked Assets', value: metrics.totalAssets },
      { metric: 'Available / In Store', value: metrics.availableAssets },
      { metric: 'Currently Assigned to Employees', value: metrics.assignedAssets },
      { metric: 'Under Repair / Diagnostic Queue', value: metrics.underRepairAssets },
      { metric: 'Retired / Archived', value: metrics.retiredAssets },
      { metric: 'Warranties Expiring (Next 90 Days)', value: metrics.expiringWarrantiesCount },
      { metric: 'Overdue Employee Assignments', value: metrics.overdueAssignmentsCount },
      { metric: 'Active Maintenance Work Orders', value: metrics.activeMaintenanceCount },
      { metric: 'Low Stock Spare Part Alerts', value: metrics.lowStockItemsCount },
      { metric: 'Total Capital Equipment Cost (INR)', value: (metrics.totalAcquisitionValueMinor / 100).toLocaleString('en-IN') },
    ]);

    summarySheet.getRow(1).font = { bold: true, color: { argb: 'FFFFFFFF' } };
    summarySheet.getRow(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1E3A8A' } };

    // ================= SHEET 2: HARDWARE INVENTORY =================
    const inventorySheet = workbook.addWorksheet('Hardware Inventory');
    inventorySheet.columns = [
      { header: 'Asset Tag', key: 'tag', width: 16 },
      { header: 'Asset Name', key: 'name', width: 28 },
      { header: 'Category', key: 'category', width: 18 },
      { header: 'Manufacturer', key: 'make', width: 16 },
      { header: 'Model', key: 'model', width: 20 },
      { header: 'Serial Number', key: 'serial', width: 20 },
      { header: 'Status', key: 'status', width: 14 },
      { header: 'Condition', key: 'condition', width: 12 },
      { header: 'CPU Model', key: 'cpu', width: 22 },
      { header: 'RAM (GB)', key: 'ram', width: 12 },
      { header: 'Storage (GB)', key: 'storage', width: 14 },
      { header: 'Department', key: 'dept', width: 20 },
      { header: 'Location', key: 'loc', width: 24 },
      { header: 'Assigned To', key: 'custodian', width: 22 },
    ];

    assets.forEach((a) => {
      const storageTotal = a.specifications?.storage?.drives?.reduce((acc, d) => acc + (d.capacityGb || 0), 0) || 0;
      inventorySheet.addRow({
        tag: a.assetTag,
        name: a.name,
        category: a.categoryId?.name || 'N/A',
        make: a.manufacturer,
        model: a.model,
        serial: a.serialNumber || 'N/A',
        status: a.status,
        condition: a.condition,
        cpu: a.specifications?.cpu?.model || 'N/A',
        ram: a.specifications?.ram?.totalCapacityGb || 'N/A',
        storage: storageTotal > 0 ? `${storageTotal} GB` : 'N/A',
        dept: a.departmentId?.name || 'Unassigned',
        loc: a.locationId?.name || 'IT Depot',
        custodian: a.assignedTo ? `${a.assignedTo.name} (${a.assignedTo.email})` : 'Unassigned',
      });
    });

    inventorySheet.getRow(1).font = { bold: true, color: { argb: 'FFFFFFFF' } };
    inventorySheet.getRow(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF0F766E' } };

    // ================= SHEET 3: ACTIVE CUSTODY =================
    const custodySheet = workbook.addWorksheet('Active Custody');
    custodySheet.columns = [
      { header: 'Asset Tag', key: 'tag', width: 16 },
      { header: 'Device Model', key: 'model', width: 24 },
      { header: 'Employee Name', key: 'name', width: 22 },
      { header: 'Employee Email', key: 'email', width: 28 },
      { header: 'Assigned Date', key: 'assignedAt', width: 16 },
      { header: 'Handover Condition', key: 'condition', width: 16 },
      { header: 'Accessories Included', key: 'accessories', width: 35 },
    ];

    assignments.forEach((as) => {
      custodySheet.addRow({
        tag: as.assetId?.assetTag || 'N/A',
        model: `${as.assetId?.manufacturer || ''} ${as.assetId?.model || ''}`,
        name: as.employeeId?.name || 'N/A',
        email: as.employeeId?.email || 'N/A',
        assignedAt: as.assignedAt ? as.assignedAt.toISOString().split('T')[0] : 'N/A',
        condition: as.conditionAtHandover,
        accessories: as.accessories?.map((ac) => ac.name).join(', ') || 'Standard',
      });
    });

    custodySheet.getRow(1).font = { bold: true, color: { argb: 'FFFFFFFF' } };
    custodySheet.getRow(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1E40AF' } };

    // ================= SHEET 4: SPARE PARTS LEDGER =================
    const stockSheet = workbook.addWorksheet('Spare Parts Stock');
    stockSheet.columns = [
      { header: 'Item Code', key: 'code', width: 18 },
      { header: 'Item Description', key: 'name', width: 30 },
      { header: 'Category', key: 'category', width: 16 },
      { header: 'On-Hand Stock', key: 'qty', width: 14 },
      { header: 'Min Threshold', key: 'min', width: 14 },
      { header: 'Unit', key: 'unit', width: 10 },
      { header: 'Storage Location', key: 'loc', width: 20 },
    ];

    stockItems.forEach((stk) => {
      stockSheet.addRow({
        code: stk.itemCode,
        name: stk.name,
        category: stk.category,
        qty: stk.currentQuantity,
        min: stk.minStockLevel,
        unit: stk.unit,
        loc: stk.location,
      });
    });

    stockSheet.getRow(1).font = { bold: true, color: { argb: 'FFFFFFFF' } };
    stockSheet.getRow(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF854D0E' } };

    return workbook;
  }
}
