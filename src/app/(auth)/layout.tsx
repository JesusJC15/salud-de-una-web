import type { ReactNode } from "react";

export default function AuthLayout({ children }: Readonly<{ children: ReactNode }>) {
  return (
    <div className="gradient-bg dark:bg-background-dark min-h-screen flex flex-col relative overflow-x-hidden">
      {/* Gradient blobs background */}
      <div className="fixed inset-0 z-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-24 -left-24 w-80 h-80 bg-aquamarine/10 rounded-full blur-3xl"></div>
        <div className="absolute top-1/2 -right-32 w-96 h-96 bg-primary/10 rounded-full blur-3xl"></div>
        <div className="absolute bottom-10 left-1/2 -translate-x-1/2 w-64 h-64 bg-aquamarine/5 rounded-full blur-2xl"></div>
      </div>

      {/* Content */}
      <div className="relative z-10 flex-1 flex flex-col">
        {children}
      </div>

      {/* Decorative medical icons */}
      <div className="absolute bottom-4 left-4 opacity-10 pointer-events-none rotate-12 z-0">
        <span className="material-symbols-outlined text-6xl text-aquamarine">
          stethoscope
        </span>
      </div>
      <div className="absolute top-1/3 right-4 opacity-10 pointer-events-none -rotate-12 z-0">
        <span className="material-symbols-outlined text-7xl text-primary">
          medical_services
        </span>
      </div>
    </div>
  );
}
