import { z } from "zod"

// External link schema for section citations
export const ExternalLinkSchema = z.object({
  url: z.string(),
  anchor_context: z.string().describe("What concept should this link verify? e.g. 'The 2024 price increase'")
})

export const ArticleOutlineSchema = z.object({
  title: z.string().min(3).max(200),
  intro: z.object({
    instruction_note: z.string().min(10).max(2000),
    keywords_to_include: z.array(z.string()).max(20),
  }),
  sections: z
    .array(
      z.object({
        id: z.number().int().positive(),
        heading: z.string().min(3).max(200),
        level: z.number().int().min(2).max(6).default(2),
        instruction_note: z.string().min(10).max(2000),
        keywords_to_include: z.array(z.string()).max(20),
        // Optional external link to include in this section
        external_link: ExternalLinkSchema.optional(),
        // Optional: Should this section have an in-content image?
        needs_image: z.boolean().optional().default(false),
        // Optional: Type of image if needs_image is true
        image_type: z.enum(['concept', 'how_to', 'comparison', 'process', 'insight']).optional(),
      })
    )
    .min(1),
})

export type ArticleOutline = z.infer<typeof ArticleOutlineSchema>
export type ExternalLink = z.infer<typeof ExternalLinkSchema>