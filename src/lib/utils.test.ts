import { cn } from '@/lib/utils'

describe('cn', () => {
  it('merges conditional class names', () => {
    expect(cn('px-2', false && 'hidden', 'py-4', undefined)).toBe('px-2 py-4')
  })

  it('resolves conflicting tailwind classes keeping the latest one', () => {
    expect(cn('px-2', 'px-4', 'text-sm', 'text-lg')).toBe('px-4 text-lg')
  })
})
