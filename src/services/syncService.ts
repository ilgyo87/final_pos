import { type Schema } from '../../amplify/data/resource';
import { generateClient } from 'aws-amplify/api';
import { Amplify } from 'aws-amplify';
import AsyncStorage from '@react-native-async-storage/async-storage';
import NetInfo from '@react-native-community/netinfo';
import { Alert } from 'react-native';

type Customer = Schema['Customer']['type'];
type SyncableEntity = Customer; // Add other types as needed

interface SyncQueue {
  id: string;
  action: 'create' | 'update' | 'delete';
  entity: 'customer' | 'order' | 'business';
  data: any;
  timestamp: number;
  retryCount: number;
}

interface SyncStatus {
  lastSync: number;
  pendingChanges: number;
  isOnline: boolean;
  isSyncing: boolean;
}

// Simple initialization of the Amplify client
try {
  // Simple configuration for Amplify
  Amplify.configure({});
  console.log('Amplify configured');
} catch (error) {
  console.log('Notice: Amplify configuration could not be loaded');
}

// Create client with basic error handling
let client: ReturnType<typeof generateClient<Schema>> | null = null;
try {
  client = generateClient<Schema>();
} catch (error) {
  console.log('Notice: Amplify client could not be generated - some cloud functions may be unavailable');
  // We'll handle operations with null client gracefully
}

// Export as both named and default export for maximum compatibility
export class SyncService {
  private static readonly SYNC_QUEUE_KEY = 'sync_queue';
  private static readonly LAST_SYNC_KEY = 'last_sync';
  private static readonly AUTO_SYNC_INTERVAL = 5 * 60 * 1000; // 5 minutes
  private static syncInterval: ReturnType<typeof setInterval> | null = null;

  // ============================================
  // LOCAL STORAGE OPERATIONS (No API calls)
  // ============================================

  static async saveToLocal<T>(key: string, data: T[]): Promise<void> {
    await AsyncStorage.setItem(key, JSON.stringify(data));
  }

  static async getFromLocal<T>(key: string): Promise<T[]> {
    const data = await AsyncStorage.getItem(key);
    return data ? JSON.parse(data) : [];
  }

  static async addToSyncQueue(item: Omit<SyncQueue, 'id' | 'timestamp' | 'retryCount'>): Promise<void> {
    const queue = await this.getSyncQueue();
    const newItem: SyncQueue = {
      ...item,
      id: `sync_${Date.now()}_${Math.random()}`,
      timestamp: Date.now(),
      retryCount: 0,
    };
    queue.push(newItem);
    await AsyncStorage.setItem(this.SYNC_QUEUE_KEY, JSON.stringify(queue));
  }

  private static async getSyncQueue(): Promise<SyncQueue[]> {
    const data = await AsyncStorage.getItem(this.SYNC_QUEUE_KEY);
    return data ? JSON.parse(data) : [];
  }

  private static async clearSyncQueue(): Promise<void> {
    await AsyncStorage.setItem(this.SYNC_QUEUE_KEY, JSON.stringify([]));
  }
  
  private static async removeFromQueue(itemId: string): Promise<void> {
    const queue = await this.getSyncQueue();
    const updatedQueue = queue.filter(item => item.id !== itemId);
    await AsyncStorage.setItem(this.SYNC_QUEUE_KEY, JSON.stringify(updatedQueue));
  }

  // ============================================
  // SYNC OPERATIONS (Controlled API calls)
  // ============================================

  static async syncNow(): Promise<{ success: boolean; synced: number; errors: string[] }> {
    const netInfo = await NetInfo.fetch();
    if (!netInfo.isConnected) {
      // Show alert for no internet connection
      Alert.alert(
        "Sync Failed",
        "No internet connection available. Please check your connection and try again.",
        [{ text: "OK" }]
      );
      return { success: false, synced: 0, errors: ['No internet connection'] };
    }

    const queue = await this.getSyncQueue();
    if (queue.length === 0) {
      Alert.alert(
        "Sync Complete", 
        "No changes to sync."
      );
      return { success: true, synced: 0, errors: [] };
    }

    let syncedCount = 0;
    const errors: string[] = [];

    // Process the queue
    for (const item of queue) {
      try {
        await this.processSyncItem(item);
        syncedCount++;
      } catch (error) {
        console.log(`Sync notice - Could not sync item ${item.id}`);
        const errorMsg = error instanceof Error ? error.message : String(error);
        errors.push(`Error syncing ${item.entity} ${item.id}: ${errorMsg}`);
        
        // Update retry count
        item.retryCount = (item.retryCount || 0) + 1;
        
        // Keep in queue if under max retries
        if (item.retryCount < 3) {
          // Keep in queue for next attempt
          continue;
        }
      }
      
      // Remove from queue if synced or max retries exceeded
      await this.removeFromQueue(item.id);
    }

    // Update last sync timestamp
    await AsyncStorage.setItem(this.LAST_SYNC_KEY, Date.now().toString());

    // Show appropriate alert based on result
    if (errors.length > 0) {
      Alert.alert(
        "Sync Results", 
        `Synchronized ${syncedCount} items with ${errors.length} errors. The errors will be retried later.`
      );
    } else if (syncedCount > 0) {
      Alert.alert(
        "Sync Partially Complete", 
        `Synced ${syncedCount} item(s), but ${errors.length} item(s) failed to sync.\n\n${errors.join('\n')}`,
        [{ text: "OK" }]
      );
    }

    return {
      success: errors.length === 0,
      synced: syncedCount,
      errors,
    };
  }

