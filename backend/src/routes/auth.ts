import { Router, Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import { prisma } from '../lib/prisma.js';
import { generateToken, generateRefreshToken, getRefreshTokenExpiry, setAuthCookies, clearAuthCookies, authMiddleware } from '../middleware/auth.js';
import { sendWelcomeEmail, sendPasswordResetEmail } from '../lib/email.js';
import { logger } from '../lib/logger.js';
import type { RegisterRequest, LoginRequest } from '../types/index.js';

const router = Router();

/**
 * POST /api/auth/register
 * Register new tenant and admin user
 */
router.post('/register', async (req: Request, res: Response) => {
  try {
    const { tenantName, subdomain, email, password, userName } = req.body as RegisterRequest;

    // Validation
    if (!tenantName || !subdomain || !email || !password || !userName) {
      return res.status(400).json({
        error: '全ての項目を入力してください',
        code: 'VALIDATION_ERROR',
      });
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({
        error: '有効なメールアドレスを入力してください',
        code: 'INVALID_EMAIL',
      });
    }

    // Validate password strength
    if (password.length < 8) {
      return res.status(400).json({
        error: 'パスワードは8文字以上で入力してください',
        code: 'PASSWORD_TOO_SHORT',
      });
    }

    if (!/[A-Za-z]/.test(password) || !/[0-9]/.test(password)) {
      return res.status(400).json({
        error: 'パスワードには英字と数字の両方を含めてください',
        code: 'PASSWORD_TOO_WEAK',
      });
    }

    // Validate subdomain format
    const subdomainRegex = /^[a-z0-9][a-z0-9-]{1,30}[a-z0-9]$/;
    if (!subdomainRegex.test(subdomain)) {
      return res.status(400).json({
        error: 'サブドメインは3-32文字の英数字とハイフンのみ使用可能です（ハイフンは先頭・末尾不可）',
        code: 'INVALID_SUBDOMAIN',
      });
    }

    // Check if subdomain already exists
    const existingTenant = await prisma.tenant.findUnique({
      where: { subdomain },
    });

    if (existingTenant) {
      return res.status(409).json({
        error: 'このサブドメインは既に使用されています',
        code: 'SUBDOMAIN_EXISTS',
      });
    }

    // Create tenant and admin user in transaction
    const result = await prisma.$transaction(async (tx) => {
      // Create tenant
      const tenant = await tx.tenant.create({
        data: {
          name: tenantName,
          subdomain,
          subscriptionStatus: 'TRIALING',
          trialEndsAt: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000), // 14 days trial
        },
      });

      // Create admin user
      const hashedPassword = await bcrypt.hash(password, 10);
      const user = await tx.user.create({
        data: {
          tenantId: tenant.id,
          email,
          passwordHash: hashedPassword,
          name: userName,
          role: 'ADMIN',
        },
      });

      // Create default shift patterns
      const patterns = [
        { name: '早番', code: 'E', startTime: '07:00', endTime: '16:00', breakTime: 60, color: '#fbbf24' },
        { name: '日勤', code: 'D', startTime: '09:00', endTime: '18:00', breakTime: 60, color: '#22c55e' },
        { name: '遅番', code: 'L', startTime: '12:00', endTime: '21:00', breakTime: 60, color: '#3b82f6' },
        { name: '夜勤', code: 'N', startTime: '21:00', endTime: '07:00', breakTime: 120, color: '#8b5cf6' },
        { name: '公休', code: 'O', startTime: '-', endTime: '-', breakTime: 0, color: '#94a3b8' },
      ];

      await tx.shiftPattern.createMany({
        data: patterns.map((p) => ({ ...p, tenantId: tenant.id })),
      });

      // Create default constraints
      const constraints = [
        { category: 'staffing', key: 'minDayStaff', value: '3' },
        { category: 'staffing', key: 'minNightStaff', value: '2' },
        { category: 'staffing', key: 'minQualifiedDay', value: '1' },
        { category: 'workLimit', key: 'maxConsecutiveDays', value: '5' },
        { category: 'workLimit', key: 'maxNightShifts', value: '8' },
        { category: 'workLimit', key: 'restAfterNight', value: '1' },
        { category: 'holiday', key: 'weeklyHolidays', value: '2' },
        { category: 'holiday', key: 'minMonthlyHolidays', value: '8' },
      ];

      await tx.constraint.createMany({
        data: constraints.map((c) => ({ ...c, tenantId: tenant.id })),
      });

      return { tenant, user };
    });

    // Generate tokens
    const token = generateToken({
      userId: result.user.id,
      tenantId: result.tenant.id,
      email: result.user.email,
      role: result.user.role,
    });

    const refreshToken = generateRefreshToken();
    await prisma.refreshToken.create({
      data: {
        userId: result.user.id,
        token: refreshToken,
        expiresAt: getRefreshTokenExpiry(),
      },
    });

    // Set HttpOnly cookies
    setAuthCookies(res, token, refreshToken);

    // Send welcome email (async, don't wait)
    sendWelcomeEmail(email, userName, tenantName).catch((err) => logger.error('Failed to send welcome email', { error: String(err) }));

    res.status(201).json({
      message: '登録が完了しました',
      token,
      user: {
        id: result.user.id,
        email: result.user.email,
        name: result.user.name,
        role: result.user.role,
      },
      tenant: {
        id: result.tenant.id,
        name: result.tenant.name,
        subdomain: result.tenant.subdomain,
      },
    });
  } catch (error) {
    logger.error('Registration error', { error: String(error) });
    res.status(500).json({
      error: '登録中にエラーが発生しました',
      code: 'REGISTRATION_ERROR',
    });
  }
});

