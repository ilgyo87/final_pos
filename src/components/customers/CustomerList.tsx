// src/components/customers/CustomerList.tsx
import React from 'react';
import { View, Text, StyleSheet, FlatList, ListRenderItem, TouchableOpacity } from 'react-native';
import { Customer } from '../../utils/types';

interface CustomerListProps {
  customers: Customer[];
  onCustomerPress?: (customer: Customer) => void;
  emptyMessage?: string;
}

export const CustomerList: React.FC<CustomerListProps> = ({
  customers = [],
  onCustomerPress,
  emptyMessage = 'No customers found',
}) => {
  const renderItem: ListRenderItem<Customer> = ({ item }) => (
    <TouchableOpacity 
      style={styles.customerItem}
      onPress={() => onCustomerPress?.(item)}
      activeOpacity={0.7}
    >
      <View style={styles.customerInfo}>
        <Text style={styles.customerName}>
          {item.firstName} {item.lastName}
        </Text>
        <Text style={styles.customerPhone}>{item.phone}</Text>
        {item.email && (
          <Text style={styles.customerEmail}>{item.email}</Text>
        )}
      </View>
    </TouchableOpacity>
  );

  if (customers.length === 0) {
    return (
      <View style={styles.placeholderContainer}>
        <Text style={styles.placeholderText}>{emptyMessage}</Text>
      </View>
    );
  }

  return (
    <FlatList
      data={customers}
      renderItem={renderItem}
      keyExtractor={(item) => item.id}
      contentContainerStyle={styles.listContainer}
      showsVerticalScrollIndicator={false}
    />
  );
};

const styles = StyleSheet.create({
  listContainer: {
    padding: 16,
  },
  customerItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  customerInfo: {
    flex: 1,
  },
  customerName: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
  },
  customerPhone: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
  },
  customerEmail: {
    fontSize: 14,
    color: '#666',
    marginTop: 2,
  },
  placeholderContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  placeholderText: {
    fontSize: 16,
    color: '#999',
    textAlign: 'center',
  },
});