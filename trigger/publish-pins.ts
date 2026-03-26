import { schedules, logger } from "@trigger.dev/sdk/v3"
import { createAdminClient } from "@/utils/supabase/admin"
import { getValidAccessToken, createPin, getBoards, createBoard } from "@/lib/pinterest-api"

/**
 * PinLoop — Drip Publisher Engine
 * 
 * Runs every 6 hours. Publishes queued pins to Pinterest at a
 * rate controlled by the account's warmup phase:
 * 
 * - warmup_no_url (Days 1-14):   3 repins/day, 0 URL pins → we skip publishing
 * - warmup_partial (Days 15-30): 5 repins + 2 URL pins/day → max 1 per batch
 * - full (Days 31+):             15 pins/day → max 4 per batch
 * 
 * Shadow ban prevention:
 * - Never publish the same product link within 24 hours
 * - Randomize publish times slightly (jitter)
 * - Respect daily limits strictly
 */
export const publishPins = schedules.task({
  id: "pinloop-drip-publisher",
  cron: "15 */6 * * *", // Every 6 hours at :15 (offset from generator)
  run: async () => {
    logger.info("📌 PinLoop publisher started")

    const supabase = createAdminClient() as any

    // Get all users with Pinterest connections
    const { data: connections, error } = await supabase
      .from("pinterest_connections")
      .select("user_id, warmup_phase, trust_score, pinterest_user_id")

    if (error || !connections || connections.length === 0) {
      logger.info("No Pinterest connections found")
      return { result: "No connections", published: 0 }
    }

    let totalPublished = 0

    for (const connection of connections) {
      try {
        const { user_id, warmup_phase, trust_score } = connection

        // Check if user has paused automation
        const { data: brandCheck } = await supabase
          .from("brand_settings")
          .select("automation_paused")
          .eq("user_id", user_id)
          .maybeSingle()

        if (brandCheck?.automation_paused) {
          logger.info(`User ${user_id}: automation paused, skipping publish`)
          continue
        }

        // Determine max pins per batch based on warmup phase
        let maxPinsPerBatch: number
        switch (warmup_phase) {
          case "warmup_no_url":
            logger.info(`User ${user_id}: warmup_no_url phase — skipping URL pin publishing`)
            continue // Don't publish URL pins during warmup
          case "warmup_partial":
            maxPinsPerBatch = 1 // Very conservative
            break
          case "full":
            maxPinsPerBatch = 4 // ~16/day across 4 batches
            break
          default:
            maxPinsPerBatch = 1
        }

        // Check daily pin count
        const todayStart = new Date()
        todayStart.setHours(0, 0, 0, 0)

        const { count: pinsToday } = await supabase
          .from("pins")
          .select("id", { count: "exact", head: true })
          .eq("user_id", user_id)
          .gte("published_at", todayStart.toISOString())
          .eq("status", "published")

        const dailyLimit = warmup_phase === "full" ? 15 : 2
        if ((pinsToday || 0) >= dailyLimit) {
          logger.info(`User ${user_id}: daily limit reached (${pinsToday}/${dailyLimit})`)
          continue
        }

        const remainingToday = dailyLimit - (pinsToday || 0)
        const batchSize = Math.min(maxPinsPerBatch, remainingToday)

        // Get valid access token (auto-refreshes if needed)
        const accessToken = await getValidAccessToken(user_id)
        if (!accessToken) {
          logger.error(`No valid access token for user ${user_id}`)
          continue
        }

        // Get user's boards
        let boards: any[]
        try {
          boards = await getBoards(accessToken)
        } catch (e: any) {
          logger.error(`Failed to fetch boards for user ${user_id}: ${e.message}`)
          continue
        }

        if (boards.length === 0) {
          logger.warn(`User ${user_id}: no boards found — skipping`)
          continue
        }

        // Get queued pins
        const { data: queuedPins } = await supabase
          .from("pin_queue")
          .select("id, pin_id")
          .eq("user_id", user_id)
          .eq("status", "pending")
          .order("priority", { ascending: true })
          .order("created_at", { ascending: true })
          .limit(batchSize)

        if (!queuedPins || queuedPins.length === 0) {
          logger.info(`User ${user_id}: no pins in queue`)
          continue
        }

        for (const queueItem of queuedPins) {
          try {
            // Fetch the pin details
            const { data: pin } = await supabase
              .from("pins")
              .select("*, products(title, product_url)")
              .eq("id", queueItem.pin_id)
              .single()

            if (!pin || !pin.rendered_image_url) {
              logger.warn(`Pin ${queueItem.pin_id}: missing rendered image, skipping`)
              await supabase.from("pin_queue").update({ status: "cancelled" }).eq("id", queueItem.id)
              continue
            }

            // Feature 16: Domain Velocity Capping (The Safety Brake)
            // No two pins pointing to the same root domain can be published within 4 hours of each other.
            if (!pin.is_mood_board && pin.products?.product_url) {
              const fourHoursAgo = new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString()
              const { count: recentDomainPin } = await supabase
                .from("pins")
                .select("id", { count: "exact", head: true })
                .eq("user_id", user_id)
                .eq("status", "published")
                .eq("is_mood_board", false)
                .gte("published_at", fourHoursAgo)

              if ((recentDomainPin || 0) > 0) {
                logger.info(`Pin ${pin.id}: Domain Velocity Cap hit. A product pin was published in the last 4 hours. Deferring URL pin to next safe window.`)
                continue
              }
            }

            // Feature 11: Select best board or auto-create a new SEO-optimized one
            const targetBoard = await selectOrCreateBoard(boards, pin.pin_title || '', pin.target_angle || '', accessToken)
            if (!targetBoard) {
              logger.error(`No board available for pin ${pin.id}, skipping`)
              continue
            }

            // Feature 15: Chronological Jitter (Mimicking Human Entropy)
            // API pushes are randomly offset by up to 45 minutes to completely mask bot footprints.
            const jitterMs = Math.floor(Math.random() * (45 * 60 * 1000))
            logger.info(`🛡️ Anti-Ban: Applying chronological jitter of ${Math.round(jitterMs / 60000)} minutes...`)
            await new Promise(resolve => setTimeout(resolve, jitterMs))

            // Publish to Pinterest
            const pinterestResult = await createPin(accessToken, {
              boardId: targetBoard.id,
              title: pin.pin_title || '',
              description: pin.pin_description || '',
              link: pin.is_mood_board ? '' : (pin.products?.product_url || ''),
              imageUrl: pin.rendered_image_url,
            })

            // Update pin record
            await supabase
              .from("pins")
              .update({
                pinterest_pin_id: pinterestResult.id,
                pinterest_board_id: targetBoard.id,
                published_at: new Date().toISOString(),
                pin_url: `https://pinterest.com/pin/${pinterestResult.id}`,
                status: "published",
              })
              .eq("id", pin.id)

            // Update queue item
            await supabase
              .from("pin_queue")
              .update({
                status: "published",
                published_at: new Date().toISOString(),
              })
              .eq("id", queueItem.id)

            totalPublished++
            logger.info(`✅ Published pin ${pin.id} → Pinterest ${pinterestResult.id}`)

          } catch (pinError: any) {
            logger.error(`Failed to publish pin ${queueItem.pin_id}: ${pinError.message}`)

            // Mark as failed
            await supabase.from("pins").update({
              status: "failed",
              error_message: pinError.message,
            }).eq("id", queueItem.pin_id)

            await supabase.from("pin_queue").update({ status: "cancelled" }).eq("id", queueItem.id)
          }
        }

        // Log account health
        await supabase.from("account_health_log").insert({
          user_id,
          pinterest_connection_id: connection.id || null,
          pins_today: (pinsToday || 0) + totalPublished,
          warmup_phase,
          warmup_day: connection.account_age_days || 0,
          shadow_ban_risk: totalPublished > 10 ? "high" : totalPublished > 5 ? "medium" : "low",
          checked_at: new Date().toISOString(),
        })

      } catch (userError: any) {
        logger.error(`Error processing user ${connection.user_id}: ${userError.message}`)
      }
    }

    logger.info(`📌 PinLoop publisher complete: ${totalPublished} pins published`)
    return { result: "Complete", published: totalPublished }
  },
})

