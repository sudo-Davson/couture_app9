import type { Timestamp } from "firebase/firestore";

export type MeasurementCode =
  | "EP"
  | "BS"
  | "SS"
  | "TN"
  | "P"
  | "CL"
  | "CTR"
  | "H"
  | "JL"
  | "RBL"
  | "MT"
  | "ML"
  | "TC";

export type Measurement = {
  code: MeasurementCode;
  value: number;
  updatedAt: Timestamp;
};

export type MeasurementHistoryEntry = {
  measurements: Measurement[];
  updatedAt: Timestamp;
};

export type Client = {
  id: string;
  name: string;
  phone: string;
  measurements: Measurement[];
  measurementsHistory?: MeasurementHistoryEntry[];
  createdAt: Timestamp;
  updatedAt: Timestamp;
};

export type OrderStatus = "pending" | "ready" | "delivered";

export type Order = {
  id: string;
  clientId: string;
  clientName?: string;
  type: string;
  price: number;
  advance: number;
  deliveryDate: string;
  status: OrderStatus;
  note: string;
  imageUrl?: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
};

export type NewClientInput = {
  name: string;
  phone: string;
};

export type NewOrderInput = {
  clientId: string;
  type: string;
  price: number;
  advance: number;
  deliveryDate: string;
  status: OrderStatus;
  note: string;
  imageUrl?: string;
};

export const MEASUREMENT_LABELS: Record<MeasurementCode, string> = {
  EP: "Epaule",
  BS: "Bout de sein",
  SS: "Sous-sein",
  TN: "Taille normale",
  P: "Poitrine",
  CL: "Corsage longueur",
  CTR: "Ceinture",
  H: "Hanche",
  JL: "Jupe longueur",
  RBL: "Robe longueur",
  MT: "Manche tour",
  ML: "Manche longueur",
  TC: "Tour cuisse",
};

export const MEASUREMENT_CODES = Object.keys(MEASUREMENT_LABELS) as MeasurementCode[];
