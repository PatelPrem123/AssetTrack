import cron from 'node-cron';
import { Asset } from '../models/Asset.js';
import { StockItem } from '../models/StockItem.js';
import { AssetAssignment } from '../models/AssetAssignment.js';
import { Notification } from '../models/Notification.js';
import { Organization } from '../models/Organization.js';
import { logger } from '../utils/logger.js';

let cronTask = null;

/**
 * Runs a deterministic audit scan across assets, consumables, and assignments
 * Creates non-duplicate alerts for warranty expiration, stock breaches, and overdue returns
 *
 * @param {string|null} targetOrgId - Optional specific organization ID
 * @returns {Promise<{ organizationsAudited: number, notificationsCreated: number }>}
 */
export async function runWarrantyAndStockAudit(targetOrgId = null) {
  const query = targetOrgId ? { _id: targetOrgId } : { isActive: true };
  const organizations = await Organization.find(query);

  const now = new Date();
  const ninetyDaysLater = new Date(now.getTime() + 90 * 24 * 60 * 60 * 1000);
  const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);

  let totalCreated = 0;

  for (const org of organizations) {
    const orgId = org._id;

    // 1. Warranty Expiry Audit (Horizon: 90 days)
    const expiringAssets = await Asset.find({
      organizationId: orgId,
      warrantyExpiry: { $gte: now, $lte: ninetyDaysLater },
      status: { $nin: ['Disposed', 'Retired'] },
    });

    for (const asset of expiringAssets) {
      const existing = await Notification.findOne({
        organizationId: orgId,
        type: 'Warranty Expiry',
        entityId: asset._id,
        createdAt: { $gte: oneDayAgo },
      });

      if (!existing) {
        const expiryFormatted = asset.warrantyExpiry.toISOString().split('T')[0];
        await Notification.create({
          organizationId: orgId,
          title: `Warranty Expiry: ${asset.assetTag}`,
          message: `Asset "${asset.name}" (${asset.serialNumber}) warranty expires on ${expiryFormatted}.`,
          type: 'Warranty Expiry',
          entityType: 'Asset',
          entityId: asset._id,
          targetRoles: ['Admin', 'Asset Manager'],
        });
        totalCreated++;
      }
    }

    // 2. Consumable Spare Parts Stock Threshold Audit
    const lowStockItems = await StockItem.find({
      organizationId: orgId,
      $expr: { $lte: ['$currentQuantity', '$minStockLevel'] },
    });

    for (const item of lowStockItems) {
      const existing = await Notification.findOne({
        organizationId: orgId,
        type: 'Low Stock',
        entityId: item._id,
        createdAt: { $gte: oneDayAgo },
      });

      if (!existing) {
        await Notification.create({
          organizationId: orgId,
          title: `Low Stock: ${item.itemCode}`,
          message: `Part "${item.name}" stock level (${item.currentQuantity} ${item.unit}) has breached threshold (${item.minStockLevel} ${item.unit}).`,
          type: 'Low Stock',
          entityType: 'StockItem',
          entityId: item._id,
          targetRoles: ['Admin', 'Asset Manager', 'Technician'],
        });
        totalCreated++;
      }
    }

    // 3. Overdue Custody Return Audit
    const overdueAssignments = await AssetAssignment.find({
      organizationId: orgId,
      status: 'Active',
      expectedReturnDate: { $lt: now },
    }).populate('assetId employeeId');

    for (const assignment of overdueAssignments) {
      const existing = await Notification.findOne({
        organizationId: orgId,
        type: 'Overdue Return',
        entityId: assignment._id,
        createdAt: { $gte: oneDayAgo },
      });

      if (!existing) {
        const tag = assignment.assetId?.assetTag || 'Asset';
        const empName = assignment.employeeId
          ? `${assignment.employeeId.firstName} ${assignment.employeeId.lastName}`
          : 'Employee';
        const dueFormatted = assignment.expectedReturnDate
          ? assignment.expectedReturnDate.toISOString().split('T')[0]
          : 'Unknown';

        await Notification.create({
          organizationId: orgId,
          title: `Overdue Return: ${tag}`,
          message: `Device assigned to ${empName} was due on ${dueFormatted}.`,
          type: 'Overdue Return',
          entityType: 'AssetAssignment',
          entityId: assignment._id,
          targetRoles: ['Admin', 'Asset Manager'],
        });
        totalCreated++;
      }
    }
  }

  logger.info(
    `[WarrantyScheduler] Completed scan. Orgs: ${organizations.length}, Alerts Generated: ${totalCreated}`
  );
  return { organizationsAudited: organizations.length, notificationsCreated: totalCreated };
}

/**
 * Initializes cron scheduler to run daily at 00:00 UTC
 */
export function startScheduler() {
  if (process.env.NODE_ENV === 'test') {
    return; // Don't run automated timers in test mode
  }

  // Daily at midnight: 0 0 * * *
  cronTask = cron.schedule('0 0 * * *', async () => {
    logger.info('[WarrantyScheduler] Firing scheduled daily warranty and stock audit...');
    try {
      await runWarrantyAndStockAudit();
    } catch (err) {
      logger.error('[WarrantyScheduler] Error during scheduled audit:', err);
    }
  });

  logger.info('[WarrantyScheduler] Background audit daemon initialized (0 0 * * *)');
}

/**
 * Halts cron scheduler cleanly
 */
export function stopScheduler() {
  if (cronTask) {
    cronTask.stop();
    cronTask = null;
    logger.info('[WarrantyScheduler] Background audit daemon stopped');
  }
}
