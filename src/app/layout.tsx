import type { Metadata } from 'next'
import { Toaster } from 'react-hot-toast'
import { ErrorBoundary } from '@/components/error-boundary'
import { cn } from '@/lib/utils'
import { Auth0ClientProvider } from '@/providers/auth0-provider'
import './globals.css'

export const metadata: Metadata = {
  title: 'SaludDeUna',
  description:
    'Plataforma de comunicación médica para optimizar el flujo de trabajo clínico',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="es-CO" className={cn('font-sans')}>
      <body className="antialiased">
        <ErrorBoundary>
          <Auth0ClientProvider>
            <Toaster position="top-right" toastOptions={{ duration: 4000 }} />
            <div className="gradient-bg dark:bg-background-dark relative flex min-h-screen flex-col">
              <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden">
                <div className="absolute -top-24 -left-24 h-80 w-80 rounded-full bg-aquamarine/10 blur-3xl"></div>
                <div className="absolute top-1/2 -right-32 h-96 w-96 rounded-full bg-primary/10 blur-3xl"></div>
                <div className="absolute bottom-10 left-1/2 h-64 w-64 -translate-x-1/2 rounded-full bg-aquamarine/5 blur-2xl"></div>
              </div>

              <div className="relative z-10 flex flex-1 flex-col">
                {children}
              </div>

              <div className="pointer-events-none absolute bottom-4 left-4 z-0 rotate-12 opacity-10">
                <span className="material-symbols-outlined text-6xl text-aquamarine">
                  stethoscope
                </span>
              </div>
              <div className="pointer-events-none absolute top-1/3 right-4 z-0 -rotate-12 opacity-10">
                <span className="material-symbols-outlined text-7xl text-primary">
                  medical_services
                </span>
              </div>
            </div>
          </Auth0ClientProvider>
        </ErrorBoundary>
      </body>
    </html>
  )
}
