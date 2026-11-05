import express from 'express';
import {
  getNotifications,
  markAsRead,
  markAllAsRead,
  triggerAudit,
} from '../controllers/notificationController.js';
import { protect, authorize } from '../middleware/authMiddleware.js';
import { USER_ROLES } from '../config/constants.js';

const router = express.Router();

router.get('/', protect, getNotifications);
router.patch('/read-all', protect, markAllAsRead);
router.patch('/:id/read', protect, markAsRead);
router.post(
  '/audit',
  protect,
  authorize(USER_ROLES.ADMIN, USER_ROLES.ASSET_MANAGER),
  triggerAudit
);

export default router;
