/**
 * @jest-environment jsdom
 */
import type { AuthMeUser } from '@/types/auth'
import { render, screen } from '@testing-library/react'
import * as React from 'react'
import { SessionContext } from '@/providers/session-context'
import { UserRole } from '@/types/enums/user-role'
import { RoleRedirectGuard } from './role-redirect-guard'

const mockReplace = jest.fn()

jest.mock('next/navigation', () => ({
  useRouter: () => ({ replace: mockReplace }),
}))

jest.mock('@/components/loading-state', () => ({
  LoadingState: ({ label }: { label: string }) =>
    React.createElement('div', { 'data-testid': 'loading-state' }, label),
}))

function renderWithSession(user: AuthMeUser | null, allowedRoles: string[]) {
  const children = React.createElement('div', { 'data-testid': 'protected-content' }, 'Protected')
  return render(
    React.createElement(
      SessionContext,
      { value: user },
      React.createElement(RoleRedirectGuard, { allowedRoles, children }),
    ),
  )
}

describe('roleRedirectGuard', () => {
  beforeEach(() => jest.clearAllMocks())

  it('renders LoadingState when user is null', () => {
    renderWithSession(null, ['DOCTOR'])
    expect(screen.getByTestId('loading-state')).toBeTruthy()
    expect(screen.queryByTestId('protected-content')).toBeNull()
  })

  it('renders children when user role is in allowedRoles', () => {
    const user: AuthMeUser = { id: '1', email: 'doc@test.com', role: UserRole.DOCTOR, isActive: true }
    renderWithSession(user, ['DOCTOR'])
    expect(screen.getByTestId('protected-content')).toBeTruthy()
    expect(mockReplace).not.toHaveBeenCalled()
  })

  it('redirects to /dashboard when user role is not in allowedRoles', () => {
    const user: AuthMeUser = { id: '1', email: 'admin@test.com', role: UserRole.ADMIN, isActive: true }
    renderWithSession(user, ['DOCTOR'])
    expect(mockReplace).toHaveBeenCalledWith('/dashboard')
    expect(screen.queryByTestId('protected-content')).toBeNull()
  })

  it('renders children when user has ADMIN role and allowedRoles includes ADMIN', () => {
    const user: AuthMeUser = { id: '2', email: 'admin@test.com', role: UserRole.ADMIN, isActive: true }
    renderWithSession(user, ['ADMIN'])
    expect(screen.getByTestId('protected-content')).toBeTruthy()
    expect(mockReplace).not.toHaveBeenCalled()
  })

  it('accepts multiple allowedRoles', () => {
    const user: AuthMeUser = { id: '3', email: 'doc@test.com', role: UserRole.DOCTOR, isActive: true }
    renderWithSession(user, ['ADMIN', 'DOCTOR'])
    expect(screen.getByTestId('protected-content')).toBeTruthy()
  })
})
