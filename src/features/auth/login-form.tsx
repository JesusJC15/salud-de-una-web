'use client'

import type { LoginDto } from '@/types'
import { Eye, EyeOff, Lock, Mail } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { authService } from '@/services/auth-service'

const EMAIL_PATTERN = /^[^\s@]+@[^\s@][^\s.@]*\.[^\s@]+$/

export default function LoginForm() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [formData, setFormData] = useState<LoginDto>({
    email: '',
    password: '',
  })

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData((prev: LoginDto) => ({
      ...prev,
      [name]: value,
    }))
    setError(null)
  }

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setError(null)
    setLoading(true)

    try {
      // Validaciones básicas
      if (!formData.email || !formData.password) {
        setError('Por favor completa todos los campos')
        setLoading(false)
        return
      }

      // Validar email
      if (!EMAIL_PATTERN.test(formData.email)) {
        setError('Por favor ingresa un correo válido')
        setLoading(false)
        return
      }

      // Realizar login
      const response = await authService.loginStaff(formData)

      if (response?.accessToken) {
        // Redirigir al dashboard
        router.push('/dashboard')
      }
    }
    catch (err) {
      const errorMessage
        = err instanceof Error ? err.message : 'Error al iniciar sesión'
      setError(errorMessage)
      console.error('Login error:', err)
    }
    finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="w-full space-y-5">
      {/* Email Field */}
      <div className="flex flex-col gap-2">
        <label htmlFor="email" className="text-slate-700 dark:text-slate-300 text-sm font-semibold ml-1">
          Email Profesional
        </label>
        <div className="relative">
          <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-6 h-6 text-aquamarine z-10" />
          <Input
            id="email"
            type="email"
            name="email"
            placeholder="ejemplo@SaludDeUna.com"
            value={formData.email}
            onChange={handleInputChange}
            disabled={loading}
            className="pl-12 pr-4 h-14 rounded-xl border border-slate-200 dark:border-slate-700 bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus-ring disabled:opacity-50"
          />
        </div>
      </div>

      {/* Password Field */}
      <div className="flex flex-col gap-2">
        <label htmlFor="password" className="text-slate-700 dark:text-slate-300 text-sm font-semibold ml-1">
          Contraseña
        </label>
        <div className="relative group">
          <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-6 h-6 text-aquamarine z-10" />
          <Input
            id="password"
            type={showPassword ? 'text' : 'password'}
            name="password"
            placeholder="••••••••"
            value={formData.password}
            onChange={handleInputChange}
            disabled={loading}
            className="pl-12 pr-12 h-14 rounded-xl border border-slate-200 dark:border-slate-700 bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus-ring disabled:opacity-50"
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            disabled={loading}
            className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-aquamarine transition-colors disabled:opacity-50"
          >
            {showPassword
              ? (
                <EyeOff className="w-5 h-5" />
              )
              : (
                <Eye className="w-5 h-5" />
              )}
          </button>
        </div>
      </div>

      {/* Forgot Password Link */}
      <div className="flex justify-end">
        <a
          href="/forgot-password"
          className="text-primary text-sm font-semibold hover:text-aquamarine transition-colors"
        >
          ¿Olvidé mi contraseña?
        </a>
      </div>

      {/* Error Message */}
      {error && (
        <div className="p-4 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800">
          <p className="text-red-700 dark:text-red-400 text-sm font-medium">
            {error}
          </p>
        </div>
      )}

      {/* Submit Button */}
      <Button
        type="submit"
        disabled={loading}
        className="w-full h-14 bg-linear-to-r from-aquamarine to-primary text-white rounded-xl font-bold text-lg shadow-lg shadow-aquamarine/20 hover:shadow-aquamarine/30 active:scale-[0.98] transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {loading
          ? (
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              <span>Iniciando sesión...</span>
            </div>
          )
          : (
            <div className="flex items-center gap-2">
              <span>Acceder al Panel</span>
            </div>
          )}
      </Button>
    </form>
  )
}
