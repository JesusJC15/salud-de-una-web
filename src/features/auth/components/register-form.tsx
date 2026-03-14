'use client'

import type { RegisterDoctorDto } from '@/types'
import { ArrowRight, ChevronDown } from 'lucide-react'
import { AnimatePresence, motion } from 'motion/react'
import { useRouter } from 'next/navigation'
import { useMemo, useState } from 'react'
import { staggerItem, staggerParent } from '@/components/animations/motion-presets'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { authService } from '@/services/auth-service'
import { Specialty } from '@/types/enums'
import { SPECIALTY_LABELS } from '@/utils/specialty-labels'

const EMAIL_PATTERN = /^[^\s@]+@[^\s@][^\s.@]*\.[^\s@]+$/

const INITIAL_FORM: RegisterDoctorDto = {
  firstName: '',
  lastName: '',
  email: '',
  password: '',
  specialty: Specialty.GENERAL_MEDICINE,
  personalId: '',
  phoneNumber: '',
  professionalLicense: '',
}

export default function RegisterForm() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [formData, setFormData] = useState<RegisterDoctorDto>(INITIAL_FORM)

  const specialties = useMemo(() => Object.values(Specialty), [])

  const updateField = (name: keyof RegisterDoctorDto, value: string) => {
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }))
    setError(null)
  }

  const handleSubmit = async (e: React.SubmitEvent<HTMLFormElement>) => {
    e.preventDefault()
    setError(null)

    if (!formData.firstName || !formData.lastName || !formData.email || !formData.password) {
      setError('Completa los campos obligatorios')
      return
    }

    if (!EMAIL_PATTERN.test(formData.email)) {
      setError('Ingresa un correo valido')
      return
    }

    if (formData.password.length < 8) {
      setError('La contrasena debe tener minimo 8 caracteres')
      return
    }

    if (!formData.personalId || !formData.phoneNumber) {
      setError('Completa identificacion y telefono')
      return
    }

    setLoading(true)
    try {
      await authService.registerStaff({
        ...formData,
        professionalLicense: formData.professionalLicense || undefined,
      })

      await authService.loginStaff({
        email: formData.email,
        password: formData.password,
      })

      router.push('/dashboard')
    }
    catch (err) {
      setError(err instanceof Error ? err.message : 'No fue posible crear la cuenta')
    }
    finally {
      setLoading(false)
    }
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
            placeholder="Ej: Perez"
            value={formData.lastName}
            onChange={e => updateField('lastName', e.target.value)}
            disabled={loading}
            className="h-12 rounded-xl border-slate-200 bg-white/80 text-base text-slate-900 placeholder:text-slate-400 focus-ring"
          />
        </label>
      </motion.div>

      <motion.div className="grid grid-cols-1 gap-6 md:grid-cols-2" variants={staggerItem}>
        <label htmlFor="email" className="flex flex-col gap-2">
          <span className="text-sm font-semibold text-slate-700">Correo electronico profesional</span>
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
          <span className="text-sm font-semibold text-slate-700">Contrasena</span>
          <Input
            id="password"
            type="password"
            name="password"
            placeholder="Minimo 8 caracteres"
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
          <span className="text-sm font-semibold text-slate-700">Tarjeta Profesional</span>
          <Input
            id="professionalLicense"
            name="professionalLicense"
            placeholder="Numero de tarjeta"
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
            placeholder="Numero de identificacion"
            value={formData.personalId}
            onChange={e => updateField('personalId', e.target.value)}
            disabled={loading}
            className="h-12 rounded-xl border-slate-200 bg-white/80 text-base text-slate-900 placeholder:text-slate-400 focus-ring"
          />
        </label>

        <label htmlFor="phoneNumber" className="flex flex-col gap-2">
          <span className="text-sm font-semibold text-slate-700">Telefono</span>
          <Input
            id="phoneNumber"
            name="phoneNumber"
            placeholder="Ej: 3001234567"
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
        Ya tienes una cuenta?
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
