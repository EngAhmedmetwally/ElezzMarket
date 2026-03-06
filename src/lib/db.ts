
'use client';

const DB_NAME = 'ElEzzMarketDB';
const DB_VERSION = 85; 
const STORES = ['orders', 'users', 'products', 'shipping-zones', 'commission-rules', 'customers', 'app-settings', 'receipt-settings', 'sync-timestamps', 'commissions', 'order-statuses', 'adjustments'];

let db: IDBDatabase | null = null;

const openDB = (): Promise<IDBDatabase> => {
  return new Promise((resolve, reject) => {
    if (db) {
      return resolve(db);
    }
    if (typeof window === 'undefined') {
        reject('IndexedDB can only be used in the browser.');
        return;
    }

    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = (event) => {
      console.error('IndexedDB error:', request.error);
      reject('Error opening IndexedDB.');
    };

    request.onblocked = () => {
        console.warn('IndexedDB is blocked. Please close other tabs of this app.');
    };

    request.onsuccess = () => {
      db = request.result;
      db.onversionchange = () => {
          db?.close();
          db = null;
          if (typeof window !== 'undefined') window.location.reload();
      };
      resolve(db);
    };

    request.onupgradeneeded = (event) => {
      const dbInstance = (event.target as IDBOpenDBRequest).result;
      STORES.forEach(storeName => {
        if (!dbInstance.objectStoreNames.contains(storeName)) {
            if (['orders', 'users', 'products', 'shipping-zones', 'commission-rules', 'customers', 'commissions', 'order-statuses', 'adjustments'].includes(storeName)) {
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
    const db = await openDB();
    return new Promise((resolve, reject) => {
        const transaction = db.transaction(storeName, 'readwrite');
        const store = transaction.objectStore(storeName);
        const request = store.put(value);
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
    });
};

export const idbBulkPut = async (storeName: string, values: any[]): Promise<void> => {
    if (!values || values.length === 0) return;
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
};

export const idbDelete = async (storeName: string, key: IDBValidKey): Promise<void> => {
    const db = await openDB();
    return new Promise((resolve, reject) => {
        const transaction = db.transaction(storeName, 'readwrite');
        const store = transaction.objectStore(storeName);
        const request = store.delete(key);
        request.onsuccess = () => resolve();
        request.onerror = () => reject(request.error);
    });
};

export const idbClear = async (storeName: string): Promise<void> => {
    const db = await openDB();
    return new Promise((resolve, reject) => {
        const transaction = db.transaction(storeName, 'readwrite');
        const store = transaction.objectStore(storeName);
        const request = store.clear();
        request.onsuccess = () => resolve();
        request.onerror = () => reject(request.error);
    });
};
