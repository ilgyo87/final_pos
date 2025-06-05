import { type Schema } from '../../amplify/data/resource';
import { SyncService } from './syncService';

type Customer = Schema['Customer']['type'];

export class LocalDataService {
  private static readonly CUSTOMERS_KEY = 'customers';

  // ============================================
  // CUSTOMER OPERATIONS (Local-first)
  // ============================================

  static async getCustomers(): Promise<Customer[]> {
    return await SyncService.getFromLocal<Customer>(this.CUSTOMERS_KEY);
  }

  static async createCustomer(customerData: Omit<Customer, 'id' | 'createdAt' | 'updatedAt'>): Promise<Customer> {
    const customers = await this.getCustomers();
    
    const newCustomer: Customer = {
      ...customerData,
      id: `local_${Date.now()}_${Math.random()}`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    customers.push(newCustomer);
    await SyncService.saveToLocal(this.CUSTOMERS_KEY, customers);

    // Add to sync queue
    await SyncService.addToSyncQueue({
      action: 'create',
      entity: 'customer',
      data: newCustomer,
    });

    return newCustomer;
  }

  static async updateCustomer(id: string, updates: Partial<Customer>): Promise<Customer> {
    const customers = await this.getCustomers();
    const index = customers.findIndex(c => c.id === id);
    
    if (index === -1) {
      throw new Error('Customer not found');
    }

    const updatedCustomer = {
      ...customers[index],
      ...updates,
      updatedAt: new Date().toISOString(),
    };

    customers[index] = updatedCustomer;
    await SyncService.saveToLocal(this.CUSTOMERS_KEY, customers);

    // Add to sync queue
    await SyncService.addToSyncQueue({
      action: 'update',
      entity: 'customer',
      data: updatedCustomer,
    });

    return updatedCustomer;
  }

  static async deleteCustomer(id: string): Promise<boolean> {
    const customers = await this.getCustomers();
    const index = customers.findIndex(c => c.id === id);
    
    if (index === -1) {
      return false;
    }

    const customerToDelete = customers[index];
    customers.splice(index, 1);
    await SyncService.saveToLocal(this.CUSTOMERS_KEY, customers);

    // Add to sync queue
    await SyncService.addToSyncQueue({
      action: 'delete',
      entity: 'customer',
      data: { id: customerToDelete.id },
    });

    return true;
  }

  static async searchCustomers(query: string): Promise<Customer[]> {
    const customers = await this.getCustomers();
    const searchTerm = query.toLowerCase();
    
    return customers.filter(customer =>
      customer.firstName?.toLowerCase().includes(searchTerm) ||
      customer.lastName?.toLowerCase().includes(searchTerm) ||
      customer.phone?.includes(searchTerm) ||
      customer.email?.toLowerCase().includes(searchTerm)
    );
  }
}
