/**
 * Webflow CMS API Client for publishing articles
 * Uses Bearer token authentication with Webflow API v2
 */

const WEBFLOW_API_BASE = 'https://api.webflow.com/v2'

interface WebflowCredentials {
    apiToken: string
    siteId: string
    collectionId: string
}

interface WebflowSite {
    id: string
    displayName: string
    shortName: string
}

interface WebflowCollection {
    id: string
    displayName: string
    slug: string
}

interface WebflowCollectionItem {
    id: string
    fieldData: Record<string, any>
}

interface CreateItemParams {
    name: string        // Title
    slug: string        // URL slug
    content: string     // Rich text content (HTML)
    imageUrl?: string   // Public URL for main image
    excerpt?: string    // Post summary
    [key: string]: any  // Additional custom fields
}

/**
 * Prepare HTML content for Webflow Rich Text:
 * 1. Strip the first H1 (title is sent separately)
 * 2. Remove ALL attributes from HTML tags (Webflow hates them)
 * 3. Convert tables to simple text (Webflow Rich Text doesn't support tables)
 * 4. MINIFY the HTML (Webflow may strip lists if there are newlines inside tags)
 */
function prepareContentForWebflow(htmlContent: string): string {
    if (!htmlContent) return ''

    let content = htmlContent

    // 1. Remove the first H1 tag (title is sent separately as post name)
    content = content.replace(/<h1[^>]*>[\s\S]*?<\/h1>/i, '')

    // 2. Handle tables BEFORE stripping attributes
    // Webflow Rich Text doesn't support tables - convert to formatted paragraphs
    // Each row becomes a paragraph with • separators
    content = content.replace(/<table[^>]*>([\s\S]*?)<\/table>/gi, (match, tableContent) => {
        const rows: string[] = []
        const rowMatches = tableContent.matchAll(/<tr[^>]*>([\s\S]*?)<\/tr>/gi)
        let isFirstRow = true

        for (const rowMatch of rowMatches) {
            const cells: string[] = []
            const cellMatches = rowMatch[1].matchAll(/<t[hd][^>]*>([\s\S]*?)<\/t[hd]>/gi)

            for (const cellMatch of cellMatches) {
                // Strip inner HTML but keep text
                const cellText = cellMatch[1].replace(/<[^>]+>/g, '').trim()
                if (cellText) cells.push(cellText)
            }

            if (cells.length > 0) {
                const rowText = cells.join(' | ')
                if (isFirstRow) {
                    // First row is header - make it bold with underline separator
                    rows.push(`<p><strong>${rowText}</strong></p>`)
                    rows.push(`<p>───────────────</p>`)
                    isFirstRow = false
                } else {
                    // Data rows - regular paragraphs
                    rows.push(`<p>${rowText}</p>`)
                }
            }
        }

        // Return with line breaks to help Webflow recognize paragraph separation
        return '\n' + rows.join('\n') + '\n'
    })

    // 3. Strip ALL attributes from HTML tags (but preserve tag structure)
    // Webflow Rich Text is very strict about this
    content = content.replace(/<(\w+)([^>\/]*)(\/?)>/g, (match, tagName, attrs, selfClose) => {
        const tag = tagName.toLowerCase()
        // Self-closing tags
        if (selfClose || ['img', 'br', 'hr'].includes(tag)) {
            // For img, we need to preserve src and alt
            if (tag === 'img') {
                const srcMatch = match.match(/src=["']([^"']*)["']/)
                const altMatch = match.match(/alt=["']([^"']*)["']/)
                const src = srcMatch ? srcMatch[1] : ''
                const alt = altMatch ? altMatch[1] : ''
                return `<img src="${src}" alt="${alt}">`
            }
            return `<${tag}>`
        }
        return `<${tag}>`
    })

    // 4. Remove <li><p>...</p></li> pattern - just keep text in li
    content = content.replace(/<li>\s*<p>([\s\S]*?)<\/p>\s*<\/li>/gi, '<li>$1</li>')

    // 5. MINIFY the HTML but PRESERVE spaces around inline tags
    // Remove spaces only between BLOCK-level tags, not inline (strong, em, a, span)
    const blockTags = 'p|h[1-6]|ul|ol|li|div|blockquote|figure|figcaption|table|tr|td|th|thead|tbody'
    content = content
        // Remove newlines and tabs
        .replace(/[\r\n\t]+/g, ' ')
        // Remove space ONLY between closing and opening BLOCK tags (not inline)
        .replace(new RegExp(`</(${blockTags})>\\s+<(${blockTags}|/)`, 'gi'), '</$1><$2')
        // Collapse multiple spaces into single space (preserve single spaces for inline)
        .replace(/\s{2,}/g, ' ')
        // Trim
        .trim()

    // 6. Debug logging
    const listCount = (content.match(/<ul>/gi) || []).length + (content.match(/<ol>/gi) || []).length
    console.log(`[Webflow] Content prepared: ${content.length} chars, ${listCount} lists found`)
    if (listCount > 0) {
        const firstList = content.match(/<[uo]l>[\s\S]*?<\/[uo]l>/i)
        if (firstList) {
            console.log('[Webflow] First list preview:', firstList[0].substring(0, 200) + '...')
        }
    }

    return content
}

