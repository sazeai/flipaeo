import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/utils/supabase/server"

export async function GET(req: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const { searchParams } = new URL(req.url)
    const userSprintId = searchParams.get("user_sprint_id")
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

    const { data, error } = await supabase
      .from("gsc_decay_candidates")
      .select("*")
      .eq("user_sprint_id", userSprintId)
      .order("decay_score", { ascending: false })
      .limit(200)

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ candidates: data || [] })
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || "Failed to fetch candidates" }, { status: 500 })
  }
}
