import type { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Campus Updates', short_name: 'Campus', description: 'Campus deadlines and notices', start_url: '/dashboard', display: 'standalone', background_color: '#0b1118', theme_color: '#0b1118', orientation: 'portrait',
    icons: [{ src: '/icon.svg', sizes: 'any', type: 'image/svg+xml', purpose: 'any' }]
  };
}
