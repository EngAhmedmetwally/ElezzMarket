'use client';

import { useState, useEffect } from 'react';
import {
  Query as RTDBQuery,
  onValue,
  off,
  DatabaseReference,
  DataSnapshot,
} from 'firebase/database';
import { errorEmitter } from '@/firebase/error-emitter';

/** Utility type to add an 'id' field to a given type T. */
export type WithId<T> = T & { id: string };

/**
 * Interface for the return value of the useCollection hook.
 * @template T Type of the document data.
 */
export interface UseCollectionResult<T> {
  data: WithId<T>[] | null; // Document data with ID, or null.
  isLoading: boolean;       // True if loading.
  error: Error | null; // Error object, or null.
}

/**
 * React hook to subscribe to a Firebase Realtime Database path or query.
 * Handles nullable references/queries.
 * 
 * IMPORTANT! YOU MUST MEMOIZE the inputted memoizedTargetRefOrQuery or BAD THINGS WILL HAPPEN
 * use useMemoFirebase to memoize it per React guidance.
 *  
 * @template T Optional type for document data. Defaults to any.
 * @param {DatabaseReference | RTDBQuery | null | undefined} memoizedTargetRefOrQuery -
 * The Realtime Database reference or query. Waits if null/undefined.
 * @returns {UseCollectionResult<T>} Object with data, isLoading, error.
 */
export function useCollection<T = any>(
    memoizedTargetRefOrQuery: (RTDBQuery | DatabaseReference) & {__memo?: boolean} | null | undefined,
): UseCollectionResult<T> {
  type ResultItemType = WithId<T>;
  type StateDataType = ResultItemType[] | null;

  const [data, setData] = useState<StateDataType>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!memoizedTargetRefOrQuery) {
      setData(null);
      setIsLoading(false);
      setError(null);
      return;
    }

    setIsLoading(true);
    setError(null);

    const listener = onValue(
      memoizedTargetRefOrQuery,
      (snapshot: DataSnapshot) => {
        const rawData = snapshot.val();
        if (rawData && typeof rawData === 'object') {
          const results: ResultItemType[] = Object.keys(rawData).map(key => ({
            ...(rawData[key] as T),
            id: key,
          }));
          setData(results);
        } else {
          setData([]); // Handle case where path is valid but has no data
        }
        setError(null);
        setIsLoading(false);
      },
      (error: Error) => {
        console.error("RTDB useCollection Error:", error);
        setError(error);
        setData(null);
        setIsLoading(false);
        // Emitting a generic error. The specific permission error system was Firestore-specific.
        errorEmitter.emit('permission-error', error as any);
      }
    );

    return () => off(memoizedTargetRefOrQuery, 'value', listener);
  }, [memoizedTargetRefOrQuery]);

  if(memoizedTargetRefOrQuery && !(memoizedTargetRefOrQuery as any).__memo) {
    throw new Error('useCollection query must be memoized with useMemoFirebase');
  }
  return { data, isLoading, error };
}
