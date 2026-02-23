import { MetadataRoute } from 'next';
import { BRANDING } from '@/src/lib/branding';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: BRANDING.name,
    short_name: BRANDING.isWay2Z ? 'Way2Z' : 'BBP',
    description: BRANDING.motto,
    start_url: '/',
    display: 'standalone',
    // Dynamic theme colors based on your branding file
    background_color: '#f8fafc',
    theme_color: BRANDING.isWay2Z ? '#059669' : '#2563eb', 
    icons: [
      {
        src: BRANDING.isWay2Z ? '/icons/way2z-192.png' : '/icons/bbp-192.png',
        sizes: '192x192',
        type: 'image/png',
        purpose: 'maskable',
      },
      {
        src: BRANDING.isWay2Z ? '/icons/way2z-512.png' : '/icons/bbp-512.png',
        sizes: '512x512',
        type: 'image/png',
      },
    ],
  };
}