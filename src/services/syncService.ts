import AsyncStorage from '@react-native-async-storage/async-storage';
import { generateClient } from 'aws-amplify/api';
import { type Schema } from '../../amplify/data/resource';
import NetInfo from '@react-native-community/netinfo';

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

const client = generateClient<Schema>();

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

  // ============================================
  // SYNC OPERATIONS (Controlled API calls)
  // ============================================

  static async syncNow(): Promise<{ success: boolean; synced: number; errors: string[] }> {
    const netInfo = await NetInfo.fetch();
    if (!netInfo.isConnected) {
      return { success: false, synced: 0, errors: ['No internet connection'] };
    }

    const queue = await this.getSyncQueue();
    if (queue.length === 0) {
      return { success: true, synced: 0, errors: [] };
    }

    const errors: string[] = [];
    let syncedCount = 0;
    const remainingQueue: SyncQueue[] = [];

    for (const item of queue) {
      try {
        await this.processSyncItem(item);
        syncedCount++;
      } catch (error) {
        console.error('Sync error for item:', item.id, error);
        
        // Retry logic
        if (item.retryCount < 3) {
          remainingQueue.push({
            ...item,
            retryCount: item.retryCount + 1,
          });
        } else {
          errors.push(`Failed to sync ${item.entity} after 3 retries`);
        }
      }
    }

    // Update queue with failed items
    await AsyncStorage.setItem(this.SYNC_QUEUE_KEY, JSON.stringify(remainingQueue));
    
    // Update last sync time
    await AsyncStorage.setItem(this.LAST_SYNC_KEY, Date.now().toString());

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
      // Add other entities as needed
      default:
        throw new Error(`Unknown entity type: ${item.entity}`);
    }
  }

  private static async syncCustomer(item: SyncQueue): Promise<void> {
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
  }

  // ============================================
  // FULL SYNC (Download from server)
  // ============================================

  static async fullSyncFromServer(): Promise<{ success: boolean; downloaded: number; errors: string[] }> {
    const netInfo = await NetInfo.fetch();
    if (!netInfo.isConnected) {
      return { success: false, downloaded: 0, errors: ['No internet connection'] };
    }

    try {
      // Download all customers
      const { data: customers, errors } = await client.models.Customer.list();
      if (errors) {
        throw new Error(errors[0].message);
      }

      // Save to local storage
      await this.saveToLocal('customers', customers);
      
      // Update last sync time
      await AsyncStorage.setItem(this.LAST_SYNC_KEY, Date.now().toString());

      return {
        success: true,
        downloaded: customers.length,
        errors: [],
      };
    } catch (error) {
      return {
        success: false,
        downloaded: 0,
        errors: [error instanceof Error ? error.message : 'Unknown error'],
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
