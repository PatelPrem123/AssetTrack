import express from 'express';
import {
  getCategories,
  createCategory,
  getDepartments,
  createDepartment,
  getLocations,
  createLocation,
} from '../controllers/taxonomyController.js';
import { protect, authorize, validate } from '../middleware/authMiddleware.js';
import {
  categorySchema,
  departmentSchema,
  locationSchema,
} from '../validators/taxonomyValidator.js';
import { USER_ROLES } from '../config/constants.js';

const router = express.Router();

// Categories
router.get('/categories', protect, getCategories);
router.post(
  '/categories',
  protect,
  authorize(USER_ROLES.ADMIN, USER_ROLES.ASSET_MANAGER),
  validate(categorySchema),
  createCategory
);

// Departments
router.get('/departments', protect, getDepartments);
router.post(
  '/departments',
  protect,
  authorize(USER_ROLES.ADMIN, USER_ROLES.ASSET_MANAGER),
  validate(departmentSchema),
  createDepartment
);

// Locations
router.get('/locations', protect, getLocations);
router.post(
  '/locations',
  protect,
  authorize(USER_ROLES.ADMIN, USER_ROLES.ASSET_MANAGER),
  validate(locationSchema),
  createLocation
);

export default router;
