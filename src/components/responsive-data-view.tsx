'use client'

interface Props<T> {
  card: (item: T) => React.ReactNode
  getKey: (item: T) => string
  items: T[]
  table: React.ReactNode
}

export function ResponsiveDataView<T>({ card, getKey, items, table }: Props<T>) {
  return (
    <>
      <div className="hidden overflow-x-auto rounded-2xl border border-slate-100 bg-white shadow-sm md:block">
        {table}
      </div>
      <div className="space-y-3 md:hidden">
        {items.map(item => (
          <div key={getKey(item)}>{card(item)}</div>
        ))}
      </div>
    </>
  )
}
