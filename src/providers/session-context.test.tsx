/**
 * @jest-environment jsdom
 */
import type { AuthMeUser } from '@/types/auth'
import { renderHook } from '@testing-library/react'
import * as React from 'react'
import { UserRole } from '@/types/enums/user-role'
import { SessionContext, useSession } from './session-context'

const mockUser: AuthMeUser = {
  id: 'user-1',
  email: 'doctor@test.com',
  role: UserRole.DOCTOR,
  isActive: true,
}

describe('useSession', () => {
  it('returns null when no SessionContext is present', () => {
    const { result } = renderHook(() => useSession())
    expect(result.current).toBeNull()
  })

  it('returns the user provided by SessionContext', () => {
    const wrapper = ({ children }: { children: React.ReactNode }) =>
      React.createElement(SessionContext, { value: mockUser }, children)

    const { result } = renderHook(() => useSession(), { wrapper })
    expect(result.current).toEqual(mockUser)
  })

  it('returns null when provider value is null', () => {
    const wrapper = ({ children }: { children: React.ReactNode }) =>
      React.createElement(SessionContext, { value: null }, children)

    const { result } = renderHook(() => useSession(), { wrapper })
    expect(result.current).toBeNull()
  })

  it('reflects updated user when context value changes', () => {
    let value: AuthMeUser | null = mockUser

    const wrapper = ({ children }: { children: React.ReactNode }) =>
      React.createElement(SessionContext, { value }, children)

    const { result, rerender } = renderHook(() => useSession(), { wrapper })
    expect(result.current?.role).toBe(UserRole.DOCTOR)

    value = { ...mockUser, role: UserRole.ADMIN }
    rerender()
    expect(result.current?.role).toBe(UserRole.ADMIN)
  })
})
