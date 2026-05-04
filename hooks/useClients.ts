"use client";

import { useEffect, useState } from "react";
import { getClients } from "@/services/firebase/clients";
import type { Client } from "@/types";

export function useClients(userId?: string) {
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(Boolean(userId));
  const [error, setError] = useState("");

  useEffect(() => {
    if (!userId) {
      setClients([]);
      setLoading(false);
      setError("");
      return;
    }

    setLoading(true);
    setError("");

    const unsubscribe = getClients(
      userId,
      (nextClients) => {
        setClients(nextClients);
        setLoading(false);
      },
      (listenerError) => {
        setError(listenerError.message);
        setLoading(false);
      },
    );

    return () => unsubscribe();
  }, [userId]);

  return { clients, loading, error };
}
