import { vi } from 'vitest';

// Set test environment
process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test-jwt-secret-for-vitest-12345';

// Mock prisma
vi.mock('../lib/prisma.js', () => {
  const mockPrisma = {
    tenant: {
      findUnique: vi.fn(),
      findFirst: vi.fn(),
      create: vi.fn(),
    },
    user: {
      findUnique: vi.fn(),
      findFirst: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
    },
    refreshToken: {
      findUnique: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      updateMany: vi.fn(),
    },
    shiftPattern: {
      createMany: vi.fn(),
      findMany: vi.fn(),
      findFirst: vi.fn(),
    },
    constraint: {
      createMany: vi.fn(),
      findMany: vi.fn(),
    },
    passwordResetToken: {
      create: vi.fn(),
      findFirst: vi.fn(),
      update: vi.fn(),
    },
    staff: {
      findMany: vi.fn(),
      findFirst: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    },
    $transaction: vi.fn((fn: (tx: unknown) => Promise<unknown>) => {
      // For callback-style transactions, pass the mock prisma itself
      if (typeof fn === 'function') {
        return fn(mockPrisma);
      }
      // For array-style transactions, resolve all promises
      return Promise.all(fn);
    }),
    $queryRaw: vi.fn(),
    $disconnect: vi.fn(),
  };

  return {
    prisma: mockPrisma,
    getTenantClient: vi.fn((tenantId: string) => ({
      tenantId,
      prisma: mockPrisma,
    })),
  };
});

// Mock email sending
vi.mock('../lib/email.js', () => ({
  sendWelcomeEmail: vi.fn().mockResolvedValue(undefined),
  sendPasswordResetEmail: vi.fn().mockResolvedValue(undefined),
}));

// Mock logger
vi.mock('../lib/logger.js', () => ({
  logger: {
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    debug: vi.fn(),
  },
}));

// Mock tenant middleware to pass through without DB lookup
vi.mock('../middleware/tenant.js', () => ({
  tenantResolver: (_req: unknown, _res: unknown, next: () => void) => next(),
  requireTenant: (_req: unknown, _res: unknown, next: () => void) => next(),
}));
