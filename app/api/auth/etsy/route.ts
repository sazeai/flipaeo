import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/utils/supabase/server"
import { generatePKCE, buildEtsyAuthUrl } from "@/lib/etsy-oauth"

/**
 * Etsy OAuth 2.0 Initiation (PKCE)
 *
 * GET /api/auth/etsy
 * Generates PKCE pair, stores verifier in a cookie,
 * and redirects user to Etsy's OAuth consent screen.
 */
export async function GET(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.redirect(new URL("/login", req.url))
  }

  if (!process.env.ETSY_API_KEY || !process.env.ETSY_SHARED_SECRET) {
    return NextResponse.json({ error: "Etsy OAuth not configured" }, { status: 500 })
  }

  const callbackUrl = new URL("/api/auth/etsy/callback", req.url).toString()

  // Generate PKCE pair
  const { codeVerifier, codeChallenge } = generatePKCE()

  // Generate CSRF state token
  const state = Buffer.from(JSON.stringify({
    userId: user.id,
    timestamp: Date.now(),
    nonce: Math.random().toString(36).substring(7),
  })).toString("base64url")

  const authUrl = buildEtsyAuthUrl(codeChallenge, callbackUrl, state)

  const response = NextResponse.redirect(authUrl)

  // Store state and code_verifier in cookies for verification on callback
  response.cookies.set("etsy_oauth_state", state, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 600,
  })

  response.cookies.set("etsy_code_verifier", codeVerifier, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 600,
  })

  return response
}
