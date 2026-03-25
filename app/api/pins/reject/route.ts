import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/utils/supabase/server"

/**
 * Reject a Pin with Feedback
 * POST /api/pins/reject
 * Body: { pinId: string, reason: 'bad_image' | 'bad_text' | 'wrong_vibe', note?: string }
 * 
 * Marks pin as "rejected" and logs the rejection reason for AI learning.
 */
export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const { pinId, reason, note } = await req.json()

    if (!pinId || !reason) {
      return NextResponse.json({ error: "pinId and reason required" }, { status: 400 })
    }

    const validReasons = ["bad_image", "bad_text", "wrong_vibe"]
    if (!validReasons.includes(reason)) {
      return NextResponse.json({ error: "Invalid reason. Must be: bad_image, bad_text, or wrong_vibe" }, { status: 400 })
    }

    // Verify pin belongs to user and is in pending_approval
    const { data: pin, error: fetchError } = await supabase
      .from("pins")
      .select("id")
      .eq("id", pinId)
      .eq("user_id", user.id)
      .eq("status", "pending_approval")
      .single()

    if (fetchError || !pin) {
      return NextResponse.json({ error: "Pin not found or not pending approval" }, { status: 404 })
    }

    // Update pin status to rejected
    await supabase
      .from("pins")
      .update({ status: "rejected", updated_at: new Date().toISOString() })
      .eq("id", pinId)

    // Log the rejection with reason
    await supabase.from("pin_rejections").insert({
      pin_id: pinId,
      user_id: user.id,
      reason,
      note: note || null,
    })

    return NextResponse.json({ success: true })
  } catch (err: any) {
    console.error("Pin reject error:", err)
    return NextResponse.json({ error: err.message || "Rejection failed" }, { status: 500 })
  }
}
