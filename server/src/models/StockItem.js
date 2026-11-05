import mongoose from 'mongoose';

const stockItemSchema = new mongoose.Schema(
  {
    organizationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Organization',
      required: true,
      index: true,
    },
    itemCode: {
      type: String,
      required: [true, 'Item code is required'],
      uppercase: true,
      trim: true,
    },
    name: {
      type: String,
      required: [true, 'Stock item name is required'],
      trim: true,
    },
    category: {
      type: String,
      enum: ['RAM', 'SSD', 'HDD', 'Cables', 'Peripherals', 'Thermal Paste', 'Power Supply', 'Other'],
      default: 'Other',
      index: true,
    },
    unit: {
      type: String,
      default: 'pcs',
      trim: true,
    },
    currentQuantity: {
      type: Number,
      default: 0,
      min: [0, 'Available stock cannot be negative (DEC-006)'],
      index: true,
    },
    minStockLevel: {
      type: Number,
      default: 5,
      min: 0,
    },
    unitCostMinor: {
      type: Number,
      default: 0,
      min: 0,
    },
    vendorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Vendor',
    },
    location: {
      type: String,
      trim: true,
      default: 'Store Room',
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

stockItemSchema.index({ organizationId: 1, itemCode: 1 }, { unique: true });
stockItemSchema.index({ organizationId: 1, category: 1 });
stockItemSchema.index({ organizationId: 1, currentQuantity: 1 });

export const StockItem = mongoose.model('StockItem', stockItemSchema);
