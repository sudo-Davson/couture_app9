import AuthGuard from "@/components/AuthGuard";
import CoutureApp from "@/components/CoutureApp";

export default function DashboardPage() {
  return (
    <AuthGuard>
      <CoutureApp />
    </AuthGuard>
  );
}
