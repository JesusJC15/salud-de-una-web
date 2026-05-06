'use client'

import type { AppRole } from '@/utils/auth-claims'
import { useAuth0 } from '@auth0/auth0-react'
import { decodeJwt } from 'jose'
import { motion } from 'motion/react'
import { useEffect, useState } from 'react'
import { AdminHomePage } from '@/features/admin-home/pages/admin-home-page'
import { DoctorHomePage } from '@/features/doctor-home/pages/doctor-home-page'
import { authService } from '@/services/auth-service'
import { extractRole } from '@/utils/auth-claims'

type Role = AppRole | null

function LoadingScreen() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-[#f5fbfb]">
      <motion.div
        className="flex flex-col items-center gap-4"
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <motion.div
          className="h-10 w-10 rounded-full border-4 border-teal-100 border-t-teal-500"
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
        />
        <p className="text-sm font-medium text-slate-400">Cargando tu espacio...</p>
      </motion.div>
    </div>
  )
}

function UnknownRoleFallback({ onLogout }: { onLogout: () => void }) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-[#f5fbfb] p-6">
      <p className="text-center text-sm text-slate-500">
        Tu cuenta aún no tiene un rol asignado en SaludDeUna.
        <br />
        Contacta al administrador para activar tu acceso.
      </p>
      <button
        onClick={onLogout}
        className="rounded-xl bg-slate-100 px-4 py-2 text-sm font-bold text-slate-700 hover:bg-slate-200"
      >
        Cerrar sesión
      </button>
    </div>
  )
}

export function DashboardPage() {
  const { isLoading: auth0Loading, getAccessTokenSilently } = useAuth0()
  const [role, setRole] = useState<Role>(null)
  const [roleLoading, setRoleLoading] = useState(true)

  useEffect(() => {
    if (auth0Loading)
      return

    async function detectRole() {
      try {
        const token
          = (await authService.getAccessToken())
            ?? (await getAccessTokenSilently())

        if (!token) {
          setRoleLoading(false)
          return
        }

        const claims = decodeJwt(token) as Record<string, unknown>
        setRole(extractRole(claims))
      }
      catch {
        setRole(null)
      }
      finally {
        setRoleLoading(false)
      }
    }

    void detectRole()
  }, [auth0Loading, getAccessTokenSilently])

  if (auth0Loading || roleLoading)
    return <LoadingScreen />

  if (role === 'DOCTOR')
    return <DoctorHomePage />
  if (role === 'ADMIN')
    return <AdminHomePage />

  return (
    <UnknownRoleFallback
      onLogout={() => void authService.logout()}
    />
  )
}
