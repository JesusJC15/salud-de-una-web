'use client'

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { adminService } from '../services/admin-service'

export function useAdminAiPrompts(page = 1, limit = 20) {
  const queryClient = useQueryClient()

  const listQuery = useQuery({
    queryKey: ['admin', 'ai-prompts', page, limit],
    queryFn: () => adminService.listAiPrompts({ page, limit }),
    retry: 2,
    staleTime: 30_000,
  })

  const createVersionMutation = useMutation({
    mutationFn: (dto: { key: string; systemInstruction: string; model?: string }) =>
      adminService.createAiPromptVersion(dto),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['admin', 'ai-prompts'] })
    },
  })

  const toggleActiveMutation = useMutation({
    mutationFn: ({ id, active }: { id: string; active: boolean }) =>
      adminService.toggleAiPromptActive(id, active),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['admin', 'ai-prompts'] })
    },
  })

  return {
    prompts: listQuery.data?.items ?? [],
    total: listQuery.data?.total ?? 0,
    isLoading: listQuery.isLoading,
    isError: listQuery.isError,
    refetch: listQuery.refetch,
    createVersionMutation,
    toggleActiveMutation,
  }
}
