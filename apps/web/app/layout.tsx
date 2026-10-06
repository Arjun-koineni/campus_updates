import type { Metadata, Viewport } from 'next';
import './globals.css';
import ServiceWorker from '../components/ServiceWorker';

export const metadata: Metadata = {
  title: 'Campus Updates',
  description: 'One calm place for every campus deadline and notice',
  manifest: '/manifest.webmanifest'
};

export const viewport: Viewport = { themeColor: '#0b1118', width: 'device-width', initialScale: 1 };

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en"><body><ServiceWorker />{children}</body></html>;
}
