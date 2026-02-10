import { Router, Request, Response } from 'express';
import Stripe from 'stripe';
import { stripe } from '../lib/stripe.js';
import { handleSubscriptionChange } from '../services/stripeService.js';
import { prisma } from '../lib/prisma.js';
import { sendPaymentSuccessEmail, sendPaymentFailedEmail } from '../lib/email.js';
import { logger } from '../lib/logger.js';

const router = Router();

/**
 * POST /api/webhook/stripe
 * Handle Stripe webhook events
 *
 * Note: This route must use raw body parser, not JSON
 */
router.post('/stripe', async (req: Request, res: Response) => {
  const sig = req.headers['stripe-signature'] as string;
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!webhookSecret) {
    logger.error('STRIPE_WEBHOOK_SECRET not configured');
    return res.status(500).json({ error: 'Webhook not configured' });
  }

  if (!stripe) {
    logger.error('Stripe not configured');
    return res.status(500).json({ error: 'Stripe not configured' });
  }

  let event: Stripe.Event;

  try {
    // Verify webhook signature
    event = stripe.webhooks.constructEvent(
      req.body, // raw body
      sig,
      webhookSecret
    );
  } catch (err) {
    logger.error('Webhook signature verification failed', { error: String(err) });
    return res.status(400).json({ error: 'Webhook signature verification failed' });
  }

  // Idempotency check: skip already processed events
  const existing = await prisma.processedWebhookEvent.findUnique({
    where: { id: event.id },
  });

  if (existing) {
    logger.info('Skipping already processed event', { eventId: event.id });
    return res.json({ received: true, duplicate: true });
  }

  logger.info('Received Stripe event', { eventType: event.type, eventId: event.id });

  try {
    switch (event.type) {
      case 'customer.subscription.created':
      case 'customer.subscription.updated': {
        const subscription = event.data.object as Stripe.Subscription;
        await handleSubscriptionChange({
          id: subscription.id,
          status: subscription.status,
          metadata: subscription.metadata as { tenantId?: string },
          customer: subscription.customer as string,
        });

        // Update trial dates
        const tenantId = subscription.metadata.tenantId;
        if (tenantId) {
          const periodEnd = subscription.items.data[0]?.current_period_end;
          await prisma.tenant.update({
            where: { id: tenantId },
            data: {
              trialEndsAt: subscription.trial_end
                ? new Date(subscription.trial_end * 1000)
                : null,
              currentPeriodEnd: periodEnd
                ? new Date(periodEnd * 1000)
                : null,
            },
          });
        }
        break;
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription;
        await handleSubscriptionChange({
          id: subscription.id,
          status: 'canceled',
          metadata: subscription.metadata as { tenantId?: string },
          customer: subscription.customer as string,
        });
        break;
      }

      case 'invoice.payment_succeeded': {
        const invoice = event.data.object as Stripe.Invoice;
        logger.info('Payment succeeded', { invoiceId: invoice.id });

        const customerId = invoice.customer as string;
        const tenant = await prisma.tenant.findFirst({
          where: { stripeCustomerId: customerId },
          include: { users: { where: { role: 'ADMIN' }, take: 1 } },
        });

        if (tenant && tenant.users[0]) {
          sendPaymentSuccessEmail(tenant.users[0].email, tenant.name).catch((err) => logger.error('Failed to send payment success email', { error: String(err) }));
        }
        break;
      }

      case 'invoice.payment_failed': {
        const invoice = event.data.object as Stripe.Invoice;
        logger.info('Payment failed', { invoiceId: invoice.id });

        const failedCustomerId = invoice.customer as string;
        const failedTenant = await prisma.tenant.findFirst({
          where: { stripeCustomerId: failedCustomerId },
          include: { users: { where: { role: 'ADMIN' }, take: 1 } },
        });

        if (failedTenant) {
          await prisma.tenant.update({
            where: { id: failedTenant.id },
            data: { subscriptionStatus: 'PAST_DUE' },
          });

          if (failedTenant.users[0]) {
            sendPaymentFailedEmail(failedTenant.users[0].email, failedTenant.name).catch((err) => logger.error('Failed to send payment failed email', { error: String(err) }));
          }
        }
        break;
      }

      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session;
        logger.info('Checkout completed', { sessionId: session.id });
        break;
      }

      default:
        logger.warn('Unhandled event type', { eventType: event.type });
    }

    // Mark event as processed
    await prisma.processedWebhookEvent.create({
      data: { id: event.id, eventType: event.type },
    });

    res.json({ received: true });
  } catch (error) {
    logger.error('Error processing webhook', { error: String(error) });
    // Return 200 to prevent Stripe from retrying on application errors
    // The event was not marked as processed, so it can be retried manually
    res.status(200).json({ received: true, error: 'Processing failed, will retry' });
  }
});

export default router;
