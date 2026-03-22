'use client'

import type { DoctorReviewItem, RethusVerificationAction } from '@/types'
import toast from 'react-hot-toast'
import { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { AdminHeader } from '@/components/admin-header'
import { showErrorToast } from '@/lib/preferences/show-error-toast'
import { authService } from '@/services/auth-service'
import { AdminDashboardLayout } from '@/features/admin-dashboard/layouts/admin-dashboard-layout'
import { DoctorVerificationTable } from '../components/doctor-verification-table'
import { VerificationModal } from '../components/verification-modal'
import { useDoctorVerification } from '../hooks/use-doctor-verification'

interface SelectedDoctorAction {
  action: RethusVerificationAction
  doctor: DoctorReviewItem
}

function formatSubtitleDate(now: Date) {
  const dateText = new Intl.DateTimeFormat('es-CO', {
    weekday: 'long',
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  }).format(now)

  const timeText = new Intl.DateTimeFormat('es-CO', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  }).format(now)

  const normalizedDate = dateText.charAt(0).toUpperCase() + dateText.slice(1)

  return `${normalizedDate} | ${timeText}`
}

export function AdminDoctorVerificationPage() {
  const router = useRouter()
  const [isRoleChecked, setIsRoleChecked] = useState(false)
  const [selectedAction, setSelectedAction] = useState<SelectedDoctorAction | null>(null)

  const {
    doctors,
    error,
    isLoading,
    verifyDoctor,
  } = useDoctorVerification({ enabled: isRoleChecked })

  useEffect(() => {
    const validateRole = async () => {
      try {
        if (!authService.isAuthenticated()) {
          router.push('/login')
          return
        }

        const userData = await authService.getMe()
        if (userData.user.role !== 'ADMIN') {
          router.push('/403')
          return
        }

        setIsRoleChecked(true)
      }
      catch (roleError) {
        showErrorToast(roleError, { message: 'No fue posible validar la sesion' })
        router.push('/login')
      }
    }

    validateRole()
  }, [router])

  useEffect(() => {
    if (error) {
      showErrorToast(error, { message: 'No fue posible cargar el listado de medicos pendientes' })
    }
  }, [error])

  const subtitle = useMemo(() => formatSubtitleDate(new Date()), [])

  const selectedDoctorName = selectedAction
    ? `${selectedAction.doctor.firstName} ${selectedAction.doctor.lastName}`.trim()
    : ''

  const handleOpenAction = (doctorId: string, action: RethusVerificationAction) => {
    const doctor = doctors.find(item => item.id === doctorId)
    if (!doctor) {
      return
    }

    setSelectedAction({
      action,
      doctor,
    })
  }

  const handleCloseModal = () => {
    setSelectedAction(null)
  }

  const handleConfirm = async ({ notes, evidenceUrl }: { notes: string, evidenceUrl?: string }) => {
    if (!selectedAction) {
      return
    }

    await verifyDoctor(selectedAction.doctor.id, {
      action: selectedAction.action,
      notes,
      evidenceUrl,
    })

    toast.success(
      selectedAction.action === 'APPROVE'
        ? 'Medico verificado correctamente.'
        : 'Medico rechazado correctamente.',
    )
  }

  const handleLogout = async () => {
    await authService.logout()
    router.push('/login')
  }

  if (!isRoleChecked) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-sm font-medium text-slate-600 dark:text-slate-300">Cargando validacion de permisos...</p>
      </div>
    )
  }

  return (
    <AdminDashboardLayout onLogout={handleLogout} activeItem="doctors">
      <div className="mx-auto max-w-7xl space-y-6">
        <AdminHeader
          title="Verificacion REThUS"
          subtitle={subtitle}
          userName={authService.getCurrentUser()?.email ?? 'Admin'}
          userRole="Super Administrador"
        />

        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100">Medicos con estado PENDING</h2>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            Aprueba o rechaza perfiles para habilitar su flujo clinico.
          </p>
        </section>

        <DoctorVerificationTable
          doctors={doctors}
          isLoading={isLoading}
          onVerify={id => handleOpenAction(id, 'APPROVE')}
          onReject={id => handleOpenAction(id, 'REJECT')}
        />
      </div>

      <VerificationModal
        isOpen={Boolean(selectedAction)}
        action={selectedAction?.action ?? 'APPROVE'}
        doctorName={selectedDoctorName}
        onClose={handleCloseModal}
        onConfirm={handleConfirm}
      />
    </AdminDashboardLayout>
  )
}
