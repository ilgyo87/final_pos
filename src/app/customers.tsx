import React, { useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { useForm } from 'react-hook-form';
import { SearchBar } from '../components/customers/SearchBar';
import { CustomerList } from '../components/customers/CustomerList';
import { CreateCustomerButton } from '../components/customers/CreateCustomerButton';
import { DynamicForm, formFields } from '../components/forms/DynamicForm';
import { Customer } from '../utils/types';

// Mock data - replace with actual data source
const MOCK_CUSTOMERS: Customer[] = [
  {
    id: '1',
    firstName: 'John',
    lastName: 'Doe',
    phone: '(123) 456-7890',
    email: 'john.doe@example.com',
  },
  {
    id: '2',
    firstName: 'Jane',
    lastName: 'Smith',
    phone: '(987) 654-3210',
  },
];

type CustomerFormData = {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
};

export default function CustomersScreen() {
  const [searchQuery, setSearchQuery] = useState('');
  const [customers, setCustomers] = useState<Customer[]>(MOCK_CUSTOMERS);
  const [isFormVisible, setIsFormVisible] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const { control, handleSubmit, reset, formState: { errors } } = useForm<CustomerFormData>();

  const filteredCustomers = customers.filter(
    (customer) =>
      customer.firstName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      customer.lastName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      customer.phone.includes(searchQuery) ||
      (customer.email && customer.email.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const handleAddCustomer = () => {
    setIsFormVisible(true);
  };

  const onSubmit = (data: CustomerFormData) => {
    setIsSubmitting(true);
    
    // Simulate API call
    setTimeout(() => {
      const newCustomer: Customer = {
        ...data,
        id: Date.now().toString(),
      };
      
      setCustomers(prev => [...prev, newCustomer]);
      reset();
      setIsFormVisible(false);
      setIsSubmitting(false);
    }, 1000);
  };

  const closeForm = () => {
    if (!isSubmitting) {
      setIsFormVisible(false);
    }
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
        emptyMessage={searchQuery ? 'No matching customers found' : 'No customers yet'}
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