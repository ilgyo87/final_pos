import { useCallback } from 'react';
import { Alert } from 'react-native';
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
      const errorMessage = error instanceof Error ? error.message : 'Failed to create customer';
      console.error('Create customer error:', error);
      Alert.alert('Error', errorMessage);
      throw error;
    }
  }, [dispatch]);

  const updateCustomer = useCallback(async (id: string, updates: Partial<Customer>) => {
    try {
      const updatedCustomer = await LocalDataService.updateCustomer(id, updates);
      dispatch({ type: 'UPDATE_CUSTOMER', payload: updatedCustomer });
      return updatedCustomer;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to update customer';
      console.error('Update customer error:', error);
      Alert.alert('Error', errorMessage);
      throw error;
    }
  }, [dispatch]);

  const deleteCustomer = useCallback(async (id: string) => {
    try {
      await LocalDataService.deleteCustomer(id);
      dispatch({ type: 'DELETE_CUSTOMER', payload: id });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to delete customer';
      console.error('Delete customer error:', error);
      Alert.alert('Error', errorMessage);
      throw error;
    }
  }, [dispatch]);

  return {
    customers: state.customers,
    loading: state.loading,
    syncStatus: state.syncStatus,
    createCustomer,
    updateCustomer,
    deleteCustomer,
  };
};
