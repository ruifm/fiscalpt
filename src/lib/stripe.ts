import Stripe from 'stripe'

if (!process.env.STRIPE_SECRET_KEY) {
  throw new Error('STRIPE_SECRET_KEY is not set')
}

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY)

if (!process.env.STRIPE_PRICE_ID) {
  throw new Error('STRIPE_PRICE_ID is not set')
}

export const RECOMMENDATIONS_PRICE_ID = process.env.STRIPE_PRICE_ID
