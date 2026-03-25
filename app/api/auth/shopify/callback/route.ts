import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/utils/supabase/server"
import { exchangeShopifyCode, getShopifyShopInfo, normalizeShopDomain } from "@/lib/shopify-oauth"
import { tasks } from "@trigger.dev/sdk/v3"
import type { shopifyProductSync } from "@/trigger/sync-shopify-products"

/**
 * Shopify OAuth Callback
 *
 * GET /api/auth/shopify/callback?code=...&shop=...&state=...
 * Receives the authorization code from Shopify, exchanges for a
 * permanent token, saves the connection, and triggers product sync.
 */
export async function GET(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.redirect(new URL("/login", req.url))
  }

  const searchParams = req.nextUrl.searchParams
  const code = searchParams.get("code")
  const shop = searchParams.get("shop")
  const state = searchParams.get("state")

  // Handle Shopify errors (user denied access)
  if (!code || !shop || !state) {
    return NextResponse.redirect(
      new URL("/integrations?shopify_error=invalid_response", req.url)
    )
  }

  // Verify CSRF state
  const storedState = req.cookies.get("shopify_oauth_state")?.value
  if (!storedState || storedState !== state) {
    return NextResponse.redirect(
      new URL("/integrations?shopify_error=invalid_state", req.url)
    )
  }

  // Verify the state contains the correct userId
  try {
    const stateData = JSON.parse(Buffer.from(state, "base64url").toString())
    if (stateData.userId !== user.id) {
      return NextResponse.redirect(
        new URL("/integrations?shopify_error=user_mismatch", req.url)
      )
    }
  } catch {
    return NextResponse.redirect(
      new URL("/integrations?shopify_error=invalid_state", req.url)
    )
  }

  try {
    const normalizedShop = normalizeShopDomain(shop)

    // Exchange code for permanent access token
    const tokens = await exchangeShopifyCode(normalizedShop, code)

    // Fetch shop info to get the store name
    const shopInfo = await getShopifyShopInfo(normalizedShop, tokens.access_token)

    // Upsert connection (one connection per user per store)
    const { data: connection, error: dbError } = await supabase
      .from("shopify_connections")
      .upsert({
        user_id: user.id,
        store_name: shopInfo.name,
        store_domain: shopInfo.myshopify_domain,
        access_token: tokens.access_token,
        is_default: true,
        updated_at: new Date().toISOString(),
      }, {
        onConflict: "user_id,store_domain",
      })
      .select("id")
      .single()

    if (dbError) {
      console.error("Failed to save Shopify connection:", dbError)
      return NextResponse.redirect(
        new URL("/integrations?shopify_error=save_failed", req.url)
      )
    }

    // Trigger initial product sync in the background
    if (connection?.id) {
      try {
        await tasks.trigger<typeof shopifyProductSync>("shopify-product-sync", {
          userId: user.id,
          shopifyConnectionId: connection.id,
        })
      } catch (triggerErr) {
        // Non-fatal: sync can be retried manually
        console.warn("Failed to trigger Shopify product sync:", triggerErr)
      }
    }

    // Clear state cookie and redirect with success
    const response = NextResponse.redirect(
      new URL("/integrations?shopify=connected", req.url)
    )
    response.cookies.delete("shopify_oauth_state")

    return response
  } catch (err: any) {
    console.error("Shopify callback error:", err)
    return NextResponse.redirect(
      new URL(`/integrations?shopify_error=${encodeURIComponent(err.message || "unknown")}`, req.url)
    )
  }
}
