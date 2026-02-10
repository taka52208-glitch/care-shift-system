import Stripe from 'stripe';
import { logger } from './logger.js';

if (!process.env.STRIPE_SECRET_KEY) {
  logger.warn('STRIPE_SECRET_KEY not set - Stripe features disabled');
}

// Stripeは設定されている場合のみ初期化
export const stripe = process.env.STRIPE_SECRET_KEY
  ? new Stripe(process.env.STRIPE_SECRET_KEY, {
      apiVersion: '2026-01-28.clover',
    })
  : null;

// Price ID for the subscription plan (set in environment)
export const PRICE_ID = process.env.STRIPE_PRICE_ID || '';

// Trial period in days
export const TRIAL_DAYS = 14;
