import { Order, Client } from "@/types";
import { Card } from "@/components/ui";
import { Scissors, Clock, Users, PackageCheck } from "lucide-react";

export function DashboardView({ clients, orders }: { clients: Client[]; orders: Order[] }) {
  const activeOrders = orders.filter((o) => o.status !== "delivered");
  const deliveryQueue = [...activeOrders].filter(o => o.deliveryDate).sort((a, b) => new Date(a.deliveryDate).getTime() - new Date(b.deliveryDate).getTime());
  const lateOrders = activeOrders.filter((o) => {
    if (!o.deliveryDate) return false;
    const isLate = new Date(o.deliveryDate).getTime() < Date.now();
    const isToday = new Date(o.deliveryDate).toISOString().slice(0,10) === new Date().toISOString().slice(0,10);
    return isLate && !isToday;
  });

  const totalEncaisse = orders.reduce((acc, order) => {
    if (order.status === 'delivered') return acc + order.price;
    return acc + (order.advance || 0);
  }, 0);

  const totalEnAttente = activeOrders.reduce((acc, order) => {
    const reste = order.price - (order.advance || 0);
    return acc + (reste > 0 ? reste : 0);
  }, 0);

  return (
    <div className="space-y-6 pb-20">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-black text-slate-900 tracking-tight">Tableau de bord</h2>
      </div>
      
      <div className="grid grid-cols-2 gap-4">
        <Card className="flex flex-col items-center justify-center p-6 text-center space-y-3">
          <div className="p-3.5 bg-blue-100 text-blue-600 rounded-2xl">
            <Users size={28} />
          </div>
          <div>
            <p className="text-3xl font-black text-slate-900">{clients.length}</p>
            <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mt-1">Clients</p>
          </div>
        </Card>
        
        <Card className="flex flex-col items-center justify-center p-6 text-center space-y-3">
          <div className="p-3.5 bg-emerald-100 text-emerald-600 rounded-2xl">
            <Scissors size={28} />
          </div>
          <div>
            <p className="text-3xl font-black text-slate-900">{activeOrders.length}</p>
            <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mt-1">En cours</p>
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="bg-slate-900 text-white rounded-3xl p-5 shadow-lg">
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Encaissé</p>
          <p className="text-xl font-black">{totalEncaisse.toLocaleString()} <span className="text-sm">FCFA</span></p>
        </div>
        <div className="bg-white border border-slate-200 rounded-3xl p-5 shadow-sm">
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">En attente</p>
          <p className="text-xl font-black text-slate-900">{totalEnAttente.toLocaleString()} <span className="text-sm">FCFA</span></p>
        </div>
      </div>

      <div className="space-y-4">
        <h3 className="text-xl font-bold text-slate-800 tracking-tight">Alertes & Rappels</h3>
        
        {lateOrders.length > 0 && (
          <Card className="border-l-4 border-l-red-500 flex items-center gap-4">
            <div className="p-3 bg-red-100 text-red-600 rounded-xl shrink-0">
              <Clock size={24} />
            </div>
            <div>
              <p className="font-bold text-slate-900">{lateOrders.length} commande(s) en retard</p>
              <p className="text-sm font-medium text-slate-500">Action requise immédiatement.</p>
            </div>
          </Card>
        )}

        {deliveryQueue.length > 0 ? (
          <div className="space-y-3 mt-4">
            <h4 className="text-sm font-bold text-slate-500 uppercase tracking-wider">File d'attente des livraisons</h4>
            {deliveryQueue.map(order => {
              const client = clients.find(c => c.id === order.clientId);
              const orderDate = new Date(order.deliveryDate).getTime();
              const isLate = orderDate < Date.now() && new Date(order.deliveryDate).toISOString().slice(0,10) !== new Date().toISOString().slice(0,10);
              const colorClass = isLate ? "border-l-red-500" : "border-l-blue-500";
              const badgeClass = isLate ? "text-red-600 bg-red-50" : "text-blue-600 bg-blue-50";

              return (
                <Card key={order.id} className={`border-l-4 ${colorClass} dark:bg-slate-900`}>
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="font-black text-slate-900 dark:text-white">{client?.name || "Client inconnu"}</p>
                      <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">{order.type}</p>
                    </div>
                    <p className={`text-xs font-bold px-2 py-1 rounded-lg ${badgeClass}`}>
                      {new Date(order.deliveryDate).toLocaleDateString('fr-FR')}
                    </p>
                  </div>
                  <div className="flex justify-between items-end border-t border-slate-100 dark:border-slate-800 pt-2 mt-2">
                    <p className="font-bold text-slate-900 dark:text-white text-sm">{order.price} FCFA</p>
                    {(order.price - (order.advance || 0)) > 0 ? (
                      <p className="text-xs font-bold text-red-500">Reste à payer : {order.price - (order.advance || 0)} FCFA</p>
                    ) : (
                      <p className="text-xs font-bold text-emerald-500">Tout est payé</p>
                    )}
                  </div>
                </Card>
              );
            })}
          </div>
        ) : (
          <Card className="flex items-center gap-4">
            <div className="p-3 bg-slate-100 text-slate-400 rounded-xl shrink-0">
              <PackageCheck size={24} />
            </div>
            <div>
              <p className="font-bold text-slate-900 dark:text-white">Aucune livraison prévue</p>
              <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Votre file d'attente est vide.</p>
            </div>
          </Card>
        )}
      </div>
    </div>
  );
}
