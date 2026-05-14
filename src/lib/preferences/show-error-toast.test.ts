import toast from 'react-hot-toast'
import { ApiClientError } from '@/api/api-client'
import { showErrorToast } from '@/lib/preferences/show-error-toast'

jest.mock('react-hot-toast', () => ({
  __esModule: true,
  default: Object.assign(
    jest.fn(),
    { error: jest.fn() },
  ),
}))

const toastFn = jest.mocked(toast)
const errorMock = jest.mocked(toast.error)

describe('showErrorToast', () => {
  beforeEach(() => {
    toastFn.mockReset()
    errorMock.mockReset()
  })

  it('shows the original error message when an Error is provided', () => {
    showErrorToast(new Error('Fallo de red'))
    expect(errorMock).toHaveBeenCalledWith('Fallo de red')
  })

  it('prefers the custom message when provided', () => {
    showErrorToast(new Error('Mensaje original'), { message: 'Mensaje visible' })
    expect(errorMock).toHaveBeenCalledWith('Mensaje visible')
  })

  it('converts unknown values to string messages', () => {
    showErrorToast('Error plano')
    expect(errorMock).toHaveBeenCalledWith('Error plano')
  })

  it('shows a rate-limit toast (not error) for 429 ApiClientError', () => {
    const rateLimitError = new ApiClientError('Demasiadas solicitudes. Intentá de nuevo en 30s', {
      status: 429,
    })
    showErrorToast(rateLimitError)
    expect(toastFn).toHaveBeenCalledWith(
      'Demasiadas solicitudes. Intentá de nuevo en 30s',
      expect.objectContaining({ icon: '⏳', duration: 8_000 }),
    )
    expect(errorMock).not.toHaveBeenCalled()
  })

  it('shows a regular error toast for non-429 ApiClientError', () => {
    const serverError = new ApiClientError('Error del servidor', { status: 500 })
    showErrorToast(serverError)
    expect(errorMock).toHaveBeenCalledWith('Error del servidor')
    expect(toastFn).not.toHaveBeenCalled()
  })
})
