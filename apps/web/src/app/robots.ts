import type { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        // Block private app routes from being indexed
        disallow: [
          '/dashboard',
          '/receipts',
          '/campaigns',
          '/collectors',
          '/members',
          '/expenses',
          '/reports',
          '/settings',
          '/payment/',
          '/api/',
        ],
      },
    ],
    sitemap: `${process.env.NEXT_PUBLIC_APP_URL || 'https://our.epavtibook.com'}/sitemap.xml`,
  };
}
