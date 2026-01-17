"use server"

import { createClient } from "@/utils/supabase/server"
import Sitemapper from 'sitemapper'
import { extractTitleFromUrl, generateEmbedding } from "@/lib/internal-linking"

/**
 * Synchronously syncs a sitemap to the internal_links table.
 * This is used during onboarding to ensure links are available before plan generation.
 * 
 * Unlike the Trigger.dev version, this runs synchronously and waits for completion.
 * 
 * Returns the titles for immediate use in plan generation.
 */
export async function syncSitemapToInternalLinksAction(
    websiteUrl: string,
    brandId: string
): Promise<{ success: boolean; titles: string[]; count: number; error?: string }> {
    try {
        const supabase = await createClient()
        const { data: { user } } = await supabase.auth.getUser()

        if (!user) {
            return { success: false, titles: [], count: 0, error: "Not authenticated" }
        }

        // Build sitemap URLs to try
        const baseUrl = websiteUrl.replace(/\/$/, '')
        const sitemapPaths = ['/sitemap.xml', '/sitemap_index.xml', '/wp-sitemap.xml']

        let sitemapUrls: string[] = []
        let usedSitemapUrl = ""

        // Try paths sequentially until we find one with URLs
        for (const path of sitemapPaths) {
            const currentUrl = `${baseUrl}${path}`

            try {
                const sitemapper = new Sitemapper({
                    url: currentUrl,
                    timeout: 15000,
                })

                const { sites } = await sitemapper.fetch()
                if (sites && sites.length > 0) {
                    sitemapUrls = Array.from(new Set(sites as string[])) // Deduplicate
                    usedSitemapUrl = currentUrl
                    break // Stop if we found a working sitemap
                }
            } catch (e) {
            }
        }

        if (sitemapUrls.length === 0) {
            console.warn(`[Sync Internal Links] No URLs found in any sitemap for ${baseUrl}`)
            return { success: true, titles: [], count: 0, error: "No sitemap found" }
        }

        // Get existing URLs to avoid duplicates
        const { data: existingRecords } = await supabase
            .from("internal_links")
            .select("url")
            .eq("user_id", user.id)
            .eq("brand_id", brandId)

        const existingUrls = new Set<string>(existingRecords?.map((r: any) => r.url) || [])
        const urlsToAdd = sitemapUrls.filter(url => !existingUrls.has(url))

        const allTitles = sitemapUrls.map(url => extractTitleFromUrl(url))

        const BATCH_SIZE = 5
        let syncedCount = 0

        for (let i = 0; i < urlsToAdd.length; i += BATCH_SIZE) {
            const batch = urlsToAdd.slice(i, i + BATCH_SIZE)

            const inserts = await Promise.all(batch.map(async (url) => {
                const title = extractTitleFromUrl(url)

                try {
                    const embedding = await generateEmbedding(title)
                    return {
                        user_id: user.id,
                        brand_id: brandId,
                        url,
                        title,
                        embedding
                    }
                } catch (e) {
                    console.error(`[Sync Internal Links] Failed embedding for ${url}:`, e)
                    // Still save without embedding - can be backfilled later
                    return {
                        user_id: user.id,
                        brand_id: brandId,
                        url,
                        title,
                        embedding: null
                    }
                }
            }))

            const validInserts = inserts.filter(item => item !== null)

            if (validInserts.length > 0) {
                const { error } = await supabase
                    .from("internal_links")
                    .insert(validInserts)

                if (error) {
                    console.error("[Sync Internal Links] DB Insert error:", error)
                } else {
                    syncedCount += validInserts.length
                }
            }
        }

        return {
            success: true,
            titles: allTitles,
            count: syncedCount
        }
    } catch (error: any) {
        console.error("[Sync Internal Links] Error:", error)
        return { success: false, titles: [], count: 0, error: error.message }
    }
}
