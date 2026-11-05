import { AuthService } from '../services/auth/authService.js';
import { env } from '../config/env.js';

function setAuthCookie(res, token) {
  const isProduction = env.NODE_ENV === 'production';
  res.cookie('token', token, {
    httpOnly: true,
    secure: isProduction,
    sameSite: isProduction ? 'strict' : 'lax',
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    signed: false,
  });
}

export async function register(req, res, next) {
  try {
    const meta = {
      ipAddress: req.ip || req.connection.remoteAddress,
      userAgent: req.headers['user-agent'],
    };

    const result = await AuthService.registerOrganization(req.body, meta);
    setAuthCookie(res, result.token);

    res.status(201).json({
      success: true,
      message: 'Organization and root Administrator registered successfully',
      data: result,
    });
  } catch (error) {
    next(error);
  }
}

export async function login(req, res, next) {
  try {
    const meta = {
      ipAddress: req.ip || req.connection.remoteAddress,
      userAgent: req.headers['user-agent'],
    };

    const result = await AuthService.login(req.body, meta);
    setAuthCookie(res, result.token);

    res.status(200).json({
      success: true,
      message: 'Login successful',
      data: result,
    });
  } catch (error) {
    next(error);
  }
}

export async function logout(req, res) {
  res.cookie('token', '', {
    httpOnly: true,
    expires: new Date(0),
  });

  res.status(200).json({
    success: true,
    message: 'Signed out successfully',
  });
}

export async function getMe(req, res) {
  res.status(200).json({
    success: true,
    data: {
      user: req.user,
    },
  });
}

export async function createUser(req, res, next) {
  try {
    const meta = {
      ipAddress: req.ip || req.connection.remoteAddress,
      userAgent: req.headers['user-agent'],
    };

    const user = await AuthService.createUser(
      req.user.organizationId,
      req.body,
      req.user._id,
      meta
    );

    res.status(201).json({
      success: true,
      message: `User '${user.name}' created with role '${user.role}'`,
      data: user,
    });
  } catch (error) {
    next(error);
  }
}

export async function listUsers(req, res, next) {
  try {
    const users = await AuthService.listUsers(req.user.organizationId, req.query);

    res.status(200).json({
      success: true,
      count: users.length,
      data: users,
    });
  } catch (error) {
    next(error);
  }
}
