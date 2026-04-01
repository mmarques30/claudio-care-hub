import type { Metadata } from 'next'
import { getGoogleFontsUrl } from '@/lib/fonts'
import './globals.css'

export const metadata: Metadata = {
  title: 'Carousel Studio',
  description: 'Gerador de carrosséis para Instagram — crie slides profissionais e exporte como PNG.',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR" className="dark">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href={getGoogleFontsUrl()} rel="stylesheet" />
      </head>
      <body className="font-sans antialiased" style={{ fontFamily: "'Inter', system-ui, -apple-system, sans-serif" }}>
        {children}
      </body>
    </html>
  )
}