/**
 * Make authenticated request to Webflow API
 */
async function webflowFetch(
    endpoint: string,
    apiToken: string,
    options: RequestInit = {}
): Promise<Response> {
    return fetch(`${WEBFLOW_API_BASE}${endpoint}`, {
        ...options,
        headers: {
            'Authorization': `Bearer ${apiToken}`,
            'Content-Type': 'application/json',
            'accept-version': '2.0.0',
            ...options.headers,
        },
    })
}

/**
 * Test Webflow connection by fetching authorized user info
 */
export async function testConnection(apiToken: string): Promise<{
    success: boolean
    error?: string
}> {
    try {
        const response = await webflowFetch('/token/authorized_by', apiToken)

        if (!response.ok) {
            if (response.status === 401) {
                return { success: false, error: 'Invalid API token' }
            }
            return { success: false, error: `Connection failed: ${response.status}` }
        }

        return { success: true }
    } catch (error: any) {
        return { success: false, error: error.message || 'Failed to connect' }
    }
}

/**
 * List all sites accessible with the API token
 */
export async function listSites(apiToken: string): Promise<{
    sites: WebflowSite[]
    error?: string
}> {
    try {
        const response = await webflowFetch('/sites', apiToken)

        if (!response.ok) {
            return { sites: [], error: `Failed to fetch sites: ${response.status}` }
        }

        const data = await response.json()
        return {
            sites: (data.sites || []).map((s: any) => ({
                id: s.id,
                displayName: s.displayName || s.shortName,
                shortName: s.shortName,
            }))
        }
    } catch (error: any) {
        return { sites: [], error: error.message }
    }
}

/**
 * List all CMS collections for a site
 */
export async function listCollections(
    apiToken: string,
    siteId: string
): Promise<{
    collections: WebflowCollection[]
    error?: string
}> {
    try {
        const response = await webflowFetch(`/sites/${siteId}/collections`, apiToken)

        if (!response.ok) {
            return { collections: [], error: `Failed to fetch collections: ${response.status}` }
        }

        const data = await response.json()
        return {
            collections: (data.collections || []).map((c: any) => ({
                id: c.id,
                displayName: c.displayName,
                slug: c.slug,
            }))
        }
    } catch (error: any) {
        return { collections: [], error: error.message }
    }
}

/**
 * Create a collection item (blog post) in Webflow
 */
