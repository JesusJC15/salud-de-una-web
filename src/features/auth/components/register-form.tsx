'use client'

import { ArrowRight, ChevronDown } from 'lucide-react'
import { AnimatePresence, motion } from 'motion/react'
import { useRouter } from 'next/navigation'
import { useCallback, useMemo } from 'react'
import { staggerItem, staggerParent } from '@/components/animations/motion-presets'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useRegisterDoctorForm } from '@/features/auth/hooks/use-register-doctor-form'
import { Specialty } from '@/types/enums'
import { SPECIALTY_LABELS } from '@/utils/specialty-labels'

export default function RegisterForm() {
  const router = useRouter()
  const handleSuccess = useCallback(() => {
    router.push('/dashboard')
  }, [router])

  const { loading, error, formData, updateField, submit } = useRegisterDoctorForm({
    onSuccess: handleSuccess,
  })

  const specialties = useMemo(() => Object.values(Specialty), [])

  const handleSubmit = async (e: React.SubmitEvent<HTMLFormElement>) => {
    e.preventDefault()
    await submit()
  }

  return (
    <motion.form
      onSubmit={handleSubmit}
      className="space-y-6"
      initial="hidden"
      animate="visible"
      variants={staggerParent}
    >
      <motion.div className="grid grid-cols-1 gap-6 md:grid-cols-2" variants={staggerItem}>
        <label htmlFor="firstName" className="flex flex-col gap-2">
          <span className="text-sm font-semibold text-slate-700">Nombres</span>
          <Input
            id="firstName"
            name="firstName"
            placeholder="Ej: Juan"
            value={formData.firstName}
            onChange={e => updateField('firstName', e.target.value)}
            disabled={loading}
            className="h-12 rounded-xl border-slate-200 bg-white/80 text-base text-slate-900 placeholder:text-slate-400 focus-ring"
          />
        </label>

        <label htmlFor="lastName" className="flex flex-col gap-2">
          <span className="text-sm font-semibold text-slate-700">Apellidos</span>
          <Input
            id="lastName"
            name="lastName"
            placeholder="Ej: Pérez"
            value={formData.lastName}
            onChange={e => updateField('lastName', e.target.value)}
            disabled={loading}
            className="h-12 rounded-xl border-slate-200 bg-white/80 text-base text-slate-900 placeholder:text-slate-400 focus-ring"
          />
        </label>
      </motion.div>

      <motion.div className="grid grid-cols-1 gap-6 md:grid-cols-2" variants={staggerItem}>
        <label htmlFor="email" className="flex flex-col gap-2">
          <span className="text-sm font-semibold text-slate-700">Correo electrónico profesional</span>
          <Input
            id="email"
            type="email"
            name="email"
            placeholder="nombre@clinica.com"
            value={formData.email}
            onChange={e => updateField('email', e.target.value)}
            disabled={loading}
            className="h-12 rounded-xl border-slate-200 bg-white/80 text-base text-slate-900 placeholder:text-slate-400 focus-ring"
          />
        </label>

        <label htmlFor="password" className="flex flex-col gap-2">
          <span className="text-sm font-semibold text-slate-700">Contraseña</span>
          <Input
            id="password"
            type="password"
            name="password"
            placeholder="Mínimo 8, 1 mayúscula, 1 número y 1 símbolo"
            value={formData.password}
            onChange={e => updateField('password', e.target.value)}
            disabled={loading}
            className="h-12 rounded-xl border-slate-200 bg-white/80 text-base text-slate-900 placeholder:text-slate-400 focus-ring"
          />
        </label>
      </motion.div>

      <motion.div className="grid grid-cols-1 gap-6 md:grid-cols-2" variants={staggerItem}>
        <label htmlFor="specialty" className="flex flex-col gap-2">
          <span className="text-sm font-semibold text-slate-700">Especialidad</span>
          <div className="relative">
            <select
              id="specialty"
              name="specialty"
              aria-label="Especialidad"
              title="Especialidad"
              value={formData.specialty}
              onChange={e => updateField('specialty', e.target.value)}
              disabled={loading}
              className="h-12 w-full appearance-none rounded-xl border border-slate-200 bg-white/80 px-4 pr-11 text-base text-slate-900 focus-ring"
            >
              {specialties.map(specialty => (
                <option key={specialty} value={specialty}>
                  {SPECIALTY_LABELS[specialty]}
                </option>
              ))}
            </select>
            <ChevronDown className="pointer-events-none absolute top-1/2 right-3 h-5 w-5 -translate-y-1/2 text-slate-400" />
          </div>
        </label>

        <label htmlFor="professionalLicense" className="flex flex-col gap-2">
          <span className="text-sm font-semibold text-slate-700">Tarjeta Profesional (opcional)</span>
          <Input
            id="professionalLicense"
            name="professionalLicense"
            placeholder="Número de tarjeta (opcional)"
            inputMode="numeric"
            pattern="[0-9]*"
            value={formData.professionalLicense ?? ''}
            onChange={e => updateField('professionalLicense', e.target.value)}
            disabled={loading}
            className="h-12 rounded-xl border-slate-200 bg-white/80 text-base text-slate-900 placeholder:text-slate-400 focus-ring"
          />
        </label>
      </motion.div>

      <motion.div className="grid grid-cols-1 gap-6 md:grid-cols-2" variants={staggerItem}>
        <label htmlFor="personalId" className="flex flex-col gap-2">
          <span className="text-sm font-semibold text-slate-700">Documento de identidad</span>
          <Input
            id="personalId"
            name="personalId"
            placeholder="Número de identificación"
            inputMode="numeric"
            pattern="[0-9]*"
            value={formData.personalId}
            onChange={e => updateField('personalId', e.target.value)}
            disabled={loading}
            className="h-12 rounded-xl border-slate-200 bg-white/80 text-base text-slate-900 placeholder:text-slate-400 focus-ring"
          />
        </label>

        <label htmlFor="phoneNumber" className="flex flex-col gap-2">
          <span className="text-sm font-semibold text-slate-700">Teléfono</span>
          <Input
            id="phoneNumber"
            name="phoneNumber"
            placeholder="Ej: 3001234567"
            inputMode="numeric"
            pattern="[0-9]*"
            value={formData.phoneNumber}
            onChange={e => updateField('phoneNumber', e.target.value)}
            disabled={loading}
            className="h-12 rounded-xl border-slate-200 bg-white/80 text-base text-slate-900 placeholder:text-slate-400 focus-ring"
          />
        </label>
      </motion.div>

      <AnimatePresence mode="wait">
        {error && (
          <motion.div
            key="register-error"
            className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700"
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.2 }}
          >
            {error}
          </motion.div>
        )}
      </AnimatePresence>

      <motion.div className="pt-2" variants={staggerItem} whileHover={{ y: -1 }} whileTap={{ y: 0 }}>
        <Button
          type="submit"
          className="h-14 w-full rounded-xl bg-linear-to-r from-aquamarine to-primary text-base font-bold text-white shadow-lg shadow-aquamarine/20 transition-all hover:shadow-aquamarine/30"
          disabled={loading}
        >
          <span>{loading ? 'Creando cuenta...' : 'Registrarse'}</span>
          {!loading && <ArrowRight className="h-5 w-5" />}
        </Button>
      </motion.div>

      <motion.p className="text-center text-sm text-slate-500" variants={staggerItem}>
        ¿Ya tienes una cuenta?
        {' '}
        <button
          type="button"
          onClick={() => router.push('/login')}
          className="font-semibold text-primary hover:underline"
        >
          Inicia sesión aquí
        </button>
      </motion.p>
    </motion.form>
  )
}
