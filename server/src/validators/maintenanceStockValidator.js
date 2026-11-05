import { z } from 'zod';
import {
  ALL_MAINTENANCE_TYPES,
  ALL_MAINTENANCE_PRIORITIES,
  ALL_MAINTENANCE_STATUSES,
  ALL_ASSET_CONDITIONS,
  ALL_STOCK_MOVEMENT_TYPES,
} from '../config/constants.js';

export const createMaintenanceSchema = z.object({
  body: z.object({
    assetId: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid asset ID'),
    maintenanceType: z.enum(ALL_MAINTENANCE_TYPES),
    priority: z.enum(ALL_MAINTENANCE_PRIORITIES).optional().default('Medium'),
    issueDescription: z.string().min(3).max(1000),
    technicianId: z.string().regex(/^[0-9a-fA-F]{24}$/).optional(),
    notes: z.string().optional(),
  }),
});

export const updateMaintenanceSchema = z.object({
  body: z.object({
    technicianId: z.string().regex(/^[0-9a-fA-F]{24}$/).optional(),
    status: z.enum(ALL_MAINTENANCE_STATUSES).optional(),
    diagnosis: z.string().optional(),
    actionTaken: z.string().optional(),
    costMinor: z.coerce.number().int().min(0).optional(),
    assetConditionPostRepair: z.enum(ALL_ASSET_CONDITIONS).optional(),
    notes: z.string().optional(),
  }),
});

export const componentChangeSchema = z.object({
  body: z.object({
    componentType: z.enum(['RAM', 'Storage', 'GPU', 'Motherboard', 'Network', 'Other']),
    previousSpecification: z.string().min(2),
    newSpecification: z.string().min(2),
    stockItemId: z.string().regex(/^[0-9a-fA-F]{24}$/).optional(),
    quantityConsumed: z.coerce.number().int().positive().optional().default(1),
    updatedHardwareSpecs: z.record(z.any()).optional(), // optional direct sync payload
    notes: z.string().optional(),
  }),
});

export const createStockItemSchema = z.object({
  body: z.object({
    itemCode: z.string().min(2).max(20).regex(/^[A-Za-z0-9_-]+$/),
    name: z.string().min(2).max(100),
    category: z.enum(['RAM', 'SSD', 'HDD', 'Cables', 'Peripherals', 'Thermal Paste', 'Power Supply', 'Other']),
    unit: z.string().optional().default('pcs'),
    currentQuantity: z.coerce.number().int().min(0).optional().default(0),
    minStockLevel: z.coerce.number().int().min(0).optional().default(5),
    unitCostMinor: z.coerce.number().int().min(0).optional().default(0),
    vendorId: z.string().regex(/^[0-9a-fA-F]{24}$/).optional(),
    location: z.string().optional(),
  }),
});

export const createStockMovementSchema = z.object({
  body: z.object({
    stockItemId: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid stock item ID'),
    movementType: z.enum(ALL_STOCK_MOVEMENT_TYPES),
    quantity: z.coerce.number().int().positive('Quantity must be greater than zero'),
    referenceType: z.enum(['Purchase', 'Maintenance', 'Manual', 'Audit']).optional().default('Manual'),
    referenceId: z.string().regex(/^[0-9a-fA-F]{24}$/).optional(),
    notes: z.string().optional(),
  }),
});

export const createVendorSchema = z.object({
  body: z.object({
    name: z.string().min(2).max(100),
    vendorCode: z.string().min(2).max(12).regex(/^[A-Za-z0-9_-]+$/),
    contactPerson: z.string().optional(),
    email: z.string().email().optional(),
    phone: z.string().optional(),
    category: z.enum(['OEM', 'Distributor', 'AMC Provider', 'Retailer', 'Other']).optional().default('Distributor'),
    notes: z.string().optional(),
  }),
});
