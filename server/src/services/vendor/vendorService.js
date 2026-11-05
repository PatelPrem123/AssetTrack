import { Vendor } from '../../models/Vendor.js';
import { PurchaseRecord } from '../../models/PurchaseRecord.js';
import { ConflictError, NotFoundError } from '../../utils/errors.js';

export class VendorService {
  static async createVendor(organizationId, payload) {
    const { name, vendorCode, contactPerson, email, phone, category, notes } = payload;
    const normalizedCode = vendorCode.toUpperCase().trim();

    const existing = await Vendor.findOne({ organizationId, vendorCode: normalizedCode });
    if (existing) {
      throw new ConflictError(`Vendor with code '${normalizedCode}' already exists.`);
    }

    return Vendor.create({
      organizationId,
      name: name.trim(),
      vendorCode: normalizedCode,
      contactPerson,
      email,
      phone,
      category: category || 'Distributor',
      notes,
    });
  }

  static async listVendors(organizationId) {
    return Vendor.find({ organizationId, isActive: true }).sort({ name: 1 }).lean();
  }

  static async createPurchaseRecord(organizationId, payload) {
    const { vendorId, invoiceNumber, purchaseDate, totalAmountMinor, warrantyStartDate, warrantyExpiryDate, warrantyType, assetIds, notes } = payload;

    const vendor = await Vendor.findOne({ _id: vendorId, organizationId });
    if (!vendor) throw new NotFoundError('Vendor');

    return PurchaseRecord.create({
      organizationId,
      vendorId,
      invoiceNumber: invoiceNumber.trim(),
      purchaseDate,
      totalAmountMinor,
      warrantyStartDate,
      warrantyExpiryDate,
      warrantyType: warrantyType || 'Standard OEM',
      assetIds: assetIds || [],
      notes,
    });
  }

  static async listPurchaseRecords(organizationId) {
    return PurchaseRecord.find({ organizationId })
      .populate('vendorId', 'name vendorCode category')
      .populate('assetIds', 'assetTag name model')
      .sort({ purchaseDate: -1 })
      .lean();
  }
}
