import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { getTenantClient, TenantClient } from '../lib/prisma.js';
import type { JWTPayload, AuthUser } from '../types/index.js';

if (!process.env.JWT_SECRET) {
  throw new Error('JWT_SECRET environment variable is required');
}
const JWT_SECRET: string = process.env.JWT_SECRET;
const JWT_EXPIRES_IN = '15m';
const REFRESH_TOKEN_EXPIRES_DAYS = 7;

const isProduction = process.env.NODE_ENV === 'production';

// Extend Express Request type
declare global {
  namespace Express {
    interface Request {
      user?: AuthUser;
      tenantId?: string;
      tenantClient?: TenantClient;
    }
  }
}

/**
 * Generate JWT access token (short-lived)
 */
export function generateToken(payload: Omit<JWTPayload, 'iat' | 'exp'>): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
}

/**
 * Generate refresh token (random string)
 */
export function generateRefreshToken(): string {
  return crypto.randomBytes(64).toString('hex');
}

/**
 * Get refresh token expiry date
 */
export function getRefreshTokenExpiry(): Date {
  return new Date(Date.now() + REFRESH_TOKEN_EXPIRES_DAYS * 24 * 60 * 60 * 1000);
}

/**
 * Verify JWT token
 */
export function verifyToken(token: string): JWTPayload {
  return jwt.verify(token, JWT_SECRET) as JWTPayload;
}

/**
 * Set auth cookies on response
 */
export function setAuthCookies(res: Response, accessToken: string, refreshToken?: string) {
  res.cookie('access_token', accessToken, {
    httpOnly: true,
    secure: isProduction,
    sameSite: 'lax',
    maxAge: 15 * 60 * 1000, // 15 minutes
    path: '/',
  });

  if (refreshToken) {
    res.cookie('refresh_token', refreshToken, {
      httpOnly: true,
      secure: isProduction,
      sameSite: 'lax',
      maxAge: REFRESH_TOKEN_EXPIRES_DAYS * 24 * 60 * 60 * 1000,
      path: '/api/auth',
    });
  }
}

/**
 * Clear auth cookies
 */
export function clearAuthCookies(res: Response) {
  res.clearCookie('access_token', { path: '/' });
  res.clearCookie('refresh_token', { path: '/api/auth' });
}

/**
 * Authentication middleware
 * Reads JWT from HttpOnly cookie (primary) or Authorization header (fallback)
 */
export function authMiddleware(req: Request, res: Response, next: NextFunction) {
  // Try cookie first, then Authorization header
  let token = req.cookies?.access_token;

  if (!token) {
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.split(' ')[1];
    }
  }

  if (!token) {
    return res.status(401).json({ error: '認証が必要です', code: 'AUTH_REQUIRED' });
  }

  try {
    const decoded = verifyToken(token);

    req.user = {
      userId: decoded.userId,
      tenantId: decoded.tenantId,
      email: decoded.email,
      role: decoded.role,
    };

    req.tenantId = decoded.tenantId;
    req.tenantClient = getTenantClient(decoded.tenantId);

    next();
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      return res.status(401).json({ error: 'トークンの有効期限が切れています', code: 'TOKEN_EXPIRED' });
    }
    return res.status(401).json({ error: 'トークンが無効です', code: 'INVALID_TOKEN' });
  }
}

/**
 * Admin role middleware
 */
export function adminMiddleware(req: Request, res: Response, next: NextFunction) {
  if (!req.user || req.user.role !== 'ADMIN') {
    return res.status(403).json({ error: '管理者権限が必要です', code: 'ADMIN_REQUIRED' });
  }
  next();
}

/**
 * Role-based access control middleware
 */
export function requireRole(...roles: string[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({ error: 'この操作を行う権限がありません', code: 'INSUFFICIENT_ROLE' });
    }
    next();
  };
}

/**
 * Optional auth middleware
 */
export function optionalAuth(req: Request, res: Response, next: NextFunction) {
  let token = req.cookies?.access_token;

  if (!token) {
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.split(' ')[1];
    }
  }

  if (!token) {
    return next();
  }

  try {
    const decoded = verifyToken(token);
    req.user = {
      userId: decoded.userId,
      tenantId: decoded.tenantId,
      email: decoded.email,
      role: decoded.role,
    };
    req.tenantId = decoded.tenantId;
    req.tenantClient = getTenantClient(decoded.tenantId);
  } catch {
    // Ignore invalid tokens in optional auth
  }

  next();
}

export type AuthRequest = Request;
