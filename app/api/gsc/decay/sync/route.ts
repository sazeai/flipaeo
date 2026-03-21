import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/utils/supabase/server"
import { syncDecayCandidates } from "@/lib/gsc-decay"

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const body = await req.json().catch(() => ({}))
    const userSprintId = body?.user_sprint_id as string | undefined
    if (!userSprintId) {
      return NextResponse.json({ error: "user_sprint_id is required" }, { status: 400 })
    }

    const { data: sprint } = await supabase
      .from("user_sprints")
      .select("id, user_id")
      .eq("id", userSprintId)
      .eq("user_id", user.id)
      .maybeSingle()
    if (!sprint) return NextResponse.json({ error: "Sprint not found" }, { status: 404 })

    const result = await syncDecayCandidates({ userId: user.id, userSprintId: userSprintId })
    if (!result.success) {
      return NextResponse.json({ error: result.error || "Failed to sync candidates" }, { status: 500 })
    }

    return NextResponse.json({ success: true, inserted: result.inserted })
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || "Failed to sync decay candidates" }, { status: 500 })
  }
}
