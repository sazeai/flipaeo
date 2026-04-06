import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/utils/supabase/server"
import { getValidAccessToken, getBoards } from "@/lib/pinterest-api"

export async function GET(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const accessToken = await getValidAccessToken(user.id)
    if (!accessToken) {
      return NextResponse.json({ error: "Not connected to Pinterest" }, { status: 400 })
    }

    const boards = await getBoards(accessToken)
    return NextResponse.json({ boards })
  } catch (err: any) {
    console.error("Fetch boards error:", err)
    return NextResponse.json({ error: err.message || "Failed to fetch boards" }, { status: 500 })
  }
}
