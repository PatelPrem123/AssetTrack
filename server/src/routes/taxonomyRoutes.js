import express from 'express';
import {
  getCategories,
  createCategory,
  getDepartments,
  createDepartment,
  getLocations,
  createLocation,
} from '../controllers/taxonomyController.js';
import { protect, optionalProtect, authorize, validate } from '../middleware/authMiddleware.js';
import {
  categorySchema,
  departmentSchema,
  locationSchema,
} from '../validators/taxonomyValidator.js';
import { USER_ROLES } from '../config/constants.js';

const router = express.Router();

// Categories: public/optional read so registration forms are always populated
router.get('/categories', optionalProtect, getCategories);
router.post(
  '/categories',
  protect,
  authorize(USER_ROLES.ADMIN, USER_ROLES.ASSET_MANAGER),
  validate(categorySchema),
  createCategory
);

// Departments: public/optional read so dropdowns have fallback options
router.get('/departments', optionalProtect, getDepartments);
router.post(
  '/departments',
  protect,
  authorize(USER_ROLES.ADMIN, USER_ROLES.ASSET_MANAGER),
  validate(departmentSchema),
  createDepartment
);

// Locations: public/optional read so dropdowns have fallback options
router.get('/locations', optionalProtect, getLocations);
router.post(
  '/locations',
  protect,
  authorize(USER_ROLES.ADMIN, USER_ROLES.ASSET_MANAGER),
  validate(locationSchema),
  createLocation
);

export default router;
