"use client";

import { useEffect, useState } from "react";
import type { User } from "firebase/auth";
import { onAuthStateChanged, RecaptchaVerifier, signInWithPhoneNumber, signOut } from "firebase/auth";
import { getFirebaseAuth } from "@/lib/firebase";

declare global {
  interface Window {
    recaptchaVerifier?: RecaptchaVerifier;
  }
}

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    let resolved = false;
    const timeout = window.setTimeout(() => {
      if (!resolved) {
        setError("Firebase ne repond pas. Verifiez les cles dans .env.local puis relancez l'application.");
        setLoading(false);
      }
    }, 6000);

    try {
      const unsubscribe = onAuthStateChanged(getFirebaseAuth(), (currentUser) => {
        resolved = true;
        window.clearTimeout(timeout);
        setUser(currentUser);
        setLoading(false);
      });

      return () => {
        window.clearTimeout(timeout);
        unsubscribe();
      };
    } catch (err) {
      resolved = true;
      window.clearTimeout(timeout);
      setError(err instanceof Error ? err.message : "Configuration Firebase invalide.");
      setLoading(false);
      return undefined;
    }
  }, []);

  return {
    user,
    loading,
    error,
    logout: () => signOut(getFirebaseAuth()),
  };
}

export function getRecaptchaVerifier() {
  if (!window.recaptchaVerifier) {
    window.recaptchaVerifier = new RecaptchaVerifier(getFirebaseAuth(), "recaptcha-container", {
      size: "invisible",
    });
  }

  return window.recaptchaVerifier;
}

export function resetRecaptchaVerifier() {
  window.recaptchaVerifier?.clear();
  window.recaptchaVerifier = undefined;
}

export function sendOtp(phone: string) {
  return signInWithPhoneNumber(getFirebaseAuth(), phone.trim(), getRecaptchaVerifier());
}
