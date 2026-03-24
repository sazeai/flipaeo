import { MetadataRoute } from 'next'
import { defaultSEO } from '@/config/seo'

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = defaultSEO.siteUrl
  const currentDate = new Date()

  // Static public pages only (no protected routes)
  const staticPages = [
    {
      url: baseUrl,
      lastModified: currentDate,
      changeFrequency: 'weekly' as const,
      priority: 1,
    },
    {
      url: `${baseUrl}/login`,
      lastModified: currentDate,
      changeFrequency: 'monthly' as const,
      priority: 0.8,
    },
  ]

  // Targeted fix: include key public pages and landing pages
  const extraRoutes = [
    '/pricing',
    '/privacy-policy',
    '/terms',
    '/refund-policy',
  ]

  const additionalPages: MetadataRoute.Sitemap = extraRoutes.map((path) => ({
    url: `${baseUrl}${path}`,
    lastModified: currentDate,
    changeFrequency: ['privacy-policy', 'terms', 'refund-policy'].some((p) => path.includes(p))
      ? ('monthly' as const)
      : ('weekly' as const),
    priority: ['privacy-policy', 'terms', 'refund-policy'].some((p) => path.includes(p))
      ? 0.5
      : 0.7,
  }))

  return [...staticPages, ...additionalPages]
}