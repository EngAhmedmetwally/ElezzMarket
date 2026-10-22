
'use client';
import { useState, useEffect, useCallback } from 'react';
import { useDatabase } from '@/firebase';
import { ref, onValue, off, Query as RTDBQuery, DatabaseReference } from 'firebase/database';
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

/**
 * Enhanced hook to sync and cache RTDB collections with support for queries.
 * @param collectionName The IDB store name.
 * @param memoizedQuery Optional Firebase Query. If provided, incremental sync is used (local missing keys aren't deleted).
 */
export function useRealtimeCachedCollection<T>(
    collectionName: string,
    memoizedQuery?: (RTDBQuery | DatabaseReference) & {__memo?: boolean}
) {
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
        // Use the query if provided, otherwise listen to the full collection
        const targetRef = memoizedQuery || ref(database, collectionName);

        const listener = onValue(targetRef, async (snapshot) => {
            if (!isMounted) return;

            let remoteDataArray: any[] = [];
            const remoteData = snapshot.val();
            
            if (snapshot.exists() && remoteData) {
                if (collectionName === 'orders' && !memoizedQuery) {
                    remoteDataArray = processOrdersSnapshot(remoteData);
                } else if (['app-settings', 'receipt-settings'].includes(collectionName)) {
                     if (remoteData.main) {
                        remoteDataArray.push({id: 'main', ...remoteData.main});
                     } else if (typeof remoteData === 'object' && !remoteData.id) {
                         // Fallback for specific settings structure
                         remoteDataArray = objectToArray(remoteData);
                     }
                } else {
                    remoteDataArray = objectToArray(remoteData);
                }
            }
            
            try {
                // Determine if we are doing a full collection sync or a subset/incremental sync
                const isFullSync = !memoizedQuery;

                if (isFullSync) {
                    const localKeys = await idbGetAllKeys(collectionName);
                    const remoteKeys = new Set(remoteDataArray.map(item => item.id));
                    const keysToDelete = localKeys.filter(key => typeof key === 'string' && !remoteKeys.has(key));

                    if (keysToDelete.length > 0) {
                        await Promise.all(keysToDelete.map(key => idbDelete(collectionName, key)));
                    }
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
            off(targetRef, 'value', listener);
        };
    }, [database, collectionName, memoizedQuery, updateCacheAndState]);

    return { data, isLoading };
}
