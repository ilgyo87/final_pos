import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSyncContext } from '../../context/SyncContext';

interface SyncControlsProps {}

export const SyncControls = ({}: SyncControlsProps) => {
  const { state, actions } = useSyncContext();

  const formatLastSync = (timestamp: number) => {
    if (!timestamp) return 'Never';
    const date = new Date(timestamp);
    return date.toLocaleString();
  };

  return (
    <View style={styles.container}>
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
            Pending: {state.syncStatus.pendingChanges}
          </Text>
        </View>
      </View>

      <Text style={styles.lastSyncText}>
        Last sync: {formatLastSync(state.syncStatus.lastSync)}
      </Text>

      <View style={styles.buttonRow}>
        <TouchableOpacity 
          style={[styles.button, styles.syncButton]} 
          onPress={actions.syncNow}
          disabled={state.syncStatus.isSyncing || !state.syncStatus.isOnline}
        >
          <Ionicons name="sync" size={16} color="#fff" />
          <Text style={styles.buttonText}>
            {state.syncStatus.isSyncing ? 'Syncing...' : 'Sync Now'}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={[styles.button, styles.downloadButton]} 
          onPress={actions.fullSync}
          disabled={state.syncStatus.isSyncing || !state.syncStatus.isOnline}
        >
          <Ionicons name="download" size={16} color="#fff" />
          <Text style={styles.buttonText}>Download All Data</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#f5f5f5',
    padding: 12,
    margin: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  statusRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  statusItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  statusText: {
    fontSize: 12,
    color: '#666',
  },
  lastSyncText: {
    fontSize: 12,
    color: '#666',
    marginBottom: 12,
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 8,
  },
  button: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 8,
    borderRadius: 6,
    gap: 4,
  },
  syncButton: {
    backgroundColor: '#2196F3',
  },
  downloadButton: {
    backgroundColor: '#4CAF50',
  },
  buttonText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
});
