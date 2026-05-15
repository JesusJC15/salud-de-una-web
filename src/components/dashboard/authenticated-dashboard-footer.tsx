'use client'

import Image from 'next/image'

const FOOTER_SECTIONS = [
  {
    title: 'Acerca de',
    items: [
      'Nuestra plataforma',
      'Equipo médico',
      'Impacto clínico',
    ],
  },
  {
    title: 'Soporte',
    items: [
      'Centro de ayuda',
      'Guia de inicio',
      'Estado del sistema',
    ],
  },
  {
    title: 'Privacidad',
    items: [
      'Datos seguros',
      'Normativa',
      'Seguridad',
    ],
  },
  {
    title: 'Términos',
    items: [
      'Condiciones',
      'Uso aceptable',
      'Actualizaciones',
    ],
  },
  {
    title: 'Contacto',
    items: [
      'Soporte 24/7',
      'Ventas',
      'Alianzas',
    ],
  },
]

const BRAND_TAGLINES = [
  'Confianza clínica',
  'Operación sin fricción',
  'Datos accionables',
]

export function AuthenticatedDashboardFooter() {
  return (
    <footer className="bg-gradient-to-b from-teal-50 via-cyan-50 to-white text-slate-700">
      <div className="mx-auto w-full max-w-6xl px-6 py-12">
        <div className="flex flex-col gap-10 lg:flex-row lg:items-start lg:justify-between">
          <div className="max-w-md space-y-5">
            <div className="relative w-full max-w-[320px]">
              <Image
                src="/images/SaludDeUnaLogoBanner.png"
                alt="SaludDeUna"
                width={520}
                height={160}
                className="h-auto w-full"
                sizes="(max-width: 640px) 240px, (max-width: 1024px) 280px, 320px"
              />
            </div>

            <p className="text-sm leading-relaxed text-slate-600">
              Plataforma integral para coordinar operaciones médicas, equipos clínicos y una atención al paciente más humana.
            </p>

            <div className="flex flex-wrap gap-2 text-xs font-semibold text-slate-600">
              {BRAND_TAGLINES.map(tagline => (
                <span
                  key={tagline}
                  className="rounded-full border border-teal-200 bg-white/70 px-3 py-1 text-teal-700"
                >
                  {tagline}
                </span>
              ))}
            </div>

          </div>

          <div className="grid flex-1 grid-cols-2 gap-6 sm:grid-cols-3 lg:grid-cols-5">
            {FOOTER_SECTIONS.map(section => (
              <div key={section.title} className="space-y-3">
                <p className="text-xs font-semibold tracking-[0.2em] text-slate-500 uppercase">
                  {section.title}
                </p>
                <div className="space-y-2 text-sm text-slate-600">
                  {section.items.map(item => (
                    <button
                      key={item}
                      type="button"
                      className="block text-left transition hover:text-teal-700"
                    >
                      {item}
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-10 border-t border-slate-200 pt-6 text-xs text-slate-500">
          Derechos reservados © 2026 SaludDeUna
        </div>
      </div>
    </footer>
  )
}
