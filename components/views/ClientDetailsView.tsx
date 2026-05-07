import { useState, useRef } from "react";
import { Client, Order, MEASUREMENT_CODES, MEASUREMENT_LABELS, Measurement, NewOrderInput, OrderStatus, NewClientInput } from "@/types";
import { Card, Button, Input, Badge } from "@/components/ui";
import { ChevronLeft, Phone, MessageCircle, Plus, Edit2, Check, X, Settings, Trash2, Camera, Share2 } from "lucide-react";
import html2canvas from "html2canvas";
import { ReceiptTemplate } from "@/components/ui/ReceiptTemplate";
import { compressImage } from "@/lib/imageCompression";

export function ClientDetailsView({
  client,
  orders,
  onBack,
  onSaveMeasurements,
  onAddOrder,
  onUpdateOrderStatus,
  onUpdateClient,
  onDeleteClient,
  onUpdateOrder
}: {
  client: Client;
  orders: Order[];
  onBack: () => void;
  onSaveMeasurements: (measurements: Measurement[]) => Promise<void>;
  onAddOrder: (input: NewOrderInput) => Promise<void>;
  onUpdateOrderStatus: (orderId: string, status: OrderStatus) => Promise<void>;
  onUpdateClient: (input: Partial<NewClientInput>) => Promise<void>;
  onDeleteClient: () => Promise<void>;
  onUpdateOrder: (orderId: string, data: Partial<NewOrderInput>) => Promise<void>;
}) {
  const [activeTab, setActiveTab] = useState<"measurements" | "orders">("measurements");
  const [isEditing, setIsEditing] = useState(false);
  const [measurements, setMeasurements] = useState<Record<string, number>>(() => {
    const initial: Record<string, number> = {};
    client.measurements?.forEach(m => {
      initial[m.code] = m.value;
    });
    return initial;
  });
  const [savingMsg, setSavingMsg] = useState(false);

  // Edit Client State
  const [showEditClient, setShowEditClient] = useState(false);
  const [editName, setEditName] = useState(client.name);
  const [editPhone, setEditPhone] = useState(client.phone);
  const [savingClient, setSavingClient] = useState(false);

  // New Order State
  const [showAddOrder, setShowAddOrder] = useState(false);
  const [editingOrder, setEditingOrder] = useState<Order | null>(null);
  const [newOrder, setNewOrder] = useState({ type: "", price: "", advance: "", deliveryDate: "", note: "" });
  const [orderImage, setOrderImage] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  // Receipt State
  const receiptRef = useRef<HTMLDivElement>(null);
  const [receiptOrder, setReceiptOrder] = useState<Order | null>(null);

  const handleSaveMeasurements = async () => {
    setSavingMsg(true);
    const newArr: Measurement[] = MEASUREMENT_CODES.map(code => ({
      code,
      value: Number(measurements[code]) || 0,
      updatedAt: client.measurements?.find(m => m.code === code)?.updatedAt || new Date() as any
    }));
    await onSaveMeasurements(newArr);
    setSavingMsg(false);
    setIsEditing(false);
  };

  const handleAddOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsUploading(true);
    let imageUrl = "";
    if (orderImage) {
      try {
        imageUrl = await compressImage(orderImage);
      } catch (err) {
        console.error("Erreur de compression d'image", err);
      }
    }

    if (editingOrder) {
      await onUpdateOrder(editingOrder.id, {
        type: newOrder.type,
        price: Number(newOrder.price),
        advance: Number(newOrder.advance),
        deliveryDate: newOrder.deliveryDate,
        note: newOrder.note,
        ...(imageUrl ? { imageUrl } : {})
      });
    } else {
      await onAddOrder({
        clientId: client.id,
        type: newOrder.type,
        price: Number(newOrder.price),
        advance: Number(newOrder.advance),
        deliveryDate: newOrder.deliveryDate,
        status: "pending",
        note: newOrder.note,
        imageUrl
      });
    }

    setIsUploading(false);
    setShowAddOrder(false);
    setEditingOrder(null);
    setNewOrder({ type: "", price: "", advance: "", deliveryDate: "", note: "" });
    setOrderImage(null);
  };

  const openEditOrder = (order: Order) => {
    setEditingOrder(order);
    setNewOrder({
      type: order.type,
      price: String(order.price),
      advance: String(order.advance),
      deliveryDate: order.deliveryDate,
      note: order.note || ""
    });
    setShowAddOrder(true);
  };

  const handleWhatsApp = (order?: Order) => {
    let msg = `Bonjour ${client.name}, c'est votre couturière.`;
    if (order) {
      msg = `Bonjour ${client.name}, votre commande (${order.type}) est prête !`;
    }
    const phoneStr = client.phone.replace(/\D/g, '');
    window.open(`https://wa.me/${phoneStr}?text=${encodeURIComponent(msg)}`, '_blank');
  };

  const handleMarkReady = async (order: Order) => {
    await onUpdateOrderStatus(order.id, 'ready');
    if (confirm("La commande a été marquée comme Prête ! Voulez-vous envoyer un message WhatsApp au client pour le prévenir ?")) {
      handleWhatsApp(order);
    }
  };

  const handleShareReceipt = async (order: Order) => {
    setReceiptOrder(order);
    setTimeout(async () => {
      if (!receiptRef.current) return;
      try {
        const canvas = await html2canvas(receiptRef.current, { scale: 2 });
        canvas.toBlob(async (blob) => {
          if (!blob) return;
          const file = new File([blob], `Recu_${client.name.replace(/\s+/g, '_')}_${order.type.replace(/\s+/g, '_')}.png`, { type: 'image/png' });
          if (navigator.share) {
            await navigator.share({
              title: 'Reçu Couture',
              text: `Voici votre reçu pour : ${order.type}`,
              files: [file],
            }).catch(console.error);
          } else {
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = file.name;
            a.click();
            URL.revokeObjectURL(url);
          }
          setReceiptOrder(null);
        }, 'image/png');
      } catch (err) {
        console.error(err);
        setReceiptOrder(null);
      }
    }, 100);
  };

  const handleUpdateClient = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingClient(true);
    await onUpdateClient({ name: editName, phone: editPhone });
    setSavingClient(false);
    setShowEditClient(false);
  };

  const handleDeleteClient = async () => {
    if (confirm("Attention ! Voulez-vous vraiment supprimer ce client et TOUTES ses commandes ? Cette action est irréversible.")) {
      await onDeleteClient();
    }
  };

  if (showEditClient) {
    return (
      <div className="space-y-6 pb-20">
        <div className="flex items-center gap-3">
          <button onClick={() => setShowEditClient(false)} className="p-2 bg-white shadow-sm border border-slate-100 rounded-full active:scale-95 text-slate-600">
            <ChevronLeft size={24} />
          </button>
          <h2 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">Modifier Client</h2>
        </div>
        <form onSubmit={handleUpdateClient} className="space-y-4">
          <Input label="Nom complet" value={editName} onChange={e => setEditName(e.target.value)} required />
          <Input label="Téléphone" type="tel" value={editPhone} onChange={e => setEditPhone(e.target.value)} required />
          
          <Button type="submit" disabled={savingClient} className="w-full mt-6">
            {savingClient ? "Enregistrement..." : "Enregistrer les modifications"}
          </Button>
        </form>

        <div className="pt-8 border-t border-slate-200 mt-8">
          <Button variant="danger" className="w-full gap-2" onClick={handleDeleteClient}>
            <Trash2 size={20} />
            Supprimer ce client
          </Button>
          <p className="text-xs text-slate-500 text-center mt-3 px-4">
            La suppression supprimera également toutes les commandes de ce client.
          </p>
        </div>
      </div>
    );
  }

  if (showAddOrder) {
    return (
      <div className="space-y-6 pb-20">
        <div className="flex items-center gap-3">
          <button onClick={() => { setShowAddOrder(false); setEditingOrder(null); setNewOrder({ type: "", price: "", advance: "", deliveryDate: "", note: "" }); }} className="p-2 bg-white shadow-sm border border-slate-100 rounded-full active:scale-95 text-slate-600">
            <ChevronLeft size={24} />
          </button>
          <h2 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">{editingOrder ? "Modifier Commande" : "Nouvelle Commande"}</h2>
        </div>
        <form onSubmit={handleAddOrder} className="space-y-4">
          <Input label="Type de vêtement (ex: Robe de soirée)" value={newOrder.type} onChange={e => setNewOrder({...newOrder, type: e.target.value})} required />
          <div className="grid grid-cols-2 gap-4">
            <Input label="Prix total" type="number" value={newOrder.price} onChange={e => setNewOrder({...newOrder, price: e.target.value})} required />
            <Input label="Avance payée" type="number" value={newOrder.advance} onChange={e => setNewOrder({...newOrder, advance: e.target.value})} />
          </div>
          <Input label="Date de livraison" type="date" value={newOrder.deliveryDate} onChange={e => setNewOrder({...newOrder, deliveryDate: e.target.value})} required />
          <Input label="Notes" multiline rows={3} value={newOrder.note} onChange={e => setNewOrder({...newOrder, note: e.target.value})} />
          
          <div>
            <span className="text-sm font-bold text-slate-700 ml-1 block mb-1.5">Photo du tissu / modèle</span>
            <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-slate-300 rounded-2xl bg-slate-50 hover:bg-slate-100 transition-colors cursor-pointer overflow-hidden">
              {orderImage ? (
                <img src={URL.createObjectURL(orderImage)} alt="Aperçu" className="w-full h-full object-cover opacity-80" />
              ) : (
                <>
                  <Camera className="text-slate-400 mb-2" size={32} />
                  <span className="text-sm font-bold text-slate-500">Prendre une photo</span>
                </>
              )}
              <input 
                type="file" 
                accept="image/*" 
                capture="environment" 
                onChange={(e) => {
                  if (e.target.files && e.target.files[0]) {
                    setOrderImage(e.target.files[0]);
                  }
                }} 
                className="hidden" 
              />
            </label>
            {orderImage && (
               <button type="button" onClick={() => setOrderImage(null)} className="text-xs font-bold text-red-500 mt-2 block w-full text-center">Retirer la photo</button>
            )}
          </div>

          <Button type="submit" disabled={isUploading} className="w-full mt-6">
            {isUploading ? "Enregistrement..." : "Enregistrer la commande"}
          </Button>
        </form>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-24 min-h-[80vh] relative">
      {receiptOrder && (
        <ReceiptTemplate ref={receiptRef} client={client} order={receiptOrder} />
      )}

      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3 flex-1 overflow-hidden">
          <button onClick={onBack} className="p-2 bg-white shadow-sm border border-slate-100 rounded-full active:scale-95 text-slate-600 shrink-0">
            <ChevronLeft size={24} />
          </button>
          <div className="flex-1 overflow-hidden">
            <h2 className="text-2xl font-black text-slate-900 dark:text-white truncate tracking-tight">{client.name}</h2>
            <p className="text-sm font-semibold text-slate-500">{client.phone}</p>
          </div>
        </div>
        <button onClick={() => { setEditName(client.name); setEditPhone(client.phone); setShowEditClient(true); }} className="p-2 text-slate-400 hover:text-slate-600 active:bg-slate-100 rounded-full shrink-0">
          <Settings size={24} />
        </button>
      </div>

      <div className="flex gap-3">
        <a href={`tel:${client.phone}`} className="flex-1 flex items-center justify-center gap-2 py-3 px-4 bg-emerald-50 text-emerald-700 rounded-2xl font-bold active:bg-emerald-100 transition-colors">
          <Phone size={18} /> Appeler
        </a>
        <button onClick={() => handleWhatsApp()} className="flex-1 flex items-center justify-center gap-2 py-3 px-4 bg-green-50 text-green-700 rounded-2xl font-bold active:bg-green-100 transition-colors">
          <MessageCircle size={18} /> WhatsApp
        </button>
      </div>

      <div className="flex p-1 bg-slate-200/50 rounded-2xl">
        <button 
          onClick={() => setActiveTab("measurements")}
          className={`flex-1 py-2.5 text-sm font-bold rounded-xl transition-colors ${activeTab === "measurements" ? "bg-white text-slate-900 shadow-sm" : "text-slate-500"}`}
        >
          Mensurations
        </button>
        <button 
          onClick={() => setActiveTab("orders")}
          className={`flex-1 py-2.5 text-sm font-bold rounded-xl transition-colors ${activeTab === "orders" ? "bg-white text-slate-900 shadow-sm" : "text-slate-500"}`}
        >
          Commandes ({orders.length})
        </button>
      </div>

      {activeTab === "measurements" && (
        <div className="space-y-4">
          <div className="flex justify-between items-center px-1">
            <h3 className="font-black text-lg text-slate-900 dark:text-white tracking-tight">Valeurs (cm)</h3>
            {!isEditing ? (
              <button onClick={() => setIsEditing(true)} className="flex items-center gap-1.5 text-blue-600 font-bold text-sm bg-blue-50 px-3 py-1.5 rounded-lg active:bg-blue-100 transition-colors">
                <Edit2 size={14} /> Modifier
              </button>
            ) : (
              <div className="flex gap-2">
                <button onClick={() => setIsEditing(false)} className="p-2 text-slate-500 bg-slate-100 rounded-lg active:bg-slate-200 transition-colors">
                  <X size={18} />
                </button>
                <button onClick={handleSaveMeasurements} disabled={savingMsg} className="p-2 text-white bg-blue-600 rounded-lg active:bg-blue-700 disabled:opacity-50 transition-colors flex items-center gap-1">
                  <Check size={18} /> <span className="text-sm font-bold pr-1">Enregistrer</span>
                </button>
              </div>
            )}
          </div>

          <Card className="p-0 overflow-hidden border-0 bg-transparent shadow-none">
            <div className="grid grid-cols-2 gap-3">
              {MEASUREMENT_CODES.map(code => (
                <div key={code} className="bg-white p-3 rounded-2xl border border-slate-100 shadow-sm flex items-center justify-between">
                  <div>
                    <p className="text-xs font-bold text-slate-400">{code}</p>
                    <p className="text-[10px] uppercase text-slate-300 font-semibold leading-tight">{MEASUREMENT_LABELS[code].substring(0, 10)}.</p>
                  </div>
                  {isEditing ? (
                    <input 
                      type="number" 
                      value={measurements[code] || ''}
                      onChange={e => setMeasurements({...measurements, [code]: Number(e.target.value)})}
                      className="w-16 bg-slate-50 border border-slate-200 rounded-xl text-center py-2 font-black outline-none focus:border-blue-500 text-slate-900"
                    />
                  ) : (
                    <p className="text-xl font-black text-slate-900 dark:text-white">{measurements[code] || "--"}</p>
                  )}
                </div>
              ))}
            </div>
          </Card>
        </div>
      )}

      {activeTab === "orders" && (
        <div className="space-y-4">
          {orders.length === 0 ? (
            <div className="text-center py-10 bg-white rounded-3xl border border-slate-100 border-dashed">
              <p className="text-slate-500 font-medium">Aucune commande.</p>
            </div>
          ) : (
            orders.map(order => (
              <Card key={order.id} className="space-y-3">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="font-black text-lg text-slate-900 dark:text-white">{order.type}</p>
                    <p className="text-sm font-semibold text-slate-500">Prévu pour : {new Date(order.deliveryDate).toLocaleDateString('fr-FR')}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant={order.status === 'delivered' ? 'green' : order.status === 'ready' ? 'blue' : 'orange'}>
                      {order.status === 'delivered' ? 'Livrée' : order.status === 'ready' ? 'Prête' : 'En cours'}
                    </Badge>
                    <button onClick={() => openEditOrder(order)} className="p-2 text-slate-400 hover:text-slate-600 bg-slate-50 rounded-full">
                      <Edit2 size={14} />
                    </button>
                  </div>
                </div>
                
                {order.imageUrl && (
                  <div className="mt-3 rounded-xl overflow-hidden bg-slate-100 h-32 relative">
                    <img src={order.imageUrl} alt="Modèle/Tissu" className="w-full h-full object-cover" />
                  </div>
                )}
                
                <div className="flex justify-between items-end border-t border-slate-100 pt-3 mt-3">
                  <div>
                    <p className="font-bold text-slate-900 dark:text-white">{order.price} FCFA</p>
                    {(order.price - order.advance) > 0 ? (
                      <p className="text-xs font-bold text-red-500">Reste : {order.price - order.advance} FCFA</p>
                    ) : (
                      <p className="text-xs font-bold text-emerald-500">Payé</p>
                    )}
                  </div>
                  
                  <div className="flex gap-2">
                    <button onClick={() => handleShareReceipt(order)} className="p-2 text-blue-600 bg-blue-50 rounded-xl active:bg-blue-100 transition-colors">
                      <Share2 size={18} />
                    </button>
                    {order.status === 'pending' && (
                      <button onClick={() => handleMarkReady(order)} className="text-xs font-bold bg-blue-50 text-blue-600 px-3 py-2 rounded-xl active:bg-blue-100 transition-colors">
                        Marquer Prête
                      </button>
                    )}
                    {order.status === 'ready' && (
                      <button onClick={() => onUpdateOrderStatus(order.id, 'delivered')} className="text-xs font-bold bg-emerald-50 text-emerald-600 px-3 py-2 rounded-xl active:bg-emerald-100 transition-colors">
                        Marquer Livrée
                      </button>
                    )}
                    <button onClick={() => handleWhatsApp(order)} className="p-2 text-green-600 bg-green-50 rounded-xl active:bg-green-100 transition-colors">
                      <MessageCircle size={18} />
                    </button>
                  </div>
                </div>
              </Card>
            ))
          )}

          <button 
            onClick={() => setShowAddOrder(true)}
            className="fixed bottom-24 right-4 p-4 bg-blue-600 text-white rounded-2xl shadow-lg shadow-blue-600/30 active:scale-95 transition-transform"
          >
            <Plus size={28} />
          </button>
        </div>
      )}
    </div>
  );
}
