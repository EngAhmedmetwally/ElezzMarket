'use client';

const DB_NAME = 'ElEzzMarketDB';
const DB_VERSION = 2;
const STORES = ['orders', 'users', 'products', 'shipping-zones', 'commission-rules', 'customers', 'app-settings', 'receipt-settings', 'sync-timestamps', 'commissions'];

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

    request.onerror = () => {
      console.error('IndexedDB error:', request.error);
      reject('Error opening IndexedDB.');
    };

    request.onsuccess = () => {
      db = request.result;
      resolve(db);
    };

    request.onupgradeneeded = (event) => {
      const dbInstance = (event.target as IDBOpenDBRequest).result;
      STORES.forEach(storeName => {
        if (!dbInstance.objectStoreNames.contains(storeName)) {
            if (['orders', 'users', 'products', 'shipping-zones', 'commission-rules', 'customers', 'commissions'].includes(storeName)) {
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
    const db = await openDB();
    return new Promise((resolve, reject) => {
        const transaction = db.transaction(storeName, 'readonly');
        const store = transaction.objectStore(storeName);
        const request = store.get(key);
        request.onsuccess = () => resolve(request.result as T);
        request.onerror = () => reject(request.error);
    });
};

export const idbGetAll = async <T>(storeName: string): Promise<T[]> => {
    const db = await openDB();
    return new Promise((resolve, reject) => {
        const transaction = db.transaction(storeName, 'readonly');
        const store = transaction.objectStore(storeName);
        const request = store.getAll();
        request.onsuccess = () => resolve(request.result as T[]);
        request.onerror = () => reject(request.error);
    });
};

export const idbGetAllKeys = async (storeName: string): Promise<IDBValidKey[]> => {
    const db = await openDB();
    return new Promise((resolve, reject) => {
        const transaction = db.transaction(storeName, 'readonly');
        const store = transaction.objectStore(storeName);
        const request = store.getAllKeys();
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => {
            console.error(`Error getting all keys from ${storeName}:`, request.error);
            reject(request.error);
        };
    });
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
        transaction.onerror = () => {
            console.error(`Error bulk putting into ${storeName}:`, transaction.error);
            reject(transaction.error);
        };
        const store = transaction.objectStore(storeName);
        values.forEach(value => {
            if (value) {
                store.put(value);
            }
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
        request.onerror = () => {
            console.error(`Error deleting from ${storeName}:`, request.error);
            reject(request.error);
        };
    });
};

export const idbClear = async (storeName: string): Promise<void> => {
    const db = await openDB();
    return new Promise((resolve, reject) => {
        const transaction = db.transaction(storeName, 'readwrite');
        const store = transaction.objectStore(storeName);
        const request = store.clear();
        request.onsuccess = () => resolve();
        request.onerror = () => {
            console.error(`Error clearing store ${storeName}:`, request.error);
            reject(request.error);
        };
    });
};
