import type { Metadata, Viewport } from 'next'

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
}

export const metadata: Metadata = {
  title: '⚔️ Reflex Wars - 1v1 Reaction Battle',
  description: 'Test your reflexes in this fast-paced 1v1 reaction game. Compete worldwide and prove you have the fastest reflexes!',
  keywords: ['reaction game', '1v1', 'reflexes', 'competitive gaming', 'speed', 'arcade'],
  openGraph: {
    title: '⚔️ Reflex Wars - 1v1 Reaction Battle',
    description: 'Test your reflexes in this fast-paced 1v1 reaction game',
    type: 'website',
  },
}

