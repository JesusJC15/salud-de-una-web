import { doctorService } from './doctor-service'

const mockGet = jest.fn()
const mockPatch = jest.fn()

jest.mock('@/api/api-client', () => ({
  apiClient: () => ({ get: mockGet, patch: mockPatch }),
}))

describe('doctorService', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('getMe', () => {
    it('returns the doctor profile', async () => {
      const profile = { id: '1', firstName: 'Ana', lastName: 'Gómez', email: 'ana@example.com', specialty: 'GENERAL', doctorStatus: 'APPROVED', availabilityStatus: 'AVAILABLE' }
      mockGet.mockResolvedValue({ data: profile })

      const result = await doctorService.getMe()

      expect(mockGet).toHaveBeenCalledWith('doctors/me')
      expect(result).toEqual(profile)
    })
  })

  describe('updateAvailability', () => {
    it('patches availability and returns updated status', async () => {
      mockPatch.mockResolvedValue({ data: { availabilityStatus: 'PAUSED' } })

      const result = await doctorService.updateAvailability('PAUSED')

      expect(mockPatch).toHaveBeenCalledWith('doctors/me/availability', { status: 'PAUSED' })
      expect(result.availabilityStatus).toBe('PAUSED')
    })
  })
})
