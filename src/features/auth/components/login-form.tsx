'use client'

import { useAuth0 } from '@auth0/auth0-react'
import { motion } from 'motion/react'
import { staggerItem, staggerParent } from '@/components/animations/motion-presets'
import { Button } from '@/components/ui/button'

export default function LoginForm() {
  const { loginWithRedirect, isLoading } = useAuth0()

  const handleLogin = () => {
    void loginWithRedirect({
      authorizationParams: {
        screen_hint: 'login',
      },
    })
  }

  return (
    <motion.div
      className="w-full space-y-5"
      initial="hidden"
      animate="visible"
      variants={staggerParent}
    >
      <motion.div variants={staggerItem}>
        <p className="text-sm text-slate-500 mb-4">
          Serás redirigido al portal de autenticación seguro para ingresar tus credenciales.
        </p>
        <Button
          type="button"
          disabled={isLoading}
          onClick={handleLogin}
          className="w-full h-14 bg-linear-to-r from-aquamarine to-primary text-white rounded-xl font-bold text-lg shadow-lg shadow-aquamarine/20 hover:shadow-aquamarine/30 active:scale-[0.98] transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isLoading
            ? (
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                <span>Cargando...</span>
              </div>
            )
            : (
              <span>Acceder al Panel</span>
            )}
        </Button>
      </motion.div>
    </motion.div>
  )
}
