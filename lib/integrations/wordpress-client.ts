/**
 * WordPress REST API Client for publishing articles
 * Uses Application Passwords for authentication
 */

interface WordPressCredentials {
    siteUrl: string
    username: string
    appPassword: string
}

interface WordPressPost {
    id: number
    link: string
    status: string
    title: { rendered: string }
}

interface CreatePostParams {
    title: string
    content: string
    excerpt?: string
    slug?: string
    status?: 'draft' | 'publish' | 'pending' | 'private'
    featured_media?: number
    categories?: number[]  // Category IDs
}

interface UploadMediaResult {
    id: number
    source_url: string
}

/**
 * Create Basic Auth header from credentials
 */
function createAuthHeader(username: string, appPassword: string): string {
    const credentials = Buffer.from(`${username}:${appPassword}`).toString('base64')
    return `Basic ${credentials}`
}

/**
 * Prepare HTML content for WordPress:
 * 1. Strip the first H1 (it's sent as post title)
 * 2. Convert HTML to Gutenberg blocks format
 */
export function prepareContentForWordPress(htmlContent: string): string {
    if (!htmlContent) return ''

    // 1. Remove the first H1 tag (title is sent separately as post title)
    let content = htmlContent.replace(/<h1[^>]*>[\s\S]*?<\/h1>/i, '')

    // 2. Convert HTML elements to Gutenberg blocks
    // Parse and wrap each element in appropriate block comments

    // Convert headings: <h2>...</h2> → <!-- wp:heading {"level":2} --><h2>...</h2><!-- /wp:heading -->
    content = content.replace(/<h2([^>]*)>([\s\S]*?)<\/h2>/gi,
        '<!-- wp:heading {"level":2} -->\n<h2$1>$2</h2>\n<!-- /wp:heading -->\n\n')
    content = content.replace(/<h3([^>]*)>([\s\S]*?)<\/h3>/gi,
        '<!-- wp:heading {"level":3} -->\n<h3$1>$2</h3>\n<!-- /wp:heading -->\n\n')
    content = content.replace(/<h4([^>]*)>([\s\S]*?)<\/h4>/gi,
        '<!-- wp:heading {"level":4} -->\n<h4$1>$2</h4>\n<!-- /wp:heading -->\n\n')

    // Convert paragraphs: <p>...</p> → <!-- wp:paragraph --><p>...</p><!-- /wp:paragraph -->
    content = content.replace(/<p([^>]*)>([\s\S]*?)<\/p>/gi,
        '<!-- wp:paragraph -->\n<p$1>$2</p>\n<!-- /wp:paragraph -->\n\n')

    // Convert images: <img.../> → <!-- wp:image --><figure><img.../></figure><!-- /wp:image -->
    content = content.replace(/<img([^>]*)>/gi, (match, attrs) => {
        // Extract src for image sizing
        const srcMatch = attrs.match(/src=["']([^"']*)["']/)
        const altMatch = attrs.match(/alt=["']([^"']*)["']/)
        const src = srcMatch ? srcMatch[1] : ''
        const alt = altMatch ? altMatch[1] : ''

        return `<!-- wp:image {"sizeSlug":"large"} -->\n<figure class="wp-block-image size-large"><img src="${src}" alt="${alt}"/></figure>\n<!-- /wp:image -->\n\n`
    })

    // Convert unordered lists: <ul>...</ul> → <!-- wp:list --><ul>...</ul><!-- /wp:list -->
    content = content.replace(/<ul([^>]*)>([\s\S]*?)<\/ul>/gi,
        '<!-- wp:list -->\n<ul$1>$2</ul>\n<!-- /wp:list -->\n\n')

    // Convert ordered lists: <ol>...</ol> → <!-- wp:list {"ordered":true} --><ol>...</ol><!-- /wp:list -->
    content = content.replace(/<ol([^>]*)>([\s\S]*?)<\/ol>/gi,
        '<!-- wp:list {"ordered":true} -->\n<ol$1>$2</ol>\n<!-- /wp:list -->\n\n')

    // Convert blockquotes: <blockquote>...</blockquote> → <!-- wp:quote --><blockquote>...</blockquote><!-- /wp:quote -->
    content = content.replace(/<blockquote([^>]*)>([\s\S]*?)<\/blockquote>/gi,
        '<!-- wp:quote -->\n<blockquote$1>$2</blockquote>\n<!-- /wp:quote -->\n\n')

    // Convert code blocks: <pre><code>...</code></pre> → <!-- wp:code --><pre><code>...</code></pre><!-- /wp:code -->
    content = content.replace(/<pre([^>]*)><code([^>]*)>([\s\S]*?)<\/code><\/pre>/gi,
        '<!-- wp:code -->\n<pre$1 class="wp-block-code"><code$2>$3</code></pre>\n<!-- /wp:code -->\n\n')

    // Clean up extra whitespace
    content = content.replace(/\n{3,}/g, '\n\n')

    return content.trim()
}


