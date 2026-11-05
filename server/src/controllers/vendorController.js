import { VendorService } from '../services/vendor/vendorService.js';

export async function createVendor(req, res, next) {
  try {
    const vendor = await VendorService.createVendor(req.user.organizationId, req.body);
    res.status(201).json({ success: true, message: 'Vendor registered', data: vendor });
  } catch (error) {
    next(error);
  }
}

export async function listVendors(req, res, next) {
  try {
    const vendors = await VendorService.listVendors(req.user.organizationId);
    res.status(200).json({ success: true, count: vendors.length, data: vendors });
  } catch (error) {
    next(error);
  }
}

export async function createPurchaseRecord(req, res, next) {
  try {
    const record = await VendorService.createPurchaseRecord(req.user.organizationId, req.body);
    res.status(201).json({ success: true, message: 'Purchase record created', data: record });
  } catch (error) {
    next(error);
  }
}

export async function listPurchaseRecords(req, res, next) {
  try {
    const records = await VendorService.listPurchaseRecords(req.user.organizationId);
    res.status(200).json({ success: true, count: records.length, data: records });
  } catch (error) {
    next(error);
  }
}
