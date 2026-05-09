'use client'

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { adminService } from '../services/admin-service'

export function useAdminBilling(params: {
  from?: string
  to?: string
  specialty?: string
  status?: string
  page?: number
  limit?: number
} = {}) {
  const queryClient = useQueryClient()

  const transactionsQuery = useQuery({
    queryKey: [
      'admin',
      'billing-transactions',
      params,
    ],
    queryFn: () => adminService.getAdminTransactions(params),
    retry: 1,
    staleTime: 30_000,
  })

  const pricesQuery = useQuery({
    queryKey: ['admin', 'billing-prices'],
    queryFn: () => adminService.getBillingPrices(),
    staleTime: 60_000,
  })

  const updatePriceMutation = useMutation({
    mutationFn: ({ specialty, amount }: { specialty: string, amount: number }) =>
      adminService.updateBillingPrice(specialty, amount),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['admin', 'billing-prices'] })
    },
  })

  return {
    transactions: transactionsQuery.data?.items ?? [],
    total: transactionsQuery.data?.total ?? 0,
    isLoadingTransactions: transactionsQuery.isLoading,
    prices: pricesQuery.data ?? [],
    isLoadingPrices: pricesQuery.isLoading,
    updatePriceMutation,
  }
}
