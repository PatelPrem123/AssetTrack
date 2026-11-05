import { Organization } from '../../models/Organization.js';
import { User } from '../../models/User.js';
import { AuditLog } from '../../models/AuditLog.js';
import { USER_ROLES } from '../../config/constants.js';
import { BadRequestError, UnauthorizedError, ConflictError, NotFoundError } from '../../utils/errors.js';

export class AuthService {
  static async registerOrganization(payload, meta = {}) {
    const { orgName, orgCode, name, email, password, phone, assetTagPrefix } = payload;
    const normalizedCode = orgCode.toUpperCase().trim();

    // Check organization code uniqueness
    const existingOrg = await Organization.findOne({ code: normalizedCode });
    if (existingOrg) {
      throw new ConflictError(`Organization code '${normalizedCode}' is already taken.`);
    }

    // Create Organization document
    const org = await Organization.create({
      name: orgName.trim(),
      code: normalizedCode,
      contactEmail: email.toLowerCase().trim(),
      phone,
      settings: {
        assetTagPrefix: (assetTagPrefix || 'AT').toUpperCase(),
      },
    });

    // Create root Organization Administrator
    const adminUser = await User.create({
      organizationId: org._id,
      name: name.trim(),
      email: email.toLowerCase().trim(),
      password,
      role: USER_ROLES.ADMIN,
      phone,
    });

    // Write audit event
    await AuditLog.create({
      organizationId: org._id,
      action: 'ORGANIZATION_REGISTERED',
      entityType: 'Organization',
      entityId: org._id,
      performedBy: adminUser._id,
      ipAddress: meta.ipAddress,
      userAgent: meta.userAgent,
      details: { orgCode: org.code, adminEmail: adminUser.email },
    });

    const token = adminUser.generateToken();

    return {
      organization: {
        id: org._id,
        name: org.name,
        code: org.code,
        settings: org.settings,
      },
      user: {
        id: adminUser._id,
        name: adminUser.name,
        email: adminUser.email,
        role: adminUser.role,
        organizationId: org._id,
      },
      token,
    };
  }

  static async login({ email, password, orgCode }, meta = {}) {
    const query = { email: email.toLowerCase().trim() };

    // If orgCode provided, narrow search to that organization
    if (orgCode) {
      const org = await Organization.findOne({ code: orgCode.toUpperCase().trim() });
      if (!org) throw new UnauthorizedError('Invalid organization code or credentials.');
      query.organizationId = org._id;
    }

    const user = await User.findOne(query).select('+password');
    if (!user) {
      throw new UnauthorizedError('Invalid email or password.');
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      throw new UnauthorizedError('Invalid email or password.');
    }

    if (!user.isActive) {
      throw new UnauthorizedError('User account is deactivated.');
    }

    const org = await Organization.findById(user.organizationId);
    if (!org || !org.isActive) {
      throw new UnauthorizedError('Organization account is deactivated.');
    }

    // Update last login timestamp
    user.lastLoginAt = new Date();
    await user.save({ validateBeforeSave: false });

    // Write login audit log
    await AuditLog.create({
      organizationId: org._id,
      action: 'USER_LOGIN',
      entityType: 'User',
      entityId: user._id,
      performedBy: user._id,
      ipAddress: meta.ipAddress,
      userAgent: meta.userAgent,
    });

    const token = user.generateToken();

    return {
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        employeeId: user.employeeId,
        organizationId: org._id,
        organizationCode: org.code,
        organizationName: org.name,
        settings: org.settings,
      },
      token,
    };
  }

  static async createUser(organizationId, payload, adminId, meta = {}) {
    const { name, email, password, role, employeeId, phone, departmentId } = payload;
    const normalizedEmail = email.toLowerCase().trim();

    // Enforce tenant scoping: check if email already registered in this organization
    const existing = await User.findOne({ organizationId, email: normalizedEmail });
    if (existing) {
      throw new ConflictError(`User with email '${normalizedEmail}' already exists in this organization.`);
    }

    const newUser = await User.create({
      organizationId,
      name: name.trim(),
      email: normalizedEmail,
      password,
      role,
      employeeId,
      phone,
      departmentId,
    });

    await AuditLog.create({
      organizationId,
      action: 'USER_CREATED',
      entityType: 'User',
      entityId: newUser._id,
      performedBy: adminId,
      ipAddress: meta.ipAddress,
      userAgent: meta.userAgent,
      details: { role: newUser.role, email: newUser.email },
    });

    return {
      id: newUser._id,
      name: newUser.name,
      email: newUser.email,
      role: newUser.role,
      employeeId: newUser.employeeId,
      isActive: newUser.isActive,
    };
  }

  static async listUsers(organizationId, filter = {}) {
    const query = { organizationId };

    if (filter.role) query.role = filter.role;
    if (filter.isActive !== undefined) query.isActive = filter.isActive;
    if (filter.search) {
      query.$or = [
        { name: { $regex: filter.search, $options: 'i' } },
        { email: { $regex: filter.search, $options: 'i' } },
        { employeeId: { $regex: filter.search, $options: 'i' } },
      ];
    }

    const users = await User.find(query)
      .select('-__v')
      .populate('departmentId', 'name code')
      .sort({ createdAt: -1 })
      .lean();

    return users.map((u) => ({
      id: u._id,
      name: u.name,
      email: u.email,
      role: u.role,
      employeeId: u.employeeId,
      department: u.departmentId,
      isActive: u.isActive,
      lastLoginAt: u.lastLoginAt,
      createdAt: u.createdAt,
    }));
  }
}
