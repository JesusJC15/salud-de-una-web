import Link from 'next/link'

export default function ForbiddenPage() {
  return (
    <main className="flex min-h-screen items-center justify-center px-6">
      <section className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <p className="text-sm font-semibold tracking-wide text-red-500 uppercase">Error 403</p>
        <h1 className="mt-3 text-2xl font-black text-slate-900 dark:text-slate-100">Acceso denegado</h1>
        <p className="mt-3 text-sm text-slate-600 dark:text-slate-300">
          No cuentas con permisos para ver esta seccion.
        </p>

        <div className="mt-6 flex justify-center gap-3">
          <Link
            className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground"
            href="/dashboard"
          >
            Ir a dashboard
          </Link>
          <Link
            className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 dark:border-slate-700 dark:text-slate-200"
            href="/login"
          >
            Iniciar sesion
          </Link>
        </div>
      </section>
    </main>
  )
}
