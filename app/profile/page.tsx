import { redirect } from "next/navigation";

/**
 * /profile n'est pas une page indépendante — le profil est géré
 * dans l'onglet "Profile" du dashboard.
 * On redirige vers /dashboard qui est protégé par AuthGuard.
 */
export default function ProfilePage() {
  redirect("/dashboard");
}
