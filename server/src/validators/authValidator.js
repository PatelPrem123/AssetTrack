import { z } from 'zod';
import { ALL_ROLES } from '../config/constants.js';

export const registerOrgSchema = z.object({
  body: z.object({
    orgName: z
      .string()
      .min(2, 'Organization name must be at least 2 characters')
      .max(100, 'Organization name cannot exceed 100 characters'),
    orgCode: z
      .string()
      .min(2, 'Organization code must be at least 2 characters')
      .max(12, 'Organization code cannot exceed 12 characters')
      .regex(/^[A-Za-z0-9_-]+$/, 'Code can only contain letters, numbers, hyphens, and underscores'),
    name: z.string().min(2, 'Administrator name is required').max(100),
    email: z.string().email('Please enter a valid corporate email address'),
    password: z
      .string()
      .min(8, 'Password must be at least 8 characters')
      .regex(
        /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
        'Password must contain at least one uppercase letter, one lowercase letter, and one number'
      ),
    phone: z.string().optional(),
    assetTagPrefix: z.string().max(6).optional().default('AT'),
  }),
});

export const loginSchema = z.object({
  body: z.object({
    email: z.string().email('Please enter a valid email address'),
    password: z.string().min(1, 'Password is required'),
    orgCode: z.string().optional(), // Optional orgCode for disambiguation if needed
  }),
});

export const createUserSchema = z.object({
  body: z.object({
    name: z.string().min(2, 'User name is required').max(100),
    email: z.string().email('Please enter a valid email address'),
    password: z
      .string()
      .min(8, 'Password must be at least 8 characters')
      .regex(
        /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
        'Password must contain at least one uppercase letter, one lowercase letter, and one number'
      ),
    role: z.enum(ALL_ROLES, {
      errorMap: () => ({ message: `Role must be one of: ${ALL_ROLES.join(', ')}` }),
    }),
    employeeId: z.string().optional(),
    phone: z.string().optional(),
    departmentId: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid department ID').optional(),
  }),
});
