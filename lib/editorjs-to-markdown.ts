import { OutputData } from "@editorjs/editorjs"

/**
 * Converts Editor.js output data to a Markdown string.
 * Supports standard blocks: header, paragraph, list, quote, delimiter, code, checklist, embed, image/simpleImage.
 */
export function editorJsToMarkdown(data: OutputData): string {
    if (!data || !data.blocks || !Array.isArray(data.blocks)) {
        return ""
    }

    return data.blocks.map(block => {
        switch (block.type) {
            case 'header':
                return '#'.repeat(block.data.level) + ' ' + convertHtmlToMarkdown(block.data.text) + '\n'

            case 'paragraph':
                return convertHtmlToMarkdown(block.data.text) + '\n\n'

            case 'list':
                // Supports nested-list plugin structure or standard list
                return convertList(block.data) + '\n'

            case 'checklist':
                return block.data.items.map((item: any) => {
                    return `- [${item.checked ? 'x' : ' '}] ${convertHtmlToMarkdown(item.text)}`
                }).join('\n') + '\n\n'

            case 'quote':
                // Handle alignment if needed, though markdown doesn't support it natively
                return `> ${convertHtmlToMarkdown(block.data.text)}\n\n`

            case 'code':
                return '```\n' + block.data.code + '\n```\n\n'

            case 'delimiter':
                return '---\n\n'

            case 'image':
            case 'simpleImage':
                const url = block.data.url || block.data.file?.url || ''
                const caption = block.data.caption || ''
                // Standard markdown image: ![alt](url)
                return `![${caption}](${url})\n\n`

            case 'embed':
                const source = block.data.source || block.data.embed || ''
                return `[Embed: ${block.data.service}](${source})\n\n`

            default:
                return ''
        }
    }).join('\n')
}

function convertList(data: any): string {
    const style = data.style === 'ordered' ? 'ordered' : 'unordered'
    return processListItems(data.items, style, 0)
}

function processListItems(items: any[], style: 'ordered' | 'unordered', level: number): string {
    if (!items || !Array.isArray(items)) return ''

    return items.map((item, index) => {
        const indent = '  '.repeat(level)
        const bullet = style === 'ordered' ? `${index + 1}.` : '-'
        const content = item.content || item.text || '' // NestedList uses 'content', standard list uses 'text'
        const markdownContent = convertHtmlToMarkdown(content)

        let result = `${indent}${bullet} ${markdownContent}\n`

        // Handle nested items (NestedList plugin)
        if (item.items && item.items.length > 0) {
            result += processListItems(item.items, style, level + 1)
        }

        return result
    }).join('')
}

/**
 * Helper to convert inline HTML tags from Editor.js to Markdown syntax
 */
function convertHtmlToMarkdown(html: string): string {
    if (!html) return ""

    return html
        // Replace bold tags (b, strong) with attribute support and multiline support
        .replace(/<b\b[^>]*>([\s\S]*?)<\/b>/gi, '**$1**')
        .replace(/<strong\b[^>]*>([\s\S]*?)<\/strong>/gi, '**$1**')

        // Replace italic tags (i, em)
        .replace(/<i\b[^>]*>([\s\S]*?)<\/i>/gi, '_$1_')
        .replace(/<em\b[^>]*>([\s\S]*?)<\/em>/gi, '_$1_')

        // Replace underline (u) - keep as HTML or markdown if you prefer (MD doesn't support underline standardly)
        // keeping as HTML for now, but handling attributes
        .replace(/<u\b[^>]*>([\s\S]*?)<\/u>/gi, '<u>$1</u>')

        // Replace strikethrough (s, strike, del) -> ~~text~~
        .replace(/<s\b[^>]*>([\s\S]*?)<\/s>/gi, '~~$1~~')
        .replace(/<strike\b[^>]*>([\s\S]*?)<\/strike>/gi, '~~$1~~')
        .replace(/<del\b[^>]*>([\s\S]*?)<\/del>/gi, '~~$1~~')

        // Replace inline code (code) -> `text`
        .replace(/<code\b[^>]*>([\s\S]*?)<\/code>/gi, '`$1`')

        // Replace mark -> <mark>text</mark> (preserve HTML but handle attrs)
        .replace(/<mark\b[^>]*>([\s\S]*?)<\/mark>/gi, '<mark>$1</mark>')

        // Replace links - make sure to capture href even if other attributes exist
        // Note: This regex tries to find href anywhere in the tag
        .replace(/<a\s+(?:[^>]*?\s+)?href=["']([^"']*)["'][^>]*>([\s\S]*?)<\/a>/gi, '[$2]($1)')

        // Replace line breaks
        .replace(/<br\s*\/?>/gi, '\n')

        // Replace encoded spaces
        .replace(/&nbsp;/gi, ' ')
}
