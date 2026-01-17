"use server"

import { createClient } from "@/utils/supabase/server"
import { getGeminiClient } from "@/utils/gemini/geminiClient"
import { fetchSitemapUrls, extractTitlesFromUrls, extractParentQuestions, preseedCoverage } from "@/lib/sitemap"

/**
 * Syncs a website's sitemap content to answer_coverage table.
 * This ensures the content plan knows what content already exists.
 * Should be called BEFORE generating a content plan.
 */
export async function syncSitemapToCoverage(
    websiteUrl: string,
    brandId: string
): Promise<{ success: boolean; count: number; error?: string }> {
    try {
        const supabase = await createClient()
        const { data: { user } } = await supabase.auth.getUser()

        if (!user) {
            return { success: false, count: 0, error: "Not authenticated" }
        }


        // Step 1: Fetch sitemap URLs
        const urls = await fetchSitemapUrls(websiteUrl)
        if (urls.length === 0) {
            return { success: true, count: 0 }
        }


        // Step 2: Extract titles from URLs
        const titles = extractTitlesFromUrls(urls)
        if (titles.length === 0) {
            return { success: true, count: 0 }
        }


        // Step 3: Use LLM to extract parent questions
        const genAI = getGeminiClient()
        const parentQuestions = await extractParentQuestions(titles, genAI)

        // Step 4: Save to answer_coverage table
        const savedCount = await preseedCoverage(parentQuestions, user.id, brandId, supabase)

        return { success: true, count: savedCount }
    } catch (error: any) {
        return { success: false, count: 0, error: error.message }
    }
}
