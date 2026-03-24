/**
 * Sprint Pacing — Deterministic 90-day article scheduling
 *
 * Distributes articles across a 90-day sprint window with:
 * - Separate pacing queues for new vs refresh
 * - Max 2 articles/day (quality protection)
 * - Refresh starts after day 14 (gives GSC time to sync)
 * - Even distribution with slight authority ramp-up in later phases
 * - No front-loading
 */

export type PacingParams = {
  totalNew: number
  totalRefresh: number
  sprintStartDate: string // ISO date
  durationDays?: number   // default 90
}

export type PacedSlot = {
  day: number
  date: string // ISO date
  type: "new" | "refresh"
  phase: "Foundation" | "Growth" | "Expansion" | "Authority"
}

/**
 * Map day number (1-90) to sprint phase
 */
export function dayToPhase(day: number): PacedSlot["phase"] {
  if (day <= 20) return "Foundation"
  if (day <= 45) return "Growth"
  if (day <= 70) return "Expansion"
  return "Authority"
}

/**
 * Generate a pacing schedule for the sprint.
 * Returns an ordered array of PacedSlots (one per article to be generated).
 */
export function generatePacingSchedule(params: PacingParams): PacedSlot[] {
  const { totalNew, totalRefresh, sprintStartDate, durationDays = 90 } = params
  const start = new Date(sprintStartDate)
  const slots: PacedSlot[] = []

  // --- New article pacing: days 1 through durationDays ---
  const newSlots = distributeEvenly(totalNew, 1, durationDays, 2)
  for (const day of newSlots) {
    const date = new Date(start)
    date.setDate(start.getDate() + (day - 1))
    slots.push({
      day,
      date: date.toISOString().split("T")[0],
      type: "new",
      phase: dayToPhase(day),
    })
  }

  // --- Refresh article pacing: days 15 through durationDays ---
  // Start refresh after day 14 to let GSC sync initial data
  const refreshStartDay = 15
  const refreshSlots = distributeEvenly(totalRefresh, refreshStartDay, durationDays, 1)
  for (const day of refreshSlots) {
    const date = new Date(start)
    date.setDate(start.getDate() + (day - 1))
    slots.push({
      day,
      date: date.toISOString().split("T")[0],
      type: "refresh",
      phase: dayToPhase(day),
    })
  }

  // Sort by day, then type (new before refresh on same day)
  slots.sort((a, b) => a.day - b.day || (a.type === "new" ? -1 : 1))

  return slots
}

/**
 * Distribute `count` items evenly across [startDay, endDay] with maxPerDay cap.
 * Returns an array of day numbers.
 */
function distributeEvenly(
  count: number,
  startDay: number,
  endDay: number,
  maxPerDay: number
): number[] {
  if (count <= 0) return []

  const availableDays = endDay - startDay + 1
  const capacity = availableDays * maxPerDay

  // If we can't fit everything even at max capacity, pack as tight as possible
  const effectiveMax = count > capacity ? Math.ceil(count / availableDays) : maxPerDay

  const days: number[] = []
  let remaining = count

  if (remaining <= availableDays) {
    // Fewer items than days: spread evenly with floating-point spacing
    const spacing = availableDays / remaining
    for (let i = 0; i < remaining; i++) {
      const day = startDay + Math.floor(i * spacing)
      days.push(Math.min(day, endDay))
    }
  } else {
    // More items than days: fill each day up to effectiveMax
    for (let d = startDay; d <= endDay && remaining > 0; d++) {
      const todayCount = Math.min(effectiveMax, remaining)
      for (let j = 0; j < todayCount; j++) {
        days.push(d)
        remaining--
      }
    }
  }

  return days
}

/**
 * Calculate desired daily throughput based on remaining quota and remaining days.
 * Used by the scheduler to decide how many articles to process today.
 */
export function dailyThroughput(remaining: number, daysLeft: number, maxBurst = 3): number {
  if (daysLeft <= 0 || remaining <= 0) return 0
  const ideal = Math.ceil(remaining / daysLeft)
  return Math.min(ideal, maxBurst)
}
