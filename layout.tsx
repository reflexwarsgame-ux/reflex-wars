import type { Metadata, Viewport } from 'next'

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
}

export const metadata: Metadata = {
  title: '⚔️ Reflex Wars - 1v1 Reaction Battle',
  description: 'Test your reflexes in this fast-paced 1v1 reaction game. Compete worldwide and become the ultimate champion!',
  keywords: ['reaction game', 'reflexes', '1v1', 'battle', 'competitive', 'esports'],
  authors: [{ name: 'Reflex Wars Team' }],
  openGraph: {
    title: '⚔️ Reflex Wars - 1v1 Reaction Battle',
    description: 'Test your reflexes in this fast-paced 1v1 reaction game.',
    type: 'website',
  },
  icons: {
    icon: '/favicon.svg',
    apple: '/favicon.svg',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap" rel="stylesheet" />
        <link rel="icon" href="/favicon.svg" type="image/svg+xml" />
      </head>
      <body style={{ 
        margin: 0, 
        padding: 0, 
        minHeight: '100dvh',
        backgroundColor: '#050510',
        fontFamily: '"Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
        WebkitFontSmoothing: 'antialiased',
        MozOsxFontSmoothing: 'grayscale',
        overflowX: 'hidden',
        touchAction: 'manipulation',
      }}>
        {children}
      </body>
    </html>
  )
}

