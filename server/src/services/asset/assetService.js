import { Asset } from '../../models/Asset.js';
import { AuditLog } from '../../models/AuditLog.js';
import { Organization } from '../../models/Organization.js';
import { generateUniqueAssetTag, generateOpaqueQRToken } from './tagGenerator.js';
import { QRService } from '../qr/qrService.js';
import { ConflictError, NotFoundError, BadRequestError } from '../../utils/errors.js';
import { ASSET_STATUSES } from '../../config/constants.js';

export class AssetService {
  static async registerAsset(organizationId, payload, userId, meta = {}) {
    const org = await Organization.findById(organizationId);
    if (!org) throw new NotFoundError('Organization not found');

    // 1. Generate or validate unique Asset Tag
    let assetTag = payload.assetTag ? payload.assetTag.toUpperCase().trim() : null;
    if (!assetTag) {
      assetTag = await generateUniqueAssetTag(organizationId);
    } else {
      const existing = await Asset.findOne({ organizationId, assetTag });
      if (existing) {
        throw new ConflictError(`Asset tag '${assetTag}' is already registered in this organization.`);
      }
    }

    // 2. Check serial number uniqueness if provided
    if (payload.serialNumber) {
      const existingSerial = await Asset.findOne({
        organizationId,
        serialNumber: payload.serialNumber.trim(),
      });
      if (existingSerial) {
        throw new ConflictError(`Serial number '${payload.serialNumber}' is already registered.`);
      }
    }

    // 3. Generate non-sensitive opaque QR reference token (DEC-004)
    const qrCodeReference = generateOpaqueQRToken(org.code, assetTag);

    // 4. Create Asset document
    const asset = await Asset.create({
      ...payload,
      organizationId,
      assetTag,
      qrCodeReference,
      status: payload.status || ASSET_STATUSES.AVAILABLE,
    });

    // 5. Create audit trail
    await AuditLog.create({
      organizationId,
      action: 'ASSET_REGISTERED',
      entityType: 'Asset',
      entityId: asset._id,
      performedBy: userId,
      ipAddress: meta.ipAddress,
      userAgent: meta.userAgent,
      details: {
        assetTag: asset.assetTag,
        name: asset.name,
        category: asset.categoryId,
      },
    });

    return asset;
  }

  static async getAssetById(organizationId, id) {
    const asset = await Asset.findOne({ _id: id, organizationId })
      .populate('categoryId', 'name code isHardware')
      .populate('departmentId', 'name code')
      .populate('locationId', 'name campus building floor room')
      .populate('assignedTo', 'name email employeeId role')
      .lean();

    if (!asset) throw new NotFoundError('Asset');
    return asset;
  }

  static async listAssets(organizationId, filter = {}, pagination = { page: 1, limit: 50 }) {
    const query = { organizationId };

    if (filter.status) query.status = filter.status;
    if (filter.categoryId) query.categoryId = filter.categoryId;
    if (filter.departmentId) query.departmentId = filter.departmentId;
    if (filter.locationId) query.locationId = filter.locationId;
    if (filter.assignedTo) query.assignedTo = filter.assignedTo;
    if (filter.search) {
      query.$or = [
        { name: { $regex: filter.search, $options: 'i' } },
        { assetTag: { $regex: filter.search, $options: 'i' } },
        { serialNumber: { $regex: filter.search, $options: 'i' } },
        { manufacturer: { $regex: filter.search, $options: 'i' } },
        { model: { $regex: filter.search, $options: 'i' } },
      ];
    }

    const page = Math.max(1, parseInt(pagination.page, 10) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(pagination.limit, 10) || 50));
    const skip = (page - 1) * limit;

    const [assets, totalCount] = await Promise.all([
      Asset.find(query)
        .populate('categoryId', 'name code isHardware')
        .populate('departmentId', 'name code')
        .populate('locationId', 'name building room')
        .populate('assignedTo', 'name email employeeId')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Asset.countDocuments(query),
    ]);

    return {
      assets,
      pagination: {
        page,
        limit,
        totalCount,
        totalPages: Math.ceil(totalCount / limit),
      },
    };
  }

  static async updateAsset(organizationId, id, payload, userId, meta = {}) {
    const asset = await Asset.findOne({ _id: id, organizationId });
    if (!asset) throw new NotFoundError('Asset');

    const previousSpecs = JSON.stringify(asset.specifications);

    // Update permissible fields
    Object.assign(asset, payload);
    await asset.save();

    await AuditLog.create({
      organizationId,
      action: 'ASSET_UPDATED',
      entityType: 'Asset',
      entityId: asset._id,
      performedBy: userId,
      ipAddress: meta.ipAddress,
      userAgent: meta.userAgent,
      details: {
        modifiedFields: Object.keys(payload),
        specsChanged: previousSpecs !== JSON.stringify(asset.specifications),
      },
    });

    return asset;
  }

  static async retireAsset(organizationId, id, payload, userId, meta = {}) {
    const asset = await Asset.findOne({ _id: id, organizationId });
    if (!asset) throw new NotFoundError('Asset');

    if (asset.status === ASSET_STATUSES.ASSIGNED) {
      throw new BadRequestError('Cannot retire an asset that is currently assigned. Process asset return first.');
    }

    asset.status = ASSET_STATUSES.RETIRED;
    asset.notes = (asset.notes ? asset.notes + '\n' : '') + `Retired: ${payload.reason} (${payload.disposalMethod || 'Storage'})`;
    await asset.save();

    await AuditLog.create({
      organizationId,
      action: 'ASSET_RETIRED',
      entityType: 'Asset',
      entityId: asset._id,
      performedBy: userId,
      ipAddress: meta.ipAddress,
      userAgent: meta.userAgent,
      details: { reason: payload.reason, disposalMethod: payload.disposalMethod },
    });

    return asset;
  }

  static async getAssetByQRReference(organizationId, qrRef, userRole) {
    const asset = await Asset.findOne({ organizationId, qrCodeReference: qrRef })
      .populate('categoryId', 'name code isHardware')
      .populate('departmentId', 'name code')
      .populate('locationId', 'name campus building floor room')
      .populate('assignedTo', 'name email employeeId role')
      .lean();

    if (!asset) throw new NotFoundError('Scanned asset QR code');

    // Role-tailored triage payload (DEC-004)
    if (userRole === 'Employee') {
      return {
        id: asset._id,
        assetTag: asset.assetTag,
        name: asset.name,
        category: asset.categoryId?.name,
        manufacturer: asset.manufacturer,
        model: asset.model,
        status: asset.status,
        condition: asset.condition,
        assignedTo: asset.assignedTo?.name,
        allowReportMalfunction: true,
      };
    }

    // Full specs for Technicians, Managers, and Admins
    return asset;
  }
}
