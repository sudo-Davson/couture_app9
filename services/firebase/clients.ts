import {
  addDoc,
  arrayUnion,
  collection,
  doc,
  getDocs,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  Timestamp,
  updateDoc,
  where,
  writeBatch,
  type Unsubscribe,
} from "firebase/firestore";
import { getFirebaseDb } from "@/lib/firebase";
import type { Client, Measurement, NewClientInput } from "@/types";

const userClientsCollection = (userId: string) => collection(getFirebaseDb(), "users", userId, "clients");
const userClientDoc = (userId: string, clientId: string) => doc(getFirebaseDb(), "users", userId, "clients", clientId);

export function createClient(userId: string, input: NewClientInput) {
  return addDoc(userClientsCollection(userId), {
    name: input.name.trim(),
    phone: input.phone.trim(),
    measurements: [],
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
}

export function getClients(
  userId: string,
  onChange: (clients: Client[]) => void,
  onError?: (error: Error) => void,
): Unsubscribe {
  const clientsQuery = query(userClientsCollection(userId), orderBy("createdAt", "desc"));

  return onSnapshot(
    clientsQuery,
    (snapshot) => {
      const clients = snapshot.docs.map((item) => ({ id: item.id, ...item.data() }) as Client);
      onChange(clients);
    },
    (error) => onError?.(error),
  );
}

export function updateClient(userId: string, clientId: string, input: Partial<NewClientInput>) {
  return updateDoc(userClientDoc(userId, clientId), {
    ...("name" in input ? { name: input.name?.trim() } : {}),
    ...("phone" in input ? { phone: input.phone?.trim() } : {}),
    updatedAt: serverTimestamp(),
  });
}

export async function deleteClient(userId: string, clientId: string) {
  const db = getFirebaseDb();
  const ordersQuery = query(collection(db, "users", userId, "orders"), where("clientId", "==", clientId));
  const ordersSnapshot = await getDocs(ordersQuery);
  const batch = writeBatch(db);

  ordersSnapshot.docs.forEach((orderDoc) => batch.delete(orderDoc.ref));
  batch.delete(userClientDoc(userId, clientId));

  await batch.commit();
}

export function saveMeasurements(userId: string, clientId: string, measurements: Measurement[]) {
  return updateDoc(userClientDoc(userId, clientId), {
    measurements,
    measurementsHistory: arrayUnion({
      measurements,
      updatedAt: Timestamp.now(),
    }),
    updatedAt: serverTimestamp(),
  });
}
