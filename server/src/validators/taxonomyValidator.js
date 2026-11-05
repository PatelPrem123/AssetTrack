import { z } from 'zod';

export const categorySchema = z.object({
  body: z.object({
    name: z.string().min(2).max(60),
    code: z.string().min(2).max(10).regex(/^[A-Za-z0-9_-]+$/),
    isHardware: z.boolean().optional().default(true),
    description: z.string().optional(),
    defaultDepreciationYears: z.coerce.number().min(1).max(20).optional().default(3),
  }),
});

export const departmentSchema = z.object({
  body: z.object({
    name: z.string().min(2).max(80),
    code: z.string().min(2).max(10).regex(/^[A-Za-z0-9_-]+$/),
    headOfDepartment: z.string().optional(),
    contactEmail: z.string().email().optional(),
    budgetMinor: z.coerce.number().int().min(0).optional().default(0),
  }),
});

export const locationSchema = z.object({
  body: z.object({
    campus: z.string().min(2).max(60).optional().default('Main Campus'),
    building: z.string().min(1).max(60),
    floor: z.string().min(1).max(40),
    room: z.string().min(1).max(60),
    capacity: z.coerce.number().int().min(1).optional().default(30),
    isServerRoom: z.boolean().optional().default(false),
  }),
});
