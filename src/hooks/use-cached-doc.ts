'use client';
import { useState, useEffect, useCallback } from 'react';
import { idbGet } from '@/lib/db';
import { syncEvents } from '@/lib/sync-events';

export function useCachedDoc<T>(collectionName: string, docId: string | null | undefined) {
    const [data, setData] = useState<T | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    const fetchData = useCallback(async () => {
        if (!docId) {
            setData(null);
            setIsLoading(false);
            return;
        }
        setIsLoading(true);
        try {
            const cachedData = await idbGet<T>(collectionName, docId);
            setData(cachedData || null);
        } catch (error) {
            console.error(`Error fetching ${docId} from ${collectionName} in IndexedDB:`, error);
            setData(null);
        } finally {
            setIsLoading(false);
        }
    }, [collectionName, docId]);

    useEffect(() => {
        fetchData();

        const onSync = (syncedCollection: string) => {
            if (syncedCollection === collectionName || syncedCollection === 'all') {
                fetchData();
            }
        };
        syncEvents.on('synced', onSync);

        return () => {
            syncEvents.off('synced', onSync);
        };
    }, [collectionName, fetchData]);

    return { data, isLoading, refetch: fetchData };
}
