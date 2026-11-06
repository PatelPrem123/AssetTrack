import { AssetCategory } from '../../models/AssetCategory.js';
import { Department } from '../../models/Department.js';
import { Location } from '../../models/Location.js';
import { DEFAULT_ASSET_CATEGORIES } from '../../config/constants.js';
import { ConflictError, NotFoundError } from '../../utils/errors.js';

export class TaxonomyService {
  // ================= CATEGORIES =================
  static async listCategories(organizationId) {
    if (!organizationId) {
      // Fallback for unauthenticated guests: return standard hardware taxonomy
      return DEFAULT_ASSET_CATEGORIES.map((cat, idx) => ({
        _id: `seed-cat-${idx + 1}`,
        id: `seed-cat-${idx + 1}`,
        name: cat.name,
        code: cat.code,
        isHardware: cat.isHardware,
        description: `${cat.name} enterprise asset class`,
        defaultDepreciationYears: 3,
      }));
    }

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
      _id: c._id,
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
      _id: category._id,
      id: category._id,
      name: category.name,
      code: category.code,
      isHardware: category.isHardware,
      defaultDepreciationYears: category.defaultDepreciationYears,
    };
  }

  // ================= DEPARTMENTS =================
  static async listDepartments(organizationId) {
    const defaultDepts = [
      { name: 'IT & Infrastructure', code: 'IT', headOfDepartment: 'IT Lead', contactEmail: 'it@assettrack.internal' },
      { name: 'Engineering & R&D', code: 'ENG', headOfDepartment: 'Engineering Director', contactEmail: 'eng@assettrack.internal' },
      { name: 'Product & Design', code: 'PROD', headOfDepartment: 'Principal Architect', contactEmail: 'product@assettrack.internal' },
      { name: 'Operations & Facilities', code: 'OPS', headOfDepartment: 'Operations Lead', contactEmail: 'ops@assettrack.internal' },
      { name: 'Human Resources', code: 'HR', headOfDepartment: 'People Operations', contactEmail: 'hr@assettrack.internal' },
      { name: 'Finance & Accounts', code: 'FIN', headOfDepartment: 'Finance Controller', contactEmail: 'finance@assettrack.internal' },
    ];

    if (!organizationId) {
      return defaultDepts.map((d, idx) => ({
        _id: `seed-dept-${idx + 1}`,
        id: `seed-dept-${idx + 1}`,
        ...d,
      }));
    }

    let depts = await Department.find({ organizationId, isActive: true }).sort({ name: 1 }).lean();

    // Auto-seed default departments if none exist for this organization
    if (depts.length === 0) {
      const seedDocs = defaultDepts.map((d) => ({ ...d, organizationId }));
      await Department.insertMany(seedDocs);
      depts = await Department.find({ organizationId, isActive: true }).sort({ name: 1 }).lean();
    }

    return depts.map((d) => ({
      _id: d._id,
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
      _id: dept._id,
      id: dept._id,
      name: dept.name,
      code: dept.code,
      headOfDepartment: dept.headOfDepartment,
      contactEmail: dept.contactEmail,
    };
  }

  // ================= LOCATIONS =================
  static async listLocations(organizationId) {
    const defaultLocs = [
      { campus: 'Main HQ', building: 'Tower A', floor: '1st Floor', room: 'Server Room 101', capacity: 50, isServerRoom: true },
      { campus: 'Main HQ', building: 'Tower A', floor: '2nd Floor', room: 'IT Diagnostics Bay', capacity: 30, isServerRoom: false },
      { campus: 'Tech Hub', building: 'Tower B', floor: '4th Floor', room: 'Engineering Floor 402', capacity: 45, isServerRoom: false },
      { campus: 'Remote Depot', building: 'Logistics Center', floor: 'Ground Floor', room: 'Dispatched to Employee', capacity: 100, isServerRoom: false },
    ];

    if (!organizationId) {
      return defaultLocs.map((loc, idx) => ({
        _id: `seed-loc-${idx + 1}`,
        id: `seed-loc-${idx + 1}`,
        ...loc,
      }));
    }

    let locations = await Location.find({ organizationId, isActive: true })
      .sort({ building: 1, floor: 1, room: 1 })
      .lean();

    // Auto-seed default locations if none exist for this organization
    if (locations.length === 0) {
      const seedDocs = defaultLocs.map((l) => ({ ...l, organizationId }));
      await Location.insertMany(seedDocs);
      locations = await Location.find({ organizationId, isActive: true })
        .sort({ building: 1, floor: 1, room: 1 })
        .lean();
    }

    return locations.map((loc) => ({
      _id: loc._id,
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
      _id: location._id,
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
