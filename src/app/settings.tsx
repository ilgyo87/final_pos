import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Stack } from 'expo-router';
import { useSyncContext } from '../context/SyncContext';
import { Ionicons } from '@expo/vector-icons';

interface SettingsScreenProps {}

export default function SettingsScreen({}: SettingsScreenProps) {
  const { state, actions } = useSyncContext();

  const formatLastSync = (timestamp: number) => {
    if (!timestamp) return 'Never';
    const date = new Date(timestamp);
    return date.toLocaleString();
  };

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ title: 'Settings', headerShown: true }} />
      
      <View style={styles.section}>
        <Text style={styles.sectionHeader}>Data Synchronization</Text>
        
        <View style={styles.statusContainer}>
          <View style={styles.statusRow}>
            <View style={styles.statusItem}>
              <Ionicons 
                name={state.syncStatus.isOnline ? 'cellular' : 'cellular-outline'} 
                size={16} 
                color={state.syncStatus.isOnline ? '#4CAF50' : '#f44336'} 
              />
              <Text style={styles.statusText}>
                {state.syncStatus.isOnline ? 'Online' : 'Offline'}
              </Text>
            </View>
            
            <View style={styles.statusItem}>
              <Text style={styles.statusText}>
                Pending changes: {state.syncStatus.pendingChanges}
              </Text>
            </View>
          </View>

          <Text style={styles.lastSyncText}>
            Last sync: {formatLastSync(state.syncStatus.lastSync)}
          </Text>
        </View>

        <View style={styles.buttonGroup}>
          <TouchableOpacity 
            style={[styles.button, styles.primaryButton]} 
            onPress={actions.syncNow}
            disabled={state.syncStatus.isSyncing || !state.syncStatus.isOnline}
          >
            <Ionicons name="sync" size={20} color="#fff" />
            <Text style={styles.buttonText}>
              {state.syncStatus.isSyncing ? 'Syncing...' : 'Sync Now'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.button, styles.secondaryButton]} 
            onPress={actions.fullSync}
            disabled={state.syncStatus.isSyncing || !state.syncStatus.isOnline}
          >
            <Ionicons name="cloud-download" size={20} color="#fff" />
            <Text style={styles.buttonText}>Download All Data</Text>
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionHeader}>Auto-Sync Options</Text>
        
        <View style={styles.buttonGroup}>
          <TouchableOpacity 
            style={[styles.button, styles.primaryButton]} 
            onPress={actions.startAutoSync}
          >
            <Ionicons name="timer-outline" size={20} color="#fff" />
            <Text style={styles.buttonText}>Start Auto-Sync</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.button, styles.secondaryButton]} 
            onPress={actions.stopAutoSync}
          >
            <Ionicons name="stop-circle-outline" size={20} color="#fff" />
            <Text style={styles.buttonText}>Stop Auto-Sync</Text>
          </TouchableOpacity>
        </View>
        
        <Text style={styles.helpText}>
          Auto-sync will periodically check for and upload pending changes when online.
          This happens every 5 minutes in the background and only when changes exist.
        </Text>
      </View>

      {state.error && (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{state.error}</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: '#f9f9f9',
  },
  section: {
    marginBottom: 24,
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  sectionHeader: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 16,
    color: '#333',
  },
  statusContainer: {
    backgroundColor: '#f5f5f5',
    padding: 12,
    borderRadius: 6,
    marginBottom: 16,
  },
  statusRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  statusItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  statusText: {
    fontSize: 14,
    color: '#555',
  },
  lastSyncText: {
    fontSize: 14,
    color: '#555',
  },
  buttonGroup: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 8,
  },
  button: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 14,
    borderRadius: 8,
    gap: 8,
  },
  primaryButton: {
    backgroundColor: '#2196F3',
  },
  secondaryButton: {
    backgroundColor: '#4CAF50',
  },
  buttonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  helpText: {
    fontSize: 12,
    color: '#777',
    marginTop: 12,
    fontStyle: 'italic',
  },
  errorContainer: {
    backgroundColor: '#ffebee',
    padding: 12,
    borderRadius: 6,
    borderLeftWidth: 4,
    borderLeftColor: '#f44336',
    marginBottom: 16,
  },
  errorText: {
    color: '#d32f2f',
    fontSize: 14,
  },
});
