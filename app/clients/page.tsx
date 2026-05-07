import { redirect } from "next/navigation";

/**
 * /clients n'est pas une page indépendante — les clients sont gérés
 * dans l'onglet "Clients" du dashboard.
 * On redirige vers /dashboard qui est protégé par AuthGuard.
 */
export default function ClientsPage() {
  redirect("/dashboard");
}
