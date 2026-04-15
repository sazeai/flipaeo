/**
 * SEO Utilities and Metadata Generation
 * 
 * This file contains utility functions for generating SEO metadata
 * using Next.js 13+ Metadata API. These functions help create
 * consistent and optimized metadata across all pages.
 */

import { Metadata } from 'next';
import {
  defaultSEO,
  socialConfig,
  organizationSchema,
  openGraphImages,
  schemaTemplates,
  seoUtils,
  type SEOConfig,
  pageSEO,
} from '@/config/seo';

export interface PageSEOProps {
  title?: string;
  description?: string;
  keywords?: string[];
  canonical?: string;
  noindex?: boolean;
  nofollow?: boolean;
  ogImage?: string;
  ogType?: 'website' | 'article' | 'profile';
  twitterCard?: 'summary' | 'summary_large_image' | 'app' | 'player';
  jsonLd?: Record<string, any> | Record<string, any>[];
  baseUrl?: string;
}

export interface WebPageJsonLdProps {
  title: string;
  description: string;
  urlPath?: string;
  dateModified?: string;
}

/**
 * Generate comprehensive metadata for a page
 */
export function generateMetadata(props: PageSEOProps = {}): Metadata {
  const {
    title,
    description = defaultSEO.description,
    keywords = defaultSEO.keywords,
    canonical,
    noindex = false,
    nofollow = false,
    ogImage,
    ogType = 'website',
    twitterCard = socialConfig.twitter.cardType,
  } = props;

  const pageTitle = title ? seoUtils.generateTitle(title) : defaultSEO.title;
  const canonicalUrl = canonical ? seoUtils.generateCanonicalUrl(canonical, props.baseUrl) : defaultSEO.siteUrl;
  const ogImageUrl = ogImage || openGraphImages.default.url;

  // Generate robots directive
  const robots = {
    index: !noindex,
    follow: !nofollow,
    googleBot: {
      index: !noindex,
      follow: !nofollow,
    },
  };

  const metadata: Metadata = {
    title: pageTitle,
    description,
    keywords: keywords.join(', '),
    authors: [{ name: defaultSEO.author }],
    creator: defaultSEO.author,
    publisher: defaultSEO.author,
    robots,
    alternates: {
      canonical: canonicalUrl,
    },
    openGraph: {
      type: ogType,
      title: pageTitle,
      description,
      url: canonicalUrl,
      siteName: defaultSEO.siteName,
      locale: defaultSEO.locale,
      images: [
        {
          url: ogImageUrl,
          width: openGraphImages.default.width,
          height: openGraphImages.default.height,
          alt: pageTitle,
        },
      ],
    },
    twitter: {
      card: twitterCard,
      site: socialConfig.twitter.site,
      creator: socialConfig.twitter.handle,
      title: pageTitle,
      description,
      images: [ogImageUrl],
    },
    ...(defaultSEO.googleSiteVerification && {
      verification: {
        google: defaultSEO.googleSiteVerification,
        ...(defaultSEO.bingSiteVerification || defaultSEO.yandexVerification ? {
          other: {
            ...(defaultSEO.bingSiteVerification && {
              'msvalidate.01': defaultSEO.bingSiteVerification,
            }),
            ...(defaultSEO.yandexVerification && {
              'yandex-verification': defaultSEO.yandexVerification,
            }),
          },
        } : {}),
      },
    }),
    other: {
      'theme-color': '#000000',
      'color-scheme': 'light dark',
      'format-detection': 'telephone=no',
    },
  };

  return metadata;
}

/**
 * Generate JSON-LD structured data
 */
export function generateJsonLd(schema: Record<string, any> | Record<string, any>[]): string {
  return JSON.stringify(schema, null, 0);
}

/**
 * Generate organization JSON-LD
 */
export function generateOrganizationJsonLd(): string {
  const schema = {
    '@context': 'https://schema.org',
    ...organizationSchema,
  };
  return generateJsonLd(schema);
}

/**
 * Generate website JSON-LD
 */
export function generateWebsiteJsonLd(): string {
  return generateJsonLd(schemaTemplates.website);
}

/**
 * Generate generic WebPage JSON-LD
 */
export function generateWebPageJsonLd(props: WebPageJsonLdProps): string {
  const url = props.urlPath ? seoUtils.generateCanonicalUrl(props.urlPath) : defaultSEO.siteUrl;

  const schema = {
    '@context': 'https://schema.org',
    '@type': 'WebPage',
    name: props.title,
    description: props.description,
    url,
    isPartOf: {
      '@id': `${defaultSEO.siteUrl}#website`,
    },
    about: {
      '@id': `${defaultSEO.siteUrl}#organization`,
    },
    ...(props.dateModified && {
      dateModified: props.dateModified,
    }),
  };

  return generateJsonLd(schema);
}

