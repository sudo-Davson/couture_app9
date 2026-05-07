import { redirect } from "next/navigation";

/**
 * /orders n'est pas une page indépendante — les commandes sont gérées
 * dans l'onglet "Orders" du dashboard.
 * On redirige vers /dashboard qui est protégé par AuthGuard.
 */
export default function OrdersPage() {
  redirect("/dashboard");
}
