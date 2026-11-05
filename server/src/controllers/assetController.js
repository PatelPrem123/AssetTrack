import { AssetService } from '../services/asset/assetService.js';
import { QRService } from '../services/qr/qrService.js';
import { PDFLabelGenerator } from '../services/reports/pdfLabelGenerator.js';

export async function createAsset(req, res, next) {
  try {
    const meta = {
      ipAddress: req.ip || req.connection.remoteAddress,
      userAgent: req.headers['user-agent'],
    };

    const asset = await AssetService.registerAsset(
      req.user.organizationId,
      req.body,
      req.user._id,
      meta
    );

    res.status(201).json({
      success: true,
      message: `Asset registered with tag ${asset.assetTag}`,
      data: asset,
    });
  } catch (error) {
    next(error);
  }
}

export async function listAssets(req, res, next) {
  try {
    const { page, limit, status, categoryId, departmentId, locationId, assignedTo, search } = req.query;

    const result = await AssetService.listAssets(
      req.user.organizationId,
      { status, categoryId, departmentId, locationId, assignedTo, search },
      { page, limit }
    );

    res.status(200).json({
      success: true,
      count: result.assets.length,
      pagination: result.pagination,
      data: result.assets,
    });
  } catch (error) {
    next(error);
  }
}

export async function getAssetById(req, res, next) {
  try {
    const asset = await AssetService.getAssetById(req.user.organizationId, req.params.id);
    res.status(200).json({
      success: true,
      data: asset,
    });
  } catch (error) {
    next(error);
  }
}

export async function updateAsset(req, res, next) {
  try {
    const meta = {
      ipAddress: req.ip || req.connection.remoteAddress,
      userAgent: req.headers['user-agent'],
    };

    const asset = await AssetService.updateAsset(
      req.user.organizationId,
      req.params.id,
      req.body,
      req.user._id,
      meta
    );

    res.status(200).json({
      success: true,
      message: 'Asset updated successfully',
      data: asset,
    });
  } catch (error) {
    next(error);
  }
}

export async function retireAsset(req, res, next) {
  try {
    const meta = {
      ipAddress: req.ip || req.connection.remoteAddress,
      userAgent: req.headers['user-agent'],
    };

    const asset = await AssetService.retireAsset(
      req.user.organizationId,
      req.params.id,
      req.body,
      req.user._id,
      meta
    );

    res.status(200).json({
      success: true,
      message: `Asset ${asset.assetTag} successfully retired`,
      data: asset,
    });
  } catch (error) {
    next(error);
  }
}

export async function getAssetQR(req, res, next) {
  try {
    const asset = await AssetService.getAssetById(req.user.organizationId, req.params.id);
    const [qrDataUrl, qrSvg] = await Promise.all([
      QRService.generateQRCodeDataUrl(asset.qrCodeReference),
      QRService.generateQRCodeSVG(asset.qrCodeReference),
    ]);

    res.status(200).json({
      success: true,
      data: {
        assetTag: asset.assetTag,
        qrCodeReference: asset.qrCodeReference,
        qrDataUrl,
        qrSvg,
      },
    });
  } catch (error) {
    next(error);
  }
}

export async function downloadLabelPDF(req, res, next) {
  try {
    const asset = await AssetService.getAssetById(req.user.organizationId, req.params.id);
    const pdfBuffer = await PDFLabelGenerator.generateAssetLabelPDF(asset, req.user.organizationName);

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="Asset-Label-${asset.assetTag}.pdf"`);
    res.send(pdfBuffer);
  } catch (error) {
    next(error);
  }
}

export async function resolveScannedQR(req, res, next) {
  try {
    const profile = await AssetService.getAssetByQRReference(
      req.user.organizationId,
      req.params.qrRef,
      req.user.role
    );

    res.status(200).json({
      success: true,
      data: profile,
    });
  } catch (error) {
    next(error);
  }
}
