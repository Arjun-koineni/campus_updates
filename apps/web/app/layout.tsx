import type { Metadata, Viewport } from 'next';
import './globals.css';
import ServiceWorker from '../components/ServiceWorker';

export const metadata: Metadata = {
  title: 'Campus Updates',
  description: 'One calm place for every campus deadline and notice',
  manifest: '/manifest.webmanifest'
};

export const viewport: Viewport = { themeColor: '#e8edf2', width: 'device-width', initialScale: 1 };

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>
        <ServiceWorker />
        {/* Decorative floating blobs for depth */}
        <div className="floating-blob blob-1" aria-hidden="true" />
        <div className="floating-blob blob-2" aria-hidden="true" />
        <div className="floating-blob blob-3" aria-hidden="true" />
        {children}
      </body>
    </html>
  );
}
