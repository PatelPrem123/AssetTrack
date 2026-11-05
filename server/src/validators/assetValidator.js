import { z } from 'zod';
import { ALL_ASSET_STATUSES, ALL_ASSET_CONDITIONS } from '../config/constants.js';

const ramModuleValidator = z.object({
  slot: z.coerce.number().int().positive(),
  capacityGb: z.coerce.number().int().positive(),
  speedMts: z.coerce.number().int().positive().optional(),
  make: z.string().optional(),
  serial: z.string().optional(),
});

const storageDriveValidator = z.object({
  driveIndex: z.coerce.number().int().min(0).optional().default(0),
  driveType: z.enum(['SSD', 'HDD', 'Hybrid']).optional().default('SSD'),
  interface: z.enum(['NVMe', 'SATA', 'SAS', 'PCIe']).optional().default('NVMe'),
  capacityGb: z.coerce.number().int().positive(),
  make: z.string().optional(),
  model: z.string().optional(),
  serial: z.string().optional(),
  healthStatus: z.enum(['Good', 'Warning', 'Failing', 'Unknown']).optional().default('Good'),
});

export const hardwareSpecsValidator = z
  .object({
    cpu: z
      .object({
        manufacturer: z.string().optional(),
        model: z.string().optional(),
        generation: z.string().optional(),
        cores: z.coerce.number().int().positive().optional(),
        threads: z.coerce.number().int().positive().optional(),
        baseGhz: z.coerce.number().positive().optional(),
        boostGhz: z.coerce.number().positive().optional(),
      })
      .optional(),
    ram: z
      .object({
        totalCapacityGb: z.coerce.number().int().positive().optional(),
        ddrGen: z.enum(['DDR3', 'DDR4', 'DDR5', 'LPDDR5', 'Unified']).optional(),
        formFactor: z.enum(['DIMM', 'SODIMM', 'Soldered']).optional(),
        modules: z.array(ramModuleValidator).optional(),
      })
      .optional(),
    storage: z
      .object({
        drives: z.array(storageDriveValidator).optional(),
      })
      .optional(),
    motherboard: z
      .object({
        manufacturer: z.string().optional(),
        model: z.string().optional(),
        chipset: z.string().optional(),
        socket: z.string().optional(),
        ramSlotsTotal: z.coerce.number().int().positive().optional(),
        pcieSlotsTotal: z.coerce.number().int().min(0).optional(),
      })
      .optional(),
    gpu: z
      .object({
        gpuType: z.enum(['Integrated', 'Dedicated']).optional(),
        manufacturer: z.string().optional(),
        model: z.string().optional(),
        dedicatedVramGb: z.coerce.number().min(0).optional(),
      })
      .optional(),
    networking: z
      .object({
        ethernetMac: z
          .string()
          .regex(/^([0-9A-Fa-f]{2}[:-]){5}([0-9A-Fa-f]{2})$/, 'Invalid Ethernet MAC address format')
          .optional()
          .or(z.literal('')),
        wifiMac: z
          .string()
          .regex(/^([0-9A-Fa-f]{2}[:-]){5}([0-9A-Fa-f]{2})$/, 'Invalid Wi-Fi MAC address format')
          .optional()
          .or(z.literal('')),
        linkSpeedMbps: z.coerce.number().int().positive().optional(),
        staticIp: z.string().optional(),
        switchPort: z.string().optional(),
        connectionType: z.enum(['DHCP', 'Static']).optional(),
      })
      .optional(),
    os: z
      .object({
        osName: z.string().optional(),
        edition: z.string().optional(),
        version: z.string().optional(),
        architecture: z.enum(['x64', 'x86', 'ARM64']).optional(),
        buildNumber: z.string().optional(),
        installDate: z.coerce.date().optional(),
      })
      .optional(),
  })
  .optional();

export const createAssetSchema = z.object({
  body: z.object({
    assetTag: z.string().max(30).optional(), // Auto-generated if omitted
    serialNumber: z.string().max(80).optional(),
    name: z.string().min(2).max(100),
    categoryId: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid category ID'),
    manufacturer: z.string().min(1).max(60),
    model: z.string().min(1).max(60),
    status: z.enum(ALL_ASSET_STATUSES).optional().default('Available'),
    condition: z.enum(ALL_ASSET_CONDITIONS).optional().default('Good'),
    locationId: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid location ID'),
    departmentId: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid department ID'),
    purchaseDate: z.coerce.date().optional(),
    purchaseCostMinor: z.coerce.number().int().min(0).optional().default(0),
    warrantyExpiry: z.coerce.date().optional(),
    specifications: hardwareSpecsValidator,
    notes: z.string().optional(),
  }),
});

export const updateAssetSchema = z.object({
  body: z.object({
    name: z.string().min(2).max(100).optional(),
    serialNumber: z.string().max(80).optional(),
    manufacturer: z.string().min(1).max(60).optional(),
    model: z.string().min(1).max(60).optional(),
    categoryId: z.string().regex(/^[0-9a-fA-F]{24}$/).optional(),
    locationId: z.string().regex(/^[0-9a-fA-F]{24}$/).optional(),
    departmentId: z.string().regex(/^[0-9a-fA-F]{24}$/).optional(),
    condition: z.enum(ALL_ASSET_CONDITIONS).optional(),
    purchaseCostMinor: z.coerce.number().int().min(0).optional(),
    warrantyExpiry: z.coerce.date().optional(),
    specifications: hardwareSpecsValidator,
    notes: z.string().optional(),
  }),
});

export const retireAssetSchema = z.object({
  body: z.object({
    reason: z.string().min(3, 'Retirement reason is required'),
    disposalMethod: z.enum(['Storage', 'Scrapped', 'Recycled', 'Sold', 'Donated']).optional().default('Storage'),
  }),
});
