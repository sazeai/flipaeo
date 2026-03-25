import { NextResponse } from "next/server"
import { createClient } from "@/utils/supabase/server"

/**
 * Approve All Pending Pins
 * POST /api/pins/approve-all
 * 
 * Moves ALL of the user's "pending_approval" pins → "queued" and inserts into pin_queue.
 */
export async function POST() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    // Get all pending_approval pins for this user
    const { data: pendingPins, error: fetchError } = await supabase
      .from("pins")
      .select("id")
      .eq("user_id", user.id)
      .eq("status", "pending_approval")

    if (fetchError || !pendingPins || pendingPins.length === 0) {
      return NextResponse.json({ approved: 0 })
    }

    const pinIds = pendingPins.map((p: any) => p.id)

    // Batch update pins to "queued"
    await supabase
      .from("pins")
      .update({ status: "queued", updated_at: new Date().toISOString() })
      .in("id", pinIds)

    // Batch insert into pin_queue
    const queueEntries = pinIds.map((pinId: string) => ({
      user_id: user.id,
      pin_id: pinId,
      priority: 0,
      status: "pending",
    }))

    await supabase.from("pin_queue").insert(queueEntries)

    return NextResponse.json({ approved: pinIds.length })
  } catch (err: any) {
    console.error("Approve-all error:", err)
    return NextResponse.json({ error: err.message || "Approval failed" }, { status: 500 })
  }
}
