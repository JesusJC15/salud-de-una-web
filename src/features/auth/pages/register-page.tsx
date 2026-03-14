'use client'

import { Info, ShieldAlert, ShieldCheck } from 'lucide-react'
import { motion } from 'motion/react'
import Image from 'next/image'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'
import { cardPopIn, pageReveal, staggerItem, staggerParent } from '@/components/animations/motion-presets'
import RegisterForm from '@/features/auth/components/register-form'
import { authService } from '@/services/auth-service'

const VALIDATION_STEPS = [
  {
    title: 'Cruce de datos REThUS',
    description:
      'Validamos automaticamente su identidad y especialidad con la base de datos oficial del Ministerio de Salud.',
  },
  {
    title: 'Verificacion de Documentos',
    description:
      'Nuestro equipo legal revisa su tarjeta profesional y antecedentes etico-profesionales.',
  },
  {
    title: 'Activacion de Perfil',
    description:
      'Una vez validado, podra configurar sus horarios de atencion y recibir pacientes en menos de 24 horas.',
  },
]

export function RegisterPage() {
  const router = useRouter()

  useEffect(() => {
    if (authService.isAuthenticated()) {
      router.push('/dashboard')
    }
  }, [router])

  return (
    <motion.div
      className="gradient-bg min-h-screen text-slate-900"
      initial="hidden"
      animate="visible"
      variants={staggerParent}
    >
      <motion.header
        className="sticky top-0 z-40 border-b border-slate-200 bg-white/95 px-6 py-4 backdrop-blur-md md:px-14"
        variants={pageReveal}
      >
        <div className="mx-auto flex w-full max-w-[1100px] items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="flex size-8 items-center justify-center rounded-lg bg-teal-100 text-teal-600">
              <ShieldCheck className="h-5 w-5" />
            </div>
            <span className="text-xl font-bold tracking-tight">SaludDeUna</span>
          </div>

          <div className="flex items-center gap-5 md:gap-8">
            <nav className="hidden items-center gap-6 md:flex">
            </nav>
            <div className="hidden h-6 w-px bg-slate-200 md:block"></div>
            <Link
              href="/login"
              className="inline-flex h-14 items-center justify-center rounded-xl bg-linear-to-r from-aquamarine to-primary px-5 text-base font-bold text-white shadow-lg shadow-aquamarine/20 transition-all hover:shadow-aquamarine/30"
            >
              Iniciar Sesion
            </Link>
          </div>
        </div>
      </motion.header>

      <motion.main className="px-6 py-10 md:px-10 lg:py-12" variants={pageReveal}>
        <div className="mx-auto grid w-full max-w-[1100px] grid-cols-1 gap-10 lg:grid-cols-12 lg:gap-12">
          <section className="space-y-8 lg:col-span-7">
            <motion.div className="space-y-4" variants={staggerParent}>
              <motion.span
                className="inline-flex w-fit items-center rounded-full bg-teal-100 px-3 py-1 text-xs font-semibold text-teal-700"
                variants={staggerItem}
              >
                Portal de Profesionales
              </motion.span>
              <motion.h1 className="text-4xl leading-tight font-black tracking-tight" variants={staggerItem}>
                Registro para Medicos
              </motion.h1>
              <motion.p className="max-w-xl text-lg text-slate-600" variants={staggerItem}>
                Unete a la red de profesionales de SaludDeUna. Ingresa tus datos oficiales para comenzar el proceso de validacion institucional.
              </motion.p>
            </motion.div>

            <motion.div
              className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm md:p-8"
              variants={cardPopIn}
            >
              <RegisterForm />
            </motion.div>
          </section>

          <aside className="space-y-6 lg:col-span-5">
            <motion.div
              className="rounded-2xl border border-teal-200 bg-linear-to-br from-teal-50 to-cyan-50 p-7 lg:sticky lg:top-24"
              variants={cardPopIn}
            >
              <div className="mb-7 flex items-center gap-3">
                <div className="flex size-10 items-center justify-center rounded-full bg-teal-500 text-white">
                  <Info className="h-5 w-5" />
                </div>
                <h3 className="text-2xl font-bold tracking-tight">Proceso de Validacion</h3>
              </div>

              <div className="space-y-6">
                {VALIDATION_STEPS.map((step, index) => (
                  <div key={step.title} className="flex gap-4">
                    <div className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-teal-100 text-xs font-bold text-teal-700">
                      {index + 1}
                    </div>
                    <div>
                      <h4 className="font-bold text-slate-800">{step.title}</h4>
                      <p className="mt-1 text-sm text-slate-600">{step.description}</p>
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-8 border-t border-teal-200 pt-6">
                <div className="flex items-start gap-3 rounded-xl bg-white/70 p-4">
                  <ShieldAlert className="mt-0.5 h-4 w-4 shrink-0 text-amber-500" />
                  <p className="text-xs text-slate-500 italic">
                    Nota: El registro en REThUS es obligatorio para ejercer profesiones de salud en el territorio nacional segun la Ley 1164 de 2007.
                  </p>
                </div>
              </div>
            </motion.div>

            <motion.div
              className="relative h-48 overflow-hidden rounded-2xl border border-slate-200 shadow-sm"
              variants={cardPopIn}
            >
              <Image
                src="/images/medical-facility.png"
                alt="Plataforma de telemedicina"
                fill
                className="object-cover grayscale"
                sizes="(max-width: 1024px) 100vw, 400px"
                priority
              />
              <div className="absolute inset-0 bg-linear-to-br from-primary/35 to-slate-900/70" />
              <div className="absolute inset-0 flex items-center justify-center px-8 text-center">
              </div>
            </motion.div>
          </aside>
        </div>
      </motion.main>

      <motion.footer
        className="border-t border-slate-200 bg-white px-6 py-8 md:px-10"
        variants={pageReveal}
      >
      </motion.footer>
    </motion.div>
  )
}