  private static async processSyncItem(item: SyncQueue): Promise<void> {
    switch (item.entity) {
      case 'customer':
        await this.syncCustomer(item);
        break;
      // Add cases for other entity types as needed
      default:
        console.warn(`Unknown entity type: ${item.entity}`);
        break;
    }
  }

  private static async syncCustomer(item: SyncQueue): Promise<void> {
    try {
      console.log(`Syncing customer item ${item.id} of type ${item.action}`);
      
      // Check if client is initialized
      if (!client) {
        console.error('Cannot sync customer: Amplify client is not initialized');
        Alert.alert(
          "Sync Error",
          "Unable to sync customer data because the connection to the cloud is not available."
        );
        throw new Error('Amplify client is not initialized');
      }
      
      switch (item.action) {
        case 'create':
          await client.models.Customer.create(item.data);
          break;
        case 'update':
          await client.models.Customer.update(item.data);
          break;
        case 'delete':
          await client.models.Customer.delete({ id: item.data.id });
          break;
      }
    } catch (error) {
      console.error(`Error syncing customer ${item.id}:`, error);
      throw error;
    }
  }

  // ============================================
  // FULL SYNC (Download from server)
  // ============================================

  static async fullSyncFromServer(): Promise<{ success: boolean; downloaded: number; errors: string[] }> {
    const netInfo = await NetInfo.fetch();
    if (!netInfo.isConnected) {
      // Show alert for no internet connection
      Alert.alert(
        "Download Failed",
        "No internet connection available. Please check your connection and try again.",
        [{ text: "OK" }]
      );
      return { success: false, downloaded: 0, errors: ['No internet connection'] };
    }

    try {
      // Check if client and required properties are initialized
      if (!client || !client.models || !client.models.Customer || typeof client.models.Customer.list !== 'function') {
        // Use console.log instead of console.error to avoid red text
        console.log('Cloud sync unavailable: Connection to AWS services not established');
        
        Alert.alert(
          "Download Unavailable",
          "Cloud connection is currently unavailable. Please try again later.",
          [{ text: "OK" }]
        );
        return { success: false, downloaded: 0, errors: [] };
      }
      
      // Download all customers
      console.log('Attempting to list customers from cloud');
      const { data: customers, errors } = await client.models.Customer.list();
      
      if (errors && errors.length > 0) {
        const errorMessage = errors[0].message || 'Unknown error from Amplify client';
        // Show alert for API errors
        Alert.alert(
          "Download Failed",
          `Error from server: ${errorMessage}`,
          [{ text: "OK" }]
        );
        throw new Error(errorMessage);
      }

      // Save to local storage
      await this.saveToLocal('customers', customers);
      
      // Update last sync time
      await AsyncStorage.setItem(this.LAST_SYNC_KEY, Date.now().toString());

      // Show success alert with download count
      Alert.alert(
        "Download Complete",
        `Successfully downloaded ${customers.length} customer(s).`,
        [{ text: "OK" }]
      );

      return {
        success: true,
        downloaded: customers.length,
        errors: [],
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      
      // Show general error alert if not already shown
      if (!(error instanceof Error && error.message.startsWith('Error from server'))) {
        Alert.alert(
          "Download Failed",
          `An error occurred: ${errorMessage}`,
          [{ text: "OK" }]
        );
      }
      
      return {
        success: false,
        downloaded: 0,
        errors: [errorMessage],
      };
    }
  }

  // ============================================
  // AUTO SYNC MANAGEMENT
  // ============================================

  static startAutoSync(): void {
    this.stopAutoSync(); // Clear any existing interval
    
    this.syncInterval = setInterval(async () => {
      const netInfo = await NetInfo.fetch();
      if (netInfo.isConnected) {
        const queue = await this.getSyncQueue();
        if (queue.length > 0) {
          console.log('Auto-syncing pending changes...');
          await this.syncNow();
        }
      }
    }, this.AUTO_SYNC_INTERVAL);
  }

  static stopAutoSync(): void {
    if (this.syncInterval) {
      clearInterval(this.syncInterval);
      this.syncInterval = null;
    }
  }

  // ============================================
  // SYNC STATUS
  // ============================================

  static async getSyncStatus(): Promise<SyncStatus> {
    const [lastSyncStr, queue, netInfo] = await Promise.all([
      AsyncStorage.getItem(this.LAST_SYNC_KEY),
      this.getSyncQueue(),
      NetInfo.fetch(),
    ]);

    return {
      lastSync: lastSyncStr ? parseInt(lastSyncStr) : 0,
      pendingChanges: queue.length,
      isOnline: netInfo.isConnected || false,
      isSyncing: false, // You'd track this with a state variable
    };
  }
}

// Export as default for compatibility with import statements 
export default SyncService;
