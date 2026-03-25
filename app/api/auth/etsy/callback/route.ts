import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/utils/supabase/server"
import { exchangeEtsyCode, getEtsyShopInfo } from "@/lib/etsy-oauth"
import { tasks } from "@trigger.dev/sdk/v3"
import type { etsyProductSync } from "@/trigger/sync-etsy-products"

/**
 * Etsy OAuth Callback
 *
 * GET /api/auth/etsy/callback?code=...&state=...
 * Receives the authorization code from Etsy, exchanges for tokens
 * using PKCE verifier, fetches shop info, saves connection, and
 * triggers initial product sync.
 */
export async function GET(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.redirect(new URL("/login", req.url))
  }

  const searchParams = req.nextUrl.searchParams
  const code = searchParams.get("code")
  const state = searchParams.get("state")
  const error = searchParams.get("error")

  // Handle OAuth errors (user denied access)
  if (error) {
    console.error("Etsy OAuth error:", error)
    return NextResponse.redirect(
      new URL(`/integrations?etsy_error=${encodeURIComponent(error)}`, req.url)
    )
  }

  if (!code || !state) {
    return NextResponse.redirect(
      new URL("/integrations?etsy_error=invalid_response", req.url)
    )
  }

  // Verify CSRF state
  const storedState = req.cookies.get("etsy_oauth_state")?.value
  if (!storedState || storedState !== state) {
    return NextResponse.redirect(
      new URL("/integrations?etsy_error=invalid_state", req.url)
    )
  }

  // Verify the state contains the correct userId
  try {
    const stateData = JSON.parse(Buffer.from(state, "base64url").toString())
    if (stateData.userId !== user.id) {
      return NextResponse.redirect(
        new URL("/integrations?etsy_error=user_mismatch", req.url)
      )
    }
  } catch {
    return NextResponse.redirect(
      new URL("/integrations?etsy_error=invalid_state", req.url)
    )
  }

  // Retrieve the PKCE code_verifier from cookie
  const codeVerifier = req.cookies.get("etsy_code_verifier")?.value
  if (!codeVerifier) {
    return NextResponse.redirect(
      new URL("/integrations?etsy_error=missing_verifier", req.url)
    )
  }

  try {
    const callbackUrl = new URL("/api/auth/etsy/callback", req.url).toString()

    // Exchange code for tokens using PKCE verifier
    const tokens = await exchangeEtsyCode(code, codeVerifier, callbackUrl)

    // Fetch the user's Etsy shop info
    const shopInfo = await getEtsyShopInfo(tokens.access_token)

    const expiresAt = new Date(Date.now() + tokens.expires_in * 1000)

    // Upsert connection (one connection per user)
    const { data: connection, error: dbError } = await supabase
      .from("etsy_connections")
      .upsert({
        user_id: user.id,
        shop_id: shopInfo.shopId,
        shop_name: shopInfo.shopName,
        access_token: tokens.access_token,
        refresh_token: tokens.refresh_token,
        expires_at: expiresAt.toISOString(),
        updated_at: new Date().toISOString(),
      }, {
        onConflict: "user_id",
      })
      .select("id")
      .single()

    if (dbError) {
      console.error("Failed to save Etsy connection:", dbError)
      return NextResponse.redirect(
        new URL("/integrations?etsy_error=save_failed", req.url)
      )
    }

    // Trigger initial product sync in the background
    if (connection?.id) {
      try {
        await tasks.trigger<typeof etsyProductSync>("etsy-product-sync", {
          userId: user.id,
          etsyConnectionId: connection.id,
        })
      } catch (triggerErr) {
        // Non-fatal: sync can be retried manually
        console.warn("Failed to trigger Etsy product sync:", triggerErr)
      }
    }

    // Clear cookies and redirect with success
    const response = NextResponse.redirect(
      new URL("/integrations?etsy=connected", req.url)
    )
    response.cookies.delete("etsy_oauth_state")
    response.cookies.delete("etsy_code_verifier")

    return response
  } catch (err: any) {
    console.error("Etsy callback error:", err)
    return NextResponse.redirect(
      new URL(`/integrations?etsy_error=${encodeURIComponent(err.message || "unknown")}`, req.url)
    )
  }
}
