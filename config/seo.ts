/**
 * SEO configuration for EcomPin.
 *
 * This file centralizes metadata, structured data, and crawl settings
 * for the public marketing surface of ecompin.com.
 */

export interface SEOConfig {
  title: string;
  description: string;
  keywords: string[];
  author: string;
  siteUrl: string;
  siteName: string;
  locale: string;
  type: string;
  robots: string;
  googleSiteVerification?: string;
  bingSiteVerification?: string;
  yandexVerification?: string;
}

export interface SocialConfig {
  twitter: {
    handle: string;
    site: string;
    cardType: 'summary' | 'summary_large_image' | 'app' | 'player';
  };
  linkedin: {
    handle?: string;
  };
}

export interface OrganizationSchema {
  '@type': string;
  name: string;
  url: string;
  logo: string;
  description: string;
  address?: {
    '@type': string;
    streetAddress?: string;
    addressLocality?: string;
    addressRegion?: string;
    postalCode?: string;
    addressCountry?: string;
  };
  contactPoint?: {
    '@type': string;
    telephone?: string;
    contactType?: string;
    email?: string;
  };
  sameAs?: string[];
}

// Default SEO Configuration
export const defaultSEO: SEOConfig = {
  title: 'EcomPin - Autonomous Pinterest Agent for Shopify & Etsy Brands',
  description: 'EcomPin is an autonomous Pinterest marketing agent for ecommerce brands. Turn product photos into lifestyle pins, approve faster, and grow store traffic.',
  keywords: [
    'Pinterest marketing automation',
    'AI Pinterest tool',
    'Pinterest pin generator',
    'AI pin generator',
    'Pinterest automation for Shopify',
    'Pinterest automation for Etsy',
    'ecommerce Pinterest marketing',
    'lifestyle pin generator',
    'Pinterest traffic tool',
    'Pinterest scheduler',
    'Pinterest SEO tool',
    'product photo to lifestyle pin',
    'Pinterest marketing software',
    'Shopify Pinterest automation',
    'Etsy Pinterest automation',
  ],
  author: 'EcomPin',
  siteUrl: process.env.NEXT_PUBLIC_APP_URL || 'https://ecompin.com',
  siteName: 'EcomPin',
  locale: 'en_US',
  type: 'website',
  robots: 'index, follow',
  googleSiteVerification:
    process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION ||
    process.env.GOOGLE_SITE_VERIFICATION ||
    undefined,
  bingSiteVerification:
    process.env.NEXT_PUBLIC_BING_SITE_VERIFICATION ||
    process.env.BING_SITE_VERIFICATION ||
    undefined,
  yandexVerification:
    process.env.NEXT_PUBLIC_YANDEX_VERIFICATION ||
    process.env.YANDEX_VERIFICATION ||
    undefined,
};

// Social Media Configuration
export const socialConfig: SocialConfig = {
  twitter: {
    handle: '@EcomPin',
    site: '@EcomPin',
    cardType: 'summary_large_image',
  },
  linkedin: {
    handle: 'ecompin',
  },
};

// Organization Schema for Structured Data
export const organizationSchema: OrganizationSchema = {
  '@type': 'Organization',
  name: 'EcomPin',
  url: defaultSEO.siteUrl,
  logo: `${defaultSEO.siteUrl}/site-logo.png`,
  description: 'Autonomous Pinterest marketing for ecommerce brands. EcomPin turns product photos into lifestyle pins and helps stores grow traffic from Pinterest.',
  contactPoint: {
    '@type': 'ContactPoint',
    contactType: 'customer service',
    email: 'support@ecompin.com',
  },
  sameAs: [
    'https://x.com/EcomPin',
  ],
};

// --- Page-specific SEO configurations ---
export const pageSEO = {
  home: {
    title: 'Autonomous Pinterest Agent for Shopify & Etsy Brands',
    description: 'Turn product photos into Pinterest-ready lifestyle pins, approve faster, and grow outbound clicks with EcomPin.',
    keywords: ['Pinterest marketing automation', 'AI Pinterest tool', 'Pinterest pin generator', 'Shopify Pinterest automation', 'Etsy Pinterest automation', 'lifestyle pin generator'],
  },
  login: {
    title: 'Sign In',
    description: 'Sign in to your EcomPin account to review pins, manage publishing, and track Pinterest growth.',
    keywords: ['login', 'sign in', 'EcomPin account', 'Pinterest dashboard'],
  },
  dashboard: {
    title: 'Dashboard',
    description: 'Access your EcomPin dashboard to review generated pins, manage publishing, and track store traffic.',
    keywords: ['Pinterest dashboard', 'pin management', 'Pinterest automation'],
    robots: 'noindex, nofollow',
  },
  pricing: {
    title: 'Pricing',
    description: 'Simple pricing for EcomPin. Turn product photos into Pinterest lifestyle pins, approve in one click, and grow organic traffic for $79/month.',
    keywords: ['EcomPin pricing', 'Pinterest marketing pricing', 'AI pin generation pricing', 'Pinterest traffic tool pricing'],
  },
  about: {
    title: 'About',
    description: 'Learn how EcomPin helps ecommerce brands automate Pinterest marketing with AI-generated lifestyle pins and approval-first workflows.',
    keywords: ['about EcomPin', 'Pinterest marketing platform', 'ecommerce growth software'],
  },
  blog: {
    title: 'Blog',
    description: 'Insights on Pinterest marketing, ecommerce growth, creative strategy, and AI-assisted pin workflows.',
    keywords: ['Pinterest marketing blog', 'ecommerce Pinterest tips', 'AI pin strategy', 'Pinterest traffic insights'],
  },
  privacyPolicy: {
    title: 'Privacy Policy',
    description: 'Learn how EcomPin collects, uses, and protects your data across account, catalog, and Pinterest integrations.',
    keywords: ['EcomPin privacy', 'Pinterest marketing privacy', 'catalog data privacy', 'GDPR compliance'],
  },
  terms: {
    title: 'Terms of Service',
    description: 'Review the terms for using EcomPin, the AI-assisted Pinterest marketing platform for ecommerce brands.',
    keywords: ['EcomPin terms', 'terms of service', 'user agreement', 'Pinterest marketing platform'],
  },
  refundPolicy: {
    title: 'Refund Policy',
    description: 'Read EcomPin\'s refund policy, including our 14-day money-back guarantee and eligibility requirements.',
    keywords: ['EcomPin refund', 'money-back guarantee', 'refund policy', 'subscription cancellation'],
  },
  subscribe: {
    title: 'Subscribe',
    description: 'Start your EcomPin subscription and begin generating Pinterest-ready lifestyle pins for your store.',
    keywords: ['EcomPin subscription', 'Pinterest automation subscription', 'AI pin generation'],
    robots: 'noindex, nofollow',
  },
};