/**
 * Test WordPress connection by fetching current user
 */
export async function testConnection(credentials: WordPressCredentials): Promise<{ success: boolean; error?: string; siteName?: string }> {
    const { siteUrl, username, appPassword } = credentials

    try {
        // Normalize URL
        const baseUrl = siteUrl.replace(/\/+$/, '')
        const apiUrl = `${baseUrl}/wp-json/wp/v2/users/me`

        const response = await fetch(apiUrl, {
            method: 'GET',
            headers: {
                'Authorization': createAuthHeader(username, appPassword),
                'Content-Type': 'application/json',
            },
        })

        if (!response.ok) {
            if (response.status === 401) {
                return { success: false, error: 'Invalid credentials. Check username and application password.' }
            }
            if (response.status === 404) {
                return { success: false, error: 'WordPress REST API not found. Make sure permalinks are enabled.' }
            }
            return { success: false, error: `Connection failed: ${response.status} ${response.statusText}` }
        }

        const user = await response.json()

        // Fetch site name
        const siteResponse = await fetch(`${baseUrl}/wp-json`, {
            headers: { 'Authorization': createAuthHeader(username, appPassword) },
        })
        const siteInfo = await siteResponse.json()

        return {
            success: true,
            siteName: siteInfo?.name || siteUrl
        }
    } catch (error: any) {
        return {
            success: false,
            error: error.message || 'Failed to connect to WordPress site'
        }
    }
}

/**
 * Upload media (featured image) to WordPress
 */
export async function uploadMedia(
    credentials: WordPressCredentials,
    imageUrl: string,
    filename: string
): Promise<UploadMediaResult | null> {
    const { siteUrl, username, appPassword } = credentials

    try {
        // Fetch the image
        const imageResponse = await fetch(imageUrl)
        if (!imageResponse.ok) {
            console.error('Failed to fetch image:', imageUrl)
            return null
        }

        const imageBuffer = await imageResponse.arrayBuffer()
        const contentType = imageResponse.headers.get('content-type') || 'image/png'

        // Upload to WordPress
        const baseUrl = siteUrl.replace(/\/+$/, '')
        const apiUrl = `${baseUrl}/wp-json/wp/v2/media`

        const response = await fetch(apiUrl, {
            method: 'POST',
            headers: {
                'Authorization': createAuthHeader(username, appPassword),
                'Content-Disposition': `attachment; filename="${filename}"`,
                'Content-Type': contentType,
            },
            body: Buffer.from(imageBuffer),
        })

        if (!response.ok) {
            const errorText = await response.text()
            console.error('Failed to upload media:', errorText)
            return null
        }

        const media = await response.json()
        return {
            id: media.id,
            source_url: media.source_url,
        }
    } catch (error) {
        console.error('Error uploading media:', error)
        return null
    }
}

/**
 * WordPress Category
 */
interface WordPressCategory {
    id: number
    name: string
    slug: string
    count: number
}

/**
 * List all categories from WordPress
 */
export async function listCategories(credentials: WordPressCredentials): Promise<{
    categories: WordPressCategory[]
    error?: string
}> {
    const { siteUrl, username, appPassword } = credentials

    try {
        const baseUrl = siteUrl.replace(/\/+$/, '')
        // Fetch up to 100 categories, ordered by name
        const apiUrl = `${baseUrl}/wp-json/wp/v2/categories?per_page=100&orderby=name`

        const response = await fetch(apiUrl, {
            method: 'GET',
            headers: {
                'Authorization': createAuthHeader(username, appPassword),
                'Content-Type': 'application/json',
            },
        })

        if (!response.ok) {
            return {
                categories: [],
                error: `Failed to fetch categories: ${response.status}`
            }
        }

        const data = await response.json()
        const categories = data.map((cat: any) => ({
            id: cat.id,
            name: cat.name,
            slug: cat.slug,
            count: cat.count || 0,
        }))

        return { categories }
    } catch (error: any) {
        return {
            categories: [],
            error: error.message || 'Failed to fetch categories'
        }
    }
}

/**
 * Create a new post in WordPress
 */
