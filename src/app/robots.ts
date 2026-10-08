import type { MetadataRoute } from 'next';
import { siteUrl } from '@/lib/config';
export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: [
        '/admin',
        '/api',
        '/ho-so',
        '/yeu-thich',
        '/dang-nhap',
        '/dang-ky',
        '/quen-mat-khau',
        '/dat-lai-mat-khau',
        '/tim-kiem',
      ],
    },
    sitemap: siteUrl() + '/sitemap.xml',
  };
}
