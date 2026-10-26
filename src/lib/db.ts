
'use client';

const DB_NAME = 'ElEzzMarketDB';
const DB_VERSION = 95; // Bumping version significantly to ensure clean state
const STORES = ['orders', 'users', 'products', 'shipping-zones', 'commission-rules', 'customers', 'app-settings', 'receipt-settings', 'sync-timestamps', 'commissions', 'order-statuses', 'adjustments', 'whatsapp-logs'];

let dbPromise: Promise<IDBDatabase> | null = null;

const openDB = (): Promise<IDBDatabase> => {
  if (dbPromise) return dbPromise;

  dbPromise = new Promise((resolve, reject) => {
    if (typeof window === 'undefined') {
        reject('IndexedDB can only be used in the browser.');
        return;
    }

    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = (event) => {
      console.error('IndexedDB error:', request.error);
      dbPromise = null; // Allow retry on error
      reject(request.error || 'Error opening IndexedDB.');
    };

    request.onsuccess = () => {
      const db = request.result;
      db.onversionchange = () => {
          db.close();
          dbPromise = null;
          if (typeof window !== 'undefined') window.location.reload();
      };
      resolve(db);
    };

    request.onupgradeneeded = (event) => {
      const dbInstance = (event.target as IDBOpenDBRequest).result;
      STORES.forEach(storeName => {
        if (!dbInstance.objectStoreNames.contains(storeName)) {
            if (['orders', 'users', 'products', 'shipping-zones', 'commission-rules', 'customers', 'commissions', 'order-statuses', 'adjustments', 'whatsapp-logs'].includes(storeName)) {
                 dbInstance.createObjectStore(storeName, { keyPath: 'id' });
            } else if (storeName === 'sync-timestamps') {
                dbInstance.createObjectStore(storeName, { keyPath: 'collection' });
            } else if (storeName === 'app-settings' || storeName === 'receipt-settings') {
                dbInstance.createObjectStore(storeName, { keyPath: 'id' });
            }
             else {
                 dbInstance.createObjectStore(storeName);
            }
        }
      });
    };
  });

  return dbPromise;
};

export const idbGet = async <T>(storeName: string, key: IDBValidKey): Promise<T | undefined> => {
    try {
        const db = await openDB();
        return new Promise((resolve, reject) => {
            const transaction = db.transaction(storeName, 'readonly');
            const store = transaction.objectStore(storeName);
            const request = store.get(key);
            request.onsuccess = () => resolve(request.result as T);
            request.onerror = () => reject(request.error);
        });
    } catch (e) {
        console.error(`IDB Get Error (${storeName}):`, e);
        return undefined;
    }
};

export const idbGetAll = async <T>(storeName: string): Promise<T[]> => {
    try {
        const db = await openDB();
        return new Promise((resolve, reject) => {
            const transaction = db.transaction(storeName, 'readonly');
            const store = transaction.objectStore(storeName);
            const request = store.getAll();
            request.onsuccess = () => resolve(request.result as T[]);
            request.onerror = () => reject(request.error);
        });
    } catch (e) {
        console.error(`IDB GetAll Error (${storeName}):`, e);
        return [];
    }
};

export const idbGetAllKeys = async (storeName: string): Promise<IDBValidKey[]> => {
    try {
        const db = await openDB();
        return new Promise((resolve, reject) => {
            const transaction = db.transaction(storeName, 'readonly');
            const store = transaction.objectStore(storeName);
            const request = store.getAllKeys();
            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    } catch (e) {
        console.error(`IDB GetAllKeys Error (${storeName}):`, e);
        return [];
    }
};

export const idbPut = async (storeName: string, value: any): Promise<IDBValidKey> => {
    try {
        const db = await openDB();
        return new Promise((resolve, reject) => {
            const transaction = db.transaction(storeName, 'readwrite');
            const store = transaction.objectStore(storeName);
            const request = store.put(value);
            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    } catch (e) {
        console.error(`IDB Put Error (${storeName}):`, e);
        throw e;
    }
};

export const idbBulkPut = async (storeName: string, values: any[]): Promise<void> => {
    if (!values || values.length === 0) return;
    try {
        const db = await openDB();
        return new Promise((resolve, reject) => {
            const transaction = db.transaction(storeName, 'readwrite');
            transaction.oncomplete = () => resolve();
            transaction.onerror = () => reject(transaction.error);
            const store = transaction.objectStore(storeName);
            values.forEach(value => {
                if (value) store.put(value);
            });
        });
    } catch (e) {
        console.error(`IDB BulkPut Error (${storeName}):`, e);
    }
};

export const idbDelete = async (storeName: string, key: IDBValidKey): Promise<void> => {
    try {
        const db = await openDB();
        return new Promise((resolve, reject) => {
            const transaction = db.transaction(storeName, 'readwrite');
            const store = transaction.objectStore(storeName);
            const request = store.delete(key);
            request.onsuccess = () => resolve();
            request.onerror = () => reject(request.error);
        });
    } catch (e) {
        console.error(`IDB Delete Error (${storeName}):`, e);
    }
};

export const idbClear = async (storeName: string): Promise<void> => {
    try {
        const db = await openDB();
        return new Promise((resolve, reject) => {
            const transaction = db.transaction(storeName, 'readwrite');
            const store = transaction.objectStore(storeName);
            const request = store.clear();
            request.onsuccess = () => resolve();
            request.onerror = () => reject(request.error);
        });
    } catch (e) {
        console.error(`IDB Clear Error (${storeName}):`, e);
    }
};
