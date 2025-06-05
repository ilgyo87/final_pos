import { useCallback } from 'react';
import { useSyncContext } from '../context/SyncContext';
import { LocalDataService } from '../services/localDataService';
import { type Schema } from '../../amplify/data/resource';

type Customer = Schema['Customer']['type'];

export const useCustomers = () => {
  const { state, dispatch } = useSyncContext();

  const createCustomer = useCallback(async (customerData: Omit<Customer, 'id' | 'createdAt' | 'updatedAt'>) => {
    try {
      const newCustomer = await LocalDataService.createCustomer(customerData);
      dispatch({ type: 'ADD_CUSTOMER', payload: newCustomer });
      return newCustomer;
    } catch (error) {
      dispatch({ type: 'SET_ERROR', payload: 'Failed to create customer' });
      throw error;
    }
  }, [dispatch]);

  const updateCustomer = useCallback(async (id: string, updates: Partial<Customer>) => {
    try {
      const updatedCustomer = await LocalDataService.updateCustomer(id, updates);
      dispatch({ type: 'UPDATE_CUSTOMER', payload: updatedCustomer });
      return updatedCustomer;
    } catch (error) {
      dispatch({ type: 'SET_ERROR', payload: 'Failed to update customer' });
      throw error;
    }
  }, [dispatch]);

  const deleteCustomer = useCallback(async (id: string) => {
    try {
      const success = await LocalDataService.deleteCustomer(id);
      if (success) {
        dispatch({ type: 'DELETE_CUSTOMER', payload: id });
      }
      return success;
    } catch (error) {
      dispatch({ type: 'SET_ERROR', payload: 'Failed to delete customer' });
      throw error;
    }
  }, [dispatch]);

  return {
    customers: state.customers,
    loading: state.loading,
    error: state.error,
    syncStatus: state.syncStatus,
    createCustomer,
    updateCustomer,
    deleteCustomer,
  };
};
