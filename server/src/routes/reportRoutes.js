import express from 'express';
import multer from 'multer';
import {
  getDashboardSummary,
  getCategoryDistribution,
  getStatusDistribution,
  getWarrantyReport,
  exportExcelInventory,
  importAssetsCSV,
} from '../controllers/reportsController.js';
import { protect, authorize } from '../middleware/authMiddleware.js';
import { USER_ROLES } from '../config/constants.js';

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 }, // 10 MB limit
});

const router = express.Router();

// Dashboard Metrics
router.get('/dashboard/summary', protect, getDashboardSummary);
router.get('/reports/categories', protect, getCategoryDistribution);
router.get('/reports/status', protect, getStatusDistribution);
router.get('/reports/warranty', protect, getWarrantyReport);

// Exports & Imports (DEC-011)
router.get(
  '/reports/export.xlsx',
  protect,
  authorize(USER_ROLES.ADMIN, USER_ROLES.ASSET_MANAGER, USER_ROLES.AUDITOR),
  exportExcelInventory
);

router.post(
  '/reports/import',
  protect,
  authorize(USER_ROLES.ADMIN, USER_ROLES.ASSET_MANAGER),
  upload.single('file'),
  importAssetsCSV
);

export default router;
