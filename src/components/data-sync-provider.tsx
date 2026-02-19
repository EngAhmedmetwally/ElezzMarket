'use client';

import { useDatabase } from '@/firebase';
import { syncAllData } from '@/lib/data-sync';
import * as React from 'react';

export function DataSyncProvider({ children }: { children: React.ReactNode }) {
    const database = useDatabase();

    React.useEffect(() => {
        if (database) {
            syncAllData(database, false);
            const interval = setInterval(() => {
                syncAllData(database, false);
            }, 60 * 1000); // Sync every minute

            return () => clearInterval(interval);
        }
    }, [database]);

    return <>{children}</>;
}
