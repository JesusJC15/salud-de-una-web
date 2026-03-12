"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { authService } from "@/services/auth.service";
import { Button } from "@/components/ui/button";
import { AuthMeResponse } from "@/types/auth";

export default function DashboardPage() {
  const router = useRouter();
  const [user, setUser] = useState<AuthMeResponse | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadUser = async () => {
      try {
        if (!authService.isAuthenticated()) {
          router.push("/login");
          return;
        }

        const userData = await authService.getMe();
        setUser(userData);
      } catch (error) {
        console.error("Error loading user:", error);
        router.push("/login");
      } finally {
        setLoading(false);
      }
    };

    loadUser();
  }, [router]);

  const handleLogout = async () => {
    await authService.logout();
    router.push("/login");
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100 mb-4">
            Cargando...
          </h1>
        </div>
      </div>
    );
  }

  return (
    <div className="gradient-bg dark:bg-slate-950 min-h-screen p-8">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white dark:bg-slate-800 rounded-xl shadow-lg p-8">
          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-100">
                Bienvenido, {user?.fullName}
              </h1>
              <p className="text-slate-500 dark:text-slate-400 mt-2">
                Email: {user?.email}
              </p>
              <p className="text-slate-500 dark:text-slate-400">
                Rol: {user?.role}
              </p>
            </div>

            <Button
              onClick={handleLogout}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              Cerrar Sesión
            </Button>
          </div>

          {/* Content */}
          <div className="space-y-6">
            <div className="bg-linear-to-r from-aquamarine to-primary rounded-lg p-6 text-white">
              <h2 className="text-2xl font-bold mb-2">Portal de Médicos</h2>
              <p className="opacity-90">
                Sistema de gestión de atención clínica y comunicación médica
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-slate-100 dark:bg-slate-700 rounded-lg p-6">
                <h3 className="font-bold text-lg text-slate-900 dark:text-slate-100 mb-2">
                  Pacientes
                </h3>
                <p className="text-slate-600 dark:text-slate-400 text-sm">
                  Gestiona tus pacientes y su información médica
                </p>
              </div>

              <div className="bg-slate-100 dark:bg-slate-700 rounded-lg p-6">
                <h3 className="font-bold text-lg text-slate-900 dark:text-slate-100 mb-2">
                  Reportes
                </h3>
                <p className="text-slate-600 dark:text-slate-400 text-sm">
                  Accede a reportes y estadísticas
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
