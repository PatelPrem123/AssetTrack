import express from 'express';
import {
  createStockItem,
  listStockItems,
  recordStockMovement,
  listStockMovements,
} from '../controllers/stockController.js';
import { protect, authorize, validate } from '../middleware/authMiddleware.js';
import {
  createStockItemSchema,
  createStockMovementSchema,
} from '../validators/maintenanceStockValidator.js';
import { USER_ROLES } from '../config/constants.js';

const router = express.Router();

router.use(protect);

router.get('/items', listStockItems);
router.post(
  '/items',
  authorize(USER_ROLES.ADMIN, USER_ROLES.ASSET_MANAGER),
  validate(createStockItemSchema),
  createStockItem
);

router.get('/movements', listStockMovements);
router.post(
  '/movements',
  authorize(USER_ROLES.ADMIN, USER_ROLES.ASSET_MANAGER, USER_ROLES.TECHNICIAN),
  validate(createStockMovementSchema),
  recordStockMovement
);

export default router;
