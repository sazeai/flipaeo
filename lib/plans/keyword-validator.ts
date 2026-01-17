/**
 * Keyword validation using Google Autocomplete.
 * Validates that generated keywords are real search queries.
 */

export interface KeywordValidationResult {
    keyword: string
    isValid: boolean
    suggestions: string[]
    bestSuggestion: string | null
}

// Free Google Autocomplete endpoint (no API key needed)
const AUTOCOMPLETE_URL = 'https://suggestqueries.google.com/complete/search'

/**
 * Validates a keyword against Google Autocomplete.
 * Returns whether the keyword appears in autocomplete suggestions.
 */
export async function validateKeyword(keyword: string): Promise<KeywordValidationResult> {
    if (!keyword || keyword.trim().length < 2) {
        return {
            keyword,
            isValid: false,
            suggestions: [],
            bestSuggestion: null
        }
    }

    try {
        const url = `${AUTOCOMPLETE_URL}?client=chrome&q=${encodeURIComponent(keyword)}&hl=en`
        const response = await fetch(url)

        if (!response.ok) {
            console.warn(`[Keyword Validator] Failed to fetch autocomplete for: ${keyword}`)
            return { keyword, isValid: true, suggestions: [], bestSuggestion: null } // Assume valid if can't check
        }

        const data = await response.json()
        // Response format: ["keyword", ["suggestion1", "suggestion2", ...]]
        const suggestions: string[] = data[1] || []

        // Keyword is valid if it appears in autocomplete or is similar to suggestions
        const keywordLower = keyword.toLowerCase().trim()
        const isValid = suggestions.some(s =>
            s.toLowerCase().includes(keywordLower) ||
            keywordLower.includes(s.toLowerCase().slice(0, 10))
        )

        // Find the best matching suggestion if keyword is invalid
        const bestSuggestion = isValid ? null : findBestSuggestion(keyword, suggestions)

        return {
            keyword,
            isValid,
            suggestions: suggestions.slice(0, 5),
            bestSuggestion
        }
    } catch (error) {
        console.error(`[Keyword Validator] Error validating "${keyword}":`, error)
        return { keyword, isValid: true, suggestions: [], bestSuggestion: null } // Assume valid on error
    }
}

/**
 * Finds the best matching suggestion for a given keyword.
 */
function findBestSuggestion(keyword: string, suggestions: string[]): string | null {
    if (suggestions.length === 0) return null

    const keywordWords = new Set(keyword.toLowerCase().split(/\s+/))

    // Score each suggestion by word overlap
    let bestScore = 0
    let bestSuggestion = suggestions[0]

    for (const suggestion of suggestions) {
        const suggestionWords = new Set(suggestion.toLowerCase().split(/\s+/))
        const overlap = [...keywordWords].filter(w => suggestionWords.has(w)).length
        const score = overlap / Math.max(keywordWords.size, suggestionWords.size)

        if (score > bestScore) {
            bestScore = score
            bestSuggestion = suggestion
        }
    }

    return bestSuggestion
}

/**
 * Validates and optionally transforms keywords for a list of articles.
 * If a keyword is invalid, it can be replaced with the best suggestion.
 */
export async function validateArticleKeywords(
    articles: Array<{ main_keyword: string;[key: string]: any }>,
    autoReplace: boolean = false
): Promise<Array<{ main_keyword: string; keyword_validated: boolean; original_keyword?: string;[key: string]: any }>> {
    const results = []

    // Rate limit: Process 5 at a time with small delay
    const batchSize = 5

    for (let i = 0; i < articles.length; i += batchSize) {
        const batch = articles.slice(i, i + batchSize)

        const batchResults = await Promise.all(
            batch.map(async (article) => {
                const validation = await validateKeyword(article.main_keyword)

                if (!validation.isValid && autoReplace && validation.bestSuggestion) {
                    return {
                        ...article,
                        main_keyword: validation.bestSuggestion,
                        original_keyword: article.main_keyword,
                        keyword_validated: true
                    }
                }

                return {
                    ...article,
                    keyword_validated: validation.isValid
                }
            })
        )

        results.push(...batchResults)

        // Small delay between batches to avoid rate limiting
        if (i + batchSize < articles.length) {
            await new Promise(resolve => setTimeout(resolve, 100))
        }
    }

    return results
}

/**
 * Expands a seed keyword using autocomplete suggestions.
 * Useful for finding related long-tail keywords.
 */
export async function expandKeyword(seed: string): Promise<string[]> {
    const validation = await validateKeyword(seed)
    return validation.suggestions
}
