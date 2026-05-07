import { cn, trimLeadingSlashes, trimTrailingSlashes } from '@/lib/utils'

describe('cn', () => {
  it('merges conditional class names', () => {
    expect(cn('px-2', false && 'hidden', 'py-4', undefined)).toBe('px-2 py-4')
  })

  it('resolves conflicting tailwind classes keeping the latest one', () => {
    expect(cn('px-2', 'px-4', 'text-sm', 'text-lg')).toBe('px-4 text-lg')
  })
})

describe('trimTrailingSlashes', () => {
  it('removes single trailing slash', () => {
    expect(trimTrailingSlashes('https://api.example.com/')).toBe('https://api.example.com')
  })

  it('removes multiple trailing slashes', () => {
    expect(trimTrailingSlashes('https://api.example.com///')).toBe('https://api.example.com')
  })

  it('returns unchanged string with no trailing slashes', () => {
    expect(trimTrailingSlashes('https://api.example.com')).toBe('https://api.example.com')
  })

  it('returns empty string unchanged', () => {
    expect(trimTrailingSlashes('')).toBe('')
  })

  it('handles string consisting entirely of slashes', () => {
    expect(trimTrailingSlashes('///')).toBe('')
  })
})

describe('trimLeadingSlashes', () => {
  it('removes single leading slash', () => {
    expect(trimLeadingSlashes('/v1/auth')).toBe('v1/auth')
  })

  it('removes multiple leading slashes', () => {
    expect(trimLeadingSlashes('///v1/auth')).toBe('v1/auth')
  })

  it('returns unchanged string with no leading slashes', () => {
    expect(trimLeadingSlashes('v1/auth')).toBe('v1/auth')
  })

  it('returns empty string unchanged', () => {
    expect(trimLeadingSlashes('')).toBe('')
  })
})
