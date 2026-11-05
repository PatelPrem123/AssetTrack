import express from 'express';
import {
  createTicket,
  listTickets,
  getTicketById,
  updateTicket,
  logComponentChange,
  completeTicket,
} from '../controllers/maintenanceController.js';
import { protect, authorize, validate } from '../middleware/authMiddleware.js';
import {
  createMaintenanceSchema,
  updateMaintenanceSchema,
  componentChangeSchema,
} from '../validators/maintenanceStockValidator.js';
import { USER_ROLES } from '../config/constants.js';

const router = express.Router();

router.use(protect);

router.post('/', validate(createMaintenanceSchema), createTicket);
router.get('/', listTickets);
router.get('/:id', getTicketById);
router.patch(
  '/:id',
  authorize(USER_ROLES.ADMIN, USER_ROLES.ASSET_MANAGER, USER_ROLES.TECHNICIAN),
  validate(updateMaintenanceSchema),
  updateTicket
);
router.post(
  '/:id/component-change',
  authorize(USER_ROLES.ADMIN, USER_ROLES.ASSET_MANAGER, USER_ROLES.TECHNICIAN),
  validate(componentChangeSchema),
  logComponentChange
);
router.post(
  '/:id/complete',
  authorize(USER_ROLES.ADMIN, USER_ROLES.ASSET_MANAGER, USER_ROLES.TECHNICIAN),
  completeTicket
);

export default router;
