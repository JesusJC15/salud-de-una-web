'use client'

import Image from 'next/image'

const FOOTER_SECTIONS = [
  {
    title: 'About',
    items: [
      'Nuestra plataforma',
      'Equipo medico',
      'Impacto clinico',
    ],
  },
  {
    title: 'Support',
    items: [
      'Centro de ayuda',
      'Guia de inicio',
      'Estado del sistema',
    ],
  },
  {
    title: 'Privacy',
    items: [
      'Datos seguros',
      'Normativa',
      'Seguridad',
    ],
  },
  {
    title: 'Terms',
    items: [
      'Condiciones',
      'Uso aceptable',
      'Actualizaciones',
    ],
  },
  {
    title: 'Contact',
    items: [
      'Soporte 24/7',
      'Ventas',
      'Alianzas',
    ],
  },
]

const BRAND_TAGLINES = [
  'Confianza clinica',
  'Operacion sin friccion',
  'Datos accionables',
]

export function AuthenticatedDashboardFooter() {
  return (
    <footer className="bg-gradient-to-b from-[#0b3c74] via-[#062a52] to-[#05060c] text-slate-100">
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

            <p className="text-sm leading-relaxed text-slate-200/90">
              Plataforma integral para coordinar operaciones medicas, equipos clinicos y una atencion al paciente mas humana.
            </p>

            <div className="flex flex-wrap gap-2 text-xs font-semibold text-slate-200/90">
              {BRAND_TAGLINES.map(tagline => (
                <span
                  key={tagline}
                  className="rounded-full border border-white/15 bg-white/5 px-3 py-1"
                >
                  {tagline}
                </span>
              ))}
            </div>

          </div>

          <div className="grid flex-1 grid-cols-2 gap-6 sm:grid-cols-3 lg:grid-cols-5">
            {FOOTER_SECTIONS.map(section => (
              <div key={section.title} className="space-y-3">
                <p className="text-xs font-semibold tracking-[0.2em] text-slate-300 uppercase">
                  {section.title}
                </p>
                <div className="space-y-2 text-sm text-slate-200/90">
                  {section.items.map(item => (
                    <button
                      key={item}
                      type="button"
                      className="block text-left transition hover:text-white"
                    >
                      {item}
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-10 border-t border-white/10 pt-6 text-xs text-slate-300">
          Copyright © 2026 SaludDeUna
        </div>
      </div>
    </footer>
  )
}
