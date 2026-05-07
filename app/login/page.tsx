"use client";

import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { signInWithEmail, signUpWithEmail } from "@/hooks/useAuth";

export default function LoginPage() {
  const router = useRouter();

  const [mode, setMode] = useState<"login" | "signup">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [checking, setChecking] = useState(true);

  // CHECK SESSION
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        router.replace("/dashboard");
      } else {
        setChecking(false);
      }
    });

    return () => unsubscribe();
  }, [router]);

  function parseFirebaseError(err: unknown): string {
    const code =
      typeof err === "object" && err !== null && "code" in err
        ? String((err as { code: string }).code)
        : "";

    switch (code) {
      case "auth/user-not-found":
      case "auth/invalid-credential":
      case "auth/wrong-password":
        return "Email ou mot de passe incorrect.";
      case "auth/invalid-email":
        return "Adresse email invalide.";
      case "auth/email-already-in-use":
        return "Cet email est déjà utilisé.";
      case "auth/weak-password":
        return "Le mot de passe doit contenir au moins 6 caractères.";
      case "auth/too-many-requests":
        return "Trop de tentatives. Veuillez réessayer plus tard.";
      case "auth/network-request-failed":
        return "Erreur réseau. Vérifiez votre connexion.";
      default:
        return err instanceof Error ? err.message : "Une erreur est survenue.";
    }
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setErrorMsg("");

    try {
      if (mode === "login") {
        await signInWithEmail(email.trim(), password);
      } else {
        await signUpWithEmail(email.trim(), password);
      }

      router.replace("/dashboard");
    } catch (err) {
      setErrorMsg(parseFirebaseError(err));
    } finally {
      setBusy(false);
    }
  }

  if (checking) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#f3f5f7]">
        <p className="text-sm font-black text-slate-400">Chargement...</p>
      </main>
    );
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-[#f3f5f7] px-4">
      <section className="w-full max-w-sm rounded-[2rem] bg-white p-6 shadow-sm">

        <p className="mb-1 text-xs font-bold uppercase tracking-wider text-[#08669a]">
          Couture App
        </p>

        <h1 className="mb-6 text-3xl font-black text-slate-950">
          {mode === "login" ? "Connexion" : "Inscription"}
        </h1>

        <form onSubmit={handleSubmit} className="space-y-4">

          <label className="block space-y-2">
            <span className="text-sm font-black text-slate-700">Email</span>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="input"
              required
            />
          </label>

          <label className="block space-y-2">
            <span className="text-sm font-black text-slate-700">Mot de passe</span>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="input"
              minLength={6}
              required
            />
          </label>

          <button type="submit" disabled={busy} className="primary-button w-full">
            {busy ? "Patientez..." : mode === "login" ? "Se connecter" : "Créer un compte"}
          </button>
        </form>

        {errorMsg && (
          <p className="mt-4 rounded-2xl bg-amber-50 px-4 py-3 text-sm font-semibold text-amber-800">
            {errorMsg}
          </p>
        )}

        <p className="mt-6 text-center text-sm text-slate-500">
          {mode === "login" ? (
            <>
              Pas encore de compte ?{" "}
              <button onClick={() => setMode("signup")} className="font-black text-[#08669a]">
                S&apos;inscrire
              </button>
            </>
          ) : (
            <>
              Déjà un compte ?{" "}
              <button onClick={() => setMode("login")} className="font-black text-[#08669a]">
                Se connecter
              </button>
            </>
          )}
        </p>

      </section>
    </main>
  );
}