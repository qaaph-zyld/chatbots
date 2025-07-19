import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { cn } from '@/lib/utils'
import { Providers } from '@/components/providers'
import { Navigation } from '@/components/layout/navigation'

const inter = Inter({ 
  subsets: ['latin'],
  variable: '--font-sans',
  display: 'swap',
})

export const metadata: Metadata = {
  title: {
    default: 'ShopBot - AI-Powered E-commerce Customer Support',
    template: '%s | ShopBot'
  },
  description: 'Transform your e-commerce customer support with AI automation. Reduce costs by 70% while improving customer satisfaction. Works seamlessly with Shopify and WooCommerce.',
  keywords: [
    'AI customer support',
    'e-commerce automation',
    'Shopify customer service',
    'WooCommerce support',
    'customer service automation',
    'AI chatbot',
    'e-commerce AI',
    'customer support software'
  ],
  authors: [{ name: 'ShopBot Team' }],
  creator: 'ShopBot',
  publisher: 'ShopBot',
  metadataBase: new URL('https://shopbot.ai'),
  alternates: {
    canonical: '/',
  },
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: 'https://shopbot.ai',
    title: 'ShopBot - AI-Powered E-commerce Customer Support',
    description: 'Transform your e-commerce customer support with AI automation. Reduce costs by 70% while improving customer satisfaction.',
    siteName: 'ShopBot',
    images: [
      {
        url: '/og-image.jpg',
        width: 1200,
        height: 630,
        alt: 'ShopBot AI Customer Support Dashboard',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'ShopBot - AI-Powered E-commerce Customer Support',
    description: 'Transform your e-commerce customer support with AI automation. Reduce costs by 70% while improving customer satisfaction.',
    images: ['/twitter-image.jpg'],
    creator: '@shopbot_ai',
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  verification: {
    google: 'your-google-verification-code',
  },
  category: 'technology',
}

interface RootLayoutProps {
  children: React.ReactNode
}

export default function RootLayout({ children }: RootLayoutProps) {
  return (
    <html lang="en">
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </head>
      <body className={cn(
        'min-h-screen bg-background font-sans antialiased',
        inter.variable
      )}>
        <Providers>
          <div className="relative flex min-h-screen flex-col">
            <Navigation />
            <main className="flex-1">
              {children}
            </main>
          </div>
        </Providers>
      </body>
    </html>
  )
}
