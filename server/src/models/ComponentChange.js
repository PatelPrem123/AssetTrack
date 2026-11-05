import mongoose from 'mongoose';

const componentChangeSchema = new mongoose.Schema(
  {
    organizationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Organization',
      required: true,
      index: true,
    },
    assetId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Asset',
      required: true,
      index: true,
    },
    maintenanceRecordId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'MaintenanceRecord',
      required: true,
      index: true,
    },
    technicianId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    componentType: {
      type: String,
      enum: ['RAM', 'Storage', 'GPU', 'Motherboard', 'Network', 'Other'],
      required: true,
      index: true,
    },
    previousSpecification: {
      type: String,
      required: true,
      trim: true,
    },
    newSpecification: {
      type: String,
      required: true,
      trim: true,
    },
    stockItemId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'StockItem',
    },
    quantityConsumed: {
      type: Number,
      default: 1,
    },
    replacedAt: {
      type: Date,
      default: Date.now,
      index: true,
    },
    notes: {
      type: String,
      trim: true,
    },
  },
  {
    timestamps: true,
  }
);

componentChangeSchema.index({ organizationId: 1, assetId: 1, replacedAt: -1 });

export const ComponentChange = mongoose.model('ComponentChange', componentChangeSchema);
