import React from 'react';
import { View, Text, StyleSheet, FlatList, ListRenderItem } from 'react-native';

interface Customer {
  id: string;
  firstName: string;
  lastName: string;
  phone?: string;
  email?: string;
}

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
    <View style={styles.customerItem}>
      <View style={styles.customerInfo}>
        <Text style={styles.customerName}>
          {item.firstName} {item.lastName}
        </Text>
        {item.phone && <Text style={styles.customerPhone}>{item.phone}</Text>}
      </View>
    </View>
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
