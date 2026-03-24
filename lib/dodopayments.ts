/**
 * Client-side wrapper for calling our Dodo Payments API routes.
 * NOTE: Do not import the server SDK here. These functions run in the browser.
 * 
 * PIVOT: Primary flow is now one-time sprint checkout. Subscription functions
 * are deprecated and kept only for legacy compatibility.
 */

type ProductCartItem = { product_id: string; quantity: number; amount?: number }

type CustomerRequest = {
    email: string
    name?: string
    phone_number?: string
}

type BillingAddress = {
    country: string
    city: string
    state?: string
    street: string
    zipcode: string
}

/**
 * Create hosted Checkout Session and return the checkout_url and session_id.
 * For sprint purchases, pass the sprint product_id in the cart with quantity 1.
 */
export async function checkout(
    product_cart: ProductCartItem[],
    customer?: CustomerRequest,
    billing_address?: BillingAddress,
    return_url?: string,
    metadata?: Record<string, string>,
): Promise<{ checkout_url: string; session_id: string }> {
    if (!return_url) {
        throw new Error('return_url is required')
    }
    const payload: Record<string, unknown> = {
        product_cart,
        return_url,
        metadata,
    }
    if (customer) payload.customer = customer
    if (billing_address) payload.billing_address = billing_address

    const res = await fetch('/api/dodopayments/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
    })

    const data = await res.json()
    if (!res.ok) {
        throw new Error(data?.error || 'Failed to create checkout session')
    }
    return { checkout_url: data.checkout_url, session_id: data.session_id }
}

/**
 * Convenience: create a sprint checkout session.
 * Wraps checkout() with sprint-specific metadata (user_id, tier, brand_id).
 */
export async function checkoutSprint(params: {
    productId: string
    tierCode: string
    userId: string
    brandId?: string
    customerEmail: string
    customerName?: string
    returnUrl: string
}): Promise<{ checkout_url: string; session_id: string }> {
    return checkout(
        [{ product_id: params.productId, quantity: 1 }],
        { email: params.customerEmail, name: params.customerName },
        undefined,
        params.returnUrl,
        {
            user_id: params.userId,
            tier: params.tierCode,
            brand_id: params.brandId || '',
            checkout_type: 'sprint',
        },
    )
}

// ---- DEPRECATED: Subscription management ----
// These are kept for legacy users still on $79/month plans.
// They will be removed when all legacy subscribers are migrated.

/** @deprecated Use checkoutSprint instead */
export async function cancelSubscription(
    subscription_id?: string,
): Promise<{ ok: boolean; subscription_id: string; remote: unknown }> {
    const res = await fetch('/api/dodopayments/subscription/cancel', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ subscription_id }),
    })
    const data = await res.json()
    if (!res.ok) {
        throw new Error(data?.error || 'Failed to schedule subscription cancellation')
    }
    return data
}

/** @deprecated */
export async function updatePaymentMethod(
    subscription_id?: string,
    return_url?: string,
): Promise<{ url?: string; emailed?: boolean; message?: string }> {
    const res = await fetch('/api/dodopayments/subscription/update-payment-method', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ subscription_id, return_url }),
    })
    const data = await res.json()
    if (!res.ok) {
        throw new Error(data?.error || 'Failed to create customer portal session')
    }
    return {
        url: data?.url || data?.link,
        emailed: Boolean(data?.emailed),
        message: typeof data?.message === 'string' ? data.message : undefined,
    }
}

/** @deprecated */
export async function restoreSubscription(
    subscription_id?: string
): Promise<{ ok: boolean; subscription_id: string }> {
    const res = await fetch('/api/dodopayments/subscription/restore', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ subscription_id }),
    })
    const data = await res.json()
    if (!res.ok) {
        throw new Error(data?.error || 'Failed to restore subscription')
    }
    return data
}

/** @deprecated */
export async function changeSubscriptionPlan(
    subscription_id: string | undefined,
    product_id: string,
    proration_billing_mode: 'prorated_immediately' | 'none' = 'prorated_immediately',
    quantity: number = 1
): Promise<{ ok: boolean; subscription_id: string }> {
    const res = await fetch('/api/dodopayments/subscription/change-plan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            subscription_id,
            product_id,
            proration_billing_mode,
            quantity,
        }),
    })
    const data = await res.json()
    if (!res.ok) {
        throw new Error(data?.error || 'Failed to change subscription plan')
    }
    return data
}

// Placeholders (kept for interface compat)
export async function getProducts(): Promise<never> { throw new Error('Not implemented') }
export async function getProduct(_id: string): Promise<never> { throw new Error('Not implemented') }
export async function getCustomer(_id: string): Promise<never> { throw new Error('Not implemented') }
export async function getCustomerSubscriptions(_id: string): Promise<never> { throw new Error('Not implemented') }
export async function getCustomerPayments(_id: string): Promise<never> { throw new Error('Not implemented') }
export async function createCustomer(_c: unknown): Promise<never> { throw new Error('Not implemented') }
export async function updateCustomer(_id: string, _c: unknown): Promise<never> { throw new Error('Not implemented') }