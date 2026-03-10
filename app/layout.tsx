import type { Metadata, Viewport } from 'next';
import './globals.css';

export const viewport: Viewport = {
  themeColor: '#FC4C02',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: 'cover',
};

export const metadata: Metadata = {
  title: 'StoryRun – Strava Story Generator',
  description: 'Turn your Strava runs into stunning Instagram Stories',
  applicationName: 'StoryRun',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'StoryRun',
  },
  formatDetection: {
    telephone: false,
  },
  manifest: '/manifest.json',
  icons: {
    icon: [
      { url: '/icons/icon-192.png', sizes: '192x192', type: 'image/png' },
      { url: '/icons/icon-512.png', sizes: '512x512', type: 'image/png' },
    ],
    apple: [
      { url: '/icons/icon-192.png', sizes: '192x192', type: 'image/png' },
    ],
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark">
      <head>
        {/* PWA / Android Chrome */}
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="theme-color" content="#FC4C02" />
        <link rel="manifest" href="/manifest.json" />

        {/* iOS Safari PWA */}
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="apple-mobile-web-app-title" content="StoryRun" />

        {/* Splash screen colour for Android */}
        <meta name="msapplication-TileColor" content="#FC4C02" />
        <meta name="msapplication-tap-highlight" content="no" />
      </head>
      <body suppressHydrationWarning>
        {children}
      </body>
    </html>
  );
}
