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
    sitemap: 'https://epavtibook.com/sitemap.xml',
  };
}
