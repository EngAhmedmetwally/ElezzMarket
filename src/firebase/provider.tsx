
'use client';

import React, { DependencyList, createContext, useContext, ReactNode, useMemo, useState, useEffect } from 'react';
import { FirebaseApp } from 'firebase/app';
import { Database, ref, onValue, off } from 'firebase/database';
import { User } from '@/lib/types';
import { FirebaseErrorListener } from '@/components/FirebaseErrorListener';

// Combined state for the Firebase context
export interface FirebaseContextState {
  areServicesAvailable: boolean; 
  firebaseApp: FirebaseApp | null;
  database: Database | null;
  user: User | null;
  isUserLoading: boolean; 
  connectionStatus: 'connected' | 'disconnected' | 'loading';
  login: (userData: User) => void;
  logout: () => void;
}

// React Context
export const FirebaseContext = createContext<FirebaseContextState | undefined>(undefined);

interface FirebaseProviderProps {
  children: ReactNode;
  firebaseApp: FirebaseApp;
  database: Database;
}

export const FirebaseProvider: React.FC<FirebaseProviderProps> = ({
  children,
  firebaseApp,
  database,
}) => {
  const [user, setUser] = useState<User | null>(null);
  const [isUserLoading, setIsUserLoading] = useState(true);
  const [connectionStatus, setConnectionStatus] = useState<'connected' | 'disconnected' | 'loading'>('loading');

  useEffect(() => {
    // Load user from localStorage on initial mount
    try {
      const storedUser = localStorage.getItem('user');
      if (storedUser) {
        setUser(JSON.parse(storedUser));
      }
    } catch (error) {
      console.error("Failed to load user from localStorage", error);
      localStorage.removeItem('user');
    } finally {
      setIsUserLoading(false);
    }
  }, []);

   useEffect(() => {
    if (!database) {
      setConnectionStatus('disconnected');
      return;
    }
    const connectedRef = ref(database, '.info/connected');
    const listener = onValue(connectedRef, (snap) => {
      setConnectionStatus(snap.val() === true ? 'connected' : 'disconnected');
    });
    return () => off(connectedRef, 'value', listener);
  }, [database]);

  const login = (userData: User) => {
    const userToStore = { ...userData };
    delete userToStore.password; // Don't store password in localStorage
    localStorage.setItem('user', JSON.stringify(userToStore));
    setUser(userToStore);
  };

  const logout = () => {
    localStorage.removeItem('user');
    setUser(null);
  };
  
  const contextValue = useMemo((): FirebaseContextState => {
    const servicesAvailable = !!(firebaseApp && database);
    return {
      areServicesAvailable: servicesAvailable,
      firebaseApp: servicesAvailable ? firebaseApp : null,
      database: servicesAvailable ? database : null,
      user,
      isUserLoading,
      connectionStatus,
      login,
      logout,
    };
  }, [firebaseApp, database, user, isUserLoading, connectionStatus]);

  return (
    <FirebaseContext.Provider value={contextValue}>
      <FirebaseErrorListener />
      {children}
    </FirebaseContext.Provider>
  );
};


// Hooks
const useFirebaseContext = () => {
    const context = useContext(FirebaseContext);
    if (context === undefined) {
        throw new Error('useFirebase hook must be used within a FirebaseProvider.');
    }
    return context;
}

export const useFirebase = (): any => {
    const context = useFirebaseContext();
     if (!context.areServicesAvailable || !context.firebaseApp || !context.database) {
        throw new Error('Firebase core services not available. Check FirebaseProvider props.');
    }
    return {
        firebaseApp: context.firebaseApp,
        database: context.database,
        user: context.user,
        isUserLoading: context.isUserLoading,
        login: context.login,
        logout: context.logout,
        auth: null, // Stub for compatibility
        userError: null,
    }
}

/** Hook to access Realtime Database instance. */
export const useDatabase = (): Database => {
  const { database } = useFirebase();
  return database;
};

/** Hook to access Firebase App instance. */
export const useFirebaseApp = (): FirebaseApp => {
  const { firebaseApp } = useFirebase();
  return firebaseApp;
};

/**
 * Hook specifically for accessing the authenticated user's state.
 * This provides the User object, loading status, and any auth errors.
 */
export interface UserHookResult { 
  user: User | null;
  isUserLoading: boolean;
  userError: Error | null;
}
export const useUser = (): UserHookResult => { 
  const { user, isUserLoading } = useFirebaseContext(); 
  return { user, isUserLoading, userError: null };
};

export const useAuthActions = () => {
    const { login, logout } = useFirebaseContext();
    return { login, logout };
}

/** Hook to access Firebase Auth instance. It's now a stub. */
export const useAuth = (): any => {
  return null;
};

/** Hook to access the current connection status to Firebase. */
export const useConnectionStatus = () => {
  const { connectionStatus } = useFirebaseContext();
  return connectionStatus;
}


// useMemoFirebase is a utility and can stay
type MemoFirebase <T> = T & {__memo?: boolean};

export function useMemoFirebase<T>(factory: () => T, deps: DependencyList): T | (MemoFirebase<T>) {
  const memoized = useMemo(factory, deps);
  
  if(typeof memoized !== 'object' || memoized === null) return memoized;
  (memoized as MemoFirebase<T>).__memo = true;
  
  return memoized;
}
