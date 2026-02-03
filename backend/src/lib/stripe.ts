import Stripe from 'stripe';

if (!process.env.STRIPE_SECRET_KEY) {
  console.warn('Warning: STRIPE_SECRET_KEY not set');
}

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
  apiVersion: '2026-01-28.clover',
});

// Price ID for the subscription plan (set in environment)
export const PRICE_ID = process.env.STRIPE_PRICE_ID || '';

// Trial period in days
export const TRIAL_DAYS = 14;
