import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/utils/supabase/server"
import { publishToWordPress, uploadContentImagesToWordPress, prepareContentForWordPress } from "@/lib/integrations/wordpress-client"

export async function POST(req: NextRequest) {
    try {
        const supabase = await createClient()
        const { data: { user } } = await supabase.auth.getUser()

        if (!user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
        }

        const body = await req.json()
        const { articleId, connectionId, publishStatus = 'publish' } = body

        if (!articleId || !connectionId) {
            return NextResponse.json({ error: "Missing articleId or connectionId" }, { status: 400 })
        }

        // 1. Fetch the article
        const { data: article, error: articleError } = await supabase
            .from("articles")
            .select("id, outline, final_html, meta_description, slug, featured_image_url, user_id")
            .eq("id", articleId)
            .eq("user_id", user.id)
            .single()

        if (articleError || !article) {
            console.error(`[WP Publish API] Article not found: ${articleId}`)
            return NextResponse.json({ error: "Article not found" }, { status: 404 })
        }

        if (!article.final_html) {
            return NextResponse.json({ error: "Article has no content to publish" }, { status: 400 })
        }

        // 2. Fetch the WordPress connection
        const { data: connection, error: connectionError } = await supabase
            .from("wordpress_connections")
            .select("id, site_url, username, app_password, default_category_id")
            .eq("id", connectionId)
            .eq("user_id", user.id)
            .single()

        if (connectionError || !connection) {
            console.error(`[WP Publish API] Connection not found: ${connectionId}`)
            return NextResponse.json({ error: "WordPress connection not found" }, { status: 404 })
        }

        const appUrl = process.env.NEXT_PUBLIC_APP_URL
            || (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'http://localhost:3000')

        // 3. Get the featured image URL (use proxy if needed)
        let featuredImageUrl = article.featured_image_url
        if (featuredImageUrl && featuredImageUrl.includes('.r2.cloudflarestorage.com/')) {
            // Convert to proxy URL for fetching
            const key = featuredImageUrl.split('.r2.cloudflarestorage.com/')[1]
            featuredImageUrl = `${appUrl}/api/images/${key}`
        } else if (featuredImageUrl && featuredImageUrl.startsWith('/api/images/')) {
            // Already a relative proxy URL - make it absolute
            featuredImageUrl = `${appUrl}${featuredImageUrl}`
        }


        // 4. Upload section images to WordPress media library and replace R2 URLs
        const credentials = {
            siteUrl: connection.site_url,
            username: connection.username,
            appPassword: connection.app_password,
        }

        let processedContent = article.final_html
        try {
            processedContent = await uploadContentImagesToWordPress(
                credentials,
                article.final_html,
                appUrl
            )
        } catch (imgError) {
            console.error('[WP Publish API] Section images processing failed:', imgError)
            // Continue with original content - non-blocking
        }

        // 4b. Prepare content for WordPress (strip H1, convert to Gutenberg blocks)
        processedContent = prepareContentForWordPress(processedContent)

        // 5. Publish to WordPress
        const result = await publishToWordPress(
            credentials,
            {
                title: article.outline?.title || 'Untitled',
                content: processedContent,
                excerpt: article.meta_description || undefined,
                slug: article.slug || undefined,
                featuredImageUrl,
                categoryId: connection.default_category_id || null,
            },
            publishStatus
        )

        if (!result.success) {
            return NextResponse.json({ error: result.error }, { status: 500 })
        }

        // 5. Update article with WordPress post info
        await supabase
            .from("articles")
            .update({
                wordpress_post_id: String(result.post?.id),
                wordpress_post_url: result.post?.link,
                wordpress_site_id: connectionId,
                published_at: new Date().toISOString(),
            })
            .eq("id", articleId)

        return NextResponse.json({
            success: true,
            postId: result.post?.id,
            postUrl: result.post?.link,
            status: result.post?.status,
        })

    } catch (error: any) {
        console.error("WordPress publish error:", error)
        return NextResponse.json(
            { error: error.message || "Failed to publish" },
            { status: 500 }
        )
    }
}
