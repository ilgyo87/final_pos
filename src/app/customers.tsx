import React, { useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { useForm } from 'react-hook-form';
import type { Control, FieldValues } from 'react-hook-form';
import { SearchBar } from '../components/customers/SearchBar';
import { CustomerList } from '../components/customers/CustomerList';
import { CreateCustomerButton } from '../components/customers/CreateCustomerButton';
import { DynamicForm, FormField, formFields } from '../components/forms/DynamicForm';

// Mock data - replace with your actual data
const MOCK_CUSTOMERS = [
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

interface Customer {
  id: string;
  firstName: string;
  lastName: string;
  phone?: string;
  email?: string;
}

const customerFormFields: FormField[] = [...formFields.customer];

export default function CustomersScreen() {
  const [searchQuery, setSearchQuery] = useState('');
  const [customers, setCustomers] = useState<Customer[]>(MOCK_CUSTOMERS);
  const [isFormVisible, setIsFormVisible] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  type FormData = {
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
  };

  const { control, handleSubmit, reset, formState: { errors } } = useForm<FormData>();

  const filteredCustomers = customers.filter(
    (customer) =>
      customer.firstName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      customer.lastName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (customer.phone && customer.phone.includes(searchQuery)) ||
      (customer.email && customer.email.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const handleAddCustomer = () => {
    setIsFormVisible(true);
  };

  const onSubmit = (data: any) => {
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
        <DynamicForm
          control={control as unknown as Control<FieldValues>}
          errors={errors}
          fields={customerFormFields}
          onSubmit={handleSubmit(onSubmit)}
          submitText={isSubmitting ? 'Saving...' : 'Save Customer'}
          loading={isSubmitting}
          isVisible={isFormVisible}
          onClose={closeForm}
          containerStyle={styles.modalOverlay}
          scrollViewStyle={styles.scrollView}
          formContainerStyle={styles.formContainer}
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
  formContainer: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 16,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  scrollView: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '90%',
  },
  scrollViewContent: {
    padding: 20,
    paddingBottom: 40,
  },
  input: {
    backgroundColor: '#f0f0f0',
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
    fontSize: 16,
  },
  submitButton: {
    backgroundColor: '#4CAF50',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 16,
  },
  submitButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  closeButton: {
    position: 'absolute',
    top: 10,
    right: 10,
    padding: 10,
  },
});