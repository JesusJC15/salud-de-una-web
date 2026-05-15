'use client'

import Image from 'next/image'

export function DashboardBrandMark() {
  return (
    <div className="relative h-10 w-10 shrink-0 overflow-hidden rounded-xl bg-white/70 p-1 shadow-sm ring-1 ring-slate-200/70 sm:h-11 sm:w-11">
      <Image
        src="/images/SaludDeUnaLogoPrincipal.png"
        alt="SaludDeUna"
        fill
        sizes="44px"
        className="object-contain p-1"
        priority
      />
    </div>
  )
}
