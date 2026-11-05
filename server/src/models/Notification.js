import mongoose from 'mongoose';

const notificationSchema = new mongoose.Schema(
  {
    organizationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Organization',
      required: true,
      index: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
    },
    message: {
      type: String,
      required: true,
      trim: true,
    },
    type: {
      type: String,
      enum: ['Warranty Expiry', 'Low Stock', 'Overdue Return', 'Maintenance Alert', 'General'],
      required: true,
      index: true,
    },
    entityType: {
      type: String,
      enum: ['Asset', 'StockItem', 'AssetAssignment', 'MaintenanceRecord'],
    },
    entityId: {
      type: mongoose.Schema.Types.ObjectId,
    },
    isRead: {
      type: Boolean,
      default: false,
      index: true,
    },
    targetRoles: {
      type: [String],
      default: ['Admin', 'Asset Manager'],
    },
  },
  {
    timestamps: true,
  }
);

notificationSchema.index({ organizationId: 1, isRead: 1, createdAt: -1 });

export const Notification = mongoose.model('Notification', notificationSchema);
