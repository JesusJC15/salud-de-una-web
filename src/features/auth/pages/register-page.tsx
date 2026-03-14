'use client'

import { motion } from 'motion/react'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'
import { cardPopIn, pageReveal, staggerItem, staggerParent } from '@/components/animations/motion-presets'
import RegisterForm from '@/features/auth/components/register-form'
import { authService } from '@/services/auth-service'

export function RegisterPage() {
  const router = useRouter()

  useEffect(() => {
    if (authService.isAuthenticated()) {
      router.push('/dashboard')
    }
  }, [router])

  return (
    <motion.div
      className="flex min-h-screen items-center justify-center bg-slate-50 px-6 py-10"
      initial="hidden"
      animate="visible"
      variants={pageReveal}
    >
      <motion.div
        className="w-full max-w-xl rounded-xl border border-slate-200 bg-white p-8 shadow-sm"
        variants={staggerParent}
      >
        <motion.h1 className="text-2xl font-bold text-slate-900" variants={staggerItem}>Registro Staff</motion.h1>
        <motion.p className="mt-2 text-sm text-slate-600" variants={staggerItem}>Crea cuenta para medicos y administradores.</motion.p>

        <motion.div variants={cardPopIn}>
          <RegisterForm />
        </motion.div>

        <motion.button
          type="button"
          onClick={() => router.push('/login')}
          className="mt-6 text-sm font-semibold text-primary hover:underline"
          variants={staggerItem}
          whileHover={{ x: -2 }}
        >
          Ya tengo cuenta
        </motion.button>
      </motion.div>
    </motion.div>
  )
}
