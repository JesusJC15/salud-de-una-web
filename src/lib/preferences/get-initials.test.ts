import { getInitials } from '@/lib/preferences/get-initials'

describe('getInitials', () => {
  it('returns the first letter of the first two words', () => {
    expect(getInitials('Ana Maria')).toBe('AM')
  })

  it('ignores extra whitespace and uppercases the result', () => {
    expect(getInitials('  juan   perez  ')).toBe('JP')
  })

  it('returns a single initial for one-word names', () => {
    expect(getInitials('salud')).toBe('S')
  })
})
