import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { getTenantClient, TenantClient } from '../lib/prisma.js';
import type { JWTPayload, AuthUser } from '../types/index.js';

const JWT_SECRET = process.env.JWT_SECRET || 'shift-system-secret-key-2024';
const JWT_EXPIRES_IN = '24h';

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
 * Generate JWT token
 */
export function generateToken(payload: Omit<JWTPayload, 'iat' | 'exp'>): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
}

/**
 * Verify JWT token
 */
export function verifyToken(token: string): JWTPayload {
  return jwt.verify(token, JWT_SECRET) as JWTPayload;
}

/**
 * Authentication middleware
 * Verifies JWT token and sets req.user, req.tenantId, req.tenantClient
 */
export function authMiddleware(req: Request, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: '認証が必要です', code: 'AUTH_REQUIRED' });
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = verifyToken(token);

    // Set user info
    req.user = {
      userId: decoded.userId,
      tenantId: decoded.tenantId,
      email: decoded.email,
      role: decoded.role,
    };

    // Set tenant context
    req.tenantId = decoded.tenantId;
    req.tenantClient = getTenantClient(decoded.tenantId);

    // Validate tenant consistency if tenant was already set by tenantResolver
    if (req.tenantId && req.tenantId !== decoded.tenantId) {
      return res.status(403).json({
        error: 'このテナントへのアクセス権がありません',
        code: 'TENANT_MISMATCH',
      });
    }

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
 * Must be used after authMiddleware
 */
export function adminMiddleware(req: Request, res: Response, next: NextFunction) {
  if (!req.user || req.user.role !== 'ADMIN') {
    return res.status(403).json({ error: '管理者権限が必要です', code: 'ADMIN_REQUIRED' });
  }
  next();
}

/**
 * Optional auth middleware
 * Sets user info if token is present, but doesn't require authentication
 */
export function optionalAuth(req: Request, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return next();
  }

  const token = authHeader.split(' ')[1];

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

// Backward compatibility alias
export type AuthRequest = Request;
