'use client'

import { ShieldPlus, Sparkles, UserPlus } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'
import LoginForm from '@/features/auth/login-form'
import { authService } from '@/services/auth-service'

export function LoginPage() {
  const router = useRouter()

  useEffect(() => {
    if (authService.isAuthenticated()) {
      router.push('/dashboard')
    }
  }, [router])

  return (
    <div className="flex min-h-screen flex-col bg-white lg:flex-row">
      <div className="relative hidden overflow-hidden bg-linear-to-br from-teal-100 to-teal-50 p-12 lg:flex lg:w-1/2 lg:flex-col lg:items-center lg:justify-center">
        <div className="relative z-10 max-w-lg space-y-8 text-center">
          <div className="flex justify-center">
            <div className="flex size-20 items-center justify-center rounded-xl bg-teal-500 shadow-lg shadow-teal-500/20">
              <ShieldPlus className="h-16 w-16 text-white" />
            </div>
          </div>

          <div className="space-y-4">
            <h1 className="text-4xl font-black tracking-tight text-slate-900">
              Innovación en Comunicación Médica
            </h1>
            <p className="text-lg leading-relaxed text-slate-600">
              Nuestra plataforma permite a los profesionales de la salud optimizar el flujo de trabajo clínico y mejorar la experiencia del paciente.
            </p>
          </div>

          <div className="overflow-hidden rounded-xl border-4 border-white shadow-2xl">
            <div className="h-64 w-full bg-[url('/images/medical-facility.png')] bg-cover bg-center" />
          </div>
        </div>
      </div>

      <div className="flex flex-1 flex-col justify-center bg-white px-6 py-12 lg:px-24">
        <div className="sm:mx-auto sm:w-full sm:max-w-md">
          <div className="mb-12 flex items-center gap-3 lg:hidden">
            <Sparkles className="h-8 w-8 text-teal-500" />
            <h2 className="text-xl font-bold tracking-tight">SaludDeUna</h2>
          </div>

          <div className="space-y-2">
            <h2 className="text-3xl font-black leading-tight tracking-tight text-slate-900">
              Portal de Médicos y Administradores
            </h2>
            <p className="font-medium text-slate-500">
              Inicie sesión para gestionar la atención clínica
            </p>
          </div>

          <div className="mt-10">
            <LoginForm />
          </div>

          <div className="mt-10 space-y-4 border-t border-slate-200 pt-8">
            <div>
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
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
