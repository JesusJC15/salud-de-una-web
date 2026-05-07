'use client'

import type { NotificationsResponseDto } from '@/types/notification'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { apiClient } from '@/api/api-client'

export function useNotifications() {
  const queryClient = useQueryClient()

  const query = useQuery<NotificationsResponseDto>({
    queryKey: ['notifications'],
    queryFn: async () => {
      const res = await apiClient('').get<NotificationsResponseDto>(
        'notifications/me',
        { params: { limit: 20 } },
      )
      return res.data
    },
    refetchInterval: 60_000,
    staleTime: 30_000,
  })

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