// Open Graph Image Configuration
export const openGraphImages = {
  default: {
    url: `${defaultSEO.siteUrl}/og-image.png`,
    width: 1200,
    height: 630,
    alt: 'EcomPin - Autonomous Pinterest Agent for Shopify & Etsy Brands',
  },
  logo: {
    url: `${defaultSEO.siteUrl}/site-logo.png`,
    width: 400,
    height: 400,
    alt: 'EcomPin Logo',
  },
};

// Robots.txt Configuration
export const robotsConfig = {
  rules: {
    userAgent: '*',
    allow: '/',
    disallow: [
      '/api/',
      '/dashboard',
      '/account',
      '/settings',
      '/products',
      '/pins',
      '/integrations',
      '/onboarding',
      '/subscribe',
    ],
  },
  sitemap: `${defaultSEO.siteUrl}/sitemap.xml`,
};

// Sitemap Configuration
export const sitemapConfig = {
  siteUrl: defaultSEO.siteUrl,
  generateRobotsTxt: true,
  exclude: [
    '/dashboard/*',
    '/account/*',
    '/settings/*',
    '/products/*',
    '/pins/*',
    '/integrations/*',
    '/api/*',
    '/auth/*',
    '/error',
    '/onboarding/*',
    '/subscribe/*',
    '/login',
  ],
  additionalPaths: async () => {
    return [];
  },
};

// JSON-LD Schema Templates
export const schemaTemplates = {
  website: {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: defaultSEO.siteName,
    url: defaultSEO.siteUrl,
    description: defaultSEO.description,
    publisher: {
      '@type': 'Organization',
      name: organizationSchema.name,
    },
  },
  softwareApplication: {
    '@context': 'https://schema.org',
    '@type': 'WebApplication',
    name: defaultSEO.siteName,
    description: 'Autonomous Pinterest marketing for ecommerce brands. Turn product photos into lifestyle pins, approve faster, and grow outbound clicks.',
    url: defaultSEO.siteUrl,
    applicationCategory: 'BusinessApplication',
    applicationSubCategory: 'Pinterest Marketing Software',
    operatingSystem: 'Web Browser',
    offers: {
      '@type': 'Offer',
      price: '79',
      priceCurrency: 'USD',
      availability: 'https://schema.org/InStock',
    },
    publisher: organizationSchema,
    featureList: [
      'AI lifestyle pin generation from product photos',
      'Pinterest-ready titles and descriptions',
      'Approval-first publishing workflow',
      'Shopify and Etsy catalog sync',
      'Pinterest scheduling and publishing',
      'Creative optimization from performance data',
      'Brand-aware fonts, colors, and layouts',
      'Weekly performance reporting',
    ],
  },
  service: (service: { name: string, description: string, url: string, serviceType: string, provider: any }) => ({
    '@context': 'https://schema.org',
    '@type': 'Service',
    name: service.name,
    description: service.description,
    url: service.url,
    serviceType: service.serviceType,
    provider: service.provider,
    areaServed: {
      '@type': 'Place',
      name: 'Worldwide'
    },
    offers: {
      '@type': 'Offer',
      price: '79',
      priceCurrency: 'USD'
    }
  })
};

// SEO Utility Functions
export const seoUtils = {
  /**
   * Generate page title with site name
   */
  generateTitle: (pageTitle?: string): string => {
    if (!pageTitle) return defaultSEO.title;
    return `${pageTitle} | ${defaultSEO.siteName}`;
  },

  /**
   * Generate canonical URL
   */
  generateCanonicalUrl: (path: string, baseUrl?: string): string => {
    const cleanPath = path.startsWith('/') ? path : `/${path}`;
    const url = baseUrl || defaultSEO.siteUrl;
    return `${url}${cleanPath}`;
  },

  /**
   * Generate Open Graph URL
   */
  generateOgUrl: (path: string): string => {
    return seoUtils.generateCanonicalUrl(path);
  },

  /**
   * Merge SEO config with page-specific overrides
   */
  mergeSEOConfig: (pageConfig: Partial<SEOConfig>): SEOConfig => {
    return { ...defaultSEO, ...pageConfig };
  },
};