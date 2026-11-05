import mongoose from 'mongoose';
import {
  ALL_MAINTENANCE_TYPES,
  ALL_MAINTENANCE_PRIORITIES,
  ALL_MAINTENANCE_STATUSES,
  ALL_ASSET_CONDITIONS,
  MAINTENANCE_STATUSES,
  MAINTENANCE_PRIORITIES,
} from '../config/constants.js';

const maintenanceRecordSchema = new mongoose.Schema(
  {
    organizationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Organization',
      required: true,
      index: true,
    },
    ticketNumber: {
      type: String,
      required: true,
      uppercase: true,
      trim: true,
    },
    assetId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Asset',
      required: [true, 'Asset is required'],
      index: true,
    },
    reportedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    technicianId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
      index: true,
    },
    maintenanceType: {
      type: String,
      enum: ALL_MAINTENANCE_TYPES,
      required: true,
      index: true,
    },
    priority: {
      type: String,
      enum: ALL_MAINTENANCE_PRIORITIES,
      default: MAINTENANCE_PRIORITIES.MEDIUM,
    },
    status: {
      type: String,
      enum: ALL_MAINTENANCE_STATUSES,
      default: MAINTENANCE_STATUSES.REPORTED,
      index: true,
    },
    issueDescription: {
      type: String,
      required: [true, 'Issue description is required'],
      trim: true,
    },
    diagnosis: {
      type: String,
      trim: true,
    },
    actionTaken: {
      type: String,
      trim: true,
    },
    costMinor: {
      type: Number,
      default: 0,
      description: 'Repair expense in integer paise',
    },
    completedAt: {
      type: Date,
      default: null,
    },
    assetConditionPostRepair: {
      type: String,
      enum: ALL_ASSET_CONDITIONS,
      default: null,
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

maintenanceRecordSchema.index({ organizationId: 1, ticketNumber: 1 }, { unique: true });
maintenanceRecordSchema.index({ organizationId: 1, status: 1 });
maintenanceRecordSchema.index({ organizationId: 1, assetId: 1 });
maintenanceRecordSchema.index({ organizationId: 1, technicianId: 1 });

export const MaintenanceRecord = mongoose.model('MaintenanceRecord', maintenanceRecordSchema);
