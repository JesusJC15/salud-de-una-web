import { CONSULTATION_STATUS_LABELS, translateConsultationStatus } from './consultation-status-labels'

describe('consultation status labels', () => {
  it('translates PENDING to español', () => {
    expect(translateConsultationStatus('PENDING')).toBe('Pendiente')
  })

  it('translates IN_ATTENTION to español', () => {
    expect(translateConsultationStatus('IN_ATTENTION')).toBe('En atención')
  })

  it('translates CLOSED to español', () => {
    expect(translateConsultationStatus('CLOSED')).toBe('Cerrada')
  })

  it('returns the raw value for unknown statuses', () => {
    expect(translateConsultationStatus('UNKNOWN_STATUS')).toBe('UNKNOWN_STATUS')
    expect(translateConsultationStatus('')).toBe('')
  })

  it('the CONSULTATION_STATUS_LABELS map covers all known statuses', () => {
    expect(CONSULTATION_STATUS_LABELS).toMatchObject({
      PENDING: 'Pendiente',
      IN_ATTENTION: 'En atención',
      CLOSED: 'Cerrada',
    })
  })
})
