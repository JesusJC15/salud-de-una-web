'use client'

import type { RegisterDoctorDto } from '@/types'
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

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
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
      className="mt-8 space-y-4"
      initial="hidden"
      animate="visible"
      variants={staggerParent}
    >
      <motion.div className="grid grid-cols-1 gap-4 sm:grid-cols-2" variants={staggerItem}>
        <Input
          name="firstName"
          placeholder="Nombres"
          value={formData.firstName}
          onChange={e => updateField('firstName', e.target.value)}
          disabled={loading}
        />
        <Input
          name="lastName"
          placeholder="Apellidos"
          value={formData.lastName}
          onChange={e => updateField('lastName', e.target.value)}
          disabled={loading}
        />
      </motion.div>

      <motion.div variants={staggerItem}>
        <Input
          type="email"
          name="email"
          placeholder="correo@empresa.com"
          value={formData.email}
          onChange={e => updateField('email', e.target.value)}
          disabled={loading}
        />
      </motion.div>

      <motion.div variants={staggerItem}>
        <Input
          type="password"
          name="password"
          placeholder="Contrasena"
          value={formData.password}
          onChange={e => updateField('password', e.target.value)}
          disabled={loading}
        />
      </motion.div>

      <motion.div variants={staggerItem}>
        <select
          name="specialty"
          aria-label="Especialidad"
          title="Especialidad"
          value={formData.specialty}
          onChange={e => updateField('specialty', e.target.value)}
          disabled={loading}
          className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
        >
          {specialties.map(specialty => (
            <option key={specialty} value={specialty}>
              {SPECIALTY_LABELS[specialty]}
            </option>
          ))}
        </select>
      </motion.div>

      <motion.div className="grid grid-cols-1 gap-4 sm:grid-cols-2" variants={staggerItem}>
        <Input
          name="personalId"
          placeholder="Identificacion"
          value={formData.personalId}
          onChange={e => updateField('personalId', e.target.value)}
          disabled={loading}
        />
        <Input
          name="phoneNumber"
          placeholder="Telefono"
          value={formData.phoneNumber}
          onChange={e => updateField('phoneNumber', e.target.value)}
          disabled={loading}
        />
      </motion.div>

      <motion.div variants={staggerItem}>
        <Input
          name="professionalLicense"
          placeholder="Licencia profesional (opcional)"
          value={formData.professionalLicense ?? ''}
          onChange={e => updateField('professionalLicense', e.target.value)}
          disabled={loading}
        />
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

      <motion.div variants={staggerItem} whileHover={{ y: -1 }} whileTap={{ y: 0 }}>
        <Button type="submit" className="w-full" disabled={loading}>
          {loading ? 'Creando cuenta...' : 'Crear cuenta staff'}
        </Button>
      </motion.div>
    </motion.form>
  )
}
