import express from 'express';
import {
  createVendor,
  listVendors,
  createPurchaseRecord,
  listPurchaseRecords,
} from '../controllers/vendorController.js';
import { protect, authorize, validate } from '../middleware/authMiddleware.js';
import { createVendorSchema } from '../validators/maintenanceStockValidator.js';
import { USER_ROLES } from '../config/constants.js';

const router = express.Router();

router.get('/vendors', protect, listVendors);
router.post(
  '/vendors',
  protect,
  authorize(USER_ROLES.ADMIN, USER_ROLES.ASSET_MANAGER),
  validate(createVendorSchema),
  createVendor
);

router.get(
  '/purchases',
  protect,
  authorize(USER_ROLES.ADMIN, USER_ROLES.ASSET_MANAGER, USER_ROLES.AUDITOR),
  listPurchaseRecords
);
router.post(
  '/purchases',
  protect,
  authorize(USER_ROLES.ADMIN, USER_ROLES.ASSET_MANAGER),
  createPurchaseRecord
);

export default router;
