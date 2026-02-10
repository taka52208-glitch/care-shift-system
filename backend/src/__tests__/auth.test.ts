import { describe, it, expect, beforeEach, vi } from 'vitest';
import request from 'supertest';
import { createApp } from '../app.js';
import { prisma } from '../lib/prisma.js';
import bcrypt from 'bcryptjs';

const app = createApp();

const mockPrisma = prisma as unknown as {
  tenant: { findUnique: ReturnType<typeof vi.fn>; findFirst: ReturnType<typeof vi.fn>; create: ReturnType<typeof vi.fn> };
  user: { findUnique: ReturnType<typeof vi.fn>; findFirst: ReturnType<typeof vi.fn>; create: ReturnType<typeof vi.fn>; update: ReturnType<typeof vi.fn> };
  refreshToken: { findUnique: ReturnType<typeof vi.fn>; create: ReturnType<typeof vi.fn>; update: ReturnType<typeof vi.fn>; updateMany: ReturnType<typeof vi.fn> };
  shiftPattern: { createMany: ReturnType<typeof vi.fn> };
  constraint: { createMany: ReturnType<typeof vi.fn> };
  passwordResetToken: { create: ReturnType<typeof vi.fn>; findFirst: ReturnType<typeof vi.fn> };
  $transaction: ReturnType<typeof vi.fn>;
};

describe('POST /api/auth/register', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should return 400 when missing required fields', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({ email: 'test@example.com' });

    expect(res.status).toBe(400);
    expect(res.body.code).toBe('VALIDATION_ERROR');
  });

  it('should return 400 for invalid email format', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({
        tenantName: 'Test Facility',
        subdomain: 'test-facility',
        userName: 'Admin',
        email: 'not-an-email',
        password: 'Password123',
      });

    expect(res.status).toBe(400);
    expect(res.body.code).toBe('INVALID_EMAIL');
  });

  it('should return 400 for password too short', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({
        tenantName: 'Test Facility',
        subdomain: 'test-facility',
        userName: 'Admin',
        email: 'test@example.com',
        password: 'short1',
      });

    expect(res.status).toBe(400);
    expect(res.body.code).toBe('PASSWORD_TOO_SHORT');
  });

  it('should return 400 for weak password (no numbers)', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({
        tenantName: 'Test Facility',
        subdomain: 'test-facility',
        userName: 'Admin',
        email: 'test@example.com',
        password: 'PasswordOnly',
      });

    expect(res.status).toBe(400);
    expect(res.body.code).toBe('PASSWORD_TOO_WEAK');
  });

  it('should return 400 for invalid subdomain format', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({
        tenantName: 'Test Facility',
        subdomain: '-bad',
        userName: 'Admin',
        email: 'test@example.com',
        password: 'Password123',
      });

    expect(res.status).toBe(400);
    expect(res.body.code).toBe('INVALID_SUBDOMAIN');
  });

  it('should return 409 when subdomain already exists', async () => {
    mockPrisma.tenant.findUnique.mockResolvedValue({ id: 'existing-tenant' });

    const res = await request(app)
      .post('/api/auth/register')
      .send({
        tenantName: 'Test Facility',
        subdomain: 'existing-domain',
        userName: 'Admin',
        email: 'test@example.com',
        password: 'Password123',
      });

    expect(res.status).toBe(409);
    expect(res.body.code).toBe('SUBDOMAIN_EXISTS');
  });

  it('should return 201 on successful registration', async () => {
    mockPrisma.tenant.findUnique.mockResolvedValue(null);
    mockPrisma.$transaction.mockImplementation(async (fn: (tx: unknown) => Promise<unknown>) => {
      const mockTx = {
        tenant: {
          create: vi.fn().mockResolvedValue({
            id: 'tenant-1',
            name: 'Test Facility',
            subdomain: 'test-facility',
          }),
        },
        user: {
          create: vi.fn().mockResolvedValue({
            id: 'user-1',
            email: 'test@example.com',
            name: 'Admin',
            role: 'ADMIN',
          }),
        },
        shiftPattern: { createMany: vi.fn().mockResolvedValue({ count: 5 }) },
        constraint: { createMany: vi.fn().mockResolvedValue({ count: 8 }) },
      };
      return fn(mockTx);
    });
    mockPrisma.refreshToken.create.mockResolvedValue({ id: 'rt-1', token: 'refresh-token' });

    const res = await request(app)
      .post('/api/auth/register')
      .send({
        tenantName: 'Test Facility',
        subdomain: 'test-facility',
        userName: 'Admin',
        email: 'test@example.com',
        password: 'Password123',
      });

    expect(res.status).toBe(201);
    expect(res.body.user).toBeDefined();
    expect(res.body.user.email).toBe('test@example.com');
    expect(res.body.tenant).toBeDefined();
    expect(res.body.tenant.subdomain).toBe('test-facility');
    // Should set HttpOnly cookies
    const cookies = res.headers['set-cookie'];
    expect(cookies).toBeDefined();
    const cookieStr = Array.isArray(cookies) ? cookies.join('; ') : cookies;
    expect(cookieStr).toContain('access_token');
  });
});