/**
 * Generate Software Application JSON-LD
 */
export function generateSoftwareApplicationJsonLd(): string {
  return generateJsonLd(schemaTemplates.softwareApplication);
}

/**
 * Generate Web Application JSON-LD for home page
 */
export function generateLandingPageWebApplicationJsonLd(slug: string): string {
  const cfg = (pageSEO as any)?.[slug];
  const props = cfg
    ? { title: cfg.title, description: cfg.description, urlPath: `/${slug}`, keywords: cfg.keywords }
    : { urlPath: `/${slug}` };
  return generateWebApplicationJsonLd(props);
}
export function generateWebApplicationJsonLd(props?: { title?: string; description?: string; urlPath?: string; keywords?: string[] }): string {
  const name = props?.title || defaultSEO.siteName;
  const description = props?.description || defaultSEO.description;
  const url = props?.urlPath ? seoUtils.generateCanonicalUrl(props.urlPath) : defaultSEO.siteUrl;
  const keywords = props?.keywords ? props.keywords.join(', ') : defaultSEO.keywords.join(', ');
  const baseSiteUrl = defaultSEO.siteUrl;

  const webAppSchema = {
    "@context": "https://schema.org",
    "@type": "WebApplication",
    "name": name,
    "description": description,
    "url": url,
    "applicationCategory": "BusinessApplication",
    "applicationSubCategory": "Pinterest Marketing Software",
    "operatingSystem": "Web Browser",
    "browserRequirements": "Requires JavaScript. Requires HTML5.",
    "inLanguage": "en-US",
    "keywords": keywords,

    "screenshot": [
      `${baseSiteUrl}/screenshot.png`,
      `${baseSiteUrl}/images/screenshot-dashboard.png`
    ],

    "featureList": [
      "AI lifestyle pin generation from product photos",
      "Pinterest-ready titles and descriptions",
      "Approval-first publishing workflow",
      "Shopify and Etsy catalog sync",
      "Pinterest scheduling and publishing",
      "Creative optimization from performance data",
      "Brand-aware fonts, colors, and layouts",
      "Weekly performance reporting",
    ],

    "author": {
      "@type": "Organization",
      "name": organizationSchema.name,
      "url": organizationSchema.url
    },
    "publisher": {
      "@type": "Organization",
      "name": organizationSchema.name,
      "logo": {
        "@type": "ImageObject",
        "url": `${baseSiteUrl}/site-logo.png`
      }
    }
  };

  return generateJsonLd(webAppSchema);
}

/**
 * Generate Service JSON-LD for landing pages
 */
export function generateServiceJsonLd(service: { name: string, description: string, url: string, serviceType: string, provider: any }): string {
  const schema = schemaTemplates.service(service);
  return generateJsonLd(schema);
}

/**
 * Generate breadcrumb JSON-LD
 */
export function generateBreadcrumbJsonLd(items: Array<{ name: string; url: string }>): string {
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      item: item.url,
    })),
  };
  return generateJsonLd(schema);
}

/**
 * Generate FAQ JSON-LD
 */
export function generateFAQJsonLd(faqs: Array<{ question: string; answer: string }>): string {
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faqs.map((faq) => ({
      '@type': 'Question',
      name: faq.question,
      acceptedAnswer: {
        '@type': 'Answer',
        text: faq.answer,
      },
    })),
  };
  return generateJsonLd(schema);
}

/**
 * Generate product JSON-LD for pricing pages
 */
export function generateProductJsonLd(product: {
  name: string;
  description: string;
  price: number;
  currency: string;
  features: string[];
  url?: string;
  availability?: string;
}): string {
  const productUrl = product.url
    ? (product.url.startsWith('http') ? product.url : seoUtils.generateCanonicalUrl(product.url))
    : undefined;

  const schema = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: product.name,
    description: product.description,
    ...(productUrl && {
      url: productUrl,
    }),
    brand: {
      '@type': 'Brand',
      name: organizationSchema.name,
    },
    offers: {
      '@type': 'Offer',
      ...(productUrl && {
        url: productUrl,
      }),
      price: product.price.toString(),
      priceCurrency: product.currency,
      availability: product.availability || 'https://schema.org/InStock',
      seller: organizationSchema['@id']
        ? { '@id': organizationSchema['@id'] }
        : organizationSchema,
    },
    additionalProperty: product.features.map((feature) => ({
      '@type': 'PropertyValue',
      name: 'Feature',
      value: feature,
    })),
  };
  return generateJsonLd(schema);
}

