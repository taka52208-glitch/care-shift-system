import { Router, Request, Response } from 'express';
import Stripe from 'stripe';
import { stripe } from '../lib/stripe.js';
import { handleSubscriptionChange } from '../services/stripeService.js';
import { prisma } from '../lib/prisma.js';
import { sendPaymentSuccessEmail, sendPaymentFailedEmail } from '../lib/email.js';

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
    console.error('STRIPE_WEBHOOK_SECRET not configured');
    return res.status(500).json({ error: 'Webhook not configured' });
  }

  if (!stripe) {
    console.error('Stripe not configured');
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
    console.error('Webhook signature verification failed:', err);
    return res.status(400).json({ error: 'Webhook signature verification failed' });
  }

  console.log(`Received Stripe event: ${event.type}`);

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
          // Get period end from the first subscription item
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
        console.log(`Payment succeeded for invoice ${invoice.id}`);

        // Send payment success email
        const customerId = invoice.customer as string;
        const tenant = await prisma.tenant.findFirst({
          where: { stripeCustomerId: customerId },
          include: { users: { where: { role: 'ADMIN' }, take: 1 } },
        });

        if (tenant && tenant.users[0]) {
          await sendPaymentSuccessEmail(tenant.users[0].email, tenant.name);
        }
        break;
      }

      case 'invoice.payment_failed': {
        const invoice = event.data.object as Stripe.Invoice;
        console.log(`Payment failed for invoice ${invoice.id}`);

        // Find tenant by customer ID and update status
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

          // Send payment failed email
          if (failedTenant.users[0]) {
            await sendPaymentFailedEmail(failedTenant.users[0].email, failedTenant.name);
          }
        }
        break;
      }

      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session;
        console.log(`Checkout completed for session ${session.id}`);

        // The subscription will be handled by subscription.created event
        break;
      }

      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    res.json({ received: true });
  } catch (error) {
    console.error('Error processing webhook:', error);
    res.status(500).json({ error: 'Webhook processing failed' });
  }
});

export default router;
