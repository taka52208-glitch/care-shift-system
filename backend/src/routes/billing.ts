import { Router } from 'express';
import { authMiddleware } from '../middleware/auth.js';
import { prisma } from '../lib/prisma.js';
import {
  createCheckoutSession,
  createPortalSession,
  createStripeCustomer,
} from '../services/stripeService.js';

const router = Router();

/**
 * POST /api/billing/checkout
 * Create a Stripe Checkout session for subscription
 */
router.post('/checkout', authMiddleware, async (req, res) => {
  try {
    const { successUrl, cancelUrl } = req.body;
    const tenantId = req.tenantId!;

    // Get tenant
    const tenant = await prisma.tenant.findUnique({
      where: { id: tenantId },
      include: { users: { where: { id: req.user!.userId }, take: 1 } },
    });

    if (!tenant) {
      return res.status(404).json({ error: 'テナントが見つかりません' });
    }

    // Create Stripe customer if not exists
    let customerId = tenant.stripeCustomerId;
    if (!customerId) {
      const user = tenant.users[0];
      customerId = await createStripeCustomer(
        tenantId,
        user?.email || `${tenant.subdomain}@example.com`,
        tenant.name
      );
    }

    // Create checkout session
    const checkoutUrl = await createCheckoutSession(
      tenantId,
      customerId,
      successUrl || `${process.env.FRONTEND_URL}/app/billing/success`,
      cancelUrl || `${process.env.FRONTEND_URL}/app/billing/cancel`
    );

    res.json({ url: checkoutUrl });
  } catch (error) {
    console.error('Error creating checkout session:', error);
    res.status(500).json({ error: 'チェックアウトセッションの作成に失敗しました' });
  }
});

/**
 * POST /api/billing/portal
 * Create a Stripe Customer Portal session
 */
router.post('/portal', authMiddleware, async (req, res) => {
  try {
    const { returnUrl } = req.body;
    const tenantId = req.tenantId!;

    // Get tenant
    const tenant = await prisma.tenant.findUnique({
      where: { id: tenantId },
    });

    if (!tenant) {
      return res.status(404).json({ error: 'テナントが見つかりません' });
    }

    if (!tenant.stripeCustomerId) {
      return res.status(400).json({ error: 'Stripe顧客が設定されていません' });
    }

    // Create portal session
    const portalUrl = await createPortalSession(
      tenant.stripeCustomerId,
      returnUrl || `${process.env.FRONTEND_URL}/app/settings`
    );

    res.json({ url: portalUrl });
  } catch (error) {
    console.error('Error creating portal session:', error);
    res.status(500).json({ error: 'ポータルセッションの作成に失敗しました' });
  }
});

/**
 * GET /api/billing/status
 * Get current subscription status
 */
router.get('/status', authMiddleware, async (req, res) => {
  try {
    const tenantId = req.tenantId!;

    const tenant = await prisma.tenant.findUnique({
      where: { id: tenantId },
      select: {
        subscriptionStatus: true,
        trialEndsAt: true,
        currentPeriodEnd: true,
        stripeSubscriptionId: true,
      },
    });

    if (!tenant) {
      return res.status(404).json({ error: 'テナントが見つかりません' });
    }

    // Calculate trial days remaining
    let trialDaysRemaining = null;
    if (tenant.subscriptionStatus === 'TRIALING' && tenant.trialEndsAt) {
      const now = new Date();
      const trialEnd = new Date(tenant.trialEndsAt);
      trialDaysRemaining = Math.max(0, Math.ceil((trialEnd.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)));
    }

    res.json({
      status: tenant.subscriptionStatus,
      trialEndsAt: tenant.trialEndsAt,
      currentPeriodEnd: tenant.currentPeriodEnd,
      hasSubscription: !!tenant.stripeSubscriptionId,
      trialDaysRemaining,
    });
  } catch (error) {
    console.error('Error fetching billing status:', error);
    res.status(500).json({ error: '課金状態の取得に失敗しました' });
  }
});

export default router;
