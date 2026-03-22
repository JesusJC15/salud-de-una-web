import toast from 'react-hot-toast'
import { showErrorToast } from '@/lib/preferences/show-error-toast'

jest.mock('react-hot-toast', () => ({
  __esModule: true,
  default: {
    error: jest.fn(),
  },
}))

describe('showErrorToast', () => {
  const errorMock = jest.mocked(toast.error)

  beforeEach(() => {
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
})
