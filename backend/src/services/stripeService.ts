import { stripe, PRICE_ID, TRIAL_DAYS } from '../lib/stripe.js';
import { prisma } from '../lib/prisma.js';
import { SubscriptionStatus } from '@prisma/client';

function getStripe() {
  if (!stripe) {
    throw new Error('Stripe is not configured');
  }
  return stripe;
}

/**
 * Create a Stripe customer for a tenant
 */
export async function createStripeCustomer(
  tenantId: string,
  email: string,
  name: string
): Promise<string> {
  const customer = await getStripe().customers.create({
    email,
    name,
    metadata: {
      tenantId,
    },
  });

  // Update tenant with Stripe customer ID
  await prisma.tenant.update({
    where: { id: tenantId },
    data: { stripeCustomerId: customer.id },
  });

  return customer.id;
}

/**
 * Create a Stripe Checkout session for subscription
 */
export async function createCheckoutSession(
  tenantId: string,
  customerId: string,
  successUrl: string,
  cancelUrl: string
): Promise<string> {
  const session = await getStripe().checkout.sessions.create({
    customer: customerId,
    mode: 'subscription',
    line_items: [
      {
        price: PRICE_ID,
        quantity: 1,
      },
    ],
    subscription_data: {
      trial_period_days: TRIAL_DAYS,
      metadata: {
        tenantId,
      },
    },
    success_url: successUrl,
    cancel_url: cancelUrl,
    metadata: {
      tenantId,
    },
  });

  return session.url || '';
}

/**
 * Create a Stripe Customer Portal session
 */
export async function createPortalSession(
  customerId: string,
  returnUrl: string
): Promise<string> {
  const session = await getStripe().billingPortal.sessions.create({
    customer: customerId,
    return_url: returnUrl,
  });

  return session.url;
}

/**
 * Handle subscription status changes from webhook
 */
export async function handleSubscriptionChange(
  subscription: {
    id: string;
    status: string;
    metadata: { tenantId?: string };
    customer: string | { id: string };
  }
): Promise<void> {
  const tenantId = subscription.metadata.tenantId;
  const customerId = typeof subscription.customer === 'string'
    ? subscription.customer
    : subscription.customer.id;

  // Find tenant by tenantId from metadata or customerId
  let tenant;
  if (tenantId) {
    tenant = await prisma.tenant.findUnique({ where: { id: tenantId } });
  }
  if (!tenant) {
    tenant = await prisma.tenant.findFirst({
      where: { stripeCustomerId: customerId },
    });
  }

  if (!tenant) {
    console.error('Tenant not found for subscription:', subscription.id);
    return;
  }

  // Map Stripe status to our status
  let status: SubscriptionStatus;
  switch (subscription.status) {
    case 'trialing':
      status = SubscriptionStatus.TRIALING;
      break;
    case 'active':
      status = SubscriptionStatus.ACTIVE;
      break;
    case 'canceled':
      status = SubscriptionStatus.CANCELED;
      break;
    case 'past_due':
      status = SubscriptionStatus.PAST_DUE;
      break;
    case 'unpaid':
      status = SubscriptionStatus.UNPAID;
      break;
    default:
      // For other statuses (incomplete, etc.), keep current status
      return;
  }

  await prisma.tenant.update({
    where: { id: tenant.id },
    data: {
      subscriptionStatus: status,
      stripeSubscriptionId: subscription.id,
    },
  });

  console.log(`Updated tenant ${tenant.id} subscription status to ${status}`);
}

/**
 * Cancel a subscription
 */
export async function cancelSubscription(subscriptionId: string): Promise<void> {
  await getStripe().subscriptions.cancel(subscriptionId);
}

/**
 * Get subscription details
 */
export async function getSubscription(subscriptionId: string) {
  return getStripe().subscriptions.retrieve(subscriptionId);
}