export async function createCollectionItem(
    credentials: WebflowCredentials,
    params: CreateItemParams,
    fieldMapping: Record<string, string> = {}
): Promise<{
    success: boolean
    item?: WebflowCollectionItem
    error?: string
}> {
    const { apiToken, collectionId } = credentials

    // Build fieldData based on mapping
    const fieldData: Record<string, any> = {
        name: params.name,
        slug: params.slug,
    }

    // Map content to the configured field (default: 'post-body')
    const contentField = fieldMapping.content || 'post-body'

    // Prepare content for Webflow (comprehensive sanitization)
    const cleanContent = prepareContentForWebflow(params.content || '')

    fieldData[contentField] = cleanContent

    if (params.excerpt) {
        const excerptField = fieldMapping.excerpt || 'post-summary'
        fieldData[excerptField] = params.excerpt
    }

    // Map image to the configured field
    if (params.imageUrl) {
        const imageField = fieldMapping.image || 'main-image'
        console.log(`[Webflow] Mapping image to field '${imageField}':`, params.imageUrl)
        fieldData[imageField] = params.imageUrl
    }

    // Log the payload for debugging
    console.log('[Webflow] Creating item with fields:', JSON.stringify(Object.keys(fieldData), null, 2))
    try {
        // Create as staged item first (not live)
        const response = await webflowFetch(
            `/collections/${collectionId}/items`,
            apiToken,
            {
                method: 'POST',
                body: JSON.stringify({
                    fieldData,
                    isDraft: false, // Create as staged, not draft
                }),
            }
        )

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}))
            return {
                success: false,
                error: errorData.message || errorData.err || `Failed to create item: ${response.status}`
            }
        }

        const item = await response.json()
        return {
            success: true,
            item: {
                id: item.id,
                fieldData: item.fieldData,
            }
        }
    } catch (error: any) {
        return { success: false, error: error.message }
    }
}

/**
 * Publish staged items to make them live
 */
export async function publishItems(
    apiToken: string,
    collectionId: string,
    itemIds: string[]
): Promise<{ success: boolean; error?: string }> {
    try {
        const response = await webflowFetch(
            `/collections/${collectionId}/items/publish`,
            apiToken,
            {
                method: 'POST',
                body: JSON.stringify({ itemIds }),
            }
        )

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}))
            return {
                success: false,
                error: errorData.message || `Failed to publish: ${response.status}`
            }
        }

        return { success: true }
    } catch (error: any) {
        return { success: false, error: error.message }
    }
}

/**
 * Full publish flow: create item
 */
export async function publishToWebflow(
    credentials: WebflowCredentials,
    article: {
        title: string
        content: string
        slug?: string
        excerpt?: string
        featuredImageUrl?: string | null
    },
    fieldMapping: Record<string, string> = {}
): Promise<{
    success: boolean
    itemId?: string
    error?: string
}> {
    // Generate slug from title if not provided
    const slug = article.slug || article.title
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-|-$/g, '')

    // Create the collection item
    const result = await createCollectionItem(
        credentials,
        {
            name: article.title,
            slug,
            content: article.content,
            excerpt: article.excerpt,
            imageUrl: article.featuredImageUrl || undefined,
        },
        fieldMapping
    )

    if (!result.success || !result.item) {
        return { success: false, error: result.error }
    }

    return {
        success: true,
        itemId: result.item.id,
    }
}

/**
 * Upload an asset to Webflow (2-step process: metadata -> S3)
 */
export async function uploadAssetToWebflow(
    apiToken: string,
    siteId: string,
    fileBuffer: Buffer,
    fileName: string
): Promise<{ url?: string; error?: string }> {
    try {
        const crypto = require('crypto')
        const fileHash = crypto.createHash('md5').update(fileBuffer).digest('hex')

        // Step 1: Initialize upload
        const initResponse = await webflowFetch(`/sites/${siteId}/assets`, apiToken, {
            method: 'POST',
            body: JSON.stringify({
                fileName,
                fileHash,
            }),
        })

        if (!initResponse.ok) {
            const errorText = await initResponse.text()
            return { error: `Asset init failed: ${initResponse.status} - ${errorText}` }
        }

        const assetData = await initResponse.json()
        const { uploadUrl, uploadDetails } = assetData

        // Step 2: Upload to S3
        // Note: Webflow S3 upload expects form data
        const formData = new FormData()
        Object.keys(uploadDetails).forEach(key => {
            formData.append(key, uploadDetails[key])
        })
        formData.append('file', new Blob([new Uint8Array(fileBuffer)]))

        const uploadResponse = await fetch(uploadUrl, {
            method: 'POST',
            body: formData,
        })

        if (!uploadResponse.ok) {
            return { error: `S3 upload failed: ${uploadResponse.status}` }
        }

        // Return the robust hosted URL
        return { url: assetData.hostedUrl }

    } catch (error: any) {
        console.error('Webflow asset upload error:', error)
        return { error: error.message }
    }
}
