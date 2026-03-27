import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/utils/supabase/server"

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
  }

  try {
    const { storeUrl, apiToken } = await req.json()
    if (!storeUrl || !apiToken) {
      return NextResponse.json({ message: "Missing store URL or API Token" }, { status: 400 })
    }

    // Clean store URL
    const cleanUrl = storeUrl.replace(/^https?:\/\//, "").replace(/\/+$/, "")
    const testUrl = `https://${cleanUrl}/admin/api/2024-01/products.json?limit=1`

    // Validate token against Shopify Admin API per PRD
    const res = await fetch(testUrl, {
      method: "GET",
      headers: {
        "X-Shopify-Access-Token": apiToken,
        "Content-Type": "application/json"
      }
    })

    if (!res.ok) {
      // Return 400 for validation failure
      return NextResponse.json(
        { message: `Shopify API rejected the token (Status: ${res.status})` },
        { status: 400 }
      )
    }

    // Validation successful, save to profiles table as per PRD
    const { error: profileError } = await supabase
      .from("profiles")
      .update({
        shopify_custom_app_token: apiToken,
        shopify_store_url: cleanUrl
      })
      .eq("id", user.id)

    if (profileError) {
      return NextResponse.json({ message: "Failed to save connection to database." }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (err: any) {
    return NextResponse.json({ message: err.message }, { status: 500 })
  }
}
