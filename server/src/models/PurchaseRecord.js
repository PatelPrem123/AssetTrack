import mongoose from 'mongoose';

const purchaseRecordSchema = new mongoose.Schema(
  {
    organizationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Organization',
      required: true,
      index: true,
    },
    vendorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Vendor',
      required: [true, 'Vendor reference is required'],
      index: true,
    },
    invoiceNumber: {
      type: String,
      required: [true, 'Invoice number is required'],
      trim: true,
    },
    purchaseDate: {
      type: Date,
      required: [true, 'Purchase date is required'],
      index: true,
    },
    totalAmountMinor: {
      type: Number,
      required: [true, 'Total purchase cost in paise is required'],
      min: 0,
    },
    warrantyStartDate: {
      type: Date,
    },
    warrantyExpiryDate: {
      type: Date,
      index: true,
    },
    warrantyType: {
      type: String,
      enum: ['Standard OEM', 'Extended Warranty', 'AMC Contract', 'None'],
      default: 'Standard OEM',
    },
    documentUrl: {
      type: String,
      trim: true,
    },
    assetIds: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Asset',
      },
    ],
    notes: {
      type: String,
      trim: true,
    },
  },
  {
    timestamps: true,
  }
);

purchaseRecordSchema.index({ organizationId: 1, invoiceNumber: 1 });
purchaseRecordSchema.index({ organizationId: 1, warrantyExpiryDate: 1 });

export const PurchaseRecord = mongoose.model('PurchaseRecord', purchaseRecordSchema);
