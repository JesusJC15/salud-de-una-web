'use client'

import { BarChart3, BriefcaseMedical, CircleCheck, Headset, ShieldCheck } from 'lucide-react'
import { motion } from 'motion/react'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'
import { cardPopIn, pageReveal, staggerItem, staggerParent } from '@/components/animations/motion-presets'
import RegisterForm from '@/features/auth/components/register-form'
import {
  REGISTER_BENEFITS,
} from '@/features/auth/constants/register-page-content'
import { authService } from '@/services/auth-service'

const BENEFIT_ICONS = [
  CircleCheck,
  BriefcaseMedical,
  BarChart3,
] as const

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
        className="relative sticky top-0 z-40 bg-white/80 px-6 py-4 backdrop-blur-xl md:px-14"
        variants={pageReveal}
      >
        <div className="pointer-events-none absolute right-0 bottom-0 left-0 h-px bg-gradient-to-r from-teal-400/10 via-teal-500/30 to-cyan-500/10" />
        <div className="mx-auto flex w-full max-w-[1100px] items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="flex size-8 items-center justify-center rounded-lg bg-teal-100 text-teal-700">
              <ShieldCheck className="h-4 w-4" />
            </div>
            <span className="text-xl font-extrabold tracking-tight text-teal-700">SaludDeUna</span>
          </div>

          <div className="hidden items-center gap-8 md:flex">
            <button
              type="button"
              onClick={() => router.push('/login')}
              className="inline-flex h-10 items-center justify-center rounded-full bg-linear-to-r from-aquamarine to-primary px-5 text-sm font-bold text-white shadow-md shadow-aquamarine/20 transition-all hover:shadow-aquamarine/30"
            >
              Iniciar Sesión
            </button>
          </div>
        </div>
      </motion.header>

      <motion.main className="px-6 py-10 md:px-10 lg:py-12" variants={pageReveal}>
        <div className="mx-auto grid w-full max-w-[1100px] grid-cols-1 gap-10 lg:grid-cols-12 lg:gap-12">
          <section className="space-y-8 lg:col-span-8">
            <motion.div className="space-y-4" variants={staggerParent}>
              <motion.h1 className="text-4xl leading-tight font-black tracking-tight md:text-5xl" variants={staggerItem}>
                Únete a la red de salud más eficiente
              </motion.h1>
              <motion.p className="max-w-2xl text-lg text-slate-600" variants={staggerItem}>
                Registra tu perfil profesional y comienza a gestionar tus consultas con la tecnología más avanzada del sector médico.
              </motion.p>
            </motion.div>

            <motion.div variants={cardPopIn}>
              <RegisterForm />
            </motion.div>
          </section>

          <aside className="space-y-6 lg:col-span-4">
            <motion.div
              className="rounded-[2rem] bg-white/80 p-7 backdrop-blur-sm"
              variants={cardPopIn}
            >
              <h3 className="mb-7 text-2xl font-bold tracking-tight">Beneficios de la red</h3>

              <div className="space-y-6">
                {REGISTER_BENEFITS.map((benefit, index) => {
                  const Icon = BENEFIT_ICONS[index] ?? CircleCheck

                  return (
                    <div key={benefit.title} className="flex gap-4">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-teal-100/80 text-teal-700">
                        <Icon className="h-5 w-5" />
                      </div>
                      <div>
                        <h4 className="font-bold text-slate-800">{benefit.title}</h4>
                        <p className="mt-1 text-sm text-slate-600">{benefit.description}</p>
                      </div>
                    </div>
                  )
                })}
              </div>
            </motion.div>

            <motion.div
              className="relative overflow-hidden rounded-[2rem] bg-linear-to-br from-aquamarine to-primary p-8 text-white"
              variants={cardPopIn}
            >
              <div className="relative z-10">
                <h3 className="text-2xl font-bold">¿Necesitas ayuda?</h3>
                <p className="mt-3 text-sm leading-relaxed text-teal-50">
                  Nuestro equipo de soporte está disponible para asistirte con tu registro profesional 24/7.
                </p>
                <button
                  type="button"
                  className="mt-6 inline-flex items-center gap-2 rounded-full bg-white/20 px-4 py-2 text-sm font-semibold backdrop-blur-sm transition-colors hover:bg-white/30"
                >
                  <Headset className="h-4 w-4" />
                  Contactar Soporte
                </button>
              </div>

              <div className="pointer-events-none absolute -right-8 -bottom-8 opacity-20">
                <BriefcaseMedical className="h-28 w-28" />
              </div>
            </motion.div>

            <motion.div
              className="relative h-72 overflow-hidden rounded-[2rem]"
              variants={cardPopIn}
            >
              <Image
                src="/images/medical-facility.png"
                alt="Plataforma de telemedicina"
                fill
                className="object-cover"
                sizes="(max-width: 1024px) 100vw, 400px"
              />
              <div className="absolute inset-0 bg-linear-to-t from-slate-900/65 via-slate-900/20 to-transparent" />
              <div className="absolute inset-x-0 bottom-0 p-6">
                <p className="text-[0.65rem] font-semibold tracking-[0.2em] text-teal-100 uppercase">
                  Tecnología SaludDeUna
                </p>
                <p className="mt-2 max-w-[18ch] text-xl leading-tight font-semibold text-white">
                  Infraestructura digital diseñada para médicos de élite.
                </p>
              </div>
            </motion.div>
          </aside>
        </div>
      </motion.main>

      <motion.footer
        className="bg-white/60 px-6 py-8 backdrop-blur-sm md:px-10"
        variants={pageReveal}
      >
        <div className="mx-auto flex w-full max-w-[1100px] flex-col items-center justify-between gap-4 text-sm text-slate-500 md:flex-row">
          <span className="font-semibold text-slate-700">SaludDeUna</span>
        </div>
      </motion.footer>
    </motion.div>
  )
}
