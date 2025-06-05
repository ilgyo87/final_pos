import React, { createContext, useContext, useReducer, useEffect, ReactNode } from 'react';
import { SyncService } from '../services/syncService';
import { LocalDataService } from '../services/localDataService';
import NetInfo from '@react-native-community/netinfo';
import { type Schema } from '../../amplify/data/resource';
import { Alert } from 'react-native';
import { Amplify } from 'aws-amplify';

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
  loading: false
};

const syncReducer = (state: SyncState, action: SyncAction): SyncState => {
  switch (action.type) {
    case 'SET_CUSTOMERS':
      return { ...state, customers: action.payload };
    
    case 'ADD_CUSTOMER':
      return { 
        ...state, 
        customers: [...state.customers, action.payload] 
      };
      
    case 'UPDATE_CUSTOMER':
      return {
        ...state,
        customers: state.customers.map(customer => 
          customer.id === action.payload.id ? action.payload : customer
        )
      };
      
    case 'DELETE_CUSTOMER':
      return {
        ...state,
        customers: state.customers.filter(customer => customer.id !== action.payload)
      };
      
    case 'SET_SYNC_STATUS':
      return {
        ...state,
        syncStatus: { ...state.syncStatus, ...action.payload }
      };
    
    case 'SET_LOADING':
      return { ...state, loading: action.payload };
      
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

  // Initialize Amplify and check its configuration
  useEffect(() => {
    try {
      console.log('SyncProvider: Checking Amplify configuration');
      const config = Amplify.getConfig();
      console.log('SyncProvider: Current Amplify config:', JSON.stringify(config));
    } catch (error) {
      console.error('SyncProvider: Error checking Amplify config:', error);
      if (error instanceof Error) {
        console.error('Error message:', error.message);
      }
      
      // Try to initialize Amplify with empty config
      try {
        console.log('SyncProvider: Attempting to initialize Amplify');
        Amplify.configure({});
        console.log('SyncProvider: Amplify initialized successfully');
      } catch (initError) {
        console.error('SyncProvider: Failed to initialize Amplify:', initError);
        Alert.alert(
          "Configuration Error",
          "There was a problem initializing the data service. Sync features may not work correctly."
        );
      }
    }
  }, []);

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
      console.error('Failed to load local data:', error);
      Alert.alert('Error', 'Failed to load local data');
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
          const errorMessage = result.errors?.length ? result.errors.join(', ') : 'Sync completed with errors';
          console.error('Sync failed:', errorMessage);
          Alert.alert('Sync Failed', errorMessage);
        }
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown sync error';
        console.error('Sync error:', error);
        Alert.alert('Sync Error', errorMessage);
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
          const errorMessage = result.errors?.length ? result.errors.join(', ') : 'Full sync completed with errors';
          console.error('Full sync failed:', errorMessage);
          // Error is only logged to console, no alert shown
        }
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown full sync error';
        console.error('Full sync error:', error);
        // Error is only logged to console, no alert shown
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
