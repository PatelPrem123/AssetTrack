import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';
import { User } from '../models/User.js';
import { Organization } from '../models/Organization.js';
import { UnauthorizedError, ForbiddenError } from '../utils/errors.js';

export async function protect(req, res, next) {
  try {
    let token = null;

    // 1. Check HttpOnly cookie
    if (req.cookies && req.cookies.token) {
      token = req.cookies.token;
    }
    // 2. Check Authorization Bearer header
    else if (req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
      throw new UnauthorizedError('Authentication required. Please sign in.');
    }

    // Verify token signature
    const decoded = jwt.verify(token, env.JWT_SECRET);

    // Fetch user with organization
    const user = await User.findById(decoded.id).lean();
    if (!user || !user.isActive) {
      throw new UnauthorizedError('User account not found or has been deactivated.');
    }

    // Check organization active status
    const org = await Organization.findById(user.organizationId).lean();
    if (!org || !org.isActive) {
      throw new UnauthorizedError('Organization account is inactive. Please contact support.');
    }

    // Attach verified user and organization context
    req.user = {
      _id: user._id,
      id: user._id.toString(),
      name: user.name,
      email: user.email,
      role: user.role,
      employeeId: user.employeeId,
      departmentId: user.departmentId,
      organizationId: user.organizationId,
      organizationCode: org.code,
      organizationName: org.name,
      settings: org.settings,
    };

    next();
  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      return next(new UnauthorizedError('Invalid authentication token'));
    }
    if (error.name === 'TokenExpiredError') {
      return next(new UnauthorizedError('Authentication session expired. Please sign in again.'));
    }
    next(error);
  }
}

/**
 * Optional authentication middleware:
 * If token is present and valid, attaches req.user.
 * If token is missing or invalid, proceeds without error as guest.
 */
export async function optionalProtect(req, res, next) {
  try {
    let token = null;
    if (req.cookies && req.cookies.token) {
      token = req.cookies.token;
    } else if (req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
      return next();
    }

    const decoded = jwt.verify(token, env.JWT_SECRET);
    const user = await User.findById(decoded.id).lean();
    if (user && user.isActive) {
      const org = await Organization.findById(user.organizationId).lean();
      if (org && org.isActive) {
        req.user = {
          _id: user._id,
          id: user._id.toString(),
          name: user.name,
          email: user.email,
          role: user.role,
          employeeId: user.employeeId,
          departmentId: user.departmentId,
          organizationId: user.organizationId,
          organizationCode: org.code,
          organizationName: org.name,
          settings: org.settings,
        };
      }
    }
    next();
  } catch {
    next();
  }
}

export function authorize(...roles) {
  return (req, res, next) => {
    if (!req.user) {
      return next(new UnauthorizedError('Authentication required'));
    }
    if (!roles.includes(req.user.role)) {
      return next(
        new ForbiddenError(
          `Access denied. Role '${req.user.role}' is not authorized to access this resource.`
        )
      );
    }
    next();
  };
}

export function validate(schema) {
  return async (req, res, next) => {
    try {
      const parsed = await schema.parseAsync({
        body: req.body,
        query: req.query,
        params: req.params,
      });
      req.body = parsed.body ?? req.body;
      req.query = parsed.query ?? req.query;
      req.params = parsed.params ?? req.params;
      next();
    } catch (error) {
      next(error);
    }
  };
}
