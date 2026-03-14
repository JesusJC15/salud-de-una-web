'use client'

import { HeartPulse } from 'lucide-react'
import { motion } from 'motion/react'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'
import { authService } from '@/services/auth-service'

export function HomeRedirectPage() {
  const router = useRouter()

  useEffect(() => {
    if (authService.isAuthenticated()) {
      router.push('/dashboard')
    }
    else {
      router.push('/login')
    }
  }, [router])

  return (
    <div className="flex min-h-screen items-center justify-center bg-white px-6">
      <motion.div
        className="flex flex-col items-center gap-4 rounded-2xl border border-slate-200 bg-white px-8 py-7 shadow-sm"
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, ease: 'easeOut' }}
      >
        <motion.div
          animate={{ scale: 1.14 }}
          transition={{ duration: 0.6, repeat: Infinity, repeatType: 'mirror', ease: 'easeInOut' }}
          className="text-teal-500"
        >
          <HeartPulse className="h-10 w-10" />
        </motion.div>
        <p className="text-sm font-medium text-slate-600">Cargando tu sesion...</p>
      </motion.div>
    </div>
  )
}
