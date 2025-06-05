import React, { createContext, useContext, useReducer, useEffect, ReactNode } from 'react';
import { SyncService } from '../services/syncService';
import { LocalDataService } from '../services/localDataService';
import NetInfo from '@react-native-community/netinfo';
import { type Schema } from '../../amplify/data/resource';

type Customer = Schema['Customer']['type'];

interface SyncState {
  customers: Customer[];
  syncStatus: {
    lastSync: number;
    pendingChanges: number;
    isOnline: boolean;
    isSyncing: boolean;
  };
  loading: boolean;
  error: string | null;
}

type SyncAction = 
  | { type: 'SET_CUSTOMERS'; payload: Customer[] }
  | { type: 'ADD_CUSTOMER'; payload: Customer }
  | { type: 'UPDATE_CUSTOMER'; payload: Customer }
  | { type: 'DELETE_CUSTOMER'; payload: string }
  | { type: 'SET_SYNC_STATUS'; payload: Partial<SyncState['syncStatus']> }
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_ERROR'; payload: string | null };

const initialState: SyncState = {
  customers: [],
  syncStatus: {
    lastSync: 0,
    pendingChanges: 0,
    isOnline: false,
    isSyncing: false,
  },
  loading: false,
  error: null,
};

const syncReducer = (state: SyncState, action: SyncAction): SyncState => {
  switch (action.type) {
    case 'SET_CUSTOMERS':
      return { ...state, customers: action.payload };
    
    case 'ADD_CUSTOMER':
      return { 
        ...state, 
        customers: [...state.customers, action.payload],
        syncStatus: { 
          ...state.syncStatus, 
          pendingChanges: state.syncStatus.pendingChanges + 1 
        }
      };
    
    case 'UPDATE_CUSTOMER':
      return {
        ...state,
        customers: state.customers.map(c => 
          c.id === action.payload.id ? action.payload : c
        ),
        syncStatus: { 
          ...state.syncStatus, 
          pendingChanges: state.syncStatus.pendingChanges + 1 
        }
      };
    
    case 'DELETE_CUSTOMER':
      return {
        ...state,
        customers: state.customers.filter(c => c.id !== action.payload),
        syncStatus: { 
          ...state.syncStatus, 
          pendingChanges: state.syncStatus.pendingChanges + 1 
        }
      };
    
    case 'SET_SYNC_STATUS':
      return {
        ...state,
        syncStatus: { ...state.syncStatus, ...action.payload }
      };
    
    case 'SET_LOADING':
      return { ...state, loading: action.payload };
    
    case 'SET_ERROR':
      return { ...state, error: action.payload };
    
    default:
      return state;
  }
};

interface SyncContextType {
  state: SyncState;
  dispatch: React.Dispatch<SyncAction>;
  actions: {
    syncNow: () => Promise<void>;
    fullSync: () => Promise<void>;
    startAutoSync: () => void;
    stopAutoSync: () => void;
  };
}

const SyncContext = createContext<SyncContextType | null>(null);

interface SyncProviderProps {
  children: ReactNode;
}

export const SyncProvider = ({ children }: SyncProviderProps) => {
  const [state, dispatch] = useReducer(syncReducer, initialState);

  // Load local data on mount
  useEffect(() => {
    loadLocalData();
    updateSyncStatus();
    
    // Monitor network status
    const unsubscribe = NetInfo.addEventListener(state => {
      dispatch({ 
        type: 'SET_SYNC_STATUS', 
        payload: { isOnline: state.isConnected || false } 
      });
    });

    return () => unsubscribe();
  }, []);

  const loadLocalData = async () => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      const customers = await LocalDataService.getCustomers();
      dispatch({ type: 'SET_CUSTOMERS', payload: customers });
    } catch (error) {
      dispatch({ type: 'SET_ERROR', payload: 'Failed to load local data' });
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  };

  const updateSyncStatus = async () => {
    const status = await SyncService.getSyncStatus();
    dispatch({ type: 'SET_SYNC_STATUS', payload: status });
  };

  const actions = {
    syncNow: async () => {
      dispatch({ type: 'SET_SYNC_STATUS', payload: { isSyncing: true } });
      try {
        const result = await SyncService.syncNow();
        if (result.success) {
          await updateSyncStatus();
        } else {
          dispatch({ type: 'SET_ERROR', payload: result.errors.join(', ') });
        }
      } catch (error) {
        dispatch({ type: 'SET_ERROR', payload: 'Sync failed' });
      } finally {
        dispatch({ type: 'SET_SYNC_STATUS', payload: { isSyncing: false } });
      }
    },

    fullSync: async () => {
      dispatch({ type: 'SET_SYNC_STATUS', payload: { isSyncing: true } });
      try {
        const result = await SyncService.fullSyncFromServer();
        if (result.success) {
          await loadLocalData(); // Reload local data
          await updateSyncStatus();
        } else {
          dispatch({ type: 'SET_ERROR', payload: result.errors.join(', ') });
        }
      } catch (error) {
        dispatch({ type: 'SET_ERROR', payload: 'Full sync failed' });
      } finally {
        dispatch({ type: 'SET_SYNC_STATUS', payload: { isSyncing: false } });
      }
    },

    startAutoSync: () => {
      SyncService.startAutoSync();
    },

    stopAutoSync: () => {
      SyncService.stopAutoSync();
    },
  };

  return (
    <SyncContext.Provider value={{ state, dispatch, actions }}>
      {children}
    </SyncContext.Provider>
  );
};

export const useSyncContext = () => {
  const context = useContext(SyncContext);
  if (!context) {
    throw new Error('useSyncContext must be used within SyncProvider');
  }
  return context;
};
