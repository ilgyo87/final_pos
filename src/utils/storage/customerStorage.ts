import AsyncStorage from '@react-native-async-storage/async-storage';

const CUSTOMER_PREFIX = 'cust_';

export interface Customer {
    id: string;
    firstName: string;
    lastName: string;
    address?: string;
    city?: string;
    state?: string;
    zipCode?: string;
    phone: string;
    location?: Location;
    email?: string;
    businessId?: string;
    cognitoId?: string;
    imageName?: string;
    notes: string[];
    createdAt: Date;
    updatedAt?: Date;
    dob?: Date; // Date of birth
}

export const customerStorage = {
  getAllCustomers: async (): Promise<Record<string, Customer>> => {
    try {
      const keys = await AsyncStorage.getAllKeys();
      const customerKeys = keys.filter(key => key.startsWith(CUSTOMER_PREFIX));
      const entries = await AsyncStorage.multiGet(customerKeys);
      
      return entries.reduce<Record<string, Customer>>((acc, [key, value]) => {
        if (value) {
          const customer = JSON.parse(value);
          acc[customer.id] = customer;
        }
        return acc;
      }, {});
    } catch (error) {
      console.error('Error fetching all customers:', error);
      return {};
    }
  },

  getCustomer: async (customerId: string): Promise<Customer | null> => {
    try {
      const data = await AsyncStorage.getItem(`${CUSTOMER_PREFIX}${customerId}`);
      return data ? JSON.parse(data) : null;
    } catch (error) {
      console.error(`Error fetching customer ${customerId}:`, error);
      return null;
    }
  },

  saveCustomer: async (customer: Omit<Customer, 'createdAt' | 'updatedAt'> & { 
    id?: string 
  }): Promise<Customer> => {
    const now = new Date();
    const isNew = !customer.id;
    const customerId = customer.id || `cust_${Date.now()}`;
    
    // If this is an update, get the existing customer to preserve createdAt
    let existingCustomer: Customer | null = null;
    if (!isNew) {
      existingCustomer = await customerStorage.getCustomer(customerId);
    }
    
    const customerToSave: Customer = {
      ...customer,
      id: customerId,
      createdAt: isNew ? now : (existingCustomer?.createdAt || now),
      updatedAt: now
    };

    try {
      await AsyncStorage.setItem(
        `${CUSTOMER_PREFIX}${customerId}`,
        JSON.stringify(customerToSave)
      );
      return customerToSave;
    } catch (error) {
      console.error('Error saving customer:', error);
      throw error;
    }
  },

  deleteCustomer: async (customerId: string): Promise<boolean> => {
    try {
      await AsyncStorage.removeItem(`${CUSTOMER_PREFIX}${customerId}`);
      return true;
    } catch (error) {
      console.error(`Error deleting customer ${customerId}:`, error);
      return false;
    }
  },

  searchCustomers: async (query: string): Promise<Customer[]> => {
    try {
      const customers = await customerStorage.getAllCustomers();
      const searchTerm = query.toLowerCase();
      
      return Object.values(customers).filter(customer => 
        customer.firstName.toLowerCase().includes(searchTerm) ||
        customer.lastName.toLowerCase().includes(searchTerm) ||
        customer.phone.includes(searchTerm) ||
        (customer.email && customer.email.toLowerCase().includes(searchTerm))
      );
    } catch (error) {
      console.error('Error searching customers:', error);
      return [];
    }
  }
};