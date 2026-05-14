'use client'

import { ArrowLeft, ChevronLeft, ChevronRight } from 'lucide-react'
import Link from 'next/link'
import { useState } from 'react'
import { useAdminBilling } from '../hooks/use-admin-billing'

const SPECIALTY_LABELS: Record<string, string> = {
  GENERAL_MEDICINE: 'Medicina General',
  ODONTOLOGY: 'Odontología',
  URGENT_CARE: 'Urgencias',
}

function formatCOP(amount: number) {
  return `$${amount.toLocaleString('es-CO')} COP`
}

export function AdminBillingPage() {
  const [editingSpecialty, setEditingSpecialty] = useState<string | null>(null)
  const [newAmount, setNewAmount] = useState('')
  const [page, setPage] = useState(1)
  const LIMIT = 20

  const { transactions, total, isLoadingTransactions, prices, isLoadingPrices, updatePriceMutation }
    = useAdminBilling({ page, limit: LIMIT })

  const totalPages = Math.max(1, Math.ceil(total / LIMIT))

  const handleUpdatePrice = async (specialty: string) => {
    const amount = Number.parseInt(newAmount, 10)
    if (Number.isNaN(amount) || amount < 0)
      return
    await updatePriceMutation.mutateAsync({ specialty, amount })
    setEditingSpecialty(null)
    setNewAmount('')
  }

  return (
    <div className="space-y-8 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Facturación</h1>
          <p className="mt-1 text-sm text-slate-500">
            {total}
            {' '}
            transacciones registradas
          </p>
        </div>
        <Link
          href="/admin"
          className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
        >
          <ArrowLeft className="h-4 w-4" />
          Volver
        </Link>
      </div>

      {/* Precios por especialidad */}
      <section>
        <h2 className="mb-3 text-sm font-bold uppercase tracking-widest text-slate-400">
          Precios por especialidad
        </h2>
        <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-sm">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
              <tr>
                <th className="px-4 py-3">Especialidad</th>
                <th className="px-4 py-3">Precio (COP)</th>
                <th className="px-4 py-3">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {isLoadingPrices
                ? (
                  <tr>
                    <td className="px-4 py-6 text-center text-slate-400" colSpan={3}>
                      Cargando precios...
                    </td>
                  </tr>
                )
                : prices.map(price => (
                  <tr key={price.specialty} className="hover:bg-slate-50">
                    <td className="px-4 py-3 font-medium text-slate-800">
                      {SPECIALTY_LABELS[price.specialty] ?? price.specialty}
                    </td>
                    <td className="px-4 py-3 text-slate-700">
                      {editingSpecialty === price.specialty
                        ? (
                          <input
                            aria-label={`Nuevo precio para ${SPECIALTY_LABELS[price.specialty] ?? price.specialty}`}
                            className="w-32 rounded-lg border border-slate-300 px-2 py-1 text-sm"
                            type="number"
                            value={newAmount}
                            onChange={e => setNewAmount(e.target.value)}
                            min={0}
                          />
                        )
                        : formatCOP(price.amount)}
                    </td>
                    <td className="px-4 py-3">
                      {editingSpecialty === price.specialty
                        ? (
                          <div className="flex gap-2">
                            <button
                              type="button"
                              className="rounded bg-teal-600 px-3 py-1 text-xs text-white disabled:opacity-60"
                              disabled={updatePriceMutation.isPending}
                              onClick={() => void handleUpdatePrice(price.specialty)}
                            >
                              {updatePriceMutation.isPending ? 'Guardando...' : 'Guardar'}
                            </button>
                            <button
                              type="button"
                              className="rounded border border-slate-200 px-3 py-1 text-xs text-slate-600"
                              onClick={() => {
                                setEditingSpecialty(null)
                                setNewAmount('')
                              }}
                            >
                              Cancelar
                            </button>
                          </div>
                        )
                        : (
                          <button
                            type="button"
                            className="rounded bg-slate-800 px-3 py-1 text-xs text-white hover:bg-slate-700"
                            onClick={() => {
                              setEditingSpecialty(price.specialty)
                              setNewAmount(String(price.amount))
                            }}
                          >
                            Editar
                          </button>
                        )}
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* Transacciones */}
      <section>
        <h2 className="mb-3 text-sm font-bold uppercase tracking-widest text-slate-400">
          Transacciones recientes
        </h2>
        <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-sm">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
              <tr>
                <th className="px-4 py-3">Fecha</th>
                <th className="px-4 py-3">Especialidad</th>
                <th className="px-4 py-3">Monto</th>
                <th className="px-4 py-3">Estado</th>
                <th className="px-4 py-3">Consulta</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {isLoadingTransactions
                ? (
                  <tr>
                    <td className="px-4 py-6 text-center text-slate-400" colSpan={5}>
                      Cargando transacciones...
                    </td>
                  </tr>
                )
                : transactions.length === 0
                  ? (
                    <tr>
                      <td className="px-4 py-6 text-center text-slate-400" colSpan={5}>
                        No hay transacciones registradas aún.
                      </td>
                    </tr>
                  )
                  : transactions.map(t => (
                    <tr key={t.id} className="hover:bg-slate-50">
                      <td className="px-4 py-3 text-slate-500">
                        {t.createdAt ? new Date(t.createdAt).toLocaleDateString('es-CO') : '—'}
                      </td>
                      <td className="px-4 py-3 text-slate-700">
                        {SPECIALTY_LABELS[t.specialty] ?? t.specialty}
                      </td>
                      <td className="px-4 py-3 font-medium text-slate-900">
                        {formatCOP(t.amount)}
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`rounded-full px-2 py-0.5 text-xs font-bold ${
                            t.status === 'COMPLETED'
                              ? 'bg-emerald-100 text-emerald-700'
                              : t.status === 'REFUNDED'
                                ? 'bg-slate-100 text-slate-600'
                                : 'bg-amber-100 text-amber-700'
                          }`}
                        >
                          {t.status === 'COMPLETED' ? 'Pagado' : t.status === 'REFUNDED' ? 'Reembolsado' : 'Pendiente'}
                        </span>
                      </td>
                      <td className="px-4 py-3 font-mono text-xs text-slate-400">
                        {t.consultationId.slice(-8)}
                      </td>
                    </tr>
                  ))}
            </tbody>
          </table>
        </div>

        {/* Paginación */}
        {totalPages > 1 && (
          <div className="mt-4 flex items-center justify-between">
            <p className="text-xs text-slate-400">
              Página
              {' '}
              {page}
              {' '}
              de
              {' '}
              {totalPages}
              {' '}
              ·
              {' '}
              {total}
              {' '}
              resultados
            </p>
            <div className="flex items-center gap-2">
              <button
                type="button"
                aria-label="Página anterior"
                disabled={page <= 1}
                onClick={() => setPage(p => p - 1)}
                className="rounded-lg border border-slate-200 p-1.5 text-slate-500 hover:border-teal-300 disabled:opacity-40"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <button
                type="button"
                aria-label="Página siguiente"
                disabled={page >= totalPages}
                onClick={() => setPage(p => p + 1)}
                className="rounded-lg border border-slate-200 p-1.5 text-slate-500 hover:border-teal-300 disabled:opacity-40"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}
      </section>
    </div>
  )
}
