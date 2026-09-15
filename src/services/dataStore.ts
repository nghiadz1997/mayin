import { db, isFirebaseConfigured } from "./firebase";
import {
  collection,
  doc,
  getDocs,
  getDoc,
  setDoc,
  updateDoc,
  deleteDoc,
  query,
  orderBy,
  Timestamp,
} from "firebase/firestore";
import {
  DEFAULT_DEPARTMENTS,
  DEFAULT_TONER_TYPES,
  DEFAULT_PRINTERS,
  DEFAULT_TRANSACTIONS,
  DEFAULT_REPAIRS,
  DEFAULT_TRANSFERS,
  DEFAULT_FAULT_REPORTS,
  DEFAULT_AUDIT_LOGS,
  DEFAULT_SETTINGS,
  DEMO_USERS,
} from "../lib/seedData";

// Tên các Collections trong Firestore & Local Cache Keys
export const COLLECTIONS = {
  DEPARTMENTS: "departments",
  TONER_TYPES: "tonerTypes",
  PRINTERS: "printers",
  TONER_TRANSACTIONS: "tonerTransactions",
  REPAIRS: "repairs",
  PRINTER_TRANSFERS: "printerTransfers",
  FAULT_REPORTS: "faultReports",
  AUDIT_LOGS: "auditLogs",
  SETTINGS: "settings",
  USERS: "users",
} as const;

type CollectionKey = keyof typeof COLLECTIONS;

function getInitialData(col: string) {
  switch (col) {
    case COLLECTIONS.DEPARTMENTS:
      return DEFAULT_DEPARTMENTS;
    case COLLECTIONS.TONER_TYPES:
      return DEFAULT_TONER_TYPES;
    case COLLECTIONS.PRINTERS:
      return DEFAULT_PRINTERS;
    case COLLECTIONS.TONER_TRANSACTIONS:
      return DEFAULT_TRANSACTIONS;
    case COLLECTIONS.REPAIRS:
      return DEFAULT_REPAIRS;
    case COLLECTIONS.PRINTER_TRANSFERS:
      return DEFAULT_TRANSFERS;
    case COLLECTIONS.FAULT_REPORTS:
      return DEFAULT_FAULT_REPORTS;
    case COLLECTIONS.AUDIT_LOGS:
      return DEFAULT_AUDIT_LOGS;
    case COLLECTIONS.SETTINGS:
      return [DEFAULT_SETTINGS];
    case COLLECTIONS.USERS:
      return DEMO_USERS;
    default:
      return [];
  }
}

// Local Storage Helper
function getLocalCollection<T>(colName: string): T[] {
  if (typeof window === "undefined") {
    return getInitialData(colName) as T[];
  }
  const key = `school_printers_${colName}`;
  const data = localStorage.getItem(key);
  if (!data) {
    const initial = getInitialData(colName);
    localStorage.setItem(key, JSON.stringify(initial));
    return initial as T[];
  }
  try {
    return JSON.parse(data);
  } catch {
    return getInitialData(colName) as T[];
  }
}

function setLocalCollection<T>(colName: string, items: T[]) {
  if (typeof window === "undefined") return;
  const key = `school_printers_${colName}`;
  localStorage.setItem(key, JSON.stringify(items));
}

// ===================== GENERIC CRUD OPERATIONS =====================

export async function getAllDocuments<T extends { id?: string }>(colName: string): Promise<T[]> {
  if (isFirebaseConfigured && db) {
    try {
      const colRef = collection(db, colName);
      const snapshot = await getDocs(colRef);
      return snapshot.docs.map((d) => ({ id: d.id, ...d.data() } as T));
    } catch (err) {
      console.warn(`Firestore read failed for ${colName}, falling back to cache/seed:`, err);
    }
  }
  return getLocalCollection<T>(colName);
}

export async function getDocumentById<T extends { id?: string }>(colName: string, id: string): Promise<T | null> {
  if (isFirebaseConfigured && db) {
    try {
      const docRef = doc(db, colName, id);
      const snapshot = await getDoc(docRef);
      if (snapshot.exists()) {
        return { id: snapshot.id, ...snapshot.data() } as T;
      }
      return null;
    } catch (err) {
      console.warn(`Firestore getDoc failed for ${colName}/${id}:`, err);
    }
  }
  const items = getLocalCollection<T>(colName);
  return items.find((item) => item.id === id) || null;
}

export async function createDocument<T extends { id: string }>(colName: string, data: T): Promise<T> {
  if (isFirebaseConfigured && db) {
    try {
      const docRef = doc(db, colName, data.id);
      await setDoc(docRef, { ...data, createdAt: new Date().toISOString() });
    } catch (err) {
      console.warn(`Firestore createDoc failed for ${colName}:`, err);
    }
  }
  const items = getLocalCollection<T>(colName);
  const updated = [data, ...items.filter((i) => i.id !== data.id)];
  setLocalCollection(colName, updated);
  return data;
}

export async function updateDocument<T extends { id?: string }>(colName: string, id: string, partial: Partial<T>): Promise<void> {
  if (isFirebaseConfigured && db) {
    try {
      const docRef = doc(db, colName, id);
      await updateDoc(docRef, { ...partial, updatedAt: new Date().toISOString() });
    } catch (err) {
      console.warn(`Firestore updateDoc failed for ${colName}/${id}:`, err);
    }
  }
  const items = getLocalCollection<T>(colName);
  const index = items.findIndex((i) => i.id === id);
  if (index !== -1) {
    items[index] = { ...items[index], ...partial, updatedAt: new Date().toISOString() };
    setLocalCollection(colName, items);
  }
}

export async function deleteDocument(colName: string, id: string): Promise<void> {
  if (isFirebaseConfigured && db) {
    try {
      const docRef = doc(db, colName, id);
      await deleteDoc(docRef);
    } catch (err) {
      console.warn(`Firestore deleteDoc failed for ${colName}/${id}:`, err);
    }
  }
  const items = getLocalCollection<{ id: string }>(colName);
  const updated = items.filter((i) => i.id !== id);
  setLocalCollection(colName, updated);
}

// Reset data to initial defaults
export function resetLocalData() {
  if (typeof window === "undefined") return;
  Object.values(COLLECTIONS).forEach((col) => {
    localStorage.removeItem(`school_printers_${col}`);
  });
}
