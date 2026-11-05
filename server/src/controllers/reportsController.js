import { DashboardService } from '../services/reports/dashboardService.js';
import { ExportService } from '../services/reports/exportService.js';
import { ImportService } from '../services/reports/importService.js';
import { BadRequestError } from '../utils/errors.js';

export async function getDashboardSummary(req, res, next) {
  try {
    const summary = await DashboardService.getSummaryMetrics(req.user.organizationId);
    res.status(200).json({ success: true, data: summary });
  } catch (error) {
    next(error);
  }
}

export async function getCategoryDistribution(req, res, next) {
  try {
    const distribution = await DashboardService.getCategoryDistribution(req.user.organizationId);
    res.status(200).json({ success: true, data: distribution });
  } catch (error) {
    next(error);
  }
}

export async function getStatusDistribution(req, res, next) {
  try {
    const distribution = await DashboardService.getStatusDistribution(req.user.organizationId);
    res.status(200).json({ success: true, data: distribution });
  } catch (error) {
    next(error);
  }
}

export async function getWarrantyReport(req, res, next) {
  try {
    const days = parseInt(req.query.days, 10) || 90;
    const assets = await DashboardService.getWarrantyHorizon(req.user.organizationId, days);
    res.status(200).json({ success: true, count: assets.length, data: assets });
  } catch (error) {
    next(error);
  }
}

export async function exportExcelInventory(req, res, next) {
  try {
    const workbook = await ExportService.generateInventoryWorkbook(
      req.user.organizationId,
      req.user.organizationName
    );

    const filename = `AssetTrack-Inventory-${req.user.organizationCode}-${new Date().toISOString().split('T')[0]}.xlsx`;

    res.setHeader(
      'Content-Type',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    );
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);

    await workbook.xlsx.write(res);
    res.end();
  } catch (error) {
    next(error);
  }
}

export async function importAssetsCSV(req, res, next) {
  try {
    if (!req.file && !req.body.csvData) {
      throw new BadRequestError('Please provide a CSV file or csvData string for import');
    }

    const csvContent = req.file ? req.file.buffer.toString('utf-8') : req.body.csvData;
    const result = await ImportService.importAssetsFromCSV(
      req.user.organizationId,
      csvContent,
      req.user._id
    );

    res.status(200).json({
      success: true,
      message: `Successfully imported ${result.importedCount} assets. Skipped: ${result.skippedCount}`,
      data: result,
    });
  } catch (error) {
    next(error);
  }
}
