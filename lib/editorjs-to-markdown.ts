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
        // Replace bold tags
        .replace(/<b>(.*?)<\/b>/g, '**$1**')
        .replace(/<strong>(.*?)<\/strong>/g, '**$1**')
        // Replace italic tags
        .replace(/<i>(.*?)<\/i>/g, '_$1_')
        .replace(/<em>(.*?)<\/em>/g, '_$1_')
        // Replace links
        .replace(/<a\s+(?:[^>]*?\s+)?href="([^"]*)"[^>]*>(.*?)<\/a>/g, '[$2]($1)')
        // Replace line breaks
        .replace(/<br\s*\/?>/g, '\n')
        // Replace encoded spaces
        .replace(/&nbsp;/g, ' ')
    // Remove other HTML tags but keep content
    // .replace(/<[^>]*>/g, '') // Optional: might be too aggressive if we want to preserve some other tags
}
