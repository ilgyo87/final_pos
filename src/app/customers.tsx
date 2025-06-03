// src/app/customers.tsx
import React, { useState, useEffect } from 'react';
import { View, StyleSheet, Alert } from 'react-native';
import { useForm } from 'react-hook-form';
import { SearchBar } from '../components/customers/SearchBar';
import { CustomerList } from '../components/customers/CustomerList';
import { CreateCustomerButton } from '../components/customers/CreateCustomerButton';
import { DynamicForm, formFields } from '../components/forms/DynamicForm';
import { Customer } from '../utils/types';
import { customerStorage } from '../utils/storage/customerStorage';
import { phoneUtils } from '../utils/phoneUtils';

type CustomerFormData = {
  firstName: string;
  lastName: string;
  email?: string;
  phone: string;
  address?: string;
  city?: string;
  state?: string;      
  zipCode?: string;
};

export default function CustomersScreen() {
  const [searchQuery, setSearchQuery] = useState('');
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [isFormVisible, setIsFormVisible] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [serverErrors, setServerErrors] = useState<string[]>([]);
  
  const { 
    control, 
    handleSubmit, 
    reset, 
    watch,
    formState: { errors } 
  } = useForm<CustomerFormData>({
    defaultValues: {
      firstName: '',
      lastName: '',
      email: '',
      phone: '',
      address: '',
      city: '',
      state: '',
      zipCode: '',
    }
  });

  // Load customers on component mount
  useEffect(() => {
    loadCustomers();
  }, []);

  const loadCustomers = async () => {
    try {
      setIsLoading(true);
      const customerData = await customerStorage.getAllCustomers();
      const customersList = Object.values(customerData);
      
      // Sort customers by name
      customersList.sort((a, b) => {
        const nameA = `${a.firstName} ${a.lastName}`.toLowerCase();
        const nameB = `${b.firstName} ${b.lastName}`.toLowerCase();
        return nameA.localeCompare(nameB);
      });
      
      setCustomers(customersList);
    } catch (error) {
      console.error('Error loading customers:', error);
      Alert.alert('Error', 'Failed to load customers');
    } finally {
      setIsLoading(false);
    }
  };

  const filteredCustomers = customers.filter((customer) => {
    const searchTerm = searchQuery.toLowerCase();
    const normalizedPhone = phoneUtils.normalize(customer.phone);
    
    return (
      customer.firstName.toLowerCase().includes(searchTerm) ||
      customer.lastName.toLowerCase().includes(searchTerm) ||
      normalizedPhone.includes(searchTerm.replace(/\D/g, '')) ||
      customer.phone.includes(searchTerm) ||
      (customer.email && customer.email.toLowerCase().includes(searchTerm))
    );
  });

  const handleAddCustomer = () => {
    setServerErrors([]);
    setIsFormVisible(true);
  };

  const onSubmit = async (data: CustomerFormData) => {
    setIsSubmitting(true);
    setServerErrors([]);
    
    try {
      // Prepare customer data - phone is already normalized by DynamicForm
      const customerData: Partial<Customer> & {
        firstName: string;
        lastName: string;
        phone: string;
      } = {
        firstName: data.firstName.trim(),
        lastName: data.lastName.trim(),
        phone: data.phone.trim(), // Already normalized by DynamicForm
        email: data.email?.trim() || undefined,
        address: data.address?.trim() || undefined,
        city: data.city?.trim() || undefined,
        state: data.state?.trim() || undefined,
        zipCode: data.zipCode?.trim() || undefined,
        notes: [],
      };

      // Save customer with validation
      const result = await customerStorage.saveCustomer(customerData);
      
      if (result.success && result.customer) {
        // Success - add to local state and close form
        setCustomers(prev => {
          const updated = [...prev, result.customer!];
          // Sort by name
          updated.sort((a, b) => {
            const nameA = `${a.firstName} ${a.lastName}`.toLowerCase();
            const nameB = `${b.firstName} ${b.lastName}`.toLowerCase();
            return nameA.localeCompare(nameB);
          });
          return updated;
        });
        
        reset();
        setIsFormVisible(false);
        
        Alert.alert(
          'Success', 
          `${result.customer.firstName} ${result.customer.lastName} has been added successfully!`
        );
      } else {
        // Handle validation errors
        if (result.errors) {
          setServerErrors(result.errors);
        }
      }
    } catch (error) {
      console.error('Error saving customer:', error);
      setServerErrors(['An unexpected error occurred. Please try again.']);
    } finally {
      setIsSubmitting(false);
    }
  };

  const closeForm = () => {
    if (!isSubmitting) {
      setIsFormVisible(false);
      setServerErrors([]);
      reset();
    }
  };

  const handleCustomerPress = (customer: Customer) => {
    // TODO: Navigate to customer details or edit screen
    Alert.alert(
      customer.firstName + ' ' + customer.lastName,
      `Phone: ${customer.phone}\n${customer.email ? `Email: ${customer.email}` : 'No email'}`
    );
  };

  return (
    <View style={styles.container}>
      <SearchBar
        value={searchQuery}
        onChangeText={setSearchQuery}
        placeholder="Search customers..."
      />

      <CustomerList
        customers={filteredCustomers}
        onCustomerPress={handleCustomerPress}
        emptyMessage={
          isLoading 
            ? 'Loading customers...' 
            : searchQuery 
              ? 'No matching customers found' 
              : 'No customers yet. Add your first customer!'
        }
      />

      <CreateCustomerButton onPress={handleAddCustomer} />

      {isFormVisible && (
        <DynamicForm<CustomerFormData>
          control={control}
          errors={errors}
          fields={formFields.customer}
          onSubmit={handleSubmit(onSubmit)}
          submitText={isSubmitting ? 'Saving...' : 'Save Customer'}
          loading={isSubmitting}
          isVisible={isFormVisible}
          onClose={closeForm}
          watch={watch}
          serverErrors={serverErrors}
          formTitle="Add Customer"
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
});