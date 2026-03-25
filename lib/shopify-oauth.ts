/**
 * Shopify OAuth 2.0 Client — PinLoop AI
 *
 * Handles the public app OAuth flow so any Shopify merchant
 * can connect their store:
 *   1. buildAuthUrl()     → redirect merchant to Shopify consent screen
 *   2. exchangeCode()     → swap auth code for a permanent access token
 *   3. getShopInfo()      → verify connection by fetching shop metadata
 */

const SHOPIFY_SCOPES = 'read_products'

// --- OAuth URL ---

export function buildShopifyAuthUrl(
  shop: string,
  redirectUri: string,
  state: string
): string {
  const cleanShop = normalizeShopDomain(shop)
  const params = new URLSearchParams({
    client_id: process.env.SHOPIFY_CLIENT_ID!,
    scope: SHOPIFY_SCOPES,
    redirect_uri: redirectUri,
    state,
  })
  return `https://${cleanShop}/admin/oauth/authorize?${params.toString()}`
}

// --- Token Exchange ---

export async function exchangeShopifyCode(
  shop: string,
  code: string
): Promise<{
  access_token: string
  scope: string
}> {
  const cleanShop = normalizeShopDomain(shop)
  const res = await fetch(`https://${cleanShop}/admin/oauth/access_token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      client_id: process.env.SHOPIFY_CLIENT_ID!,
      client_secret: process.env.SHOPIFY_CLIENT_SECRET!,
      code,
    }),
  })

  if (!res.ok) {
    const errText = await res.text()
    throw new Error(`Shopify token exchange failed (${res.status}): ${errText}`)
  }

  return res.json()
}

// --- Shop Info ---

export async function getShopifyShopInfo(
  shop: string,
  accessToken: string
): Promise<{
  name: string
  domain: string
  myshopify_domain: string
}> {
  const cleanShop = normalizeShopDomain(shop)
  const res = await fetch(`https://${cleanShop}/admin/api/2024-10/shop.json`, {
    headers: {
      'X-Shopify-Access-Token': accessToken,
      'Content-Type': 'application/json',
    },
  })

  if (!res.ok) {
    const errText = await res.text()
    throw new Error(`Shopify shop info failed (${res.status}): ${errText}`)
  }

  const data = await res.json()
  return {
    name: data.shop?.name || '',
    domain: data.shop?.domain || '',
    myshopify_domain: data.shop?.myshopify_domain || cleanShop,
  }
}

// --- Helpers ---

/**
 * Normalize a Shopify domain to `store-name.myshopify.com` format.
 * Accepts: "store-name", "store-name.myshopify.com", "https://store-name.myshopify.com"
 */
export function normalizeShopDomain(input: string): string {
  let shop = input.trim().toLowerCase()
  // Strip protocol
  shop = shop.replace(/^https?:\/\//, '')
  // Strip trailing slash
  shop = shop.replace(/\/+$/, '')
  // Strip /admin or any path
  shop = shop.split('/')[0]
  // Add .myshopify.com if missing
  if (!shop.includes('.')) {
    shop = `${shop}.myshopify.com`
  }
  return shop
}
