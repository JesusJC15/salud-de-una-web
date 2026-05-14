import type { Metadata } from 'next'
import { LoginPage as LoginFeaturePage } from '@/features/auth/pages/login-page'

export const metadata: Metadata = {
  title: 'Iniciar sesión — SaludDeUna',
}

export default function LoginPage() {
  return <LoginFeaturePage />
}
