'use client'

interface Props {
  label?: string
}

export function LoadingState({ label = 'Cargando...' }: Props) {
  return (
    <div className="flex min-h-[40vh] flex-col items-center justify-center gap-3">
      <div className="h-8 w-8 animate-spin rounded-full border-4 border-teal-500 border-t-transparent" />
      <p className="text-sm font-medium text-slate-400">{label}</p>
    </div>
  )
}

export function SkeletonRows({ count = 5 }: { count?: number }) {
  return (
    <div className="divide-y divide-slate-50">
      {Array.from({ length: count }).map((_, index) => (
        // eslint-disable-next-line react/no-array-index-key
        <div key={index} className="flex items-center gap-4 px-4 py-3">
          <div className="h-4 w-40 animate-pulse rounded bg-slate-100" />
          <div className="h-4 w-28 animate-pulse rounded bg-slate-100" />
          <div className="h-5 w-20 animate-pulse rounded-full bg-slate-100" />
          <div className="ml-auto h-4 w-16 animate-pulse rounded bg-slate-100" />
        </div>
      ))}
    </div>
  )
}
