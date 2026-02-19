'use client';
import { useState, useEffect, useCallback } from 'react';
import { useDatabase } from '@/firebase';
import { ref, onValue, off } from 'firebase/database';
import { idbGetAll, idbBulkPut, idbGetAllKeys, idbDelete } from '@/lib/db';
import type { Order } from '@/lib/types';

// Helper to handle the nested order structure
const processOrdersSnapshot = (data: any): Order[] => {
    if (!data) return [];
    const allOrders: Order[] = [];
    Object.keys(data).forEach(key1 => {
        const node1 = data[key1];
        if (!node1 || typeof node1 !== 'object') return;

        if (typeof node1.createdAt === 'string') {
            const orderPath = `orders/${key1}`;
            allOrders.push({ ...node1, id: key1, path: orderPath });
        } else {
            Object.keys(node1).forEach(key2 => {
                const node2 = node1[key2];
                if (!node2 || typeof node2 !== 'object') return;
                Object.keys(node2).forEach(key3 => {
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
    return allOrders;
}

const objectToArray = (data: object | null | undefined): any[] => {
    if (!data) return [];
    return Object.entries(data).map(([key, value]) => ({ ...(value as object), id: key }));
};

export function useRealtimeCachedCollection<T>(collectionName: string) {
    const [data, setData] = useState<T[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const database = useDatabase();

    const updateCacheAndState = useCallback(async () => {
        try {
            const cachedData = await idbGetAll<T>(collectionName);
            setData(cachedData);
        } catch (error) {
            console.error(`Error fetching ${collectionName} from IndexedDB:`, error);
            setData([]);
        } finally {
            setIsLoading(false);
        }
    }, [collectionName]);
    
    // Set up realtime listener
    useEffect(() => {
        // Load from cache immediately for fast initial render
        updateCacheAndState();

        if (!database) {
             setIsLoading(false);
             return;
        }

        let isMounted = true;
        const collectionRef = ref(database, collectionName);

        const listener = onValue(collectionRef, async (snapshot) => {
            if (!isMounted) return;

            let remoteDataArray: any[] = [];
            const remoteData = snapshot.val();
            
            if (snapshot.exists()) {
                if (collectionName === 'orders') {
                    remoteDataArray = processOrdersSnapshot(remoteData);
                } else if (['app-settings', 'receipt-settings'].includes(collectionName)) {
                    remoteDataArray.push({id: 'main', ...remoteData});
                } else {
                    remoteDataArray = objectToArray(remoteData);
                }
            }
            
            const localKeys = await idbGetAllKeys(collectionName);
            const remoteKeys = new Set(remoteDataArray.map(item => item.id));

            const keysToDelete = localKeys.filter(key => !remoteKeys.has(key as string));

            if (keysToDelete.length > 0) {
                const deletePromises = keysToDelete.map(key => idbDelete(collectionName, key));
                await Promise.all(deletePromises);
            }
            
            if (remoteDataArray.length > 0) {
                await idbBulkPut(collectionName, remoteDataArray);
            }

            // Update state with fresh data from IDB
            await updateCacheAndState();
        }, (error) => {
            console.error(`Firebase listener error on ${collectionName}:`, error);
        });

        return () => {
            isMounted = false;
            off(collectionRef, 'value', listener);
        };
    }, [database, collectionName, updateCacheAndState]);

    return { data, isLoading };
}
