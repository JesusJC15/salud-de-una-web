const useEffectMock = jest.fn()
const useStateMock = jest.fn()

jest.mock('react', () => ({
  useEffect: useEffectMock,
  useState: useStateMock,
}))

describe('useDebounce', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('returns the current debounced value and schedules an update', async () => {
    const setDebounced = jest.fn()
    useStateMock.mockReturnValue(['initial-value', setDebounced])

    const setTimeoutSpy = jest.spyOn(globalThis, 'setTimeout')
      .mockReturnValue(123 as unknown as ReturnType<typeof setTimeout>)
    const clearTimeoutSpy = jest.spyOn(globalThis, 'clearTimeout').mockImplementation(() => {})

    const { useDebounce } = await import('@/hooks/use-debounce')
    const value = useDebounce('next-value', 250)

    expect(value).toBe('initial-value')
    expect(useStateMock).toHaveBeenCalledWith('next-value')
    expect(useEffectMock).toHaveBeenCalledTimes(1)

    const effect = useEffectMock.mock.calls[0][0] as () => () => void
    const cleanup = effect()

    expect(setTimeoutSpy).toHaveBeenCalledWith(setDebounced, 250, 'next-value')

    cleanup()

    expect(clearTimeoutSpy).toHaveBeenCalledWith(123)

    setTimeoutSpy.mockRestore()
    clearTimeoutSpy.mockRestore()
  })

  it('tracks updated dependencies on subsequent invocations', async () => {
    useStateMock.mockReturnValue(['debounced', jest.fn()])

    const { useDebounce } = await import('@/hooks/use-debounce')
    useDebounce('value-a', 100)
    useDebounce('value-b', 400)

    expect(useEffectMock).toHaveBeenNthCalledWith(1, expect.any(Function), ['value-a', 100])
    expect(useEffectMock).toHaveBeenNthCalledWith(2, expect.any(Function), ['value-b', 400])
  })
})
