import React, { useState } from 'react';
import { View, StyleSheet, SafeAreaView, Text } from 'react-native';
import { InputBox } from '../components/InputBox';
import { DashboardMenu, MenuItem } from '../components/DashboardMenu';

export default function Dashboard() {
  const [businessName] = useState('No Business');
  
  const menuItems: MenuItem[] = [
    { id: '1', title: 'Customers', icon: 'people', href: '/customers', color: '#4CAF50' },
    { id: '2', title: 'Products', icon: 'cube', href: '/products', color: '#2196F3' },
    { id: '3', title: 'Orders', icon: 'document', href: '/orders', color: '#FF9800' },
    { id: '4', title: 'Employees', icon: 'person', href: '/employees', color: '#9C27B0' },
    { id: '5', title: 'Settings', icon: 'settings', href: '/settings', color: '#607D8B' },
    { id: '6', title: 'Reports', icon: 'bar-chart', href: '/reports', color: '#795548' },
  ];

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerText}>{businessName}</Text>
      </View>

      <View>
        <InputBox
          placeholder="Customer Search"
        />
      </View>

      <DashboardMenu menuItems={menuItems} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    padding: 10,
    alignItems: 'center',
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#ccc',
  },
  headerText: {
    fontSize: 20,
    fontWeight: 'bold',
  },
});