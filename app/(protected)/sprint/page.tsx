import { createClient } from "@/utils/supabase/server"
import Link from "next/link"

function pct(done: number, total: number) {
  if (!total) return 0
  return Math.max(0, Math.min(100, Math.round((done / total) * 100)))
}

export default async function SprintTrackerPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return null

  const { data: sprint } = await supabase
    .from("user_sprints")
    .select("id, status, starts_at, ends_at, sprint_packages(name, quota_new_articles, quota_refresh_articles)")
    .eq("user_id", user.id)
    .eq("status", "active")
    .maybeSingle()

  if (!sprint) {
    return (
      <div className="p-6 space-y-4">
        <h1 className="text-2xl font-semibold">90-Day Sprint Tracker</h1>
        <p className="text-sm text-muted-foreground">No active sprint found yet.</p>
      </div>
    )
  }

  const { data: ledgerRows } = await supabase
    .from("sprint_quota_ledgers")
    .select("quota_type, delta")
    .eq("user_sprint_id", sprint.id)

  let newBalance = 0
  let refreshBalance = 0
  for (const row of ledgerRows || []) {
    if (row.quota_type === "new") newBalance += Number(row.delta || 0)
    if (row.quota_type === "refresh") refreshBalance += Number(row.delta || 0)
  }

  const pkg: any = sprint.sprint_packages || {}
  const totalNew = Number(pkg?.quota_new_articles || 0)
  const totalRefresh = Number(pkg?.quota_refresh_articles || 0)
  const usedNew = Math.max(0, totalNew - newBalance)
  const usedRefresh = Math.max(0, totalRefresh - refreshBalance)

  const now = new Date()
  const end = sprint.ends_at ? new Date(sprint.ends_at) : now
  const daysRemaining = Math.max(0, Math.ceil((end.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)))

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">90-Day Sprint Tracker</h1>
        <Link href="/integrations" className="text-sm underline">Manage Integrations</Link>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <div className="rounded-lg border p-4">
          <p className="text-sm text-muted-foreground">Package</p>
          <p className="text-lg font-medium">{pkg?.name || "Sprint"}</p>
        </div>
        <div className="rounded-lg border p-4">
          <p className="text-sm text-muted-foreground">Days Remaining</p>
          <p className="text-lg font-medium">{daysRemaining}</p>
        </div>
        <div className="rounded-lg border p-4">
          <p className="text-sm text-muted-foreground">Status</p>
          <p className="text-lg font-medium capitalize">{sprint.status}</p>
        </div>
      </div>

      <div className="rounded-lg border p-4 space-y-2">
        <div className="flex justify-between text-sm">
          <span>New Pages Generated</span>
          <span>{usedNew}/{totalNew}</span>
        </div>
        <div className="h-2 bg-muted rounded">
          <div className="h-2 bg-primary rounded" style={{ width: `${pct(usedNew, totalNew)}%` }} />
        </div>
      </div>

      <div className="rounded-lg border p-4 space-y-2">
        <div className="flex justify-between text-sm">
          <span>Decaying Pages Refreshed</span>
          <span>{usedRefresh}/{totalRefresh}</span>
        </div>
        <div className="h-2 bg-muted rounded">
          <div className="h-2 bg-primary rounded" style={{ width: `${pct(usedRefresh, totalRefresh)}%` }} />
        </div>
      </div>

      <div className="rounded-lg border p-4">
        <p className="font-medium mb-2">GSC Impact</p>
        <p className="text-sm text-muted-foreground">
          Connect Google Search Console and sync decaying pages to populate before-vs-after trend cards.
        </p>
        <div className="mt-3">
          <Link href="/integrations" className="text-sm underline">Connect GSC</Link>
        </div>
      </div>
    </div>
  )
}