describe('POST /api/auth/login', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should return 400 when missing credentials', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({});

    expect(res.status).toBe(400);
    expect(res.body.code).toBe('VALIDATION_ERROR');
  });

  it('should return 401 for non-existent user', async () => {
    mockPrisma.user.findFirst.mockResolvedValue(null);

    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'nobody@example.com', password: 'Password123' });

    expect(res.status).toBe(401);
    expect(res.body.code).toBe('INVALID_CREDENTIALS');
  });

  it('should return 401 for wrong password', async () => {
    const hashedPassword = await bcrypt.hash('CorrectPassword1', 10);
    mockPrisma.user.findFirst.mockResolvedValue({
      id: 'user-1',
      email: 'test@example.com',
      passwordHash: hashedPassword,
      name: 'Test User',
      role: 'ADMIN',
      tenantId: 'tenant-1',
      tenant: {
        id: 'tenant-1',
        name: 'Test',
        subdomain: 'test',
        subscriptionStatus: 'ACTIVE',
      },
    });

    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'test@example.com', password: 'WrongPassword1' });

    expect(res.status).toBe(401);
    expect(res.body.code).toBe('INVALID_CREDENTIALS');
  });

  it('should return 403 when subscription is inactive', async () => {
    const hashedPassword = await bcrypt.hash('Password123', 10);
    mockPrisma.user.findFirst.mockResolvedValue({
      id: 'user-1',
      email: 'test@example.com',
      passwordHash: hashedPassword,
      name: 'Test User',
      role: 'ADMIN',
      tenantId: 'tenant-1',
      tenant: {
        id: 'tenant-1',
        name: 'Test',
        subdomain: 'test',
        subscriptionStatus: 'CANCELED',
      },
    });

    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'test@example.com', password: 'Password123' });

    expect(res.status).toBe(403);
    expect(res.body.code).toBe('SUBSCRIPTION_INACTIVE');
  });

  it('should return 200 with user data on successful login', async () => {
    const hashedPassword = await bcrypt.hash('Password123', 10);
    mockPrisma.user.findFirst.mockResolvedValue({
      id: 'user-1',
      email: 'test@example.com',
      passwordHash: hashedPassword,
      name: 'Test User',
      role: 'ADMIN',
      tenantId: 'tenant-1',
      tenant: {
        id: 'tenant-1',
        name: 'Test Facility',
        subdomain: 'test',
        subscriptionStatus: 'ACTIVE',
      },
    });
    mockPrisma.refreshToken.create.mockResolvedValue({ id: 'rt-1', token: 'refresh-token' });

    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'test@example.com', password: 'Password123' });

    expect(res.status).toBe(200);
    expect(res.body.user.email).toBe('test@example.com');
    expect(res.body.user.role).toBe('ADMIN');
    expect(res.body.tenant.subdomain).toBe('test');
    // Should set HttpOnly cookies
    const cookies = res.headers['set-cookie'];
    expect(cookies).toBeDefined();
  });
});

describe('GET /api/auth/me', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should return 401 without auth token', async () => {
    const res = await request(app).get('/api/auth/me');
    expect(res.status).toBe(401);
  });
});

describe('POST /api/auth/check-subdomain', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should return available: true for new subdomain', async () => {
    mockPrisma.tenant.findUnique.mockResolvedValue(null);

    const res = await request(app)
      .post('/api/auth/check-subdomain')
      .send({ subdomain: 'new-facility' });

    expect(res.status).toBe(200);
    expect(res.body.available).toBe(true);
  });

  it('should return available: false for existing subdomain', async () => {
    mockPrisma.tenant.findUnique.mockResolvedValue({ id: 'tenant-1' });

    const res = await request(app)
      .post('/api/auth/check-subdomain')
      .send({ subdomain: 'existing' });

    expect(res.status).toBe(200);
    expect(res.body.available).toBe(false);
  });
});

describe('POST /api/auth/logout', () => {
  it('should return 200 and clear cookies', async () => {
    const res = await request(app).post('/api/auth/logout');

    expect(res.status).toBe(200);
    expect(res.body.message).toBeDefined();
  });
});

describe('GET /api/health', () => {
  it('should return health status', async () => {
    const res = await request(app).get('/api/health');

    expect(res.status).toBe(200);
    expect(res.body.status).toBe('ok');
  });
});