/**
 * Generate article JSON-LD for blog posts
 */
export function generateArticleJsonLd(article: {
  title: string;
  description: string;
  author: string;
  datePublished: string;
  dateModified?: string;
  image?: string;
  url: string;
}): string {
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: article.title,
    description: article.description,
    author: {
      '@type': 'Person',
      name: article.author,
    },
    publisher: organizationSchema,
    datePublished: article.datePublished,
    dateModified: article.dateModified || article.datePublished,
    mainEntityOfPage: {
      '@type': 'WebPage',
      '@id': article.url,
    },
    ...(article.image && {
      image: {
        '@type': 'ImageObject',
        url: article.image,
      },
    }),
  };
  return generateJsonLd(schema);
}

/**
 * SEO validation utilities
 */
export const seoValidation = {
  /**
   * Validate title length (recommended: 50-60 characters)
   */
  validateTitle: (title: string): { isValid: boolean; message?: string } => {
    if (title.length < 30) {
      return { isValid: false, message: 'Title is too short (minimum 30 characters)' };
    }
    if (title.length > 60) {
      return { isValid: false, message: 'Title is too long (maximum 60 characters)' };
    }
    return { isValid: true };
  },

  /**
   * Validate description length (recommended: 150-160 characters)
   */
  validateDescription: (description: string): { isValid: boolean; message?: string } => {
    if (description.length < 120) {
      return { isValid: false, message: 'Description is too short (minimum 120 characters)' };
    }
    if (description.length > 160) {
      return { isValid: false, message: 'Description is too long (maximum 160 characters)' };
    }
    return { isValid: true };
  },

  /**
   * Validate keywords count (recommended: 5-10 keywords)
   */
  validateKeywords: (keywords: string[]): { isValid: boolean; message?: string } => {
    if (keywords.length < 3) {
      return { isValid: false, message: 'Too few keywords (minimum 3)' };
    }
    if (keywords.length > 15) {
      return { isValid: false, message: 'Too many keywords (maximum 15)' };
    }
    return { isValid: true };
  },
};

/**
 * Pre-configured metadata for common pages
 */
// Export alias for backward compatibility
export const generateProductSchema = generateProductJsonLd;

export const commonPageMetadata = {
  home: () => generateMetadata({
    title: '',
    description: defaultSEO.description,
    canonical: '/',
    ogType: 'website',
  }),

  login: () => generateMetadata({
    title: 'Sign In',
    description: 'Sign in to your account to access dashboard',
    canonical: '/login',
    noindex: true,
  }),

  dashboard: () => generateMetadata({
    title: 'Dashboard',
    description: 'Access your EcomPin dashboard to review generated pins, manage publishing, and track Pinterest growth.',
    canonical: '/dashboard',
    noindex: true,
    nofollow: true,
  }),

  pricing: () => generateMetadata({
    title: 'Pricing',
    description: 'Simple, transparent pricing for EcomPin. Turn product photos into Pinterest lifestyle pins, approve in one click, and grow organic traffic for $79/month.',
    canonical: '/pricing',
    keywords: ['EcomPin pricing', 'Pinterest marketing pricing', 'AI pin generation pricing', 'Pinterest traffic tool pricing'],
  }),

  buyCredits: () => generateMetadata({
    title: 'Subscribe',
    description: 'Start your EcomPin subscription and begin generating Pinterest-ready lifestyle pins for your store.',
    canonical: '/subscribe',
    keywords: ['EcomPin subscription', 'Pinterest automation subscription', 'AI pin generation'],
    noindex: true,
  }),

  account: () => generateMetadata({
    title: 'Account Settings',
    description: 'Manage your account settings, billing information, and preferences.',
    canonical: '/account',
    noindex: true,
    nofollow: true,
  }),

  // Page-specific metadata using config/pageSEO
  landingPage: (slug: string) => {
    const cfg = (pageSEO as any)?.[slug];
    const title = cfg?.title || defaultSEO.title;
    const description = cfg?.description || defaultSEO.description;
    const keywords = cfg?.keywords || defaultSEO.keywords;
    return generateMetadata({
      title,
      description,
      keywords,
      canonical: `/${slug}`,
      ogType: 'website',
      baseUrl: defaultSEO.siteUrl,
    });
  },

};