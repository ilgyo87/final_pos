import React from 'react';
import { View, StyleSheet, TouchableOpacity, Text, Dimensions, FlatList } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

export type MenuItem = {
  id: string;
  title: string;
  icon: keyof typeof Ionicons.glyphMap;
  href: string;
  color: string;
};

interface DashboardMenuProps {
  menuItems: MenuItem[];
  numColumns?: number;
}

export const DashboardMenu: React.FC<DashboardMenuProps> = ({
  menuItems,
  numColumns = 2,
}) => {
  const { width } = Dimensions.get('window');
  const itemSize = width / numColumns - 34;
  const itemHeight = itemSize * 0.3;
  const router = useRouter();

  const renderItem = ({ item }: { item: MenuItem }) => (
    <TouchableOpacity 
      style={[styles.menuItem, { 
        backgroundColor: item.color, 
        width: itemSize, 
        height: itemHeight,
        paddingVertical: 15
      }]}
      onPress={() => router.push(item.href as any)}
    >
      <Ionicons name={item.icon} size={40} color="white" />
      <Text style={styles.menuItemText}>{item.title}</Text>
    </TouchableOpacity>
  );

  return (
    <View style={styles.content}>
      <FlatList
        data={menuItems}
        renderItem={renderItem}
        keyExtractor={(item: MenuItem) => item.id}
        numColumns={numColumns}
        contentContainerStyle={styles.gridContainer}
        columnWrapperStyle={styles.columnWrapper}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  content: {
    flex: 1,
    padding: 10,
  },
  gridContainer: {
    padding: 10,
  },
  columnWrapper: {
    justifyContent: 'space-between',
    marginBottom: 15,
  },
  menuItem: {
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
  },
  menuItemText: {
    color: 'white',
    fontSize: 19,
    fontWeight: '600',
    marginTop: 8,
  },
});
