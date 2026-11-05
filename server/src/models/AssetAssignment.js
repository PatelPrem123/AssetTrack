import mongoose from 'mongoose';
import { ALL_ASSET_CONDITIONS, ASSET_CONDITIONS } from '../config/constants.js';

const accessoryItemSchema = new mongoose.Schema(
  {
    name: { type: String, required: true }, // e.g. "65W USB-C Power Adapter", "Laptop Bag"
    serial: { type: String, trim: true },
    verified: { type: Boolean, default: true },
  },
  { _id: false }
);

const assetAssignmentSchema = new mongoose.Schema(
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
      required: [true, 'Asset reference is required'],
      index: true,
    },
    employeeId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Employee reference is required'],
      index: true,
    },
    assignedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    assignedAt: {
      type: Date,
      default: Date.now,
      required: true,
      index: true,
    },
    conditionAtHandover: {
      type: String,
      enum: ALL_ASSET_CONDITIONS,
      default: ASSET_CONDITIONS.GOOD,
      required: true,
    },
    accessories: [accessoryItemSchema],
    expectedReturnDate: {
      type: Date,
      index: true,
    },
    returnedAt: {
      type: Date,
      default: null,
      index: true,
    },
    receivedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    conditionAtReturn: {
      type: String,
      enum: ALL_ASSET_CONDITIONS,
      default: null,
    },
    returnNotes: {
      type: String,
      trim: true,
    },
    employeeAcknowledged: {
      type: Boolean,
      default: true,
    },
    acknowledgementDate: {
      type: Date,
      default: Date.now,
    },
    status: {
      type: String,
      enum: ['Active', 'Returned', 'Transferred'],
      default: 'Active',
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

// Compound indexes for custody querying (DEC-003)
assetAssignmentSchema.index({ organizationId: 1, assetId: 1, status: 1 });
assetAssignmentSchema.index({ organizationId: 1, employeeId: 1, status: 1 });
assetAssignmentSchema.index({ organizationId: 1, expectedReturnDate: 1, status: 1 });

export const AssetAssignment = mongoose.model('AssetAssignment', assetAssignmentSchema);
