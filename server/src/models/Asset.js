import mongoose from 'mongoose';
import { ALL_ASSET_STATUSES, ALL_ASSET_CONDITIONS, ASSET_STATUSES, ASSET_CONDITIONS } from '../config/constants.js';

// Structured Hardware Sub-Schemas (DEC-002)
const ramModuleSchema = new mongoose.Schema(
  {
    slot: { type: Number, required: true }, // e.g. 1, 2
    capacityGb: { type: Number, required: true }, // e.g. 16
    speedMts: { type: Number }, // e.g. 5600 MT/s
    make: { type: String, trim: true }, // e.g. Kingston Fury
    serial: { type: String, trim: true },
  },
  { _id: false }
);

const storageDriveSchema = new mongoose.Schema(
  {
    driveIndex: { type: Number, default: 0 },
    driveType: { type: String, enum: ['SSD', 'HDD', 'Hybrid'], default: 'SSD' },
    interface: { type: String, enum: ['NVMe', 'SATA', 'SAS', 'PCIe'], default: 'NVMe' },
    capacityGb: { type: Number, required: true }, // e.g. 512, 1024
    make: { type: String, trim: true }, // e.g. Samsung
    model: { type: String, trim: true }, // e.g. 980 Pro
    serial: { type: String, trim: true },
    healthStatus: { type: String, enum: ['Good', 'Warning', 'Failing', 'Unknown'], default: 'Good' },
  },
  { _id: false }
);

const assetSchema = new mongoose.Schema(
  {
    organizationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Organization',
      required: true,
      index: true,
    },
    assetTag: {
      type: String,
      required: [true, 'Asset tag is required'],
      uppercase: true,
      trim: true,
    },
    serialNumber: {
      type: String,
      trim: true,
    },
    name: {
      type: String,
      required: [true, 'Asset display name is required'],
      trim: true,
      maxlength: [100, 'Asset name cannot exceed 100 characters'],
    },
    categoryId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'AssetCategory',
      required: true,
      index: true,
    },
    manufacturer: {
      type: String,
      required: [true, 'Manufacturer is required'],
      trim: true,
    },
    model: {
      type: String,
      required: [true, 'Model is required'],
      trim: true,
    },
    status: {
      type: String,
      enum: {
        values: ALL_ASSET_STATUSES,
        message: '{VALUE} is not a valid asset lifecycle status',
      },
      default: ASSET_STATUSES.AVAILABLE,
      index: true,
    },
    condition: {
      type: String,
      enum: {
        values: ALL_ASSET_CONDITIONS,
        message: '{VALUE} is not a valid condition',
      },
      default: ASSET_CONDITIONS.GOOD,
    },
    locationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Location',
      required: true,
      index: true,
    },
    departmentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Department',
      required: true,
      index: true,
    },
    assignedTo: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
      index: true,
    },
    purchaseDate: {
      type: Date,
    },
    purchaseCostMinor: {
      type: Number,
      default: 0,
      description: 'Acquisition price in integer paise (DEC-002)',
    },
    warrantyExpiry: {
      type: Date,
      index: true,
    },
    qrCodeReference: {
      type: String,
      required: true,
      unique: true,
      index: true,
      description: 'Opaque token embedded in physical barcode (DEC-004)',
    },
    // Granular Hardware Specifications (DEC-002)
    specifications: {
      cpu: {
        manufacturer: { type: String, trim: true }, // Intel, AMD, Apple
        model: { type: String, trim: true }, // Core i7-13700K, Ryzen 7 7800X3D
        generation: { type: String, trim: true }, // 13th Gen, Zen 4
        cores: { type: Number },
        threads: { type: Number },
        baseGhz: { type: Number },
        boostGhz: { type: Number },
      },
      ram: {
        totalCapacityGb: { type: Number },
        ddrGen: { type: String, enum: ['DDR3', 'DDR4', 'DDR5', 'LPDDR5', 'Unified'], default: 'DDR4' },
        formFactor: { type: String, enum: ['DIMM', 'SODIMM', 'Soldered'], default: 'SODIMM' },
        modules: [ramModuleSchema],
      },
      storage: {
        drives: [storageDriveSchema],
      },
      motherboard: {
        manufacturer: { type: String, trim: true },
        model: { type: String, trim: true },
        chipset: { type: String, trim: true },
        socket: { type: String, trim: true },
        ramSlotsTotal: { type: Number },
        pcieSlotsTotal: { type: Number },
      },
      gpu: {
        gpuType: { type: String, enum: ['Integrated', 'Dedicated'], default: 'Integrated' },
        manufacturer: { type: String, trim: true }, // NVIDIA, AMD, Intel
        model: { type: String, trim: true }, // RTX 4060 Ti
        dedicatedVramGb: { type: Number, default: 0 },
      },
      networking: {
        ethernetMac: { type: String, trim: true },
        wifiMac: { type: String, trim: true },
        linkSpeedMbps: { type: Number },
        staticIp: { type: String, trim: true },
        switchPort: { type: String, trim: true },
        connectionType: { type: String, enum: ['DHCP', 'Static'], default: 'DHCP' },
      },
      os: {
        osName: { type: String, trim: true }, // Windows 11 Pro, Ubuntu 24.04 LTS
        edition: { type: String, trim: true },
        version: { type: String, trim: true },
        architecture: { type: String, enum: ['x64', 'x86', 'ARM64'], default: 'x64' },
        buildNumber: { type: String, trim: true },
        installDate: { type: Date },
      },
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

// Compound Unique Indexes for Multi-Tenant Isolation (DEC-007)
assetSchema.index({ organizationId: 1, assetTag: 1 }, { unique: true });
assetSchema.index({ organizationId: 1, serialNumber: 1 }, { sparse: true });
assetSchema.index({ organizationId: 1, status: 1 });
assetSchema.index({ organizationId: 1, categoryId: 1 });
assetSchema.index({ organizationId: 1, departmentId: 1 });
assetSchema.index({ organizationId: 1, locationId: 1 });

export const Asset = mongoose.model('Asset', assetSchema);
