import mongoose from 'mongoose';
import { Asset } from '../../models/Asset.js';
import { AssetAssignment } from '../../models/AssetAssignment.js';
import { MaintenanceRecord } from '../../models/MaintenanceRecord.js';
import { StockItem } from '../../models/StockItem.js';
import { ASSET_STATUSES, MAINTENANCE_STATUSES } from '../../config/constants.js';

export class DashboardService {
  /**
   * Retrieves high-performance executive ITAM metrics using a single MongoDB aggregation pipeline
   */
  static async getSummaryMetrics(organizationId) {
    const orgObjectId = new mongoose.Types.ObjectId(organizationId);
    const now = new Date();
    const in90Days = new Date(now.getTime() + 90 * 24 * 60 * 60 * 1000);

    const [assetStats, overdueCount, activeMaintenanceCount, lowStockCount] = await Promise.all([
      Asset.aggregate([
        { $match: { organizationId: orgObjectId } },
        {
          $group: {
            _id: null,
            totalAssets: { $sum: 1 },
            availableAssets: {
              $sum: { $cond: [{ $eq: ['$status', ASSET_STATUSES.AVAILABLE] }, 1, 0] },
            },
            assignedAssets: {
              $sum: { $cond: [{ $eq: ['$status', ASSET_STATUSES.ASSIGNED] }, 1, 0] },
            },
            underRepairAssets: {
              $sum: { $cond: [{ $eq: ['$status', ASSET_STATUSES.UNDER_REPAIR] }, 1, 0] },
            },
            retiredAssets: {
              $sum: { $cond: [{ $eq: ['$status', ASSET_STATUSES.RETIRED] }, 1, 0] },
            },
            expiringWarranties: {
              $sum: {
                $cond: [
                  {
                    $and: [
                      { $gte: ['$warrantyExpiry', now] },
                      { $lte: ['$warrantyExpiry', in90Days] },
                    ],
                  },
                  1,
                  0,
                ],
              },
            },
            totalAcquisitionValueMinor: { $sum: '$purchaseCostMinor' },
          },
        },
      ]),
      AssetAssignment.countDocuments({
        organizationId: orgObjectId,
        status: 'Active',
        expectedReturnDate: { $lt: now, $ne: null },
      }),
      MaintenanceRecord.countDocuments({
        organizationId: orgObjectId,
        status: { $in: [MAINTENANCE_STATUSES.REPORTED, MAINTENANCE_STATUSES.ASSIGNED, MAINTENANCE_STATUSES.IN_PROGRESS, MAINTENANCE_STATUSES.WAITING_PARTS] },
      }),
      StockItem.countDocuments({
        organizationId: orgObjectId,
        isActive: true,
        $expr: { $lte: ['$currentQuantity', '$minStockLevel'] },
      }),
    ]);

    const stats = assetStats[0] || {
      totalAssets: 0,
      availableAssets: 0,
      assignedAssets: 0,
      underRepairAssets: 0,
      retiredAssets: 0,
      expiringWarranties: 0,
      totalAcquisitionValueMinor: 0,
    };

    return {
      totalAssets: stats.totalAssets,
      availableAssets: stats.availableAssets,
      assignedAssets: stats.assignedAssets,
      underRepairAssets: stats.underRepairAssets,
      retiredAssets: stats.retiredAssets,
      expiringWarrantiesCount: stats.expiringWarranties,
      overdueAssignmentsCount: overdueCount,
      activeMaintenanceCount,
      lowStockItemsCount: lowStockCount,
      totalAcquisitionValueMinor: stats.totalAcquisitionValueMinor,
    };
  }

  static async getCategoryDistribution(organizationId) {
    const orgObjectId = new mongoose.Types.ObjectId(organizationId);
    return Asset.aggregate([
      { $match: { organizationId: orgObjectId } },
      {
        $group: {
          _id: '$categoryId',
          count: { $sum: 1 },
        },
      },
      {
        $lookup: {
          from: 'assetcategories',
          localField: '_id',
          foreignField: '_id',
          as: 'category',
        },
      },
      { $unwind: '$category' },
      {
        $project: {
          _id: 1,
          name: '$category.name',
          code: '$category.code',
          count: 1,
        },
      },
      { $sort: { count: -1 } },
    ]);
  }

  static async getStatusDistribution(organizationId) {
    const orgObjectId = new mongoose.Types.ObjectId(organizationId);
    return Asset.aggregate([
      { $match: { organizationId: orgObjectId } },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 },
        },
      },
      {
        $project: {
          _id: 0,
          status: '$_id',
          count: 1,
        },
      },
      { $sort: { count: -1 } },
    ]);
  }

  static async getWarrantyHorizon(organizationId, days = 90) {
    const now = new Date();
    const horizon = new Date(now.getTime() + days * 24 * 60 * 60 * 1000);

    return Asset.find({
      organizationId,
      warrantyExpiry: { $gte: now, $lte: horizon },
    })
      .populate('categoryId', 'name code')
      .populate('departmentId', 'name')
      .sort({ warrantyExpiry: 1 })
      .lean();
  }
}
