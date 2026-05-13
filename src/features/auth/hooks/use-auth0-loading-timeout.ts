'use client'

import { useEffect, useState } from 'react'

export function useAuth0LoadingTimeout(isLoading: boolean, timeoutMs = 2500): boolean {
  const [timedOut, setTimedOut] = useState(false)

  useEffect(() => {
    if (!isLoading) {
      queueMicrotask(() => setTimedOut(false))
      return
    }

    const timeout = window.setTimeout(() => {
      setTimedOut(true)
    }, timeoutMs)

    return () => window.clearTimeout(timeout)
  }, [isLoading, timeoutMs])

  return timedOut
}
