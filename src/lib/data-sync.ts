
'use client';
import { ref, get, type Database } from "firebase/database";
import { idbBulkPut, idbGet, idbPut } from './db';
import type { Order } from './types';
import { syncEvents } from './sync-events';


const SYNC_INTERVAL = 5 * 60 * 1000; // 5 minutes

const objectToArray = (data: object | null | undefined) => {
    if (!data) return [];
    return Object.entries(data).map(([key, value]) => ({ ...value, id: key }));
};

const collectionsToSync = ['orders', 'users', 'products', 'shipping-zones', 'commission-rules', 'customers', 'app-settings', 'receipt-settings', 'commissions'];

export async function syncAllData(database: Database, force: boolean = false) {
    console.log("Starting data sync...");
    const syncPromises = collectionsToSync.map(collection => syncCollection(database, collection, force));
    await Promise.all(syncPromises);
    console.log("Data sync complete.");
    syncEvents.emit('full-sync-complete');
}

export async function syncCollection(database: Database, collectionName: string, force: boolean = false) {
    const lastSync = await idbGet<{ collection: string; timestamp: number }>('sync-timestamps', collectionName);
    const now = Date.now();

    if (!force && lastSync && (now - lastSync.timestamp) < SYNC_INTERVAL) {
        return;
    }
    
    try {
        const collectionRef = ref(database, collectionName);
        const snapshot = await get(collectionRef);
        
        if (snapshot.exists()) {
            const data = snapshot.val();
            
            if (collectionName === 'orders') {
                const allOrders: Order[] = [];
                Object.keys(data).forEach(key1 => { // e.g., '1' or '02-2026'
                    const node1 = data[key1];
                    if (!node1 || typeof node1 !== 'object') return;

                    if (typeof node1.createdAt === 'string') { // Flat structure
                        const orderPath = `orders/${key1}`;
                        allOrders.push({ ...node1, id: key1, path: orderPath });
                    } else { // Nested structure
                        Object.keys(node1).forEach(key2 => { // e.g., '19'
                            const node2 = node1[key2];
                            if (!node2 || typeof node2 !== 'object') return;
                            Object.keys(node2).forEach(key3 => { // e.g., '1'
                                const order = node2[key3];
                                if (order && typeof order === 'object' && typeof order.createdAt === 'string') {
                                    const id = order.id || key3;
                                    const orderPath = `orders/${key1}/${key2}/${id}`;
                                    allOrders.push({ ...order, id: id, path: orderPath });
                                }
                            });
                        });
                    }
                });
                await idbBulkPut('orders', allOrders);
            } else if (collectionName === 'app-settings' || collectionName === 'receipt-settings') {
                 await idbPut(collectionName, {id: 'main', ...data});
            } else {
                const dataArray = objectToArray(data);
                await idbBulkPut(collectionName, dataArray);
            }
        }
        
        await idbPut('sync-timestamps', { collection: collectionName, timestamp: now });
        syncEvents.emit('synced', collectionName);

    } catch (error) {
        console.error(`Failed to sync collection ${collectionName}:`, error);
    }
}
