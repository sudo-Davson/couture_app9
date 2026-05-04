"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import type { ConfirmationResult } from "firebase/auth";
import { Timestamp } from "firebase/firestore";
import { createClient, deleteClient, saveMeasurements, updateClient } from "@/services/firebase/clients";
import { createOrder, updateOrderStatus } from "@/services/firebase/orders";
import { resetRecaptchaVerifier, sendOtp, useAuth } from "@/hooks/useAuth";
import { useClients } from "@/hooks/useClients";
import { useNetwork } from "@/hooks/useNetwork";
import { useOrders } from "@/hooks/useOrders";
import {
  Client,
  MEASUREMENT_CODES,
  MEASUREMENT_LABELS,
  Measurement,
  MeasurementCode,
  NewOrderInput,
  Order,
  OrderStatus,
} from "@/types";

type Tab = "dashboard" | "clients" | "orders" | "profile";

type ContactPickerNavigator = Navigator & {
  contacts?: {
    select: (
      properties: Array<"name" | "tel">,
      options?: { multiple?: boolean },
    ) => Promise<Array<{ name?: string[]; tel?: string[] }>>;
  };
};

const tabs: { id: Tab; label: string; icon: string }[] = [
  { id: "dashboard", label: "Dashboard", icon: "D" },
  { id: "clients", label: "Clients", icon: "C" },
  { id: "orders", label: "Orders", icon: "O" },
  { id: "profile", label: "Profile", icon: "P" },
];

const orderStatuses: { value: OrderStatus; label: string }[] = [
  { value: "pending", label: "En cours" },
  { value: "ready", label: "Prete" },
  { value: "delivered", label: "Livree" },
];

const today = () => new Date().toISOString().slice(0, 10);

function isLate(order: Order) {
  return order.status !== "delivered" && order.deliveryDate < today();
}

function isUpcoming(order: Order) {
  const now = new Date(today()).getTime();
  const delivery = new Date(order.deliveryDate).getTime();
  const days = (delivery - now) / 86400000;
  return order.status !== "delivered" && days >= 0 && days <= 3;
}

function money(value: number) {
  return new Intl.NumberFormat("fr-FR", { maximumFractionDigits: 0 }).format(value);
}

function formatDateTime(value?: { toDate?: () => Date }) {
  if (!value?.toDate) return "Date inconnue";
  return new Intl.DateTimeFormat("fr-FR", { dateStyle: "short", timeStyle: "short" }).format(value.toDate());
}

function digitsOnly(value: string) {
  return value.replace(/\D/g, "");
}

function formatLocalPhone(value: string) {
  return digitsOnly(value)
    .slice(0, 8)
    .replace(/(\d{2})(?=\d)/g, "$1 ")
    .trim();
}

function phoneForAuth(value: string) {
  return `+228${digitsOnly(value).slice(0, 8)}`;
}

function phoneForLink(value: string) {
  const digits = digitsOnly(value);
  return digits.length === 8 ? `228${digits}` : digits;
}

function twoDigitNumber(value: string) {
  return digitsOnly(value).slice(0, 2);
}

function numericAmount(value: string) {
  return Number(digitsOnly(value));
}

function byDeliveryDate(a: Order, b: Order) {
  return a.deliveryDate.localeCompare(b.deliveryDate);
}

function orderBalance(order: Order) {
  return Math.max(Number(order.price || 0) - Number(order.advance || 0), 0);
}

