import Link from 'next/link'

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-[#f5fbfb] p-6 text-center">
      <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-teal-50">
        <span className="text-3xl font-black text-teal-500">404</span>
      </div>
      <h1 className="font-manrope text-xl font-black text-slate-900">Página no encontrada</h1>
      <p className="max-w-xs text-sm text-slate-500">
        La ruta que buscás no existe o fue movida.
      </p>
      <Link
        href="/dashboard"
        className="mt-2 rounded-xl bg-teal-500 px-5 py-2.5 text-sm font-bold text-white hover:bg-teal-600"
      >
        Ir al inicio
      </Link>
    </div>
  )
}
