import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import { tenantResolver } from './middleware/tenant.js';
import { apiLimiter, authLimiter, registerLimiter, passwordResetLimiter } from './middleware/rateLimit.js';
import authRoutes from './routes/auth.js';
import dashboardRoutes from './routes/dashboard.js';
import staffRoutes from './routes/staff.js';
import shiftRoutes from './routes/shift.js';
import patternRoutes from './routes/pattern.js';
import constraintRoutes from './routes/constraint.js';
import requestRoutes from './routes/request.js';
import reportRoutes from './routes/report.js';
import billingRoutes from './routes/billing.js';
import webhookRoutes from './routes/webhook.js';
import { logger } from './lib/logger.js';

export function createApp() {
  const app = express();

  // CORS configuration
  app.use(cors({
    origin: process.env.NODE_ENV === 'production'
      ? [/\.onrender\.com$/, /\.vercel\.app$/]
      : true,
    credentials: true,
  }));

  // Stripe webhook needs raw body - must be before express.json()
  app.use('/api/webhook/stripe', express.raw({ type: 'application/json' }));
  app.use('/api/webhook', webhookRoutes);

  app.use(express.json());
  app.use(cookieParser());

  // Rate limiting (skip in test)
  if (process.env.NODE_ENV !== 'test') {
    app.use('/api', apiLimiter);
    app.use('/api/auth/login', authLimiter);
    app.use('/api/auth/register', registerLimiter);
    app.use('/api/auth/forgot-password', passwordResetLimiter);
    app.use('/api/auth/reset-password', passwordResetLimiter);
  }

  // Tenant resolver middleware
  app.use(tenantResolver);

  // API Routes
  app.use('/api/auth', authRoutes);
  app.use('/api/dashboard', dashboardRoutes);
  app.use('/api/staff', staffRoutes);
  app.use('/api/shifts', shiftRoutes);
  app.use('/api/patterns', patternRoutes);
  app.use('/api/constraints', constraintRoutes);
  app.use('/api/requests', requestRoutes);
  app.use('/api/reports', reportRoutes);
  app.use('/api/billing', billingRoutes);

  // Health check
  app.get('/api/health', (_req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
  });

  // Error handling middleware
  app.use((err: Error, req: express.Request, res: express.Response, _next: express.NextFunction) => {
    logger.error('Unhandled error', { error: err.message, stack: err.stack });
    res.status(500).json({
      error: 'サーバーエラーが発生しました',
      code: 'INTERNAL_ERROR',
    });
  });

  return app;
}