export async function createPost(
    credentials: WordPressCredentials,
    params: CreatePostParams
): Promise<{ success: boolean; post?: WordPressPost; error?: string }> {
    const { siteUrl, username, appPassword } = credentials

    try {
        const baseUrl = siteUrl.replace(/\/+$/, '')
        const apiUrl = `${baseUrl}/wp-json/wp/v2/posts`

        const postBody: Record<string, any> = {
            title: params.title,
            content: params.content,
            excerpt: params.excerpt || '',
            slug: params.slug || '',
            status: params.status || 'draft',
            featured_media: params.featured_media || 0,
        }

        // Add categories if provided
        if (params.categories && params.categories.length > 0) {
            postBody.categories = params.categories
        }

        const response = await fetch(apiUrl, {
            method: 'POST',
            headers: {
                'Authorization': createAuthHeader(username, appPassword),
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(postBody),
        })

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}))
            return {
                success: false,
                error: errorData.message || `Failed to create post: ${response.status}`
            }
        }

        const post = await response.json()
        return {
            success: true,
            post: {
                id: post.id,
                link: post.link,
                status: post.status,
                title: post.title,
            }
        }
    } catch (error: any) {
        return {
            success: false,
            error: error.message || 'Failed to create post'
        }
    }
}

/**
 * Full publish flow: upload featured image + create post
 */
export async function publishToWordPress(
    credentials: WordPressCredentials,
    article: {
        title: string
        content: string
        excerpt?: string
        slug?: string
        featuredImageUrl?: string | null
        categoryId?: number | null  // Default category ID
    },
    publishStatus: 'draft' | 'publish' = 'draft'
): Promise<{ success: boolean; post?: WordPressPost; error?: string }> {
    let featuredMediaId: number | undefined

    // 1. Upload featured image if available
    if (article.featuredImageUrl) {
        const filename = `featured-${article.slug || 'image'}.png`
        const mediaResult = await uploadMedia(credentials, article.featuredImageUrl, filename)
        if (mediaResult) {
            featuredMediaId = mediaResult.id
        }
    }

    // 2. Create the post
    return createPost(credentials, {
        title: article.title,
        content: article.content,
        excerpt: article.excerpt,
        slug: article.slug,
        status: publishStatus,
        featured_media: featuredMediaId,
        categories: article.categoryId ? [article.categoryId] : undefined,
    })
}

/**
 * Upload all section images from content to WordPress media library
 * and replace R2 URLs with WordPress media URLs
 */
export async function uploadContentImagesToWordPress(
    credentials: WordPressCredentials,
    htmlContent: string,
    appUrl: string
): Promise<string> {
    // Match all img tags with section-images URLs
    const imgRegex = /<img[^>]*src=["']([^"']*section-images[^"']*)["'][^>]*>/gi
    const matches = [...htmlContent.matchAll(imgRegex)]

    if (matches.length === 0) {
        return htmlContent // No section images found
    }

    let processedContent = htmlContent

    for (const match of matches) {
        const originalUrl = match[1]
        let fetchableUrl = originalUrl

        // Convert R2 URL to fetchable proxy URL if needed
        if (originalUrl.includes('.r2.cloudflarestorage.com/')) {
            const key = originalUrl.split('.r2.cloudflarestorage.com/')[1]
            fetchableUrl = `${appUrl}/api/images/${key}`
        } else if (originalUrl.startsWith('/api/images/')) {
            fetchableUrl = `${appUrl}${originalUrl}`
        } else if (!originalUrl.startsWith('http')) {
            fetchableUrl = `${appUrl}/${originalUrl}`
        }

        try {
            // Generate filename from URL
            const urlParts = originalUrl.split('/')
            const filename = `section-${urlParts[urlParts.length - 1] || Date.now() + '.png'}`

            console.log(`[Section Image Upload] Uploading: ${filename}`)

            // Upload to WordPress media library
            const mediaResult = await uploadMedia(credentials, fetchableUrl, filename)

            if (mediaResult) {
                // Replace R2 URL with WordPress media URL in content
                processedContent = processedContent.replace(
                    new RegExp(escapeRegExp(originalUrl), 'g'),
                    mediaResult.source_url
                )
                console.log(`[Section Image Upload] Success: ${mediaResult.source_url}`)
            }
        } catch (error) {
            console.error(`[Section Image Upload] Failed for ${originalUrl}:`, error)
            // Continue with other images - non-blocking
        }
    }

    return processedContent
}

// Helper to escape special regex characters
function escapeRegExp(string: string): string {
    return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}