/**
 * POST /api/auth/login
 * Login with email and password
 */
router.post('/login', async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body as LoginRequest;

    if (!email || !password) {
      return res.status(400).json({
        error: 'メールアドレスとパスワードを入力してください',
        code: 'VALIDATION_ERROR',
      });
    }

    // Get tenant from header or subdomain (optional for login)
    let tenantId = req.headers['x-tenant-id'] as string | undefined;
    const subdomain = req.headers['x-tenant-subdomain'] as string | undefined;

    // If subdomain is provided, look up tenant
    if (subdomain && !tenantId) {
      const tenant = await prisma.tenant.findUnique({
        where: { subdomain },
        select: { id: true },
      });
      if (tenant) {
        tenantId = tenant.id;
      }
    }

    // Find user (with optional tenant filter)
    const user = await prisma.user.findFirst({
      where: {
        email,
        ...(tenantId && { tenantId }),
      },
      include: {
        tenant: {
          select: {
            id: true,
            name: true,
            subdomain: true,
            subscriptionStatus: true,
          },
        },
      },
    });

    if (!user) {
      return res.status(401).json({
        error: 'メールアドレスまたはパスワードが正しくありません',
        code: 'INVALID_CREDENTIALS',
      });
    }

    // Verify password
    const isValidPassword = await bcrypt.compare(password, user.passwordHash);
    if (!isValidPassword) {
      return res.status(401).json({
        error: 'メールアドレスまたはパスワードが正しくありません',
        code: 'INVALID_CREDENTIALS',
      });
    }

    // Check subscription status
    if (user.tenant.subscriptionStatus !== 'TRIALING' &&
        user.tenant.subscriptionStatus !== 'ACTIVE') {
      return res.status(403).json({
        error: 'サブスクリプションが無効です。お支払いをご確認ください。',
        code: 'SUBSCRIPTION_INACTIVE',
      });
    }

    // Generate tokens
    const token = generateToken({
      userId: user.id,
      tenantId: user.tenantId,
      email: user.email,
      role: user.role,
    });

    const refreshToken = generateRefreshToken();
    await prisma.refreshToken.create({
      data: {
        userId: user.id,
        token: refreshToken,
        expiresAt: getRefreshTokenExpiry(),
      },
    });

    // Set HttpOnly cookies
    setAuthCookies(res, token, refreshToken);

    res.json({
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
      },
      tenant: {
        id: user.tenant.id,
        name: user.tenant.name,
        subdomain: user.tenant.subdomain,
      },
    });
  } catch (error) {
    logger.error('Login error', { error: String(error) });
    res.status(500).json({
      error: 'ログイン中にエラーが発生しました',
      code: 'LOGIN_ERROR',
    });
  }
});

