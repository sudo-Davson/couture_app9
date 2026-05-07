"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";

export default function AuthGuard({ children }: { children: React.ReactNode }) {
  const { user, loading, error } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !error && !user) {
      router.replace("/login");
    }
  }, [user, loading, error, router]);

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#f3f5f7]">
        <p className="text-sm font-black text-slate-400">Chargement...</p>
      </main>
    );
  }

  if (error) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#f3f5f7] px-4">
        <section className="w-full max-w-sm rounded-[2rem] bg-white p-6 shadow-sm space-y-5">
          <div className="flex flex-col items-center gap-3 py-4 text-center">
            <span className="text-5xl">📡</span>
            <h2 className="text-xl font-black text-slate-900">
              Connexion interrompue
            </h2>
            <p className="text-sm font-semibold text-slate-500">
              Vérifiez votre connexion internet.
            </p>
          </div>
          <button
            onClick={() => window.location.reload()}
            className="primary-button w-full"
          >
            Recharger
          </button>
        </section>
      </main>
    );
  }

  return <>{children}</>;
}