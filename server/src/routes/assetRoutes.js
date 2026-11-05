import express from 'express';
import {
  createAsset,
  listAssets,
  getAssetById,
  updateAsset,
  retireAsset,
  getAssetQR,
  downloadLabelPDF,
  resolveScannedQR,
} from '../controllers/assetController.js';
import { protect, authorize, validate } from '../middleware/authMiddleware.js';
import {
  createAssetSchema,
  updateAssetSchema,
  retireAssetSchema,
} from '../validators/assetValidator.js';
import { USER_ROLES } from '../config/constants.js';

const router = express.Router();

// All asset endpoints enforce authentication (DEC-007)
router.use(protect);

router.post(
  '/',
  authorize(USER_ROLES.ADMIN, USER_ROLES.ASSET_MANAGER),
  validate(createAssetSchema),
  createAsset
);

router.get('/', listAssets);

router.get('/scan/:qrRef', resolveScannedQR);

router.get('/:id', getAssetById);

router.patch(
  '/:id',
  authorize(USER_ROLES.ADMIN, USER_ROLES.ASSET_MANAGER),
  validate(updateAssetSchema),
  updateAsset
);

router.post(
  '/:id/retire',
  authorize(USER_ROLES.ADMIN, USER_ROLES.ASSET_MANAGER),
  validate(retireAssetSchema),
  retireAsset
);

router.get('/:id/qr', getAssetQR);
router.get('/:id/label.pdf', downloadLabelPDF);

export default router;