export default function CoutureApp() {
  const { user, loading, error, logout } = useAuth();
  const online = useNetwork();
  const {
    clients,
    loading: clientsLoading,
    error: clientsError,
  } = useClients(user?.uid);
  const {
    orders,
    loading: ordersLoading,
    error: ordersError,
  } = useOrders(user?.uid);
  const [tab, setTab] = useState<Tab>("dashboard");
  const [selectedClientId, setSelectedClientId] = useState("");

  const selectedClient = clients.find((client) => client.id === selectedClientId);
  const activeOrders = orders.filter((order) => order.status !== "delivered").sort(byDeliveryDate);
  const upcomingOrders = activeOrders.filter(isUpcoming);
  const syncLoading = clientsLoading || ordersLoading;
  const syncError = clientsError || ordersError;

  if (loading) return <ScreenShell title="Couture App">Chargement...</ScreenShell>;

  if (error) {
    return (
      <ScreenShell title="Configuration">
        <div className="space-y-3 text-slate-700">
          <p>Firebase n'est pas encore connecte.</p>
          <p className="rounded-2xl bg-amber-50 p-4 text-sm text-amber-800">{error}</p>
          <p className="text-sm">Verifiez le fichier `.env.local`, puis relancez l'application.</p>
        </div>
      </ScreenShell>
    );
  }

  if (!user) return <AuthScreen />;

  return (
    <main className="min-h-screen bg-[#f3f5f7] pb-28 text-slate-950">
      <header className="sticky top-0 z-20 bg-[#f3f5f7]/95 px-4 pb-3 pt-4 backdrop-blur">
        <div className="mx-auto max-w-md">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-[#08669a]">Couture App</p>
              <h1 className="text-2xl font-black">
                {tab === "dashboard" && "Tableau de bord"}
                {tab === "clients" && (selectedClient ? selectedClient.name : "Clients")}
                {tab === "orders" && "Commandes"}
                {tab === "profile" && "Profil"}
              </h1>
            </div>
            <SyncBadge online={online} />
          </div>
          {selectedClient && tab === "clients" && (
            <button
              onClick={() => setSelectedClientId("")}
              className="mt-3 rounded-full bg-white px-4 py-2 text-sm font-bold text-slate-700 shadow-sm"
            >
              Retour clients
            </button>
          )}
        </div>
      </header>

      <section className="mx-auto max-w-md space-y-5 px-4">
        {syncError && <ErrorBanner message={syncError} />}
        {syncLoading && <LoadingCard />}

        {tab === "dashboard" && (
          <Dashboard clients={clients} activeOrders={activeOrders} upcomingOrders={upcomingOrders} />
        )}

        {tab === "clients" && !selectedClient && (
          <ClientsList
            userId={user.uid}
            clients={clients}
            orders={orders}
            onOpenClient={(clientId) => setSelectedClientId(clientId)}
          />
        )}

        {tab === "clients" && selectedClient && (
          <ClientDetail
            userId={user.uid}
            client={selectedClient}
            clients={clients}
            orders={orders.filter((order) => order.clientId === selectedClient.id)}
            onDeleted={() => setSelectedClientId("")}
          />
        )}

        {tab === "orders" && <OrdersPage userId={user.uid} clients={clients} orders={activeOrders} />}

        {tab === "profile" && (
          <ProfilePage
            phone={user.phoneNumber || "Telephone connecte"}
            online={online}
            clientsCount={clients.length}
            ordersCount={orders.length}
            onLogout={() => logout()}
          />
        )}
      </section>

      <BottomNav activeTab={tab} onChange={setTab} />
    </main>
  );
}

function AuthScreen() {
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("");
  const [confirmation, setConfirmation] = useState<ConfirmationResult | null>(null);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");

  function authErrorText(error: unknown) {
    const code = typeof error === "object" && error && "code" in error ? String(error.code) : "";
    if (code === "auth/invalid-phone-number") return "Numero invalide. Entrez 8 chiffres.";
    if (code === "auth/too-many-requests") return "Trop de tentatives. Reessayez plus tard.";
    if (code === "auth/quota-exceeded") return "Quota SMS depasse. Utilisez un numero de test.";
    if (code === "auth/operation-not-allowed") return "Activez Phone dans Firebase.";
    if (code === "auth/captcha-check-failed") return "Verification echouee. Reessayez.";
    if (code === "auth/unauthorized-domain") return "Ajoutez localhost dans Firebase.";
    if (code === "auth/billing-not-enabled") return "Activez la facturation ou utilisez un numero test Firebase.";
    return error instanceof Error ? error.message : "Impossible d'envoyer le code.";
  }

  async function requestOtp(event: FormEvent) {
    event.preventDefault();
    setBusy(true);
    setMessage("");

    try {
      const timeout = new Promise<never>((_, reject) => {
        window.setTimeout(() => reject(new Error("L'envoi prend trop de temps. Reessayez.")), 25000);
      });
      const result = await Promise.race([sendOtp(phoneForAuth(phone)), timeout]);
      setConfirmation(result);
      setMessage("Code envoye.");
    } catch (error) {
      resetRecaptchaVerifier();
      setMessage(authErrorText(error));
    } finally {
      setBusy(false);
    }
  }

  async function verifyOtp(event: FormEvent) {
    event.preventDefault();
    if (!confirmation) return;
    setBusy(true);

    try {
      await confirmation.confirm(otp);
    } catch {
      setMessage("Code incorrect.");
      setBusy(false);
    }
  }

  return (
    <ScreenShell title="Couture App">
      <div className="space-y-5">
        <p className="text-base text-slate-600">Connexion simple avec votre telephone.</p>
        <form onSubmit={confirmation ? verifyOtp : requestOtp} className="space-y-4">
          {!confirmation ? (
            <Field label="Telephone">
              <input
                value={phone}
                onChange={(event) => setPhone(formatLocalPhone(event.target.value))}
                placeholder="99 99 00 00"
                className="input"
                inputMode="tel"
                maxLength={11}
                pattern="[0-9 ]{11}"
                required
              />
            </Field>
          ) : (
            <Field label="Code SMS">
              <input
                value={otp}
                onChange={(event) => setOtp(event.target.value)}
                placeholder="123456"
                className="input"
                inputMode="numeric"
                required
              />
            </Field>
          )}
          <button disabled={busy} className="primary-button w-full">
            {busy ? "Patientez..." : confirmation ? "Entrer" : "Recevoir le code"}
          </button>
        </form>
        <div id="recaptcha-container" />
        {message && <p className="rounded-2xl bg-amber-50 p-4 text-sm font-semibold text-amber-800">{message}</p>}
      </div>
    </ScreenShell>
  );
}

function Dashboard({
  clients,
  activeOrders,
  upcomingOrders,
}: {
  clients: Client[];
  activeOrders: Order[];
  upcomingOrders: Order[];
}) {
  const nextOrder = activeOrders[0];

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-3 gap-3">
        <Metric label="Clients" value={clients.length} />
        <Metric label="Actives" value={activeOrders.length} />
        <Metric label="Livraisons" value={upcomingOrders.length} />
      </div>

      <Card>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="section-title">Premiere livraison</h2>
          {nextOrder && <StatusBadge status={nextOrder.status} late={isLate(nextOrder)} />}
        </div>
        {!nextOrder ? (
          <EmptyText text="Aucune commande active." />
        ) : (
          <div className="space-y-3">
            <div>
              <p className="text-xl font-black">{nextOrder.clientName || "Client"}</p>
              <p className="text-sm font-semibold text-slate-500">
                {nextOrder.type} - {nextOrder.deliveryDate}
              </p>
            </div>
            <div className="grid grid-cols-3 gap-2">
              <InfoPill label="Prix" value={money(nextOrder.price)} />
              <InfoPill label="Paye" value={money(Number(nextOrder.advance || 0))} />
              <InfoPill label="Reste" value={money(orderBalance(nextOrder))} tone={orderBalance(nextOrder) > 0 ? "danger" : "default"} />
            </div>
          </div>
        )}
      </Card>

      <Card>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="section-title">A livrer bientot</h2>
          <span className="rounded-full bg-[#e8f3f8] px-3 py-1 text-xs font-bold text-[#08669a]">3 jours</span>
        </div>
        <div className="space-y-3">
          {upcomingOrders.length === 0 ? (
            <EmptyText text="Aucune livraison proche." />
          ) : (
            upcomingOrders.map((order) => <OrderRow key={order.id} order={order} compact />)
          )}
        </div>
      </Card>
    </div>
  );
}

