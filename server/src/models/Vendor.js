import mongoose from 'mongoose';

const vendorSchema = new mongoose.Schema(
  {
    organizationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Organization',
      required: true,
      index: true,
    },
    name: {
      type: String,
      required: [true, 'Vendor name is required'],
      trim: true,
      maxlength: [100, 'Vendor name cannot exceed 100 characters'],
    },
    vendorCode: {
      type: String,
      required: [true, 'Vendor code is required'],
      uppercase: true,
      trim: true,
      maxlength: [12, 'Vendor code cannot exceed 12 characters'],
    },
    contactPerson: {
      type: String,
      trim: true,
    },
    email: {
      type: String,
      trim: true,
      lowercase: true,
    },
    phone: {
      type: String,
      trim: true,
    },
    category: {
      type: String,
      enum: ['OEM', 'Distributor', 'AMC Provider', 'Retailer', 'Other'],
      default: 'Distributor',
    },
    address: {
      street: { type: String, trim: true },
      city: { type: String, trim: true },
      state: { type: String, trim: true },
      country: { type: String, trim: true, default: 'India' },
    },
    notes: {
      type: String,
      trim: true,
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

vendorSchema.index({ organizationId: 1, vendorCode: 1 }, { unique: true });
vendorSchema.index({ organizationId: 1, name: 1 });

export const Vendor = mongoose.model('Vendor', vendorSchema);
