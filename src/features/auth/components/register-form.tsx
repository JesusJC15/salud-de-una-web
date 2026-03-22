'use client'

import { ArrowRight, ChevronDown, Eye, EyeOff, Lock, ShieldCheck, Stethoscope } from 'lucide-react'
import { AnimatePresence, motion } from 'motion/react'
import { useRouter } from 'next/navigation'
import { useCallback, useMemo, useState } from 'react'
import { staggerItem, staggerParent } from '@/components/animations/motion-presets'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useRegisterDoctorForm } from '@/features/auth/hooks/use-register-doctor-form'
import { Specialty } from '@/types/enums'
import { SPECIALTY_LABELS } from '@/utils/specialty-labels'

const sectionCardClass = 'relative overflow-hidden rounded-[2rem] bg-white/45 p-6 md:p-8'
const sectionNumberClass = 'pointer-events-none absolute top-6 right-6 text-6xl font-black text-slate-800/10'
const sectionTitleClass = 'text-3xl font-black tracking-tight text-slate-900'
const fieldLabelClass = 'ml-1 text-sm font-semibold text-slate-700'
const inputClass = 'h-12 rounded-xl border-none bg-white text-base text-slate-900 placeholder:text-slate-400 focus-ring'

export default function RegisterForm() {
  const router = useRouter()
  const [confirmPassword, setConfirmPassword] = useState('')
  const [acceptTerms, setAcceptTerms] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)

  const handleSuccess = useCallback(() => {
    router.push('/dashboard')
  }, [router])

  const { loading, error, formData, clearError, updateField, submit } = useRegisterDoctorForm({
    onSuccess: handleSuccess,
  })

  const specialties = useMemo(() => Object.values(Specialty), [])

  const handleSubmit = (e: React.SubmitEvent<HTMLFormElement>) => {
    e.preventDefault()
    void submit({
      confirmPassword,
      acceptedTerms: acceptTerms,
    })
  }

  return (
    <motion.form
      onSubmit={handleSubmit}
      className="space-y-6"
      initial="hidden"
      animate="visible"
      variants={staggerParent}
    >
      <motion.section className={sectionCardClass} variants={staggerItem}>
        <span className={sectionNumberClass}>01</span>
        <div className="mb-8 flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-teal-100 text-teal-700">
            <ShieldCheck className="h-5 w-5" />
          </div>
          <h2 className={sectionTitleClass}>Información Personal</h2>
        </div>

        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          <label htmlFor="firstName" className="flex flex-col gap-2">
            <span className={fieldLabelClass}>Nombres *</span>
            <Input
              id="firstName"
              name="firstName"
              placeholder="Ej: Juan Manuel"
              value={formData.firstName}
              onChange={e => updateField('firstName', e.target.value)}
              required
              aria-required="true"
              disabled={loading}
              className={inputClass}
            />
          </label>

          <label htmlFor="lastName" className="flex flex-col gap-2">
            <span className={fieldLabelClass}>Apellidos *</span>
            <Input
              id="lastName"
              name="lastName"
              placeholder="Ej: Pérez García"
              value={formData.lastName}
              onChange={e => updateField('lastName', e.target.value)}
              required
              aria-required="true"
              disabled={loading}
              className={inputClass}
            />
          </label>

          <label htmlFor="personalId" className="flex flex-col gap-2">
            <span className={fieldLabelClass}>Documento de Identidad *</span>
            <Input
              id="personalId"
              name="personalId"
              placeholder="ID / DNI / Pasaporte"
              inputMode="numeric"
              pattern="[0-9]*"
              value={formData.personalId}
              onChange={e => updateField('personalId', e.target.value)}
              required
              aria-required="true"
              disabled={loading}
              className={inputClass}
            />
          </label>

          <label htmlFor="phoneNumber" className="flex flex-col gap-2">
            <span className={fieldLabelClass}>Teléfono *</span>
            <Input
              id="phoneNumber"
              name="phoneNumber"
              placeholder="Ej: 3001234567"
              inputMode="numeric"
              pattern="[0-9]*"
              value={formData.phoneNumber}
              onChange={e => updateField('phoneNumber', e.target.value)}
              required
              aria-required="true"
              disabled={loading}
              className={inputClass}
            />
          </label>
        </div>
      </motion.section>

      <motion.section className={sectionCardClass} variants={staggerItem}>
        <span className={sectionNumberClass}>02</span>
        <div className="mb-8 flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-cyan-100 text-cyan-700">
            <Stethoscope className="h-5 w-5" />
          </div>
          <h2 className={sectionTitleClass}>Credenciales Médicas</h2>
        </div>

        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          <label htmlFor="specialty" className="flex flex-col gap-2">
            <span className={fieldLabelClass}>Especialidad *</span>
            <div className="relative">
              <select
                id="specialty"
                name="specialty"
                aria-label="Especialidad"
                title="Especialidad"
                value={formData.specialty}
                onChange={e => updateField('specialty', e.target.value)}
                required
                aria-required="true"
                disabled={loading}
                className="h-12 w-full appearance-none rounded-xl border-none bg-white px-4 pr-11 text-base text-slate-900 focus-ring"
              >
                <option value="" disabled>
                  Seleccione Especialidad
                </option>
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
            <span className={fieldLabelClass}>Licencia Profesional</span>
            <Input
              id="professionalLicense"
              name="professionalLicense"
              placeholder="Nº Matrícula / Registro"
              inputMode="numeric"
              pattern="[0-9]*"
              value={formData.professionalLicense ?? ''}
              onChange={e => updateField('professionalLicense', e.target.value)}
              disabled={loading}
              className={inputClass}
            />
          </label>
        </div>
      </motion.section>

      <motion.section className={sectionCardClass} variants={staggerItem}>
        <span className={sectionNumberClass}>03</span>
        <div className="mb-8 flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-cyan-100 text-cyan-700">
            <Lock className="h-5 w-5" />
          </div>
          <h2 className={sectionTitleClass}>Acceso a la Cuenta</h2>
        </div>

        <div className="space-y-6">
          <label htmlFor="email" className="flex flex-col gap-2">
            <span className={fieldLabelClass}>Correo Electrónico *</span>
            <Input
              id="email"
              type="email"
              name="email"
              placeholder="doctor@hospital.com"
              value={formData.email}
              onChange={e => updateField('email', e.target.value)}
              required
              aria-required="true"
              disabled={loading}
              className={inputClass}
            />
          </label>

          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            <label htmlFor="password" className="flex flex-col gap-2">
              <span className={fieldLabelClass}>Contraseña *</span>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  name="password"
                  placeholder="••••••••"
                  value={formData.password}
                  onChange={e => updateField('password', e.target.value)}
                  required
                  aria-required="true"
                  disabled={loading}
                  className="h-12 rounded-xl border-none bg-white pr-11 text-base text-slate-900 placeholder:text-slate-400 focus-ring"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(prev => !prev)}
                  disabled={loading}
                  className="absolute top-1/2 right-3 -translate-y-1/2 text-slate-400 transition-colors hover:text-slate-600"
                  aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                >
                  {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>
            </label>

            <label htmlFor="confirmPassword" className="flex flex-col gap-2">
              <span className={fieldLabelClass}>Confirmar Contraseña *</span>
              <div className="relative">
                <Input
                  id="confirmPassword"
                  type={showConfirmPassword ? 'text' : 'password'}
                  name="confirmPassword"
                  placeholder="••••••••"
                  value={confirmPassword}
                  onChange={(e) => {
                    setConfirmPassword(e.target.value)
                    clearError()
                  }}
                  required
                  aria-required="true"
                  disabled={loading}
                  className="h-12 rounded-xl border-none bg-white pr-11 text-base text-slate-900 placeholder:text-slate-400 focus-ring"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(prev => !prev)}
                  disabled={loading}
                  className="absolute top-1/2 right-3 -translate-y-1/2 text-slate-400 transition-colors hover:text-slate-600"
                  aria-label={showConfirmPassword ? 'Ocultar confirmación de contraseña' : 'Mostrar confirmación de contraseña'}
                >
                  {showConfirmPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>
            </label>
          </div>
        </div>
      </motion.section>

      <motion.div className="space-y-6 py-2" variants={staggerItem}>
        <label htmlFor="acceptTerms" className="group flex cursor-pointer items-start gap-3">
          <input
            id="acceptTerms"
            name="acceptTerms"
            type="checkbox"
            checked={acceptTerms}
            onChange={(e) => {
              setAcceptTerms(e.target.checked)
              clearError()
            }}
            required
            aria-required="true"
            disabled={loading}
            className="mt-1 h-5 w-5 cursor-pointer rounded-md border border-slate-300 bg-white text-primary"
          />
          <span className="text-sm leading-tight text-slate-600 group-hover:text-slate-700">
            Acepto los
            {' '}
            <span className="font-semibold text-primary">Términos de Servicio</span>
            {' '}
            y la
            {' '}
            <span className="font-semibold text-primary">Política de Privacidad</span>
            {' '}
            de SaludDeUna. *
          </span>
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
          className="h-14 w-full rounded-full bg-linear-to-r from-aquamarine to-primary text-base font-bold text-white shadow-lg shadow-aquamarine/20 transition-all hover:shadow-aquamarine/30 md:w-auto md:px-12"
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
