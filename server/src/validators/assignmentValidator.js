import { z } from 'zod';
import { ALL_ASSET_CONDITIONS } from '../config/constants.js';

export const createAssignmentSchema = z.object({
  body: z.object({
    assetId: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid asset ID'),
    employeeId: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid employee ID'),
    conditionAtHandover: z.enum(ALL_ASSET_CONDITIONS).optional().default('Good'),
    accessories: z
      .array(
        z.object({
          name: z.string().min(1),
          serial: z.string().optional(),
          verified: z.boolean().optional().default(true),
        })
      )
      .optional()
      .default([]),
    expectedReturnDate: z.coerce.date().optional(),
    notes: z.string().optional(),
  }),
});

export const returnAssignmentSchema = z.object({
  body: z.object({
    conditionAtReturn: z.enum(ALL_ASSET_CONDITIONS),
    returnNotes: z.string().optional(),
  }),
});

export const transferAssignmentSchema = z.object({
  body: z.object({
    newEmployeeId: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid target employee ID'),
    conditionAtHandover: z.enum(ALL_ASSET_CONDITIONS).optional().default('Good'),
    expectedReturnDate: z.coerce.date().optional(),
    transferNotes: z.string().optional(),
  }),
});
