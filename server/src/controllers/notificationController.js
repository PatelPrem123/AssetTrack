import { Notification } from '../models/Notification.js';
import { runWarrantyAndStockAudit } from '../jobs/warrantyScheduler.js';
import { asyncHandler } from '../utils/errors.js';

export const getNotifications = asyncHandler(async (req, res) => {
  const { unreadOnly, limit = 50, page = 1 } = req.query;

  const query = {
    organizationId: req.user.organizationId,
    targetRoles: req.user.role,
  };

  if (unreadOnly === 'true') {
    query.isRead = false;
  }

  const skip = (parseInt(page, 10) - 1) * parseInt(limit, 10);
  const total = await Notification.countDocuments(query);
  const notifications = await Notification.find(query)
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(parseInt(limit, 10));

  const unreadCount = await Notification.countDocuments({
    organizationId: req.user.organizationId,
    targetRoles: req.user.role,
    isRead: false,
  });

  res.status(200).json({
    success: true,
    data: notifications,
    unreadCount,
    pagination: {
      total,
      page: parseInt(page, 10),
      pages: Math.ceil(total / parseInt(limit, 10)),
    },
  });
});

export const markAsRead = asyncHandler(async (req, res) => {
  const notification = await Notification.findOneAndUpdate(
    { _id: req.params.id, organizationId: req.user.organizationId },
    { isRead: true },
    { new: true }
  );

  if (!notification) {
    return res.status(404).json({ success: false, error: 'Notification not found' });
  }

  res.status(200).json({
    success: true,
    data: notification,
  });
});

export const markAllAsRead = asyncHandler(async (req, res) => {
  await Notification.updateMany(
    {
      organizationId: req.user.organizationId,
      targetRoles: req.user.role,
      isRead: false,
    },
    { isRead: true }
  );

  res.status(200).json({
    success: true,
    message: 'All notifications marked as read',
  });
});

export const triggerAudit = asyncHandler(async (req, res) => {
  const result = await runWarrantyAndStockAudit(req.user.organizationId);
  res.status(200).json({
    success: true,
    message: 'Audit scan executed successfully',
    data: result,
  });
});
