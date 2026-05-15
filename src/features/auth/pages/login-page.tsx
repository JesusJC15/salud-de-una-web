'use client'

import { useAuth0 } from '@auth0/auth0-react'
import { CheckCircle, Sparkles, UserPlus } from 'lucide-react'
import { motion } from 'motion/react'
import Image from 'next/image'
import { useRouter, useSearchParams } from 'next/navigation'
import { Suspense, useEffect, useState } from 'react'
import { cardPopIn, floatingTransition, pageReveal, staggerItem, staggerParent } from '@/components/animations/motion-presets'
import LoginForm from '@/features/auth/components/login-form'
import { useAuth0LoadingTimeout } from '@/features/auth/hooks/use-auth0-loading-timeout'
import { authService } from '@/services/auth-service'

function RegistrationSuccessBanner() {
  const searchParams = useSearchParams()
  if (searchParams.get('registered') !== '1')
    return null

  return (
    <motion.div
      className="mt-8 flex items-center gap-3 rounded-xl border border-teal-200 bg-teal-50 px-4 py-3 text-sm text-teal-800"
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <CheckCircle className="h-5 w-5 shrink-0 text-teal-600" />
      <span>
        <strong>¡Cuenta creada exitosamente!</strong>
        {' '}
        Inicia sesión con tus credenciales.
      </span>
    </motion.div>
  )
}

export function LoginPage() {
  const router = useRouter()
  const { isAuthenticated, isLoading } = useAuth0()
  const [hasLegacySession] = useState(() => authService.isAuthenticated())
  const auth0TimedOut = useAuth0LoadingTimeout(isLoading)

  useEffect(() => {
    if (hasLegacySession || ((!isLoading || auth0TimedOut) && isAuthenticated)) {
      router.push('/dashboard')
    }
  }, [
    isLoading,
    auth0TimedOut,
    isAuthenticated,
    hasLegacySession,
    router,
  ])

  return (
    <motion.div
      className="flex min-h-screen flex-col bg-white lg:flex-row"
      initial="hidden"
      animate="visible"
      variants={staggerParent}
    >
      <motion.div
        className="relative hidden overflow-hidden bg-linear-to-br from-teal-100 to-teal-50 p-12 lg:flex lg:w-1/2 lg:flex-col lg:items-center lg:justify-center"
        variants={pageReveal}
      >
        <motion.div
          className="absolute -top-10 right-8 h-28 w-28 rounded-full bg-teal-400/20 blur-2xl"
          animate={{ y: 8 }}
          transition={floatingTransition}
        />
        <motion.div
          className="absolute bottom-16 left-8 h-40 w-40 rounded-full bg-cyan-400/20 blur-3xl"
          animate={{ y: -8 }}
          transition={{ ...floatingTransition, duration: 5 }}
        />

        <div className="relative z-10 max-w-lg space-y-8 text-center">
          <motion.div className="flex justify-center" variants={staggerItem}>
            <Image
              src="/images/SaludDeUnaLogoPrincipal.png"
              alt="SaludDeUna"
              width={260}
              height={84}
              priority
              className="h-auto w-full max-w-[260px] drop-shadow-sm"
            />
          </motion.div>

          <motion.div className="space-y-4" variants={staggerItem}>
            <h1 className="text-4xl font-black tracking-tight text-slate-900">
              Innovacion en Comunicacion Medica
            </h1>
            <p className="text-lg leading-relaxed text-slate-600">
              Nuestra plataforma permite a los profesionales de la salud optimizar el flujo de trabajo clinico y mejorar la experiencia del paciente.
            </p>
          </motion.div>

          <motion.div
            className="overflow-hidden rounded-xl border-4 border-white shadow-2xl"
            variants={cardPopIn}
            whileHover={{ y: -4 }}
          >
            <div className="h-64 w-full bg-[url('/images/medical-facility.png')] bg-cover bg-center" />
          </motion.div>
        </div>
      </motion.div>

      <motion.div className="flex flex-1 flex-col justify-center bg-white px-6 py-12 lg:px-24" variants={pageReveal}>
        <motion.div className="sm:mx-auto sm:w-full sm:max-w-md" variants={staggerParent}>
          <motion.div className="mb-12 flex items-center gap-3 lg:hidden" variants={staggerItem}>
            <Sparkles className="h-8 w-8 text-teal-500" />
            <h2 className="text-xl font-bold tracking-tight">SaludDeUna</h2>
          </motion.div>

          <motion.div className="space-y-2" variants={staggerItem}>
            <h2 className="text-3xl font-black leading-tight tracking-tight text-slate-900">
              Portal de Medicos y Administradores
            </h2>
            <p className="font-medium text-slate-500">
              Inicie sesion para gestionar la atencion clinica
            </p>
          </motion.div>

          <Suspense>
            <RegistrationSuccessBanner />
          </Suspense>

          <motion.div className="mt-10" variants={staggerItem}>
            <LoginForm />
          </motion.div>

          <motion.div className="mt-10 space-y-4 border-t border-slate-200 pt-8" variants={staggerItem}>
            <motion.div variants={cardPopIn}>
              <p className="text-center text-sm text-slate-500">
                No tienes una cuenta?
              </p>
              <div className="mt-4">
                <button
                  onClick={() => router.push('/register')}
                  className="flex w-full items-center justify-center gap-2 rounded-lg bg-slate-50 px-3 py-3 text-sm font-bold text-slate-900 ring-1 ring-inset ring-slate-200 transition-colors hover:bg-slate-100"
                >
                  <UserPlus className="h-5 w-5 text-teal-500" />
                  Crear cuenta
                </button>
              </div>
            </motion.div>
          </motion.div>
        </motion.div>
      </motion.div>
    </motion.div>
  )
}