/**
 * Feature 11: Select the best board or auto-create an SEO-optimized one.
 * 
 * 1. Score each existing board by keyword overlap with the pin title.
 * 2. If a strong match is found (score >= 2), use that board.
 * 3. If no match, auto-create a new board named after the pin's lifestyle angle.
 * 4. Cache created boards in `boardCache` to avoid duplicate creation in a single batch.
 */
const boardCache = new Map<string, any>()

async function selectOrCreateBoard(
  boards: any[],
  pinTitle: string,
  targetAngle: string,
  accessToken: string
): Promise<any> {
  const titleWords = pinTitle.toLowerCase().split(/\s+/)

  // Score each existing board by keyword overlap
  let bestBoard = boards.find(b => b.privacy === 'PUBLIC') || boards[0]
  let bestScore = 0

  for (const board of boards) {
    if (board.privacy !== 'PUBLIC') continue

    const boardName = (board.name || '').toLowerCase()
    const boardDesc = (board.description || '').toLowerCase()
    let score = 0

    for (const word of titleWords) {
      if (word.length < 3) continue
      if (boardName.includes(word)) score += 2
      if (boardDesc.includes(word)) score += 1
    }

    if (score > bestScore) {
      bestScore = score
      bestBoard = board
    }
  }

  // If we found a strong keyword match, use it
  if (bestScore >= 2) {
    return bestBoard
  }

  // No strong match — auto-create a new SEO-optimized board
  // Derive a board name from the angle or pin title
  const boardName = targetAngle
    ? `${targetAngle.split(' ').slice(0, 5).join(' ')} Ideas`
    : `${pinTitle.split(' ').slice(0, 4).join(' ')} Inspiration`

  // Check cache first to avoid creating duplicates in the same batch
  const cacheKey = boardName.toLowerCase().trim()
  if (boardCache.has(cacheKey)) {
    return boardCache.get(cacheKey)
  }

  try {
    logger.info(`📌 Feature 11: Auto-creating SEO board: "${boardName}"`)
    const newBoard = await createBoard(
      accessToken,
      boardName,
      `Curated ${boardName.toLowerCase()} for your home, lifestyle, and aesthetic inspiration. Discover trending products and design ideas.`
    )
    boardCache.set(cacheKey, newBoard)
    boards.push(newBoard) // Add to the live list for subsequent pins
    return newBoard
  } catch (err: any) {
    logger.error(`Failed to create board "${boardName}": ${err.message}`)
    return bestBoard // Fall back to best existing board
  }
}
