import { AssetCategory } from '../../models/AssetCategory.js';
import { Department } from '../../models/Department.js';
import { Location } from '../../models/Location.js';
import { DEFAULT_ASSET_CATEGORIES } from '../../config/constants.js';
import { ConflictError, NotFoundError } from '../../utils/errors.js';

export class TaxonomyService {
  // ================= CATEGORIES =================
  static async listCategories(organizationId) {
    let categories = await AssetCategory.find({ organizationId, isActive: true }).sort({ name: 1 }).lean();

    // Auto-seed default 14 categories if none exist for this organization
    if (categories.length === 0) {
      const seedDocs = DEFAULT_ASSET_CATEGORIES.map((cat) => ({
        ...cat,
        organizationId,
      }));
      await AssetCategory.insertMany(seedDocs);
      categories = await AssetCategory.find({ organizationId, isActive: true }).sort({ name: 1 }).lean();
    }

    return categories.map((c) => ({
      id: c._id,
      name: c.name,
      code: c.code,
      isHardware: c.isHardware,
      description: c.description,
      defaultDepreciationYears: c.defaultDepreciationYears,
    }));
  }

  static async createCategory(organizationId, payload) {
    const { name, code, isHardware, description, defaultDepreciationYears } = payload;
    const normalizedCode = code.toUpperCase().trim();

    const existing = await AssetCategory.findOne({
      organizationId,
      $or: [{ name: name.trim() }, { code: normalizedCode }],
    });

    if (existing) {
      throw new ConflictError(`Category with name '${name}' or code '${normalizedCode}' already exists.`);
    }

    const category = await AssetCategory.create({
      organizationId,
      name: name.trim(),
      code: normalizedCode,
      isHardware: isHardware ?? true,
      description,
      defaultDepreciationYears: defaultDepreciationYears || 3,
    });

    return {
      id: category._id,
      name: category.name,
      code: category.code,
      isHardware: category.isHardware,
      defaultDepreciationYears: category.defaultDepreciationYears,
    };
  }

  // ================= DEPARTMENTS =================
  static async listDepartments(organizationId) {
    const depts = await Department.find({ organizationId, isActive: true }).sort({ name: 1 }).lean();
    return depts.map((d) => ({
      id: d._id,
      name: d.name,
      code: d.code,
      headOfDepartment: d.headOfDepartment,
      contactEmail: d.contactEmail,
      budgetMinor: d.budgetMinor,
    }));
  }

  static async createDepartment(organizationId, payload) {
    const { name, code, headOfDepartment, contactEmail, budgetMinor } = payload;
    const normalizedCode = code.toUpperCase().trim();

    const existing = await Department.findOne({
      organizationId,
      $or: [{ name: name.trim() }, { code: normalizedCode }],
    });

    if (existing) {
      throw new ConflictError(`Department with name '${name}' or code '${normalizedCode}' already exists.`);
    }

    const dept = await Department.create({
      organizationId,
      name: name.trim(),
      code: normalizedCode,
      headOfDepartment,
      contactEmail,
      budgetMinor: budgetMinor || 0,
    });

    return {
      id: dept._id,
      name: dept.name,
      code: dept.code,
      headOfDepartment: dept.headOfDepartment,
      contactEmail: dept.contactEmail,
    };
  }

  // ================= LOCATIONS =================
  static async listLocations(organizationId) {
    const locations = await Location.find({ organizationId, isActive: true })
      .sort({ building: 1, floor: 1, room: 1 })
      .lean();

    return locations.map((loc) => ({
      id: loc._id,
      campus: loc.campus,
      building: loc.building,
      floor: loc.floor,
      room: loc.room,
      name: loc.name,
      capacity: loc.capacity,
      isServerRoom: loc.isServerRoom,
    }));
  }

  static async createLocation(organizationId, payload) {
    const { campus, building, floor, room, capacity, isServerRoom } = payload;

    const existing = await Location.findOne({
      organizationId,
      building: building.trim(),
      floor: floor.trim(),
      room: room.trim(),
    });

    if (existing) {
      throw new ConflictError(`Location '${building} - ${floor} - ${room}' already exists in this organization.`);
    }

    const location = await Location.create({
      organizationId,
      campus: campus || 'Main Campus',
      building: building.trim(),
      floor: floor.trim(),
      room: room.trim(),
      capacity: capacity || 30,
      isServerRoom: isServerRoom || false,
    });

    return {
      id: location._id,
      campus: location.campus,
      building: location.building,
      floor: location.floor,
      room: location.room,
      name: location.name,
      isServerRoom: location.isServerRoom,
    };
  }
}
