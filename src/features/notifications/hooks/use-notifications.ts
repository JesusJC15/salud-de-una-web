'use client'

import type { Socket } from 'socket.io-client'
import type { NotificationListItem, NotificationsResponseDto } from '@/types/notification'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useEffect, useRef, useState } from 'react'
import { io } from 'socket.io-client'
import { apiClient } from '@/api/api-client'
import { authService } from '@/services/auth-service'
import envConfig from '@/utils/config/envConfig'

const WS_BASE_URL = envConfig.socketBaseUrl

export function useNotifications() {
  const queryClient = useQueryClient()
  const socketRef = useRef<Socket | null>(null)
  const [connectionStatus, setConnectionStatus] = useState<'connecting' | 'connected' | 'disconnected'>('disconnected')

  const query = useQuery<NotificationsResponseDto>({
    queryKey: ['notifications'],
    queryFn: async () => {
      const res = await apiClient('').get<NotificationsResponseDto>(
        'notifications/me',
        { params: { limit: 20 } },
      )
      return res.data
    },
    staleTime: 5 * 60_000,
  })

  useEffect(() => {
    let mounted = true

    async function connect() {
      const token = await authService.getAccessToken()
      if (!token || !mounted)
        return

      const socket = io(`${WS_BASE_URL}/notifications`, {
        auth: { token },
        transports: ['websocket', 'polling'],
        reconnection: true,
        reconnectionDelay: 1000,
        reconnectionAttempts: 5,
      })

      socketRef.current = socket

      setConnectionStatus('connecting')

      socket.on('connect', () => {
        if (!mounted)
          return
        setConnectionStatus('connected')
        void queryClient.invalidateQueries({ queryKey: ['notifications'] })
      })

      socket.on('disconnect', () => {
        if (mounted)
          setConnectionStatus('disconnected')
      })

      socket.on('notification:new', (notification: NotificationListItem) => {
        if (!mounted)
          return
        queryClient.setQueryData<NotificationsResponseDto>(['notifications'], (old) => {
          if (!old)
            return old
          if (old.items.some(existing => existing.id === notification.id)) {
            return {
              ...old,
              items: old.items.map(existing => existing.id === notification.id ? notification : existing),
            }
          }
          return {
            items: [notification, ...old.items].slice(0, 20),
            unreadCount: old.unreadCount + 1,
          }
        })
      })
    }

    void connect()

    return () => {
      mounted = false
      socketRef.current?.disconnect()
      socketRef.current = null
      setConnectionStatus('disconnected')
    }
  }, [queryClient])

  const markReadMutation = useMutation({
    mutationFn: (notificationId: string) =>
      apiClient('').patch(`notifications/${notificationId}/read`),
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: ['notifications'] }),
  })

  const markAllReadMutation = useMutation({
    mutationFn: () =>
      apiClient('').patch('notifications/me/read-all'),
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: ['notifications'] }),
  })

  return {
    data: query.data,
    isLoading: query.isLoading,
    isError: query.isError,
    connectionStatus,
    markRead: markReadMutation.mutate,
    markAllRead: markAllReadMutation.mutate,
    isMarkingAll: markAllReadMutation.isPending,
  }
}
