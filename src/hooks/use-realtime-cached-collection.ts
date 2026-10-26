
'use client';
import { useState, useEffect, useCallback } from 'react';
import { useDatabase } from '@/firebase';
import { ref, onValue, off, Query as RTDBQuery, DatabaseReference } from 'firebase/database';
import { idbGetAll, idbBulkPut, idbGetAllKeys, idbDelete } from '@/lib/db';
import type { Order } from '@/lib/types';

/**
 * Robust processing for orders. Handles both flat structure at root 
 * and old legacy nested structure (YYYY/MM/DD).
 */
const processOrdersSnapshot = (data: any): Order[] => {
    if (!data || typeof data !== 'object') return [];
    const allOrders: Order[] = [];

    try {
        Object.keys(data).forEach(key => {
            const item = data[key];
            if (!item || typeof item !== 'object') return;

            // Detect if it's a flat Order object at the root
            if (item.createdAt && item.customerName) {
                const orderPath = `orders/${key}`;
                allOrders.push({ ...item, id: key, path: orderPath });
            } else {
                // Handle legacy nested structure (year folders)
                Object.keys(item).forEach(month => {
                    const monthData = item[month];
                    if (!monthData || typeof monthData !== 'object') return;

                    Object.keys(monthData).forEach(day => {
                        const dayData = monthData[day];
                        if (!dayData || typeof dayData !== 'object') return;

                        Object.keys(dayData).forEach(orderId => {
                            const order = dayData[orderId];
                            if (order && typeof order === 'object' && order.createdAt) {
                                const orderPath = `orders/${key}/${month}/${day}/${orderId}`;
                                allOrders.push({ ...order, id: orderId, path: orderPath });
                            }
                        });
                    });
                });
            }
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
 * Enhanced hook to sync and cache RTDB collections with targeted queries.
 * Saves bandwidth by only downloading what's needed while keeping a local permanent cache.
 */
export function useRealtimeCachedCollection<T>(
    collectionName: string,
    memoizedQuery?: (RTDBQuery | DatabaseReference) & {__memo?: boolean} | null
) {
    const [data, setData] = useState<T[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const database = useDatabase();

    const updateCacheAndState = useCallback(async () => {
        try {
            const cachedData = await idbGetAll<T>(collectionName);
            // Sort orders locally if we have them all
            if (collectionName === 'orders') {
                cachedData.sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
            }
            setData(cachedData);
        } catch (error) {
            console.error(`Error fetching ${collectionName} from IndexedDB:`, error);
            setData([]);
        } finally {
            setIsLoading(false);
        }
    }, [collectionName]);
    
    useEffect(() => {
        // Don't do anything if the query is explicitly null (waiting for deps)
        if (memoizedQuery === null) return;
        
        updateCacheAndState();

        if (!database) {
             setIsLoading(false);
             return;
        }

        let isMounted = true;
        const targetRef = memoizedQuery || ref(database, collectionName);

        const listener = onValue(targetRef, async (snapshot) => {
            if (!isMounted) return;

            let remoteDataArray: any[] = [];
            const remoteData = snapshot.val();
            
            if (snapshot.exists() && remoteData) {
                if (collectionName === 'orders') {
                    // processOrdersSnapshot handles both flat root and legacy nested items
                    remoteDataArray = processOrdersSnapshot(remoteData);
                } else if (['app-settings', 'receipt-settings'].includes(collectionName)) {
                     if (remoteData.main) {
                        remoteDataArray.push({id: 'main', ...remoteData.main});
                     } else if (typeof remoteData === 'object' && !remoteData.id) {
                         remoteDataArray = objectToArray(remoteData);
                     }
                } else {
                    remoteDataArray = objectToArray(remoteData);
                }
            }
            
            try {
                // If it's a full collection sync (no query filters), we sync IDB exactly with remote
                const isFullSync = !memoizedQuery;

                if (isFullSync && remoteData) {
                    const localKeys = await idbGetAllKeys(collectionName);
                    const remoteKeys = new Set(remoteDataArray.map(item => item.id));
                    const keysToDelete = localKeys.filter(key => typeof key === 'string' && !remoteKeys.has(key));

                    if (keysToDelete.length > 0) {
                        await Promise.all(keysToDelete.map(key => idbDelete(collectionName, key)));
                    }
                }
                
                // Merge remote data into IDB (additive sync for queries, full sync for root)
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
