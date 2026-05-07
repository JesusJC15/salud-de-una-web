'use client'

import type { Socket } from 'socket.io-client'
import type { ChatMessage } from '@/features/doctor-queue/services/consultation-service'
import { useCallback, useEffect, useRef, useState } from 'react'
import { io } from 'socket.io-client'
import { trimTrailingSlashes } from '@/lib/utils'
import { authService } from '@/services/auth-service'

const WS_BASE_URL = trimTrailingSlashes(
  (process.env.NEXT_PUBLIC_API_BASE_URL ?? 'http://localhost:3000').replace(/\/v1$/, ''),
)

type ConnectionStatus = 'connecting' | 'connected' | 'disconnected'

export function useChatSocket(consultationId: string | null) {
  const socketRef = useRef<Socket | null>(null)
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [status, setStatus] = useState<ConnectionStatus>('disconnected')

  useEffect(() => {
    if (!consultationId)
      return

    let mounted = true

    async function connect() {
      const token = await authService.getAccessToken()
      if (!token || !mounted)
        return

      setStatus('connecting')

      const socket = io(`${WS_BASE_URL}/chat`, {
        auth: { token },
        transports: ['websocket', 'polling'],
        reconnection: true,
        reconnectionDelay: 1000,
        reconnectionAttempts: 5,
      })

      socketRef.current = socket

      socket.on('connect', () => {
        if (!mounted)
          return
        setStatus('connected')
        socket.emit('chat:join', { consultationId })
      })

      socket.on('chat:history', ({ messages: history }: { messages: ChatMessage[] }) => {
        if (!mounted)
          return
        setMessages(history)
      })

      socket.on('chat:message', (msg: ChatMessage) => {
        if (!mounted)
          return
        setMessages(prev => [...prev, msg])
      })

      socket.on('disconnect', () => {
        if (!mounted)
          return
        setStatus('disconnected')
      })

      socket.on('chat:error', (err: { code: string, message: string }) => {
        console.warn('[chat socket error]', err)
      })
    }

    void connect()

    return () => {
      mounted = false
      socketRef.current?.disconnect()
      socketRef.current = null
      setMessages([])
      setStatus('disconnected')
    }
  }, [consultationId])

  const sendMessage = useCallback(
    (content: string) => {
      if (!socketRef.current || !consultationId)
        return
      socketRef.current.emit('chat:send', { consultationId, content })
    },
    [consultationId],
  )

  return { messages, status, sendMessage }
}
