import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/utils/supabase/server"
import { buildShopifyAuthUrl, normalizeShopDomain } from "@/lib/shopify-oauth"

/**
 * Shopify OAuth Initiation
 *
 * GET /api/auth/shopify?shop=store-name.myshopify.com
 * Redirects the user to Shopify's OAuth consent screen.
 */
export async function GET(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.redirect(new URL("/login", req.url))
  }

  if (!process.env.SHOPIFY_CLIENT_ID || !process.env.SHOPIFY_CLIENT_SECRET) {
    return NextResponse.json({ error: "Shopify OAuth not configured" }, { status: 500 })
  }

  const shop = req.nextUrl.searchParams.get("shop")
  if (!shop) {
    return NextResponse.redirect(
      new URL("/integrations?shopify_error=missing_shop", req.url)
    )
  }

  const normalizedShop = normalizeShopDomain(shop)

  // Basic validation: must look like a valid shopify domain
  if (!normalizedShop.endsWith(".myshopify.com")) {
    return NextResponse.redirect(
      new URL("/integrations?shopify_error=invalid_shop", req.url)
    )
  }

  const callbackUrl = new URL("/api/auth/shopify/callback", req.url).toString()

  // Generate CSRF state token
  const state = Buffer.from(JSON.stringify({
    userId: user.id,
    shop: normalizedShop,
    timestamp: Date.now(),
    nonce: Math.random().toString(36).substring(7),
  })).toString("base64url")

  const authUrl = buildShopifyAuthUrl(normalizedShop, callbackUrl, state)

  const response = NextResponse.redirect(authUrl)

  // Store state in cookie for verification
  response.cookies.set("shopify_oauth_state", state, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 600, // 10 minutes
  })

  return response
}
