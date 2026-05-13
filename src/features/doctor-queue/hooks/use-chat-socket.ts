'use client'

import type { Socket } from 'socket.io-client'
import type { ChatMessage } from '@/features/doctor-queue/services/consultation-service'
import { useCallback, useEffect, useRef, useState } from 'react'
import toast from 'react-hot-toast'
import { io } from 'socket.io-client'
import { consultationService } from '@/features/doctor-queue/services/consultation-service'
import { clientLogger } from '@/lib/client-logger'
import { authService } from '@/services/auth-service'
import envConfig from '@/utils/config/envConfig'

const WS_BASE_URL = envConfig.socketBaseUrl

type ConnectionStatus = 'connecting' | 'connected' | 'disconnected' | 'reconnecting'
type ChatAck
  = | { ok: true, message: ChatMessage }
    | { ok: false, code: string, message: string }

function createClientMessageId() {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID()
  }
  return `${Date.now()}-${Math.random().toString(36).slice(2)}`
}

export function useChatSocket(consultationId: string | null, currentUserId: string | null) {
  const socketRef = useRef<Socket | null>(null)
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [status, setStatus] = useState<ConnectionStatus>('disconnected')

  const mergeMessages = useCallback((incoming: ChatMessage[]) => {
    setMessages((current) => {
      const knownIds = new Set(current.map(message => message.id))
      const knownClientIds = new Set(current.map(message => message.clientMessageId).filter(Boolean))
      const next = [...current]
      for (const message of incoming) {
        if (message.clientMessageId && knownClientIds.has(message.clientMessageId)) {
          const index = next.findIndex(currentMessage => currentMessage.clientMessageId === message.clientMessageId)
          if (index >= 0) {
            next[index] = { ...message, deliveryStatus: 'sent' }
          }
          continue
        }
        if (!knownIds.has(message.id)) {
          knownIds.add(message.id)
          if (message.clientMessageId)
            knownClientIds.add(message.clientMessageId)
          next.push({ ...message, deliveryStatus: message.deliveryStatus ?? 'sent' })
        }
      }
      next.sort((left, right) => {
        const leftAt = new Date(left.createdAt ?? 0).getTime()
        const rightAt = new Date(right.createdAt ?? 0).getTime()
        return leftAt - rightAt
      })
      return next
    })
  }, [])

  useEffect(() => {
    if (!consultationId)
      return

    let mounted = true
    const currentConsultationId = consultationId
    queueMicrotask(() => {
      if (mounted)
        setMessages([])
    })

    async function connect() {
      const token = await authService.getAccessToken()
      if (!token || !mounted)
        return

      try {
        const history = await consultationService.getMessages(currentConsultationId)
        if (mounted) {
          mergeMessages(history.items)
        }
      }
      catch {
        if (mounted) {
          toast.error('No se pudo cargar el historial del chat')
        }
      }

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

      socket.io.on('reconnect_attempt', () => {
        if (mounted)
          setStatus('reconnecting')
      })

      socket.io.on('reconnect', () => {
        if (mounted)
          setStatus('connected')
        socket.emit('chat:join', { consultationId })
      })

      socket.on('chat:history', ({ messages: history }: { messages: ChatMessage[] }) => {
        if (!mounted)
          return
        mergeMessages(history)
      })

      socket.on('chat:message', (msg: ChatMessage) => {
        if (!mounted)
          return
        mergeMessages([msg])
      })

      socket.on('disconnect', () => {
        if (!mounted)
          return
        setStatus('disconnected')
      })

      socket.on('chat:error', (err: { code: string, message: string }) => {
        void clientLogger.warn('Chat socket error', {
          component: 'useChatSocket',
          metadata: { code: err.code },
        })
        if (mounted) {
          toast.error(err.message || 'Error en el chat clínico')
        }
      })
    }

    void connect()

    return () => {
      mounted = false
      socketRef.current?.disconnect()
      socketRef.current = null
      queueMicrotask(() => {
        setMessages([])
      })
      setStatus('disconnected')
    }
  }, [consultationId, mergeMessages])

  const sendMessage = useCallback(
    (content: string, retryClientMessageId?: string) => {
      if (!socketRef.current || !consultationId)
        return

      const clientMessageId = retryClientMessageId ?? createClientMessageId()
      const optimisticMessage: ChatMessage = {
        id: clientMessageId,
        clientMessageId,
        consultationId,
        senderId: currentUserId ?? 'current-user',
        senderRole: 'DOCTOR',
        content,
        type: 'TEXT',
        createdAt: new Date().toISOString(),
        deliveryStatus: 'sending',
      }

      setMessages((current) => {
        if (current.some(message => message.clientMessageId === clientMessageId)) {
          return current.map(message =>
            message.clientMessageId === clientMessageId
              ? { ...message, deliveryStatus: 'sending' }
              : message)
        }
        return [...current, optimisticMessage]
      })

      socketRef.current.emit(
        'chat:send',
        { consultationId, content, clientMessageId },
        (ack: ChatAck | undefined) => {
          if (!ack || !ack.ok) {
            setMessages(current =>
              current.map(message =>
                message.clientMessageId === clientMessageId
                  ? { ...message, deliveryStatus: 'failed' }
                  : message))
            toast.error(ack?.message ?? 'No se pudo enviar el mensaje')
            return
          }

          mergeMessages([ack.message])
        },
      )
    },
    [
      consultationId,
      currentUserId,
      mergeMessages,
    ],
  )

  return { messages, status, sendMessage }
}
