import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/utils/supabase/server"
import { encrypt } from "@/utils/encryption"

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
  }

  try {
    const { storeUrl, clientId, clientSecret } = await req.json()
    if (!storeUrl || !clientId || !clientSecret) {
      return NextResponse.json({ message: "Missing store URL, Client ID, or Client Secret" }, { status: 400 })
    }

    // Clean store URL
    const cleanUrl = storeUrl.replace(/^https?:\/\//, "").replace(/\/+$/, "")
    const authUrl = `https://${cleanUrl}/admin/oauth/access_token`

    // Step 1: Validate credentials by exchanging them for an access token immediately
    const res = await fetch(authUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        client_id: clientId,
        client_secret: clientSecret,
        grant_type: "client_credentials"
      })
    })

    if (!res.ok) {
      const errorData = await res.json().catch(() => ({}))
      // Return 400 for validation failure
      return NextResponse.json(
        { message: `Shopify rejected credentials: ${errorData.error_description || 'Invalid Client Credentials'}` },
        { status: 400 }
      )
    }

    // We successfully got a 24-hr token (res.ok is true). We just drop the token; the background job will fetch a new one when needed.

    // Step 2: Encrypt the secret using our secure AES-256-GCM utility.
    let encryptedSecret: string
    try {
      encryptedSecret = encrypt(clientSecret)
    } catch (encErr: any) {
      console.error("Encryption failed:", encErr)
      return NextResponse.json({ message: `Server Configuration Error: ${encErr.message}` }, { status: 500 })
    }

    // Validation successful, save to shopify_connections table securely
    const { error: connectionError } = await supabase
      .from("shopify_connections")
      .upsert({
        user_id: user.id,
        shopify_client_id: clientId, // Public ID 
        shopify_client_secret: encryptedSecret, // Encrypted securely
        store_domain: cleanUrl,
        is_default: true,
        updated_at: new Date().toISOString()
      }, {
        onConflict: "user_id,store_domain"
      })

    if (connectionError) {
      return NextResponse.json({ message: `Failed to save connection: ${connectionError.message}` }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (err: any) {
    return NextResponse.json({ message: err.message }, { status: 500 })
  }
}
