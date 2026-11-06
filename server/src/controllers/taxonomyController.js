import { TaxonomyService } from '../services/taxonomy/taxonomyService.js';

// Categories
export async function getCategories(req, res, next) {
  try {
    const categories = await TaxonomyService.listCategories(req.user?.organizationId);
    res.status(200).json({ success: true, count: categories.length, data: categories });
  } catch (error) {
    next(error);
  }
}

export async function createCategory(req, res, next) {
  try {
    const category = await TaxonomyService.createCategory(req.user.organizationId, req.body);
    res.status(201).json({ success: true, message: 'Category created', data: category });
  } catch (error) {
    next(error);
  }
}

// Departments
export async function getDepartments(req, res, next) {
  try {
    const departments = await TaxonomyService.listDepartments(req.user?.organizationId);
    res.status(200).json({ success: true, count: departments.length, data: departments });
  } catch (error) {
    next(error);
  }
}

export async function createDepartment(req, res, next) {
  try {
    const department = await TaxonomyService.createDepartment(req.user.organizationId, req.body);
    res.status(201).json({ success: true, message: 'Department created', data: department });
  } catch (error) {
    next(error);
  }
}

// Locations
export async function getLocations(req, res, next) {
  try {
    const locations = await TaxonomyService.listLocations(req.user?.organizationId);
    res.status(200).json({ success: true, count: locations.length, data: locations });
  } catch (error) {
    next(error);
  }
}

export async function createLocation(req, res, next) {
  try {
    const location = await TaxonomyService.createLocation(req.user.organizationId, req.body);
    res.status(201).json({ success: true, message: 'Location created', data: location });
  } catch (error) {
    next(error);
  }
}
