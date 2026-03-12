"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { authService } from "@/services/auth.service";

export default function Home() {
  const router = useRouter();

  useEffect(() => {
    // Si está autenticado, ir al dashboard
    if (authService.isAuthenticated()) {
      router.push("/dashboard");
    } else {
      // Si no está autenticado, ir al login
      router.push("/login");
    }
  }, [router]);

}
