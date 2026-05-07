import { Card, Button } from "@/components/ui";
import { LogOut, User, Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";

export function ProfileView({ user, onLogout }: { user: any; onLogout: () => void }) {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <div className="space-y-6 pb-20">
      <h2 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">Profil</h2>
      
      <Card className="flex items-center gap-4 p-6">
        <div className="p-4 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-2xl">
          <User size={32} />
        </div>
        <div>
          <p className="font-black text-lg text-slate-900 dark:text-white">Mon Compte</p>
          <p className="text-sm font-semibold text-slate-500 dark:text-slate-400">{user?.email || "Connecté"}</p>
        </div>
      </Card>

      {mounted && (
        <Card className="flex items-center justify-between p-6">
          <div className="flex items-center gap-3">
            {theme === 'dark' ? <Moon size={24} className="text-blue-500" /> : <Sun size={24} className="text-amber-500" />}
            <p className="font-black text-lg text-slate-900 dark:text-white">Mode Sombre</p>
          </div>
          <button 
            onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
            className="px-4 py-2 bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white rounded-xl font-bold text-sm"
          >
            {theme === 'dark' ? 'Désactiver' : 'Activer'}
          </button>
        </Card>
      )}

      <div className="pt-8">
        <Button variant="danger" className="w-full flex items-center gap-2" onClick={onLogout}>
          <LogOut size={20} />
          Se déconnecter
        </Button>
      </div>
    </div>
  );
}
