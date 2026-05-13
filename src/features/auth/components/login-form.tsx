'use client'

import { useAuth0 } from '@auth0/auth0-react'
import { Eye, EyeOff, Lock, Mail } from 'lucide-react'
import { AnimatePresence, motion } from 'motion/react'
import { useState } from 'react'
import { staggerItem, staggerParent } from '@/components/animations/motion-presets'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useLoginStaff } from '@/features/auth/hooks/use-login-staff'

export default function LoginForm() {
  const { loginWithRedirect, isLoading: auth0Loading } = useAuth0()
  const { login, loading: legacyLoading, error, clearError } = useLoginStaff()
  const auth0Disabled = process.env.NEXT_PUBLIC_ENABLE_E2E_BACKEND_MOCK === 'true'

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)

  const isLoading = legacyLoading || (!auth0Disabled && auth0Loading)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    await login(email, password)
  }

  const handleAuth0 = () => {
    void loginWithRedirect({
      authorizationParams: {
        audience: process.env.NEXT_PUBLIC_AUTH0_AUDIENCE,
        screen_hint: 'login',
        ...(email ? { login_hint: email } : {}),
      },
    })
  }

  return (
    <motion.form
      onSubmit={handleSubmit}
      className="w-full space-y-5"
      initial="hidden"
      animate="visible"
      variants={staggerParent}
    >
      <motion.div
        className="overflow-hidden rounded-2xl border border-slate-100 bg-white p-6 shadow-lg shadow-slate-100/80"
        variants={staggerItem}
      >
        <div className="space-y-4">
          <label htmlFor="login-email" className="flex flex-col gap-2">
            <span className="ml-1 text-sm font-semibold text-slate-700">Correo electrónico</span>
            <div className="relative">
              <Mail className="absolute top-1/2 left-3 h-5 w-5 -translate-y-1/2 text-slate-400" />
              <Input
                id="login-email"
                type="email"
                placeholder="doctor@hospital.com"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value)
                  clearError()
                }}
                disabled={isLoading}
                className="h-14 rounded-xl border-slate-200 bg-slate-50 pl-10 text-base placeholder:text-slate-400 focus-ring"
              />
            </div>
          </label>

          <label htmlFor="login-password" className="flex flex-col gap-2">
            <span className="ml-1 text-sm font-semibold text-slate-700">Contraseña</span>
            <div className="relative">
              <Lock className="absolute top-1/2 left-3 h-5 w-5 -translate-y-1/2 text-slate-400" />
              <Input
                id="login-password"
                type={showPassword ? 'text' : 'password'}
                placeholder="••••••••"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value)
                  clearError()
                }}
                disabled={isLoading}
                className="h-14 rounded-xl border-slate-200 bg-slate-50 pl-10 pr-11 text-base placeholder:text-slate-400 focus-ring"
              />
              <button
                type="button"
                onClick={() => setShowPassword(prev => !prev)}
                disabled={isLoading}
                className="absolute top-1/2 right-3 -translate-y-1/2 text-slate-400 transition-colors hover:text-slate-600"
                aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
              >
                {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
              </button>
            </div>
          </label>
        </div>
      </motion.div>

      <AnimatePresence mode="wait">
        {error && (
          <motion.div
            key="login-error"
            className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.2 }}
          >
            {error}
          </motion.div>
        )}
      </AnimatePresence>

      <motion.div className="space-y-3" variants={staggerItem}>
        <Button
          type="submit"
          disabled={isLoading}
          className="w-full h-14 bg-linear-to-r from-aquamarine to-primary text-white rounded-xl font-bold text-lg shadow-lg shadow-aquamarine/20 hover:shadow-aquamarine/30 active:scale-[0.98] transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {legacyLoading
            ? (
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                <span>Verificando...</span>
              </div>
            )
            : (
              <span>Acceder al Panel</span>
            )}
        </Button>

        <div className="flex items-center gap-3">
          <div className="h-px flex-1 bg-slate-200" />
          <span className="text-xs text-slate-400">o</span>
          <div className="h-px flex-1 bg-slate-200" />
        </div>

        <Button
          type="button"
          onClick={handleAuth0}
          disabled={isLoading || auth0Disabled}
          variant="outline"
          className="w-full h-12 rounded-xl border-slate-200 bg-white font-semibold text-slate-700 hover:bg-slate-50 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {auth0Loading && !auth0Disabled
            ? (
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 border-2 border-slate-400 border-t-transparent rounded-full animate-spin" />
                <span>Cargando...</span>
              </div>
            )
            : (
              <span>Continuar con Auth0</span>
            )}
        </Button>
      </motion.div>
    </motion.form>
  )
}
