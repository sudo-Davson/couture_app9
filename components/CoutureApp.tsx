"use client";

import { useState } from "react";
import { createClient, saveMeasurements, updateClient, deleteClient } from "@/services/firebase/clients";
import { createOrder, updateOrderStatus, updateOrderData } from "@/services/firebase/orders";
import { useAuth } from "@/hooks/useAuth";
import { useClients } from "@/hooks/useClients";
import { useOrders } from "@/hooks/useOrders";
import { DashboardView } from "./views/DashboardView";
import { ClientsView } from "./views/ClientsView";
import { ClientDetailsView } from "./views/ClientDetailsView";
import { OrdersView } from "./views/OrdersView";
import { ProfileView } from "./views/ProfileView";
import { LayoutDashboard, Users, Scissors, User } from "lucide-react";

type Tab = "dashboard" | "clients" | "orders" | "profile";

export default function CoutureApp() {
  const { user, loading, error, logout } = useAuth();
  const { clients } = useClients(user?.uid);
  const { orders } = useOrders(user?.uid);

  const [tab, setTab] = useState<Tab>("dashboard");
  const [selectedClientId, setSelectedClientId] = useState<string | null>(null);

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-50 dark:bg-slate-950">
        <p className="text-sm font-bold text-slate-400 dark:text-slate-500">Chargement...</p>
      </main>
    );
  }

  if (error || !user) return null;

  const selectedClient = clients.find((c) => c.id === selectedClientId);
  const clientOrders = selectedClientId ? orders.filter(o => o.clientId === selectedClientId) : [];

  const renderContent = () => {
    if (tab === "clients" && selectedClient) {
      return (
        <ClientDetailsView 
          client={selectedClient} 
          orders={clientOrders}
          onBack={() => setSelectedClientId(null)}
          onSaveMeasurements={async (m) => await saveMeasurements(user.uid, selectedClient.id, m)}
          onAddOrder={async (input) => await createOrder(user.uid, input, selectedClient.name)}
          onUpdateOrder={async (id, data) => await updateOrderData(user.uid, id, data)}
          onUpdateOrderStatus={async (id, status) => await updateOrderStatus(user.uid, id, status)}
          onUpdateClient={async (input) => await updateClient(user.uid, selectedClient.id, input)}
          onDeleteClient={async () => { await deleteClient(user.uid, selectedClient.id); setSelectedClientId(null); }}
        />
      );
    }

    switch (tab) {
      case "dashboard":
        return <DashboardView clients={clients} orders={orders} />;
      case "clients":
        return (
          <ClientsView 
            clients={clients} 
            onSelectClient={setSelectedClientId} 
            onAddClient={async (input) => { await createClient(user.uid, input); }} 
          />
        );
      case "orders":
        return (
          <OrdersView 
            orders={orders} 
            clients={clients}
            onUpdateOrderStatus={async (id, status) => await updateOrderStatus(user.uid, id, status)}
          />
        );
      case "profile":
        return <ProfileView user={user} onLogout={logout} />;
      default:
        return null;
    }
  };

  return (
    <main className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white font-sans selection:bg-blue-100 selection:text-blue-900">
      <div className="max-w-md mx-auto relative min-h-screen shadow-2xl shadow-slate-200/50 dark:shadow-none bg-slate-50 dark:bg-slate-950">
        
        {/* Content Area */}
        <div className="px-4 pt-8 pb-28 min-h-screen">
          {renderContent()}
        </div>

        {/* Bottom Navigation */}
        <nav className="fixed bottom-0 w-full max-w-md bg-white dark:bg-slate-900 border-t border-slate-100 dark:border-slate-800 pb-safe z-50 rounded-t-3xl shadow-[0_-10px_40px_-15px_rgba(0,0,0,0.05)] dark:shadow-[0_-10px_40px_-15px_rgba(0,0,0,0.3)]">
          <div className="flex justify-around items-center h-20 px-2">
            <NavItem 
              icon={<LayoutDashboard size={24} />} 
              label="Dashboard" 
              active={tab === "dashboard"} 
              onClick={() => { setTab("dashboard"); setSelectedClientId(null); }} 
            />
            <NavItem 
              icon={<Users size={24} />} 
              label="Clients" 
              active={tab === "clients" && !selectedClient} 
              onClick={() => { setTab("clients"); setSelectedClientId(null); }} 
            />
            <NavItem 
              icon={<Scissors size={24} />} 
              label="Commandes" 
              active={tab === "orders"} 
              onClick={() => { setTab("orders"); setSelectedClientId(null); }} 
            />
            <NavItem 
              icon={<User size={24} />} 
              label="Profil" 
              active={tab === "profile"} 
              onClick={() => { setTab("profile"); setSelectedClientId(null); }} 
            />
          </div>
        </nav>
      </div>
    </main>
  );
}

function NavItem({ icon, label, active, onClick }: { icon: React.ReactNode; label: string; active: boolean; onClick: () => void }) {
  return (
    <button 
      onClick={onClick} 
      className={`flex flex-col items-center justify-center w-full h-full gap-1.5 transition-colors active:scale-95 ${active ? "text-blue-600" : "text-slate-400 hover:text-slate-600"}`}
    >
      <div className={`transition-transform duration-300 ${active ? "scale-110" : ""}`}>
        {icon}
      </div>
      <span className={`text-[10px] font-black tracking-wide ${active ? "text-blue-600" : "text-slate-400"}`}>
        {label}
      </span>
    </button>
  );
}