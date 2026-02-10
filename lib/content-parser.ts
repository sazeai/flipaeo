import * as cheerio from 'cheerio'
import DOMPurify from 'isomorphic-dompurify'

// Define types for extracted data
export interface TOCEntry {
    id: string
    text: string
    level: number // 2 for h2, 3 for h3
}

export interface FAQEntry {
    question: string
    answer: string
}

export interface ParsedContent {
    tocEntries: TOCEntry[]
    faqs: FAQEntry[]
    content: string
}

/**
 * Parses raw HTML content to extract metadata and sanitize HTML
 */
export function parseContent(rawContent: string): ParsedContent {
    // 1. Sanitize the raw content first
    const sanitizedContent = DOMPurify.sanitize(rawContent, {
        ADD_TAGS: ['iframe'],
        ADD_ATTR: ['allow', 'allowfullscreen', 'frameborder', 'scrolling', 'target', 'loading']
    })

    // 2. Load into Cheerio for extraction
    const $ = cheerio.load(sanitizedContent)
    const tocEntries: TOCEntry[] = []
    const faqs: FAQEntry[] = []

    // Extract headings for Table of Contents
    $('h2, h3').each((_, el) => {
        const $el = $(el)
        const text = $el.text().trim()
        const tagName = $el.prop('tagName')
        const level = tagName ? parseInt(tagName.substring(1)) : 2

        // Generate ID if missing
        let id = $el.attr('id')
        if (!id && text) {
            id = text
                .toLowerCase()
                .replace(/[^\w\s-]/g, '')
                .replace(/\s+/g, '-')
        }

        if (text && id) {
            tocEntries.push({ id, text, level })
            // Ensure the element has the ID in the final HTML
            $el.attr('id', id)
        }
    })

    // Extract FAQs (assuming standardized schema-like HTML structure if present, or generic detection)
    // For now, let's look for common strong/p patterns often used for FAQs in blog posts
    // Or if using specific schema markup classes

    // Example pattern: <h3>Question?</h3> <p>Answer</p>
    // This is a heuristic and might need adjustment based on actual content structure
    // For safety, we only extract if explicitly marked or clearly structured

    // Update the content string with any modifications (like added IDs)
    // We use $.html() to get the modified HTML back (Cheerio wraps in <html><body> by default, so we take body)
    const finalContent = $('body').html() || sanitizedContent

    return {
        tocEntries,
        faqs, // Empty for now unless specific structure is defined
        content: finalContent
    }
}
