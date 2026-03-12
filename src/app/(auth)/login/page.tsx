"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import LoginForm from "@/components/auth/LoginForm";
import { authService } from "@/services/auth.service";
import { ShieldPlus, UserPlus, Sparkles } from "lucide-react";

export default function LoginPage() {
  const router = useRouter();

  useEffect(() => {
    // Verificar si ya está autenticado
    if (authService.isAuthenticated()) {
      router.push("/dashboard");
    }
  }, [router]);

  return (
    <div className="flex min-h-screen flex-col lg:flex-row bg-white">
      {/* Left Section - Branding */}
      <div className="hidden lg:flex lg:w-1/2 relative flex-col justify-center items-center bg-linear-to-br from-teal-100 to-teal-50 overflow-hidden p-12">
        <div className="relative z-10 max-w-lg text-center space-y-8">
          {/* Logo */}
          <div className="flex justify-center">
            <div className="size-20 bg-teal-500 rounded-xl flex items-center justify-center shadow-lg shadow-teal-500/20">
              <ShieldPlus className="w-16 h-16 text-white" />
            </div>
          </div>

          {/* Title and Description */}
          <div className="space-y-4">
            <h1 className="text-4xl font-black tracking-tight text-slate-900">
              Innovación en Comunicaion Médica
            </h1>
            <p className="text-lg text-slate-600 leading-relaxed">
              Nuestra plataforma permite a los profesionales de la salud optimizar el flujo de trabajo clínico y mejorar la experiencia del paciente.
            </p>
          </div>

          {/* Medical Image Placeholder */}
          <div className="rounded-xl overflow-hidden shadow-2xl border-4 border-white">
            <div 
              className="w-full h-64 bg-cover bg-center" 
              style={{backgroundImage: 'url(/medical-facility.png)'}}
            ></div>
          </div>
        </div>
      </div>

      {/* Right Section - Form */}
      <div className="flex flex-1 flex-col justify-center px-6 py-12 lg:px-24 bg-white">
        <div className="sm:mx-auto sm:w-full sm:max-w-md">
          {/* Mobile Logo */}
          <div className="flex items-center gap-3 lg:hidden mb-12">
            <Sparkles className="w-8 h-8 text-teal-500" />
            <h2 className="text-xl font-bold tracking-tight">SaludDeUna</h2>
          </div>

          {/* Header */}
          <div className="space-y-2">
            <h2 className="text-3xl font-black leading-tight tracking-tight text-slate-900">
              Portal de Médicos y Administradores
            </h2>
            <p className="text-slate-500 font-medium">
              Inicie sesión para gestionar la atención clínica
            </p>
          </div>

          {/* Form */}
          <div className="mt-10">
            <LoginForm />
          </div>

          {/* Registration Section */}
          {/* Registration Section */}
          <div className="mt-10 border-t border-slate-200 pt-8 space-y-4">
            <div>
              <p className="text-center text-sm text-slate-500">
                ¿No tienes una cuenta?
              </p>
              <div className="mt-4">
                <button
                  onClick={() => router.push("/register")}
                  className="flex w-full items-center justify-center gap-2 rounded-lg bg-slate-50 px-3 py-3 text-sm font-bold text-slate-900 ring-1 ring-inset ring-slate-200 hover:bg-slate-100 transition-colors"
                >
                  <UserPlus className="w-5 h-5 text-teal-500" />
                  Crear cuenta
                </button>
              </div>
            </div>
          </div>

          {/* Footer Links */}
          <div className="mt-12 flex justify-center gap-6">
            <a href="/support" className="text-xs text-slate-400 hover:text-slate-600 transition-colors">
              Soporte Técnico
            </a>
            <a href="/privacy" className="text-xs text-slate-400 hover:text-slate-600 transition-colors">
              Aviso de Privacidad
            </a>
            <a href="/terms" className="text-xs text-slate-400 hover:text-slate-600 transition-colors">
              Términos y Condiciones
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
