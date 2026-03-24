import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/utils/supabase/server"
import { buildAuthUrl } from "@/lib/pinterest-api"

/**
 * Pinterest OAuth Initiation
 * 
 * GET /api/auth/pinterest
 * Redirects user to Pinterest to authorize our app.
 */
export async function GET(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.redirect(new URL("/login", req.url))
  }

  if (!process.env.PINTEREST_APP_ID) {
    return NextResponse.json({ error: "Pinterest OAuth not configured" }, { status: 500 })
  }

  const callbackUrl = new URL("/api/auth/pinterest/callback", req.url).toString()

  // Generate CSRF state token
  const state = Buffer.from(JSON.stringify({
    userId: user.id,
    timestamp: Date.now(),
    nonce: Math.random().toString(36).substring(7),
  })).toString("base64")

  const authUrl = buildAuthUrl(callbackUrl, state)

  const response = NextResponse.redirect(authUrl)

  // Store state in cookie for verification
  response.cookies.set("pinterest_oauth_state", state, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 600, // 10 minutes
  })

  return response
}
