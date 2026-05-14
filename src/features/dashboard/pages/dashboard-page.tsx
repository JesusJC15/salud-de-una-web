'use client'

import type { AppRole } from '@/utils/auth-claims'
import { useAuth0 } from '@auth0/auth0-react'
import { motion } from 'motion/react'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { authService } from '@/services/auth-service'

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

function PatientWebFallback({ onLogout }: { onLogout: () => void }) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-[#f5fbfb] p-6">
      <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-teal-50">
        <svg className="h-7 w-7 text-teal-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
        </svg>
      </div>
      <p className="max-w-xs text-center text-sm font-semibold text-slate-700">
        SaludDeUna Web es exclusiva para médicos y administradores.
      </p>
      <p className="max-w-xs text-center text-xs text-slate-400">
        Descargá la app móvil SaludDeUna para acceder a tus consultas como paciente.
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

function UnknownRoleFallback({ onLogout }: { onLogout: () => void }) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-[#f5fbfb] p-6">
      <p className="text-center text-sm text-slate-500">
        Tu cuenta no tiene acceso a esta plataforma.
        <br />
        Contactá al administrador para activar tu acceso.
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
  const { isLoading: auth0Loading } = useAuth0()
  const router = useRouter()
  const [role, setRole] = useState<Role>(null)
  const [roleLoading, setRoleLoading] = useState(true)

  useEffect(() => {
    if (auth0Loading)
      return

    async function detectRole() {
      try {
        const user = await authService.getCurrentUser()
        if (!user) {
          setRoleLoading(false)
          return
        }

        setRole(user.role as Role)
      }
      catch {
        setRole(null)
      }
      finally {
        setRoleLoading(false)
      }
    }

    void detectRole()
  }, [auth0Loading])

  useEffect(() => {
    if (auth0Loading || roleLoading)
      return

    if (role === 'ADMIN') {
      router.replace('/admin')
      return
    }

    if (role === 'DOCTOR') {
      router.replace('/doctor')
    }
  }, [
    auth0Loading,
    roleLoading,
    role,
    router,
  ])

  if (auth0Loading || roleLoading)
    return <LoadingScreen />

  if (role === 'DOCTOR' || role === 'ADMIN')
    return <LoadingScreen />

  if (role === 'PATIENT')
    return <PatientWebFallback onLogout={() => void authService.logout()} />

  return (
    <UnknownRoleFallback
      onLogout={() => void authService.logout()}
    />
  )
}
