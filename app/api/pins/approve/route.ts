import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/utils/supabase/server"

/**
 * Batch Approve Pins
 * POST /api/pins/approve
 * Body: { pinIds: string[] }
 * 
 * Moves pins from "pending_approval" → "queued" and inserts into pin_queue.
 */
export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const { pinIds } = await req.json()

    if (!pinIds || !Array.isArray(pinIds) || pinIds.length === 0) {
      return NextResponse.json({ error: "pinIds array required" }, { status: 400 })
    }

    // Verify all pins belong to user and are in pending_approval
    const { data: pins, error: fetchError } = await supabase
      .from("pins")
      .select("id")
      .eq("user_id", user.id)
      .eq("status", "pending_approval")
      .in("id", pinIds)

    if (fetchError || !pins) {
      return NextResponse.json({ error: "Failed to fetch pins" }, { status: 500 })
    }

    const validPinIds = pins.map((p: any) => p.id)

    if (validPinIds.length === 0) {
      return NextResponse.json({ approved: 0 })
    }

    // Update pins status to "queued"
    await supabase
      .from("pins")
      .update({ status: "queued", updated_at: new Date().toISOString() })
      .in("id", validPinIds)

    // Insert into pin_queue for the publisher to pick up
    const queueEntries = validPinIds.map((pinId: string) => ({
      user_id: user.id,
      pin_id: pinId,
      priority: 0,
      status: "pending",
    }))

    await supabase.from("pin_queue").insert(queueEntries)

    return NextResponse.json({ approved: validPinIds.length })
  } catch (err: any) {
    console.error("Pin approve error:", err)
    return NextResponse.json({ error: err.message || "Approval failed" }, { status: 500 })
  }
}
