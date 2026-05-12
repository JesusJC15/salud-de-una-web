'use client'

import type { Socket } from 'socket.io-client'
import type { NotificationListItem, NotificationsResponseDto } from '@/types/notification'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useEffect, useRef } from 'react'
import { io } from 'socket.io-client'
import { apiClient } from '@/api/api-client'
import { trimTrailingSlashes } from '@/lib/utils'
import { authService } from '@/services/auth-service'

const WS_BASE_URL = trimTrailingSlashes(
  (process.env.NEXT_PUBLIC_API_BASE_URL ?? 'http://localhost:3000').replace(/\/v1$/, ''),
)

export function useNotifications() {
  const queryClient = useQueryClient()
  const socketRef = useRef<Socket | null>(null)

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
    markRead: markReadMutation.mutate,
    markAllRead: markAllReadMutation.mutate,
    isMarkingAll: markAllReadMutation.isPending,
  }
}
