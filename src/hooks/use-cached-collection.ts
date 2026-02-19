'use client';
import { useState, useEffect, useCallback } from 'react';
import { idbGetAll } from '@/lib/db';
import { syncEvents } from '@/lib/sync-events';

export function useCachedCollection<T>(collectionName: string) {
    const [data, setData] = useState<T[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    const fetchData = useCallback(async () => {
        setIsLoading(true);
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
        let isMounted = true;
        
        if (isMounted) {
            fetchData();
        }

        const onSync = (syncedCollection: string) => {
            if (syncedCollection === collectionName || syncedCollection === 'all') {
                fetchData();
            }
        };

        syncEvents.on('synced', onSync);

        return () => {
            isMounted = false;
            syncEvents.off('synced', onSync);
        };
    }, [collectionName, fetchData]);

    return { data, isLoading, refetch: fetchData };
}
