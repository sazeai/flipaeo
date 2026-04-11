import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/utils/supabase/server"

/**
 * Update Pin Metadata
 * PATCH /api/pins/[id]
 * Body: { pin_title?, pin_description?, pinterest_board_id? }
 */
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { id } = await params

  try {
    // Verify pin belongs to user
    const { data: pin, error: fetchError } = await supabase
      .from("pins")
      .select("id, status")
      .eq("id", id)
      .eq("user_id", user.id)
      .single()

    if (fetchError || !pin) {
      return NextResponse.json({ error: "Pin not found" }, { status: 404 })
    }

    const body = await req.json()

    // Only allow updating these fields
    const allowedFields = ["pin_title", "pin_description", "pinterest_board_id"]
    const updatePayload: Record<string, any> = {
      updated_at: new Date().toISOString(),
    }

    for (const field of allowedFields) {
      if (body[field] !== undefined) {
        updatePayload[field] = body[field]
      }
    }

    const { error: updateError } = await supabase
      .from("pins")
      .update(updatePayload)
      .eq("id", id)

    if (updateError) {
      return NextResponse.json({ error: "Failed to update pin" }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (err: any) {
    console.error("Pin update error:", err)
    return NextResponse.json({ error: err.message || "Update failed" }, { status: 500 })
  }
}
