/**
 * Etsy OAuth 2.0 PKCE Client — PinLoop AI
 *
 * Handles the full Etsy OAuth 2.0 + PKCE flow so any Etsy seller
 * can connect their shop:
 *   1. generatePKCE()     → create code_verifier + code_challenge
 *   2. buildAuthUrl()     → redirect user to Etsy consent screen
 *   3. exchangeCode()     → swap auth code + verifier for tokens
 *   4. getShopInfo()      → fetch the user's shop_id + shop_name
 */

import crypto from 'crypto'

const ETSY_OAUTH_BASE = 'https://www.etsy.com/oauth/connect'
const ETSY_TOKEN_URL = 'https://api.etsy.com/v3/public/oauth/token'
const ETSY_API_BASE = 'https://openapi.etsy.com/v3'

// Scopes: read listings + read shop info
const ETSY_SCOPES = 'listings_r shops_r'

// --- PKCE ---

export function generatePKCE(): { codeVerifier: string; codeChallenge: string } {
  // Generate a 43-128 character code_verifier
  const codeVerifier = crypto.randomBytes(32).toString('base64url')

  // Create SHA-256 hash → base64url encoded
  const codeChallenge = crypto
    .createHash('sha256')
    .update(codeVerifier)
    .digest('base64url')

  return { codeVerifier, codeChallenge }
}

// --- OAuth URL ---

export function buildEtsyAuthUrl(
  codeChallenge: string,
  redirectUri: string,
  state: string
): string {
  const params = new URLSearchParams({
    response_type: 'code',
    client_id: process.env.ETSY_API_KEY!,
    redirect_uri: redirectUri,
    scope: ETSY_SCOPES,
    state,
    code_challenge: codeChallenge,
    code_challenge_method: 'S256',
  })

  return `${ETSY_OAUTH_BASE}?${params.toString()}`
}

// --- Token Exchange ---

export async function exchangeEtsyCode(
  code: string,
  codeVerifier: string,
  redirectUri: string
): Promise<{
  access_token: string
  refresh_token: string
  expires_in: number
}> {
  const res = await fetch(ETSY_TOKEN_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'authorization_code',
      client_id: process.env.ETSY_API_KEY!,
      redirect_uri: redirectUri,
      code,
      code_verifier: codeVerifier,
    }),
  })

  if (!res.ok) {
    const errText = await res.text()
    throw new Error(`Etsy token exchange failed (${res.status}): ${errText}`)
  }

  return res.json()
}

// --- Shop Info ---

/**
 * Fetch the authenticated user's Etsy user ID, then their shops.
 * Returns the first (primary) shop's ID and name.
 */
export async function getEtsyShopInfo(
  accessToken: string
): Promise<{
  shopId: string
  shopName: string
  userId: string
}> {
  // Step 1: Get the user's Etsy user_id from the token metadata
  // The /v3/application/users/me endpoint returns the user tied to this token
  const meRes = await fetch(`${ETSY_API_BASE}/application/users/me`, {
    headers: {
      'x-api-key': process.env.ETSY_API_KEY!,
      'Authorization': `Bearer ${accessToken}`,
    },
  })

  if (!meRes.ok) {
    const errText = await meRes.text()
    throw new Error(`Etsy user info failed (${meRes.status}): ${errText}`)
  }

  const meData = await meRes.json()
  const etsyUserId = meData.user_id?.toString() || ''

  if (!etsyUserId) {
    throw new Error('Could not resolve Etsy user_id')
  }

  // Step 2: Fetch the user's shops
  const shopsRes = await fetch(`${ETSY_API_BASE}/application/users/${etsyUserId}/shops`, {
    headers: {
      'x-api-key': process.env.ETSY_API_KEY!,
      'Authorization': `Bearer ${accessToken}`,
    },
  })

  if (!shopsRes.ok) {
    const errText = await shopsRes.text()
    throw new Error(`Etsy shops fetch failed (${shopsRes.status}): ${errText}`)
  }

  const shopsData = await shopsRes.json()

  // Etsy users typically have one shop
  const shop = shopsData.results?.[0]
  if (!shop) {
    throw new Error('No Etsy shop found for this user. Please create a shop first.')
  }

  return {
    shopId: shop.shop_id?.toString() || '',
    shopName: shop.shop_name || '',
    userId: etsyUserId,
  }
}
