
'use client';
import { useState, useEffect, useCallback } from 'react';
import { useDatabase } from '@/firebase';
import { ref, onValue, off } from 'firebase/database';
import { idbGetAll, idbBulkPut, idbGetAllKeys, idbDelete } from '@/lib/db';
import type { Order } from '@/lib/types';

// Helper to handle the nested order structure with safety checks
const processOrdersSnapshot = (data: any): Order[] => {
    if (!data || typeof data !== 'object') return [];
    const allOrders: Order[] = [];

    try {
        Object.keys(data).forEach(year => {
            const yearData = data[year];
            if (!yearData || typeof yearData !== 'object') return;

            Object.keys(yearData).forEach(month => {
                const monthData = yearData[month];
                if (!monthData || typeof monthData !== 'object') return;

                Object.keys(monthData).forEach(day => {
                    const dayData = monthData[day];
                    if (!dayData || typeof dayData !== 'object') return;

                    Object.keys(dayData).forEach(orderId => {
                        const order = dayData[orderId];
                        if (order && typeof order === 'object' && order.createdAt) {
                            const orderPath = `orders/${year}/${month}/${day}/${orderId}`;
                            allOrders.push({ ...order, id: orderId, path: orderPath });
                        }
                    });
                });
            });
        });
    } catch (e) {
        console.error("Error processing orders snapshot:", e);
    }
    return allOrders;
};

const objectToArray = (data: object | null | undefined): any[] => {
    if (!data || typeof data !== 'object') return [];
    return Object.entries(data).map(([key, value]) => {
        if (value && typeof value === 'object') {
            return { ...value, id: key };
        }
        return null;
    }).filter(Boolean);
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
    
    useEffect(() => {
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
            
            if (snapshot.exists() && remoteData) {
                if (collectionName === 'orders') {
                    remoteDataArray = processOrdersSnapshot(remoteData);
                } else if (['app-settings', 'receipt-settings'].includes(collectionName)) {
                     if (remoteData.main) {
                        remoteDataArray.push({id: 'main', ...remoteData.main});
                     }
                } else {
                    remoteDataArray = objectToArray(remoteData);
                }
            }
            
            try {
                const localKeys = await idbGetAllKeys(collectionName);
                const remoteKeys = new Set(remoteDataArray.map(item => item.id));

                const keysToDelete = localKeys.filter(key => typeof key === 'string' && !remoteKeys.has(key));

                if (keysToDelete.length > 0) {
                    await Promise.all(keysToDelete.map(key => idbDelete(collectionName, key)));
                }
                
                if (remoteDataArray.length > 0) {
                    await idbBulkPut(collectionName, remoteDataArray);
                }

                if (isMounted) {
                    await updateCacheAndState();
                }
            } catch (err) {
                console.error("Cache update failed:", err);
            }
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
