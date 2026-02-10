import { Request, Response, NextFunction } from 'express';
import { prisma, getTenantClient, TenantClient } from '../lib/prisma.js';
import { logger } from '../lib/logger.js';

// Extend Express Request type
declare global {
  namespace Express {
    interface Request {
      tenantId?: string;
      tenantClient?: TenantClient;
    }
  }
}

/**
 * Tenant resolver middleware
 * Identifies tenant from:
 * 1. Subdomain (e.g., facility-a.careshift.example.com)
 * 2. X-Tenant-ID header (for development/testing)
 * 3. JWT token (if authenticated)
 */
export const tenantResolver = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    let tenantId: string | undefined;
    let subdomain: string | undefined;

    // Method 1: Extract from subdomain
    const host = req.hostname || req.get('host') || '';
    const parts = host.split('.');

    // Check if it's a subdomain (e.g., demo.careshift.com or demo.localhost)
    if (parts.length >= 2 && parts[0] !== 'www' && parts[0] !== 'api') {
      subdomain = parts[0];
    }

    // Method 2: X-Tenant-ID header (for development)
    if (!subdomain && req.headers['x-tenant-id']) {
      tenantId = req.headers['x-tenant-id'] as string;
    }

    // Method 3: X-Tenant-Subdomain header (for development)
    if (!subdomain && req.headers['x-tenant-subdomain']) {
      subdomain = req.headers['x-tenant-subdomain'] as string;
    }

    // Look up tenant by subdomain if we have one
    if (subdomain && !tenantId) {
      const tenant = await prisma.tenant.findUnique({
        where: { subdomain },
        select: { id: true, subscriptionStatus: true },
      });

      if (tenant) {
        tenantId = tenant.id;

        // Check subscription status (allow TRIALING and ACTIVE)
        if (tenant.subscriptionStatus !== 'TRIALING' &&
            tenant.subscriptionStatus !== 'ACTIVE') {
          return res.status(403).json({
            error: 'サブスクリプションが無効です。お支払いをご確認ください。',
            code: 'SUBSCRIPTION_INACTIVE',
          });
        }
      }
    }

    // For public routes (like registration), tenant is not required
    if (tenantId) {
      req.tenantId = tenantId;
      req.tenantClient = getTenantClient(tenantId);
    }

    next();
  } catch (error) {
    logger.error('Tenant resolver error', { error: String(error) });
    next(error);
  }
};

/**
 * Require tenant middleware
 * Use this for routes that must have a tenant context
 */
export const requireTenant = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  if (!req.tenantId || !req.tenantClient) {
    return res.status(400).json({
      error: 'テナントを識別できません。',
      code: 'TENANT_REQUIRED',
    });
  }
  next();
};