/**
 * GET /api/auth/me
 * Get current user info
 */
router.get('/me', authMiddleware, async (req: Request, res: Response) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user!.userId },
      include: {
        tenant: {
          select: {
            id: true,
            name: true,
            subdomain: true,
            subscriptionStatus: true,
          },
        },
      },
    });

    if (!user) {
      return res.status(404).json({
        error: 'ユーザーが見つかりません',
        code: 'USER_NOT_FOUND',
      });
    }

    res.json({
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      tenant: {
        id: user.tenant.id,
        name: user.tenant.name,
        subdomain: user.tenant.subdomain,
      },
    });
  } catch (error) {
    logger.error('Get user error', { error: String(error) });
    res.status(500).json({
      error: 'ユーザー情報の取得中にエラーが発生しました',
      code: 'GET_USER_ERROR',
    });
  }
});

/**
 * POST /api/auth/check-subdomain
 * Check if subdomain is available
 */
router.post('/check-subdomain', async (req: Request, res: Response) => {
  try {
    const { subdomain } = req.body;

    if (!subdomain) {
      return res.status(400).json({ available: false, error: 'サブドメインを入力してください' });
    }

    const existing = await prisma.tenant.findUnique({
      where: { subdomain },
    });

    res.json({ available: !existing });
  } catch (error) {
    logger.error('Check subdomain error', { error: String(error) });
    res.status(500).json({ available: false, error: 'エラーが発生しました' });
  }
});

/**
 * POST /api/auth/forgot-password
 * Request password reset
 */
router.post('/forgot-password', async (req: Request, res: Response) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        error: 'メールアドレスを入力してください',
        code: 'VALIDATION_ERROR',
      });
    }

    // Find user by email
    const user = await prisma.user.findFirst({
      where: { email },
    });

    // Always return success to prevent email enumeration
    if (!user) {
      return res.json({
        message: 'パスワードリセットのメールを送信しました（登録されている場合）',
      });
    }

    // Generate reset token
    const resetToken = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

    // Save token to database
    await prisma.passwordResetToken.create({
      data: {
        email,
        token: resetToken,
        expiresAt,
      },
    });

    // Send reset email
    await sendPasswordResetEmail(email, resetToken);

    res.json({
      message: 'パスワードリセットのメールを送信しました（登録されている場合）',
    });
  } catch (error) {
    logger.error('Forgot password error', { error: String(error) });
    res.status(500).json({
      error: 'エラーが発生しました',
      code: 'FORGOT_PASSWORD_ERROR',
    });
  }
});

/**
 * POST /api/auth/reset-password
 * Reset password with token
 */
