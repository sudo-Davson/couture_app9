import {
  addDoc,
  collection,
  doc,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  updateDoc,
  type Unsubscribe,
} from "firebase/firestore";
import { getFirebaseDb } from "@/lib/firebase";
import type { NewOrderInput, Order, OrderStatus } from "@/types";

const userOrdersCollection = (userId: string) => collection(getFirebaseDb(), "users", userId, "orders");
const userOrderDoc = (userId: string, orderId: string) => doc(getFirebaseDb(), "users", userId, "orders", orderId);

export function createOrder(userId: string, input: NewOrderInput, clientName?: string) {
  return addDoc(userOrdersCollection(userId), {
    ...input,
    clientName,
    price: Number(input.price),
    advance: Number(input.advance || 0),
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
}

export function listenOrders(
  userId: string,
  onChange: (orders: Order[]) => void,
  onError?: (error: Error) => void,
): Unsubscribe {
  const ordersQuery = query(userOrdersCollection(userId), orderBy("deliveryDate", "asc"));

  return onSnapshot(
    ordersQuery,
    (snapshot) => {
      const orders = snapshot.docs.map((item) => ({ id: item.id, ...item.data() }) as Order);
      onChange(orders);
    },
    (error) => onError?.(error),
  );
}

export function updateOrderStatus(userId: string, orderId: string, status: OrderStatus) {
  return updateDoc(userOrderDoc(userId, orderId), {
    status,
    updatedAt: serverTimestamp(),
  });
}

export function updateOrderData(userId: string, orderId: string, data: Partial<NewOrderInput>) {
  return updateDoc(userOrderDoc(userId, orderId), {
    ...data,
    updatedAt: serverTimestamp(),
  });
}
