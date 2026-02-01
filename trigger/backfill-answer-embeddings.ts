import { task } from "@trigger.dev/sdk/v3"
import { createAdminClient } from "@/utils/supabase/admin"
import { generateEmbedding } from "@/lib/internal-linking"

/**
 * Backfill missing answer_embedding values in the answer_coverage table.
 * Processes rows in batches to avoid API rate limits.
 */
export const backfillAnswerEmbeddings = task({
    id: "backfill-answer-embeddings",
    run: async (payload: { batchSize?: number; dryRun?: boolean }) => {
        const { batchSize = 10, dryRun = false } = payload
        const supabase = createAdminClient() as any

        console.log(`🚀 Starting answer_coverage embedding backfill (dryRun=${dryRun}, batchSize=${batchSize})`)

        // Fetch all rows with null answer_embedding
        const { data: rows, error: fetchError } = await supabase
            .from("answer_coverage")
            .select("id, answer_unit")
            .is("answer_embedding", null)
            .limit(1000) // Safety limit

        if (fetchError) {
            console.error("❌ Failed to fetch rows:", fetchError)
            return { success: false, error: fetchError.message }
        }

        if (!rows || rows.length === 0) {
            console.log("✅ No rows need backfilling!")
            return { success: true, processed: 0 }
        }

        console.log(`📊 Found ${rows.length} rows with missing embeddings`)

        if (dryRun) {
            console.log("🔵 Dry run - not making any changes")
            return { success: true, processed: 0, wouldProcess: rows.length }
        }

        let processedCount = 0
        let errorCount = 0

        // Process in batches
        for (let i = 0; i < rows.length; i += batchSize) {
            const batch = rows.slice(i, i + batchSize)
            console.log(`⚙️ Processing batch ${Math.floor(i / batchSize) + 1} of ${Math.ceil(rows.length / batchSize)}...`)

            for (const row of batch) {
                try {
                    const embedding = await generateEmbedding(row.answer_unit)
                    const embeddingJson = JSON.stringify(embedding)

                    const { error: updateError } = await supabase
                        .from("answer_coverage")
                        .update({ answer_embedding: embeddingJson })
                        .eq("id", row.id)

                    if (updateError) {
                        console.error(`❌ Failed to update row ${row.id}:`, updateError.message)
                        errorCount++
                    } else {
                        processedCount++
                    }
                } catch (e: any) {
                    console.error(`❌ Failed to generate embedding for "${row.answer_unit}":`, e.message)
                    errorCount++
                }
            }

            // Small delay between batches to avoid rate limiting
            if (i + batchSize < rows.length) {
                await new Promise(resolve => setTimeout(resolve, 1000))
            }
        }

        console.log(`🎉 Backfill complete! Processed: ${processedCount}, Errors: ${errorCount}`)
        return { success: true, processed: processedCount, errors: errorCount, total: rows.length }
    }
})
