import { useState } from "react";
import { Client, NewClientInput } from "@/types";
import { Card, Button, Input } from "@/components/ui";
import { UserPlus, Search, ChevronRight, Contact } from "lucide-react";

export function ClientsView({ 
  clients, 
  onSelectClient, 
  onAddClient 
}: { 
  clients: Client[]; 
  onSelectClient: (id: string) => void;
  onAddClient: (input: NewClientInput) => Promise<void>;
}) {
  const [search, setSearch] = useState("");
  const [showAddForm, setShowAddForm] = useState(false);
  const [newName, setNewName] = useState("");
  const [newPhone, setNewPhone] = useState("");
  const [loading, setLoading] = useState(false);

  const filtered = clients.filter(c => c.name.toLowerCase().includes(search.toLowerCase()) || c.phone.includes(search));

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim() || !newPhone.trim()) return;
    setLoading(true);
    await onAddClient({ name: newName, phone: newPhone });
    setLoading(false);
    setShowAddForm(false);
    setNewName("");
    setNewPhone("");
  };

  const handleImportContacts = async () => {
    if ('contacts' in navigator && 'ContactsManager' in window) {
      try {
        const contacts = await (navigator as any).contacts.select(['name', 'tel'], { multiple: false });
        if (contacts && contacts.length > 0) {
          const contact = contacts[0];
          if (contact.name && contact.name.length > 0) setNewName(contact.name[0]);
          if (contact.tel && contact.tel.length > 0) setNewPhone(contact.tel[0]);
        }
      } catch (ex) {
        console.error(ex);
        alert("Erreur lors de l'accès aux contacts.");
      }
    } else {
      alert("L'importation de contacts n'est pas supportée sur ce navigateur ou cet appareil.");
    }
  };

  if (showAddForm) {
    return (
      <div className="space-y-6 pb-20">
        <div className="flex items-center gap-3">
          <button onClick={() => setShowAddForm(false)} className="p-2 bg-white shadow-sm border border-slate-100 rounded-full active:scale-95 text-slate-600">
            <ChevronRight className="rotate-180" size={24} />
          </button>
          <h2 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">Nouveau Client</h2>
        </div>

        {('contacts' in navigator) && (
          <button 
            type="button"
            onClick={handleImportContacts}
            className="w-full flex items-center justify-center gap-2 py-3 px-4 bg-emerald-50 text-emerald-700 rounded-2xl font-bold active:bg-emerald-100 transition-colors mt-4"
          >
            <Contact size={20} />
            Importer depuis mes contacts
          </button>
        )}

        <form onSubmit={handleAdd} className="space-y-4 mt-4">
          <Input 
            label="Nom complet" 
            placeholder="Ex: Aminata Diallo" 
            value={newName} 
            onChange={e => setNewName(e.target.value)} 
            required 
          />
          <Input 
            label="Téléphone" 
            type="tel" 
            placeholder="Ex: +225 01 23 45 67 89" 
            value={newPhone} 
            onChange={e => setNewPhone(e.target.value)} 
            required 
          />
          <Button type="submit" disabled={loading} className="w-full mt-6">
            {loading ? "Création..." : "Enregistrer le client"}
          </Button>
        </form>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-20 min-h-[80vh]">
      <h2 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">Mes Clients</h2>

      <div className="relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
        <input 
          type="text" 
          placeholder="Rechercher un client..." 
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl pl-12 pr-4 py-3.5 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all font-medium placeholder:text-slate-400 shadow-sm text-slate-900 dark:text-white"
        />
      </div>

      <div className="space-y-3">
        {filtered.length === 0 ? (
          <div className="text-center py-10">
            <p className="text-slate-500 font-medium">Aucun client trouvé.</p>
          </div>
        ) : (
          filtered.map(client => (
            <Card key={client.id} onClick={() => onSelectClient(client.id)} className="flex items-center justify-between hover:border-blue-200 group">
              <div>
                <p className="font-black text-lg text-slate-900 dark:text-white group-hover:text-blue-600 transition-colors">{client.name}</p>
                <p className="text-sm font-semibold text-slate-500 mt-0.5">{client.phone}</p>
              </div>
              <ChevronRight className="text-slate-300 group-hover:text-blue-500 transition-colors" />
            </Card>
          ))
        )}
      </div>

      {/* FAB */}
      <button 
        onClick={() => setShowAddForm(true)}
        className="fixed bottom-24 right-4 p-4 bg-blue-600 text-white rounded-2xl shadow-lg shadow-blue-600/30 active:scale-95 transition-transform"
      >
        <UserPlus size={28} />
      </button>
    </div>
  );
}
