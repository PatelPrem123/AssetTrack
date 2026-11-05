import Papa from 'papaparse';
import { Asset } from '../../models/Asset.js';
import { AssetCategory } from '../../models/AssetCategory.js';
import { Department } from '../../models/Department.js';
import { Location } from '../../models/Location.js';
import { generateUniqueAssetTag, generateOpaqueQRToken } from '../asset/tagGenerator.js';
import { Organization } from '../../models/Organization.js';
import { AuditLog } from '../../models/AuditLog.js';

export class ImportService {
  /**
   * Bulk imports hardware assets from a CSV text buffer with formula sanitization (DEC-006)
   */
  static async importAssetsFromCSV(organizationId, csvString, userId) {
    const org = await Organization.findById(organizationId);
    if (!org) throw new Error('Organization not found');

    const [categories, departments, locations] = await Promise.all([
      AssetCategory.find({ organizationId }).lean(),
      Department.find({ organizationId }).lean(),
      Location.find({ organizationId }).lean(),
    ]);

    const catMap = new Map(categories.map((c) => [c.code.toUpperCase(), c._id]));
    const deptMap = new Map(departments.map((d) => [d.code.toUpperCase(), d._id]));
    const locMap = new Map(locations.map((l) => [l.room.toUpperCase(), l._id]));

    // Default fallbacks if code matching fails
    const defaultCatId = categories[0]?._id;
    const defaultDeptId = departments[0]?._id;
    const defaultLocId = locations[0]?._id;

    const parsed = Papa.parse(csvString, {
      header: true,
      skipEmptyLines: true,
      trimHeaders: true,
    });

    const importedAssets = [];
    const errors = [];
    let skippedCount = 0;

    for (let i = 0; i < parsed.data.length; i++) {
      const row = parsed.data[i];
      const rowNum = i + 2; // Accounting for 1-based index + header row

      try {
        const name = row['Asset Name'] || row['name'] || row['Name'];
        const manufacturer = row['Manufacturer'] || row['manufacturer'] || 'Generic OEM';
        const model = row['Model'] || row['model'] || 'Enterprise Model';
        const serialNumber = row['Serial Number'] || row['serial'] || null;
        const catCode = (row['Category Code'] || row['category'] || '').toUpperCase().trim();
        const deptCode = (row['Department Code'] || row['department'] || '').toUpperCase().trim();
        const roomCode = (row['Room'] || row['location'] || '').toUpperCase().trim();

        if (!name) {
          skippedCount++;
          errors.push({ row: rowNum, error: 'Asset Name is required' });
          continue;
        }

        // Formula injection sanitization: strip leading =, +, -, @
        const sanitizeCell = (val) => (typeof val === 'string' && /^[=+\-@]/.test(val) ? `'${val}` : val);

        const categoryId = catMap.get(catCode) || defaultCatId;
        const departmentId = deptMap.get(deptCode) || defaultDeptId;
        const locationId = locMap.get(roomCode) || defaultLocId;

        // Check serial uniqueness if present
        if (serialNumber) {
          const exists = await Asset.findOne({ organizationId, serialNumber });
          if (exists) {
            skippedCount++;
            errors.push({ row: rowNum, error: `Serial '${serialNumber}' already exists in inventory` });
            continue;
          }
        }

        const assetTag = await generateUniqueAssetTag(organizationId);
        const qrCodeReference = generateOpaqueQRToken(org.code, assetTag);

        const asset = await Asset.create({
          organizationId,
          assetTag,
          qrCodeReference,
          name: sanitizeCell(name),
          manufacturer: sanitizeCell(manufacturer),
          model: sanitizeCell(model),
          serialNumber: serialNumber ? sanitizeCell(serialNumber) : undefined,
          categoryId,
          departmentId,
          locationId,
          status: 'Available',
          condition: 'Good',
        });

        importedAssets.push(asset);
      } catch (err) {
        skippedCount++;
        errors.push({ row: rowNum, error: err.message });
      }
    }

    if (importedAssets.length > 0) {
      await AuditLog.create({
        organizationId,
        action: 'ASSETS_BULK_IMPORTED',
        entityType: 'Asset',
        performedBy: userId,
        details: { count: importedAssets.length, skipped: skippedCount },
      });
    }

    return {
      importedCount: importedAssets.length,
      skippedCount,
      errors,
      importedAssets: importedAssets.map((a) => ({ id: a._id, assetTag: a.assetTag, name: a.name })),
    };
  }
}
