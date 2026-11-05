import express from 'express';
import {
  createAssignment,
  returnAssignment,
  transferAssignment,
  listAssignments,
  getOverdueAssignments,
} from '../controllers/assignmentController.js';
import { protect, authorize, validate } from '../middleware/authMiddleware.js';
import {
  createAssignmentSchema,
  returnAssignmentSchema,
  transferAssignmentSchema,
} from '../validators/assignmentValidator.js';
import { USER_ROLES } from '../config/constants.js';

const router = express.Router();

router.use(protect);

router.post(
  '/',
  authorize(USER_ROLES.ADMIN, USER_ROLES.ASSET_MANAGER),
  validate(createAssignmentSchema),
  createAssignment
);

router.post(
  '/:id/return',
  authorize(USER_ROLES.ADMIN, USER_ROLES.ASSET_MANAGER),
  validate(returnAssignmentSchema),
  returnAssignment
);

router.post(
  '/:id/transfer',
  authorize(USER_ROLES.ADMIN, USER_ROLES.ASSET_MANAGER),
  validate(transferAssignmentSchema),
  transferAssignment
);

router.get('/overdue', authorize(USER_ROLES.ADMIN, USER_ROLES.ASSET_MANAGER, USER_ROLES.AUDITOR), getOverdueAssignments);

router.get('/', listAssignments);

export default router;
