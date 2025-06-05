// src/utils/storage/syncService.ts
import AsyncStorage from '@react-native-async-storage/async-storage';
import { generateClient } from 'aws-amplify/data';
import type { Schema } from '../../../amplify/data/resource';
import { customerStorage, type SaveCustomerResult } from './customerStorage';
import { Customer } from '../types';

const client = generateClient<Schema>();

interface SyncMetadata {
  lastSyncTimestamp: string;
  deviceId: string;
  pendingUploads: string[]; // Customer IDs waiting to sync
  conflictResolution: 'local' | 'remote' | 'manual';
}

export class HybridSyncService {
  private static readonly SYNC_METADATA_KEY = 'sync_metadata';
  private static readonly SYNC_INTERVAL = 5 * 60 * 1000; // 5 minutes
  
  // Initialize device with unique ID
  static async initializeDevice(): Promise<string> {
    let deviceId = await AsyncStorage.getItem('device_id');
    if (!deviceId) {
      deviceId = `device_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      await AsyncStorage.setItem('device_id', deviceId);
    }
    return deviceId;
  }

  // Get sync metadata
  static async getSyncMetadata(): Promise<SyncMetadata> {
    const metadata = await AsyncStorage.getItem(this.SYNC_METADATA_KEY);
    if (metadata) {
      return JSON.parse(metadata);
    }
    
    const deviceId = await this.initializeDevice();
    const defaultMetadata: SyncMetadata = {
      lastSyncTimestamp: new Date(0).toISOString(),
      deviceId,
      pendingUploads: [],
      conflictResolution: 'local'
    };
    
    await AsyncStorage.setItem(this.SYNC_METADATA_KEY, JSON.stringify(defaultMetadata));
    return defaultMetadata;
  }

  // Update sync metadata
  static async updateSyncMetadata(updates: Partial<SyncMetadata>): Promise<void> {
    const current = await this.getSyncMetadata();
    const updated = { ...current, ...updates };
    await AsyncStorage.setItem(this.SYNC_METADATA_KEY, JSON.stringify(updated));
  }

  // Mark customer for upload (called when local data changes)
  static async markForUpload(customerId: string): Promise<void> {
    const metadata = await this.getSyncMetadata();
    if (!metadata.pendingUploads.includes(customerId)) {
      metadata.pendingUploads.push(customerId);
      await this.updateSyncMetadata(metadata);
    }
  }

  // Upload pending changes to cloud (cost-optimized batch)
  static async uploadPendingChanges(): Promise<{ success: number; failed: string[] }> {
    const metadata = await this.getSyncMetadata();
    const failed: string[] = [];
    let success = 0;

    if (metadata.pendingUploads.length === 0) {
      return { success: 0, failed: [] };
    }

    console.log(`Uploading ${metadata.pendingUploads.length} pending changes...`);

    // Process in small batches to avoid hitting rate limits
    const batchSize = 5;
    for (let i = 0; i < metadata.pendingUploads.length; i += batchSize) {
      const batch = metadata.pendingUploads.slice(i, i + batchSize);
      
      for (const customerId of batch) {
        try {
          const localCustomer = await customerStorage.getCustomer(customerId);
          if (!localCustomer) continue;

          // Transform local customer to Amplify format
          const cloudCustomer = {
            firstName: localCustomer.firstName,
            lastName: localCustomer.lastName,
            phone: localCustomer.phone,
            email: localCustomer.email || undefined,
            address: localCustomer.address || undefined,
            city: localCustomer.city || undefined,
            state: localCustomer.state || undefined,
            zipCode: localCustomer.zipCode || undefined,
            businessId: localCustomer.businessId || undefined,
            cognitoId: localCustomer.cognitoId || undefined,
          };

          // Check if customer exists in cloud
          const existingCustomer = await client.models.Customer.get({ id: customerId });
          
          if (existingCustomer.data) {
            // Update existing
            await client.models.Customer.update({
              id: customerId,
              ...cloudCustomer
            });
          } else {
            // Create new
            await client.models.Customer.create({
              id: customerId,
              ...cloudCustomer
            });
          }
          
          success++;
        } catch (error) {
          console.error(`Failed to upload customer ${customerId}:`, error);
          failed.push(customerId);
        }
      }
    }

    // Update metadata - remove successfully uploaded IDs
    const stillPending = metadata.pendingUploads.filter(id => failed.includes(id));
    await this.updateSyncMetadata({
      pendingUploads: stillPending,
      lastSyncTimestamp: new Date().toISOString()
    });

    return { success, failed };
  }

  // Download changes from cloud (only new/updated records)
  static async downloadChanges(): Promise<{ downloaded: number; conflicts: Customer[] }> {
    const metadata = await this.getSyncMetadata();
    const conflicts: Customer[] = [];
    let downloaded = 0;

    try {
      // Only get records newer than last sync
      const response = await client.models.Customer.list({
        filter: {
          updatedAt: {
            gt: metadata.lastSyncTimestamp
          }
        }
      });

      const cloudCustomers = response.data || [];
      console.log(`Found ${cloudCustomers.length} cloud changes since ${metadata.lastSyncTimestamp}`);

      for (const cloudCustomer of cloudCustomers) {
        const localCustomer = await customerStorage.getCustomer(cloudCustomer.id);
        
        if (localCustomer) {
          // Check for conflicts (both modified since last sync)
          const localModified = new Date(localCustomer.updatedAt || 0);
          const cloudModified = new Date(cloudCustomer.updatedAt);
          const lastSync = new Date(metadata.lastSyncTimestamp);
          
          if (localModified > lastSync && cloudModified > lastSync) {
            // Conflict detected
            conflicts.push(localCustomer);
            continue;
          }
        }

        // Transform cloud customer to local format
        const localFormat: Customer = {
          id: cloudCustomer.id,
          firstName: cloudCustomer.firstName,
          lastName: cloudCustomer.lastName,
          phone: cloudCustomer.phone,
          email: cloudCustomer.email || undefined,
          address: cloudCustomer.address || undefined,
          city: cloudCustomer.city || undefined,
          state: cloudCustomer.state || undefined,
          zipCode: cloudCustomer.zipCode || undefined,
          businessId: cloudCustomer.businessId || undefined,
          cognitoId: cloudCustomer.cognitoId || undefined,
          notes: [], // Initialize empty notes array
          createdAt: new Date(cloudCustomer.createdAt),
          updatedAt: new Date(cloudCustomer.updatedAt)
        };

        // Save to local storage
        await customerStorage.saveCustomer(localFormat);
        downloaded++;
      }

      // Update last sync timestamp
      await this.updateSyncMetadata({
        lastSyncTimestamp: new Date().toISOString()
      });

    } catch (error) {
      console.error('Failed to download changes:', error);
      throw error;
    }

    return { downloaded, conflicts };
  }

  // Full bidirectional sync
  static async performSync(): Promise<{
    uploaded: number;
    downloaded: number;
    conflicts: Customer[];
    uploadFailed: string[];
  }> {
    console.log('Starting bidirectional sync...');
    
    // 1. Upload pending changes first
    const uploadResult = await this.uploadPendingChanges();
    
    // 2. Download new changes
    const downloadResult = await this.downloadChanges();
    
    console.log(`Sync complete: ${uploadResult.success} uploaded, ${downloadResult.downloaded} downloaded, ${downloadResult.conflicts.length} conflicts`);
    
    return {
      uploaded: uploadResult.success,
      downloaded: downloadResult.downloaded,
      conflicts: downloadResult.conflicts,
      uploadFailed: uploadResult.failed
    };
  }

  // Auto-sync on app start/resume
  static async startAutoSync(): Promise<void> {
    // Immediate sync on start
    try {
      await this.performSync();
    } catch (error) {
      console.error('Initial sync failed:', error);
    }

    // Set up periodic sync
    setInterval(async () => {
      try {
        await this.performSync();
      } catch (error) {
        console.error('Periodic sync failed:', error);
      }
    }, this.SYNC_INTERVAL);
  }

  // Manual conflict resolution
  static async resolveConflict(
    customerId: string, 
    resolution: 'keep-local' | 'keep-remote' | 'merge'
  ): Promise<void> {
    const localCustomer = await customerStorage.getCustomer(customerId);
    const cloudResponse = await client.models.Customer.get({ id: customerId });
    const cloudCustomer = cloudResponse.data;

    if (!localCustomer || !cloudCustomer) {
      throw new Error('Customer not found for conflict resolution');
    }

    switch (resolution) {
      case 'keep-local':
        // Mark for upload to overwrite cloud
        await this.markForUpload(customerId);
        break;
        
      case 'keep-remote':
        // Download and overwrite local
        const remoteFormat: Customer = {
          id: cloudCustomer.id,
          firstName: cloudCustomer.firstName,
          lastName: cloudCustomer.lastName,
          phone: cloudCustomer.phone,
          email: cloudCustomer.email || undefined,
          address: cloudCustomer.address || undefined,
          city: cloudCustomer.city || undefined,
          state: cloudCustomer.state || undefined,
          zipCode: cloudCustomer.zipCode || undefined,
          businessId: cloudCustomer.businessId || undefined,
          cognitoId: cloudCustomer.cognitoId || undefined,
          notes: localCustomer.notes, // Keep local notes
          createdAt: new Date(cloudCustomer.createdAt),
          updatedAt: new Date(cloudCustomer.updatedAt)
        };
        await customerStorage.saveCustomer(remoteFormat);
        break;
        
      case 'merge':
        // Smart merge - combine data
        const merged: Customer = {
          ...localCustomer,
          // Use most recent non-empty values
          email: cloudCustomer.email || localCustomer.email,
          address: cloudCustomer.address || localCustomer.address,
          city: cloudCustomer.city || localCustomer.city,
          state: cloudCustomer.state || localCustomer.state,
          zipCode: cloudCustomer.zipCode || localCustomer.zipCode,
          // Merge notes arrays - handle case where notes property doesn't exist on cloudCustomer
          notes: [...new Set([...(localCustomer.notes || []), ...((cloudCustomer as any).notes || [])])],
          updatedAt: new Date()
        };
        await customerStorage.saveCustomer(merged);
        await this.markForUpload(customerId);
        break;
    }
  }
}

// Enhanced customer storage wrapper that auto-marks for sync
export const syncedCustomerStorage = {
  ...customerStorage,
  
  saveCustomer: async (customer: Customer): Promise<Customer> => {
    const result = await customerStorage.saveCustomer(customer);
    if ('customer' in result && result.customer) {
      await HybridSyncService.markForUpload(result.customer.id);
      return result.customer;
    }
    throw new Error('Failed to save customer');
  },
  
  deleteCustomer: async (customerId: string): Promise<boolean> => {
    const result = await customerStorage.deleteCustomer(customerId);
    if (result) {
      // Mark for deletion sync (you'd need to implement soft deletes)
      await HybridSyncService.markForUpload(customerId);
    }
    return result;
  }
};
