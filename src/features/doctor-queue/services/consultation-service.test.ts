import { consultationService } from './consultation-service'

const mockGet = jest.fn()
const mockPatch = jest.fn()
const mockPost = jest.fn()

jest.mock('@/api/api-client', () => ({
  apiClient: () => ({ get: mockGet, patch: mockPatch, post: mockPost }),
}))

describe('consultationService', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('getQueue', () => {
    it('returns queue items', async () => {
      const items = [{ id: '1', patientId: 'p1', triageSessionId: 't1', specialty: 'GENERAL', priority: 'HIGH', status: 'PENDING', createdAt: null }]
      mockGet.mockResolvedValue({ data: { items } })

      const result = await consultationService.getQueue()

      expect(mockGet).toHaveBeenCalledWith('consultations/queue')
      expect(result.items).toEqual(items)
    })
  })

  describe('getById', () => {
    it('returns consultation detail by id', async () => {
      const detail = { id: 'c1', patientId: 'p1', triageSessionId: 't1', specialty: 'GENERAL', priority: 'LOW', status: 'PENDING', createdAt: null, triage: null }
      mockGet.mockResolvedValue({ data: detail })

      const result = await consultationService.getById('c1')

      expect(mockGet).toHaveBeenCalledWith('consultations/c1')
      expect(result).toEqual(detail)
    })
  })

  describe('assign', () => {
    it('patches assign and returns result', async () => {
      const response = { id: 'c1', status: 'IN_ATTENTION', assignedDoctorId: 'd1', updatedAt: '2024-01-01' }
      mockPatch.mockResolvedValue({ data: response })

      const result = await consultationService.assign('c1')

      expect(mockPatch).toHaveBeenCalledWith('consultations/c1/assign')
      expect(result).toEqual(response)
    })
  })

  describe('generateSummary', () => {
    it('posts generate summary and returns result', async () => {
      const response = { consultationId: 'c1', summary: 'Patient has fever', generatedAt: '2024-01-01' }
      mockPost.mockResolvedValue({ data: response })

      const result = await consultationService.generateSummary('c1')

      expect(mockPost).toHaveBeenCalledWith('consultations/c1/summary/generate')
      expect(result).toEqual(response)
    })
  })

  describe('close', () => {
    it('patches close and returns result', async () => {
      const response = { id: 'c1', status: 'CLOSED', closedAt: '2024-01-01' }
      mockPatch.mockResolvedValue({ data: response })

      const result = await consultationService.close('c1')

      expect(mockPatch).toHaveBeenCalledWith('consultations/c1/close', {
        baselineSymptomSeverity: 5,
        redFlagsConfirmed: false,
      })
      expect(result).toEqual(response)
    })
  })

  describe('getMessages', () => {
    it('returns messages with default limit', async () => {
      const response = { items: [], total: 0 }
      mockGet.mockResolvedValue({ data: response })

      await consultationService.getMessages('c1')

      expect(mockGet).toHaveBeenCalledWith('consultations/c1/messages', { params: { limit: 50 } })
    })

    it('respects custom limit', async () => {
      mockGet.mockResolvedValue({ data: { items: [], total: 0 } })

      await consultationService.getMessages('c1', 10)

      expect(mockGet).toHaveBeenCalledWith('consultations/c1/messages', { params: { limit: 10 } })
    })
  })

  describe('getMyHistory', () => {
    it('uses default pagination when no options provided', async () => {
      mockGet.mockResolvedValue({ data: { items: [], total: 0, page: 1, limit: 20 } })

      await consultationService.getMyHistory()

      expect(mockGet).toHaveBeenCalledWith('consultations/doctor/my-history', {
        params: { page: 1, limit: 20, status: undefined },
      })
    })

    it('passes custom pagination and status filter', async () => {
      mockGet.mockResolvedValue({ data: { items: [], total: 0, page: 2, limit: 5 } })

      await consultationService.getMyHistory({ page: 2, limit: 5, status: 'CLOSED' })

      expect(mockGet).toHaveBeenCalledWith('consultations/doctor/my-history', {
        params: { page: 2, limit: 5, status: 'CLOSED' },
      })
    })
  })
})
