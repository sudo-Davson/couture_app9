import { useState } from "react";
import { Order, Client, OrderStatus } from "@/types";
import { Card, Badge } from "@/components/ui";

type FilterType = "active" | "delivered" | "all";

export function OrdersView({ 
  orders, 
  clients,
  onUpdateOrderStatus
}: { 
  orders: Order[]; 
  clients: Client[];
  onUpdateOrderStatus: (id: string, status: OrderStatus) => Promise<void>
}) {
  const [filter, setFilter] = useState<FilterType>("active");

  const getClientName = (id: string) => clients.find(c => c.id === id)?.name || "Client inconnu";

  const handleWhatsApp = (clientId: string, orderType: string) => {
    const client = clients.find(c => c.id === clientId);
    if (!client) return;
    const msg = `Bonjour ${client.name}, votre commande (${orderType}) est prête !`;
    const phoneStr = client.phone.replace(/\D/g, '');
    window.open(`https://wa.me/${phoneStr}?text=${encodeURIComponent(msg)}`, '_blank');
  };

  const handleMarkReady = async (order: Order) => {
    await onUpdateOrderStatus(order.id, 'ready');
    if (confirm("La commande a été marquée comme Prête ! Voulez-vous envoyer un message WhatsApp au client pour le prévenir ?")) {
      handleWhatsApp(order.clientId, order.type);
    }
  };

  const filteredOrders = orders.filter(o => {
    if (filter === 'active') return o.status !== 'delivered';
    if (filter === 'delivered') return o.status === 'delivered';
    return true;
  });

  const sortedOrders = [...filteredOrders].sort((a, b) => {
    // Si c'est l'historique, on trie de la plus récente à la plus ancienne, 
    // sinon de la plus urgente à la moins urgente
    if (filter === 'delivered' || filter === 'all') {
      return new Date(b.deliveryDate).getTime() - new Date(a.deliveryDate).getTime();
    }
    return new Date(a.deliveryDate).getTime() - new Date(b.deliveryDate).getTime();
  });

  return (
    <div className="space-y-6 pb-20 min-h-[80vh]">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">Commandes</h2>
      </div>

      <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide -mx-4 px-4">
        <button 
          onClick={() => setFilter('active')}
          className={`px-4 py-2 rounded-full text-sm font-bold whitespace-nowrap transition-colors ${filter === 'active' ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900 shadow-md' : 'bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400'}`}
        >
          En cours & Prêtes
        </button>
        <button 
          onClick={() => setFilter('delivered')}
          className={`px-4 py-2 rounded-full text-sm font-bold whitespace-nowrap transition-colors ${filter === 'delivered' ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900 shadow-md' : 'bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400'}`}
        >
          Historique (Livrées)
        </button>
        <button 
          onClick={() => setFilter('all')}
          className={`px-4 py-2 rounded-full text-sm font-bold whitespace-nowrap transition-colors ${filter === 'all' ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900 shadow-md' : 'bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400'}`}
        >
          Toutes
        </button>
      </div>

      <div className="space-y-4">
        {sortedOrders.length === 0 ? (
          <div className="text-center py-10">
            <p className="text-slate-500 font-medium">Aucune commande pour le moment.</p>
          </div>
        ) : (
          sortedOrders.map(order => (
            <Card key={order.id} className="space-y-3">
              <div className="flex justify-between items-start">
                <div>
                  <p className="font-black text-lg text-slate-900 dark:text-white">{order.type}</p>
                  <p className="text-sm font-bold text-blue-600 dark:text-blue-400">{getClientName(order.clientId)}</p>
                </div>
                <Badge variant={order.status === 'delivered' ? 'green' : order.status === 'ready' ? 'blue' : 'orange'}>
                  {order.status === 'delivered' ? 'Livrée' : order.status === 'ready' ? 'Prête' : 'En cours'}
                </Badge>
              </div>
              
              <div className="flex justify-between items-end border-t border-slate-100 dark:border-slate-800 pt-3 mt-3">
                <div>
                  <p className="font-bold text-slate-900 dark:text-white">{order.price} FCFA</p>
                  {(order.price - (order.advance || 0)) > 0 ? (
                    <p className="text-xs font-bold text-red-500">Reste : {order.price - (order.advance || 0)} FCFA</p>
                  ) : (
                    <p className="text-xs font-bold text-emerald-500">Payé</p>
                  )}
                  <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider mt-1">
                    Pour le {new Date(order.deliveryDate).toLocaleDateString('fr-FR')}
                  </p>
                </div>
                
                <div className="flex gap-2">
                  {order.status === 'pending' && (
                    <button onClick={() => handleMarkReady(order)} className="text-xs font-bold bg-blue-50 text-blue-600 px-3 py-2 rounded-xl active:bg-blue-100 transition-colors">
                      Prête
                    </button>
                  )}
                  {order.status === 'ready' && (
                    <button onClick={() => onUpdateOrderStatus(order.id, 'delivered')} className="text-xs font-bold bg-emerald-50 text-emerald-600 px-3 py-2 rounded-xl active:bg-emerald-100 transition-colors">
                      Livrée
                    </button>
                  )}
                </div>
              </div>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