router.post('/reset-password', async (req: Request, res: Response) => {
  try {
    const { token, password } = req.body;

    if (!token || !password) {
      return res.status(400).json({
        error: 'トークンと新しいパスワードを入力してください',
        code: 'VALIDATION_ERROR',
      });
    }

    if (password.length < 8) {
      return res.status(400).json({
        error: 'パスワードは8文字以上で入力してください',
        code: 'PASSWORD_TOO_SHORT',
      });
    }

    if (!/[A-Za-z]/.test(password) || !/[0-9]/.test(password)) {
      return res.status(400).json({
        error: 'パスワードには英字と数字の両方を含めてください',
        code: 'PASSWORD_TOO_WEAK',
      });
    }

    // Find valid token
    const resetToken = await prisma.passwordResetToken.findFirst({
      where: {
        token,
        expiresAt: { gt: new Date() },
        usedAt: null,
      },
    });

    if (!resetToken) {
      return res.status(400).json({
        error: 'リンクが無効または期限切れです',
        code: 'INVALID_TOKEN',
      });
    }

    // Find user
    const user = await prisma.user.findFirst({
      where: { email: resetToken.email },
    });

    if (!user) {
      return res.status(400).json({
        error: 'ユーザーが見つかりません',
        code: 'USER_NOT_FOUND',
      });
    }

    // Update password and mark token as used
    const hashedPassword = await bcrypt.hash(password, 10);

    await prisma.$transaction([
      prisma.user.update({
        where: { id: user.id },
        data: { passwordHash: hashedPassword },
      }),
      prisma.passwordResetToken.update({
        where: { id: resetToken.id },
        data: { usedAt: new Date() },
      }),
    ]);

    res.json({
      message: 'パスワードが更新されました',
    });
  } catch (error) {
    logger.error('Reset password error', { error: String(error) });
    res.status(500).json({
      error: 'エラーが発生しました',
      code: 'RESET_PASSWORD_ERROR',
    });
  }
});

/**
 * POST /api/auth/refresh
 * Refresh access token using refresh token
 */
router.post('/refresh', async (req: Request, res: Response) => {
  try {
    const refreshTokenValue = req.cookies?.refresh_token;

    if (!refreshTokenValue) {
      return res.status(401).json({
        error: 'リフレッシュトークンが必要です',
        code: 'REFRESH_TOKEN_REQUIRED',
      });
    }

    // Find valid refresh token
    const storedToken = await prisma.refreshToken.findUnique({
      where: { token: refreshTokenValue },
      include: {
        user: {
          include: {
            tenant: { select: { id: true, name: true, subdomain: true } },
          },
        },
      },
    });

    if (!storedToken || storedToken.revokedAt || storedToken.expiresAt < new Date()) {
      clearAuthCookies(res);
      return res.status(401).json({
        error: 'リフレッシュトークンが無効または期限切れです',
        code: 'INVALID_REFRESH_TOKEN',
      });
    }

    // Revoke old refresh token
    await prisma.refreshToken.update({
      where: { id: storedToken.id },
      data: { revokedAt: new Date() },
    });

    // Generate new tokens
    const newAccessToken = generateToken({
      userId: storedToken.user.id,
      tenantId: storedToken.user.tenantId,
      email: storedToken.user.email,
      role: storedToken.user.role,
    });

    const newRefreshToken = generateRefreshToken();
    await prisma.refreshToken.create({
      data: {
        userId: storedToken.user.id,
        token: newRefreshToken,
        expiresAt: getRefreshTokenExpiry(),
      },
    });

    setAuthCookies(res, newAccessToken, newRefreshToken);

    res.json({
      token: newAccessToken,
      user: {
        id: storedToken.user.id,
        email: storedToken.user.email,
        name: storedToken.user.name,
        role: storedToken.user.role,
      },
    });
  } catch (error) {
    logger.error('Refresh token error', { error: String(error) });
    res.status(500).json({
      error: 'トークンの更新に失敗しました',
      code: 'REFRESH_ERROR',
    });
  }
});

/**
 * POST /api/auth/logout
 * Revoke refresh token and clear cookies
 */
router.post('/logout', async (req: Request, res: Response) => {
  try {
    const refreshTokenValue = req.cookies?.refresh_token;

    if (refreshTokenValue) {
      await prisma.refreshToken.updateMany({
        where: { token: refreshTokenValue, revokedAt: null },
        data: { revokedAt: new Date() },
      });
    }

    clearAuthCookies(res);
    res.json({ message: 'ログアウトしました' });
  } catch (error) {
    logger.error('Logout error', { error: String(error) });
    clearAuthCookies(res);
    res.json({ message: 'ログアウトしました' });
  }
});

export default router;