function ClientsList({
  userId,
  clients,
  orders,
  onOpenClient,
}: {
  userId: string;
  clients: Client[];
  orders: Order[];
  onOpenClient: (clientId: string) => void;
}) {
  const [search, setSearch] = useState("");
  const filteredClients = clients.filter((client) => {
    const target = `${client.name} ${client.phone}`.toLowerCase();
    return target.includes(search.toLowerCase());
  });

  return (
    <div className="space-y-5">
      <QuickClientForm userId={userId} />
      <input
        value={search}
        onChange={(event) => setSearch(event.target.value)}
        className="input"
        placeholder="Rechercher un client"
      />
      <div className="space-y-3">
        {filteredClients.length === 0 ? (
          <EmptyText text="Ajoutez votre premier client." />
        ) : (
          filteredClients.map((client) => {
            const activeCount = orders.filter((order) => order.clientId === client.id && order.status !== "delivered").length;
            return (
              <button key={client.id} onClick={() => onOpenClient(client.id)} className="client-row">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[#e8f3f8] text-lg font-black text-[#08669a]">
                  {client.name.slice(0, 1).toUpperCase()}
                </div>
                <div className="min-w-0 flex-1 text-left">
                  <p className="truncate text-base font-black text-slate-950">{client.name}</p>
                  <p className="truncate text-sm text-slate-500">{client.phone}</p>
                </div>
                <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-700">
                  {activeCount}
                </span>
              </button>
            );
          })
        )}
      </div>
    </div>
  );
}

function ClientDetail({
  userId,
  client,
  clients,
  orders,
  onDeleted,
}: {
  userId: string;
  client: Client;
  clients: Client[];
  orders: Order[];
  onDeleted: () => void;
}) {
  const [editingClient, setEditingClient] = useState(false);

  async function removeClient() {
    const confirmed = window.confirm("Supprimer ce client et toutes ses commandes ?");
    if (!confirmed) return;

    await deleteClient(userId, client.id);
    onDeleted();
  }

  return (
    <div className="space-y-5">
      <Card>
        <div className="flex items-start gap-4">
          <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-3xl bg-[#08669a] text-2xl font-black text-white">
            {client.name.slice(0, 1).toUpperCase()}
          </div>
          <div className="min-w-0 flex-1">
            <h2 className="truncate text-2xl font-black">{client.name}</h2>
            <p className="text-base text-slate-500">{client.phone}</p>
          </div>
        </div>
        <div className="mt-5 grid grid-cols-2 gap-3">
          <a href={`tel:${digitsOnly(client.phone)}`} className="soft-button text-center">
            Appeler
          </a>
          <a href={`https://wa.me/${phoneForLink(client.phone)}`} target="_blank" rel="noreferrer" className="whatsapp-button text-center">
            WhatsApp
          </a>
        </div>
        <div className="mt-3 grid grid-cols-2 gap-3">
          <button onClick={() => setEditingClient((current) => !current)} className="soft-button">
            Modifier
          </button>
          <button onClick={removeClient} className="soft-button text-rose-700">
            Supprimer
          </button>
        </div>
      </Card>

      {editingClient && <EditClientForm userId={userId} client={client} onDone={() => setEditingClient(false)} />}

      <MeasurementEditor userId={userId} client={client} />

      <Card>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="section-title">Commandes</h2>
          <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-700">{orders.length}</span>
        </div>
        <OrderForm userId={userId} clients={clients} defaultClientId={client.id} compact />
        <div className="mt-4 space-y-3">
          {orders.length === 0 ? (
            <EmptyText text="Aucune commande pour ce client." />
          ) : (
            orders.map((order) => <OrderRow key={order.id} order={order} userId={userId} />)
          )}
        </div>
      </Card>
    </div>
  );
}

function QuickClientForm({ userId }: { userId: string }) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [busy, setBusy] = useState(false);
  const contactsAvailable =
    typeof navigator !== "undefined" && Boolean((navigator as ContactPickerNavigator).contacts?.select);

  async function submit(event: FormEvent) {
    event.preventDefault();
    setBusy(true);
    await createClient(userId, { name, phone: formatLocalPhone(phone) });
    setName("");
    setPhone("");
    setOpen(false);
    setBusy(false);
  }

  async function pickContact() {
    const contactNavigator = navigator as ContactPickerNavigator;
    if (!contactNavigator.contacts?.select) return;

    try {
      const [contact] = await contactNavigator.contacts.select(["name", "tel"], { multiple: false });
      setName(contact?.name?.[0] || "");
      setPhone(formatLocalPhone(contact?.tel?.[0] || ""));
      setOpen(true);
    } catch {
      setOpen(true);
    }
  }

  if (!open) {
    return (
      <div className="grid grid-cols-2 gap-3">
        <button onClick={() => setOpen(true)} className="primary-button">
          Ajouter
        </button>
        <button onClick={pickContact} className="soft-button" disabled={!contactsAvailable}>
          Contact
        </button>
      </div>
    );
  }

  return (
    <Card>
      <form onSubmit={submit} className="space-y-4">
        <Field label="Nom du client">
          <input value={name} onChange={(event) => setName(event.target.value)} className="input" required />
        </Field>
        <Field label="Telephone">
          <input
            value={phone}
            onChange={(event) => setPhone(formatLocalPhone(event.target.value))}
            className="input"
            inputMode="numeric"
            maxLength={11}
            pattern="[0-9 ]{11}"
            placeholder="99 99 00 00"
            required
          />
        </Field>
        <div className="grid grid-cols-2 gap-3">
          <button type="button" onClick={() => setOpen(false)} className="soft-button">
            Annuler
          </button>
          <button disabled={busy} className="primary-button">
            Enregistrer
          </button>
        </div>
      </form>
    </Card>
  );
}

function EditClientForm({ userId, client, onDone }: { userId: string; client: Client; onDone: () => void }) {
  const [name, setName] = useState(client.name);
  const [phone, setPhone] = useState(formatLocalPhone(client.phone));
  const [busy, setBusy] = useState(false);

  async function submit(event: FormEvent) {
    event.preventDefault();
    setBusy(true);
    await updateClient(userId, client.id, { name, phone: formatLocalPhone(phone) });
    setBusy(false);
    onDone();
  }

  return (
    <Card>
      <form onSubmit={submit} className="space-y-4">
        <Field label="Nom du client">
          <input value={name} onChange={(event) => setName(event.target.value)} className="input" required />
        </Field>
        <Field label="Telephone">
          <input
            value={phone}
            onChange={(event) => setPhone(formatLocalPhone(event.target.value))}
            className="input"
            inputMode="numeric"
            maxLength={11}
            pattern="[0-9 ]{11}"
            required
          />
        </Field>
        <div className="grid grid-cols-2 gap-3">
          <button type="button" onClick={onDone} className="soft-button">
            Annuler
          </button>
          <button disabled={busy} className="primary-button">
            Enregistrer
          </button>
        </div>
      </form>
    </Card>
  );
}

function MeasurementEditor({ userId, client }: { userId: string; client: Client }) {
  const initialValues = useMemo(() => {
    return MEASUREMENT_CODES.reduce(
      (acc, code) => {
        acc[code] = client.measurements?.find((item) => item.code === code)?.value?.toString() || "";
        return acc;
      },
      {} as Record<MeasurementCode, string>,
    );
  }, [client]);

  const [values, setValues] = useState(initialValues);
  const [editing, setEditing] = useState(false);
  const [busy, setBusy] = useState(false);

  useEffect(() => setValues(initialValues), [initialValues]);

  async function submit(event: FormEvent) {
    event.preventDefault();
    setBusy(true);
    const measurements = MEASUREMENT_CODES.flatMap((code) => {
      const value = Number(values[code]);
      if (!value) return [];
      return [{ code, value, updatedAt: Timestamp.now() } satisfies Measurement];
    });

    await saveMeasurements(userId, client.id, measurements);
    setEditing(false);
    setBusy(false);
  }

  return (
    <Card>
      <form onSubmit={submit} className="space-y-4">
        <div className="flex items-center justify-between gap-3">
          <h2 className="section-title">Mesures</h2>
          <button type="button" onClick={() => setEditing(true)} className="small-action">
            Modifier tout
          </button>
        </div>
        <div className="grid grid-cols-2 gap-3">
          {MEASUREMENT_CODES.map((code) => (
            <label key={code} className="measurement-card">
              <span className="text-xs font-black text-[#08669a]">{code}</span>
              <span className="truncate text-[11px] font-semibold text-slate-400">{MEASUREMENT_LABELS[code]}</span>
              <input
                value={values[code]}
                onChange={(event) => setValues((current) => ({ ...current, [code]: twoDigitNumber(event.target.value) }))}
                disabled={!editing}
                className="mt-2 w-full bg-transparent text-2xl font-black text-slate-950 outline-none disabled:text-slate-700"
                inputMode="numeric"
                maxLength={2}
                pattern="[0-9]{0,2}"
                placeholder="0"
              />
            </label>
          ))}
        </div>
        {editing && (
          <button disabled={busy} className="primary-button w-full">
            Sauvegarder les mesures
          </button>
        )}
      </form>
      <div className="mt-5 border-t border-slate-100 pt-4">
        <h3 className="mb-3 text-sm font-black text-slate-700">Historique des mesures</h3>
        {!client.measurementsHistory?.length ? (
          <p className="rounded-2xl bg-slate-50 p-3 text-sm font-semibold text-slate-500">
            Aucun historique pour le moment.
          </p>
        ) : (
          <div className="space-y-2">
            {client.measurementsHistory
              .slice()
              .reverse()
              .slice(0, 3)
              .map((entry, index) => (
                <details key={`${formatDateTime(entry.updatedAt)}-${index}`} className="rounded-2xl bg-slate-50 p-3">
                  <summary className="cursor-pointer text-sm font-black text-slate-700">
                    {formatDateTime(entry.updatedAt)}
                  </summary>
                  <div className="mt-3 grid grid-cols-4 gap-2">
                    {entry.measurements.map((measurement) => (
                      <span key={measurement.code} className="rounded-xl bg-white p-2 text-center text-xs font-black text-slate-700">
                        {measurement.code}: {measurement.value}
                      </span>
                    ))}
                  </div>
                </details>
              ))}
          </div>
        )}
      </div>
    </Card>
  );
}

function OrdersPage({ userId, clients, orders }: { userId: string; clients: Client[]; orders: Order[] }) {
  return (
    <div className="space-y-5">
      <OrderForm userId={userId} clients={clients} />
      <div className="space-y-3">
        {orders.length === 0 ? (
          <EmptyText text="Aucune commande." />
        ) : (
          orders.map((order) => <OrderRow key={order.id} order={order} userId={userId} />)
        )}
      </div>
    </div>
  );
}

function OrderForm({
  userId,
  clients,
  defaultClientId = "",
  compact = false,
}: {
  userId: string;
  clients: Client[];
  defaultClientId?: string;
  compact?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<NewOrderInput>({
    clientId: defaultClientId,
    type: "",
    price: 0,
    advance: 0,
    deliveryDate: today(),
    status: "pending",
    note: "",
    imageUrl: "",
  });
  const [busy, setBusy] = useState(false);

  useEffect(() => setForm((current) => ({ ...current, clientId: defaultClientId || current.clientId })), [defaultClientId]);

  async function submit(event: FormEvent) {
    event.preventDefault();
    setBusy(true);
    const client = clients.find((item) => item.id === form.clientId);
    await createOrder(userId, form, client?.name);
    setForm({ clientId: defaultClientId, type: "", price: 0, advance: 0, deliveryDate: today(), status: "pending", note: "", imageUrl: "" });
    setOpen(false);
    setBusy(false);
  }

  if (!open) {
    return (
      <button onClick={() => setOpen(true)} disabled={clients.length === 0} className={compact ? "soft-button w-full" : "primary-button w-full"}>
        Ajouter une commande
      </button>
    );
  }

  return (
    <Card>
      <form onSubmit={submit} className="space-y-4">
        {!defaultClientId && (
          <Field label="Client">
            <select
              value={form.clientId}
              onChange={(event) => setForm({ ...form, clientId: event.target.value })}
              className="input"
              required
            >
              <option value="">Choisir</option>
              {clients.map((client) => (
                <option key={client.id} value={client.id}>
                  {client.name}
                </option>
              ))}
            </select>
          </Field>
        )}
        <div className="grid grid-cols-2 gap-3">
          <Field label="Tenue">
            <input
              value={form.type}
              onChange={(event) => setForm({ ...form, type: event.target.value })}
              className="input"
              placeholder="Robe"
              required
            />
          </Field>
          <Field label="Prix">
            <input
              value={form.price || ""}
              onChange={(event) => setForm({ ...form, price: numericAmount(event.target.value) })}
              className="input"
              inputMode="numeric"
              required
            />
          </Field>
        </div>
        <Field label="Avance payee">
          <input
            value={form.advance || ""}
            onChange={(event) => setForm({ ...form, advance: Math.min(numericAmount(event.target.value), form.price || 0) })}
            className="input"
            inputMode="numeric"
            placeholder="0"
          />
        </Field>
        <div className="rounded-3xl bg-[#e8f3f8] p-4 text-sm font-black text-[#08669a]">
          Reste a payer: {money(Math.max((form.price || 0) - (form.advance || 0), 0))}
        </div>
        <Field label="Date livraison">
          <input
            type="date"
            value={form.deliveryDate}
            onChange={(event) => setForm({ ...form, deliveryDate: event.target.value })}
            className="input"
            required
          />
        </Field>
        <Field label="Note">
          <textarea
            value={form.note}
            onChange={(event) => setForm({ ...form, note: event.target.value })}
            className="input min-h-20"
            placeholder="Tissu, avance, details..."
          />
        </Field>
        <Field label="Photo du modele">
          <input
            value={form.imageUrl || ""}
            onChange={(event) => setForm({ ...form, imageUrl: event.target.value })}
            className="input"
            placeholder="Lien photo"
          />
        </Field>
        <div className="grid grid-cols-2 gap-3">
          <button type="button" onClick={() => setOpen(false)} className="soft-button">
            Annuler
          </button>
          <button disabled={busy} className="primary-button">
            Creer
          </button>
        </div>
      </form>
    </Card>
  );
}

function OrderRow({ order, userId, compact = false }: { order: Order; userId?: string; compact?: boolean }) {
  const late = isLate(order);
  const advance = Number(order.advance || 0);
  const balance = Math.max(Number(order.price || 0) - advance, 0);
  const message = encodeURIComponent(
    `Bonjour ${order.clientName || "cliente"}, votre commande est en cours. Livraison: ${order.deliveryDate}, Prix: ${money(order.price)}, Avance: ${money(advance)}, Reste: ${money(balance)}`,
  );

  return (
    <article className="rounded-[2rem] bg-white p-4 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="truncate text-lg font-black">{order.type}</p>
          <p className="truncate text-sm font-semibold text-slate-500">{order.clientName || "Client"}</p>
        </div>
        <StatusBadge status={order.status} late={late} />
      </div>
      <div className="mt-4 grid grid-cols-2 gap-3">
        <InfoPill label="Prix" value={money(order.price)} />
        <InfoPill label="Avance" value={money(advance)} />
        <InfoPill label="Reste" value={money(balance)} tone={balance > 0 ? "danger" : "default"} />
        <InfoPill label={late ? "En retard" : "Livraison"} value={order.deliveryDate} tone={late ? "danger" : "default"} />
      </div>
      {!compact && order.note && <p className="mt-3 rounded-2xl bg-slate-50 p-3 text-sm text-slate-600">{order.note}</p>}
      {!compact && order.imageUrl && (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={order.imageUrl} alt={order.type} className="mt-3 max-h-64 w-full rounded-3xl object-cover ring-1 ring-slate-100" />
      )}
      {!compact && userId && (
        <div className="mt-4 grid grid-cols-2 gap-3">
          {order.status === "pending" && (
            <button onClick={() => updateOrderStatus(userId, order.id, "ready")} className="soft-button">
              Marquer prete
            </button>
          )}
          {order.status !== "delivered" && (
            <button onClick={() => updateOrderStatus(userId, order.id, "delivered")} className="primary-button">
              Livree
            </button>
          )}
          <a href={`https://wa.me/?text=${message}`} target="_blank" rel="noreferrer" className="whatsapp-button text-center">
            WhatsApp
          </a>
        </div>
      )}
    </article>
  );
}

function ProfilePage({
  phone,
  online,
  clientsCount,
  ordersCount,
  onLogout,
}: {
  phone: string;
  online: boolean;
  clientsCount: number;
  ordersCount: number;
  onLogout: () => void;
}) {
  const [notificationStatus, setNotificationStatus] = useState(
    typeof Notification === "undefined" ? "non disponible" : Notification.permission,
  );

  async function enableNotifications() {
    if (typeof Notification === "undefined") {
      setNotificationStatus("non disponible");
      return;
    }

    const permission = await Notification.requestPermission();
    setNotificationStatus(permission);

    if (permission === "granted") {
      new Notification("Couture App", {
        body: "Les rappels de livraison sont actives sur cet appareil.",
      });
    }
  }

  return (
    <div className="space-y-5">
      <Card>
        <div className="flex items-center gap-4">
          <div className="flex h-16 w-16 items-center justify-center rounded-3xl bg-[#08669a] text-2xl font-black text-white">
            C
          </div>
          <div>
            <h2 className="text-xl font-black">Atelier</h2>
            <p className="text-sm font-semibold text-slate-500">{phone}</p>
          </div>
        </div>
      </Card>
      <Card>
        <h2 className="section-title">Sauvegarde</h2>
        <div className="mt-4 space-y-3">
          <InfoLine label="Connexion" value={online ? "Synchronisee" : "Hors ligne"} />
          <InfoLine label="Clients" value={`${clientsCount}`} />
          <InfoLine label="Commandes" value={`${ordersCount}`} />
        </div>
      </Card>
      <Card>
        <h2 className="section-title">Rappels</h2>
        <p className="mt-2 text-sm font-semibold text-slate-500">
          Activez les notifications de cet appareil pour les rappels de livraison.
        </p>
        <div className="mt-4 space-y-3">
          <InfoLine label="Notifications" value={notificationStatus} />
          <button onClick={enableNotifications} className="primary-button w-full">
            Activer les rappels
          </button>
        </div>
      </Card>
      <button onClick={onLogout} className="soft-button w-full text-rose-700">
        Se deconnecter
      </button>
    </div>
  );
}

function BottomNav({ activeTab, onChange }: { activeTab: Tab; onChange: (tab: Tab) => void }) {
  return (
    <nav className="fixed inset-x-0 bottom-0 z-30 bg-white/95 px-3 py-3 shadow-[0_-10px_30px_rgba(15,23,42,0.08)] backdrop-blur">
      <div className="mx-auto grid max-w-md grid-cols-4 gap-2">
        {tabs.map((item) => (
          <button
            key={item.id}
            onClick={() => onChange(item.id)}
            className={`rounded-2xl px-2 py-2 text-center text-xs font-black ${
              activeTab === item.id ? "bg-[#08669a] text-white shadow-sm" : "text-slate-500"
            }`}
          >
            <span className="block text-lg leading-5">{item.icon}</span>
            {item.label}
          </button>
        ))}
      </div>
    </nav>
  );
}

function ScreenShell({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <main className="flex min-h-screen items-center justify-center bg-[#f3f5f7] px-4">
      <section className="w-full max-w-sm rounded-[2rem] bg-white p-6 shadow-sm">
        <h1 className="mb-4 text-3xl font-black text-slate-950">{title}</h1>
        {children}
      </section>
    </main>
  );
}

function Card({ children }: { children: React.ReactNode }) {
  return <section className="rounded-[2rem] bg-white p-4 shadow-sm">{children}</section>;
}

function Metric({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-[1.75rem] bg-white p-4 shadow-sm">
      <p className="text-xs font-black uppercase text-slate-400">{label}</p>
      <p className="mt-2 text-3xl font-black text-[#08669a]">{value}</p>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block space-y-2">
      <span className="text-sm font-black text-slate-700">{label}</span>
      {children}
    </label>
  );
}

function StatusBadge({ status, late }: { status: OrderStatus; late: boolean }) {
  const statusClass = late
    ? "bg-rose-50 text-rose-700"
    : status === "delivered"
      ? "bg-slate-100 text-slate-600"
      : status === "ready"
        ? "bg-blue-50 text-blue-700"
        : "bg-amber-50 text-amber-700";
  const label = late ? "Retard" : orderStatuses.find((item) => item.value === status)?.label;

  return <span className={`rounded-full px-3 py-1 text-xs font-black ${statusClass}`}>{label}</span>;
}

function InfoPill({ label, value, tone = "default" }: { label: string; value: string; tone?: "default" | "danger" }) {
  return (
    <div className={`rounded-3xl p-3 ${tone === "danger" ? "bg-rose-50 text-rose-700" : "bg-[#f4f6f8] text-slate-700"}`}>
      <p className="text-xs font-black uppercase opacity-70">{label}</p>
      <p className="mt-1 text-sm font-black">{value}</p>
    </div>
  );
}

function InfoLine({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between rounded-3xl bg-[#f4f6f8] p-3">
      <span className="font-bold text-slate-500">{label}</span>
      <span className="font-black text-slate-900">{value}</span>
    </div>
  );
}

function SyncBadge({ online }: { online: boolean }) {
  return (
    <span className={`rounded-full px-3 py-2 text-xs font-black ${online ? "bg-[#e8f3f8] text-[#08669a]" : "bg-amber-100 text-amber-800"}`}>
      {online ? "Sync" : "Offline"}
    </span>
  );
}

function EmptyText({ text }: { text: string }) {
  return <p className="rounded-[2rem] bg-white p-5 text-center text-sm font-semibold text-slate-500 shadow-sm">{text}</p>;
}

function LoadingCard() {
  return (
    <div className="rounded-[2rem] bg-white p-4 text-sm font-black text-slate-500 shadow-sm">
      Synchronisation des donnees...
    </div>
  );
}

function ErrorBanner({ message }: { message: string }) {
  return (
    <div className="rounded-[2rem] bg-rose-50 p-4 text-sm font-bold text-rose-700">
      Firestore: {message}
    </div>
  );
}
