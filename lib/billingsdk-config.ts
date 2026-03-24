/**
 * Sprint tier definitions for the 90-Day Sprint model.
 * 
 * IMPORTANT: Set NEXT_PUBLIC_DODO_STARTER_PRODUCT_ID and NEXT_PUBLIC_DODO_GROWTH_PRODUCT_ID
 * in your .env after creating the products in the DodoPayments dashboard.
 */

export type SprintTier = {
  id: string
  code: string
  title: string
  price: number
  currency: string
  totalNewArticles: number
  totalRefreshArticles: number
  totalArticles: number
  durationDays: number
  dodoProductId: string
  highlight?: boolean
  badge?: string
  features: string[]
}

export const sprintTiers: SprintTier[] = [
  {
    id: 'starter',
    code: 'sprint_497',
    title: '90-Day Sprint — Starter',
    price: 497,
    currency: 'USD',
    totalNewArticles: 50,
    totalRefreshArticles: 25,
    totalArticles: 75,
    durationDays: 90,
    dodoProductId: process.env.NEXT_PUBLIC_DODO_STARTER_PRODUCT_ID || '',
    features: [
      '50 net-new SEO articles',
      '25 content refreshes (GSC-powered)',
      '90-day automated publishing sprint',
      'Full brand DNA analysis & topical audit',
      'Automated daily CMS publishing',
    ],
  },
  {
    id: 'growth',
    code: 'sprint_897',
    title: '90-Day Sprint — Growth',
    price: 897,
    currency: 'USD',
    totalNewArticles: 100,
    totalRefreshArticles: 50,
    totalArticles: 150,
    durationDays: 90,
    dodoProductId: process.env.NEXT_PUBLIC_DODO_GROWTH_PRODUCT_ID || '',
    highlight: true,
    badge: 'Best Value',
    features: [
      '100 net-new SEO articles',
      '50 content refreshes (GSC-powered)',
      '90-day automated publishing sprint',
      'Full brand DNA analysis & topical audit',
      'Automated daily CMS publishing',
      'Priority support',
    ],
  },
]

/** Get a sprint tier by its DodoPayments product ID */
export function getSprintTierByProductId(productId: string): SprintTier | undefined {
  return sprintTiers.find((t) => t.dodoProductId === productId)
}

/** Get a sprint tier by its code (e.g., 'sprint_497') */
export function getSprintTierByCode(code: string): SprintTier | undefined {
  return sprintTiers.find((t) => t.code === code)
}

// ---- Legacy types kept for backward compat during migration ----

export type Plan = {
  name: string
  description: string
  priceMonthly: number
  priceYearly: number
  features: string[]
  popular: boolean
  id?: string
}

export type CurrentPlan = {
  name: string
  type: string
  startDate: string
  amount: string
  invoiceHistory?: Array<{ date: string; amount: string; status: string }>
}
