"use client";

import { useEffect, useState } from "react";
import { listenOrders } from "@/services/firebase/orders";
import type { Order } from "@/types";

export function useOrders(userId?: string) {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(Boolean(userId));
  const [error, setError] = useState("");

  useEffect(() => {
    if (!userId) {
      setOrders([]);
      setLoading(false);
      setError("");
      return;
    }

    setLoading(true);
    setError("");

    const unsubscribe = listenOrders(
      userId,
      (nextOrders) => {
        setOrders(nextOrders);
        setLoading(false);
      },
      (listenerError) => {
        setError(listenerError.message);
        setLoading(false);
      },
    );

    return () => unsubscribe();
  }, [userId]);

  return { orders, loading, error };
}
