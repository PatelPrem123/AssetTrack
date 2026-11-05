import express from 'express';
import {
  register,
  login,
  logout,
  getMe,
  createUser,
  listUsers,
} from '../controllers/authController.js';
import { protect, authorize, validate } from '../middleware/authMiddleware.js';
import {
  registerOrgSchema,
  loginSchema,
  createUserSchema,
} from '../validators/authValidator.js';
import { USER_ROLES } from '../config/constants.js';

const router = express.Router();

router.post('/register', validate(registerOrgSchema), register);
router.post('/login', validate(loginSchema), login);
router.post('/logout', logout);

// Protected user context
router.get('/me', protect, getMe);

// User administration
router.post(
  '/users',
  protect,
  authorize(USER_ROLES.ADMIN),
  validate(createUserSchema),
  createUser
);

router.get(
  '/users',
  protect,
  authorize(USER_ROLES.ADMIN, USER_ROLES.ASSET_MANAGER, USER_ROLES.AUDITOR),
  listUsers
);

export default router;
