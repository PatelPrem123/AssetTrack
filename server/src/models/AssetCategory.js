import mongoose from 'mongoose';

const assetCategorySchema = new mongoose.Schema(
  {
    organizationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Organization',
      required: true,
      index: true,
    },
    name: {
      type: String,
      required: [true, 'Category name is required'],
      trim: true,
      maxlength: [60, 'Category name cannot exceed 60 characters'],
    },
    code: {
      type: String,
      required: [true, 'Category code is required'],
      uppercase: true,
      trim: true,
      maxlength: [10, 'Category code cannot exceed 10 characters'],
    },
    isHardware: {
      type: Boolean,
      default: true,
      description: 'True if items in this category require granular CPU/RAM/Storage spec models',
    },
    description: {
      type: String,
      trim: true,
    },
    defaultDepreciationYears: {
      type: Number,
      default: 3,
      min: [1, 'Depreciation period must be at least 1 year'],
      max: [20, 'Depreciation period cannot exceed 20 years'],
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

// Compound unique index ensuring category names are unique per organization (DEC-007)
assetCategorySchema.index({ organizationId: 1, name: 1 }, { unique: true });
assetCategorySchema.index({ organizationId: 1, code: 1 }, { unique: true });

export const AssetCategory = mongoose.model('AssetCategory', assetCategorySchema);
