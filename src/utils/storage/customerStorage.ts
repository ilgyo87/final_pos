// src/utils/storage/customerStorage.ts
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Customer } from '../types';
import { customerValidation, DuplicateCheckResult } from '../customerValidation';
import { phoneUtils } from '../phoneUtils';

const CUSTOMER_PREFIX = 'cust_';

export interface SaveCustomerResult {
  success: boolean;
  customer?: Customer;
  errors?: string[];
  duplicateCheck?: DuplicateCheckResult;
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
          // Ensure phone is displayed in formatted way
          customer.phone = phoneUtils.format(customer.phone);
          // Ensure required fields have default values
          customer.notes = customer.notes || [];
          customer.createdAt = customer.createdAt ? new Date(customer.createdAt) : new Date();
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
      if (data) {
        const customer = JSON.parse(data);
        // Format phone for display
        customer.phone = phoneUtils.format(customer.phone);
        // Ensure required fields have default values
        customer.notes = customer.notes || [];
        customer.createdAt = customer.createdAt ? new Date(customer.createdAt) : new Date();
        return customer;
      }
      return null;
    } catch (error) {
      console.error(`Error fetching customer ${customerId}:`, error);
      return null;
    }
  },

  /**
   * Save customer with comprehensive validation
   */
  saveCustomer: async (
    customerData: Partial<Customer> & { 
      firstName: string;
      lastName: string;
      phone: string;
    }
  ): Promise<SaveCustomerResult> => {
    try {
      // Step 1: Validate customer data
      const validation = customerValidation.validateCustomerData(customerData);
      if (!validation.isValid) {
        return {
          success: false,
          errors: validation.errors
        };
      }

      // Step 2: Get all existing customers for duplicate check
      const allCustomers = await customerStorage.getAllCustomers();
      const customersList = Object.values(allCustomers);

      // Step 3: Check for duplicates
      const duplicateCheck = await customerValidation.checkForDuplicates(
        customerData.phone!,
        customerData.email,
        customersList,
        customerData.id // Exclude current customer if updating
      );

      if (duplicateCheck.phoneExists || duplicateCheck.emailExists) {
        const errors: string[] = [];
        if (duplicateCheck.phoneExists) {
          errors.push(`Phone number already exists for ${duplicateCheck.existingCustomer?.firstName} ${duplicateCheck.existingCustomer?.lastName}`);
        }
        if (duplicateCheck.emailExists) {
          errors.push(`Email already exists for ${duplicateCheck.existingCustomer?.firstName} ${duplicateCheck.existingCustomer?.lastName}`);
        }

        return {
          success: false,
          errors,
          duplicateCheck
        };
      }

      // Step 4: Normalize data
      const normalizedData = customerValidation.normalizeCustomerData(customerData);

      // Step 5: Prepare customer object
      const now = new Date();
      const isNew = !customerData.id;
      const customerId = customerData.id || `cust_${Date.now()}`;
      
      // If updating, get existing customer to preserve createdAt
      let existingCustomer: Customer | null = null;
      if (!isNew) {
        existingCustomer = await customerStorage.getCustomer(customerId);
      }
      
      const customerToSave: Customer = {
        ...normalizedData,
        id: customerId,
        firstName: normalizedData.firstName!,
        lastName: normalizedData.lastName!,
        phone: normalizedData.phone!, // Store normalized (digits only)
        email: normalizedData.email,
        address: normalizedData.address,
        city: normalizedData.city,
        state: normalizedData.state,
        zipCode: normalizedData.zipCode,
        businessId: normalizedData.businessId,
        cognitoId: normalizedData.cognitoId,
        coordinates: normalizedData.coordinates,
        notes: normalizedData.notes || [],
        createdAt: isNew ? now : (existingCustomer?.createdAt || now),
        updatedAt: now
      };

      // Step 6: Save to storage
      await AsyncStorage.setItem(
        `${CUSTOMER_PREFIX}${customerId}`,
        JSON.stringify(customerToSave)
      );

      // Step 7: Return formatted customer for display
      const savedCustomer = {
        ...customerToSave,
        phone: phoneUtils.format(customerToSave.phone) // Format for display
      };

      return {
        success: true,
        customer: savedCustomer
      };

    } catch (error) {
      console.error('Error saving customer:', error);
      return {
        success: false,
        errors: ['Failed to save customer. Please try again.']
      };
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
      
      return Object.values(customers).filter(customer => {
        // Search in name, phone (both normalized and formatted), and email
        const normalizedPhone = phoneUtils.normalize(customer.phone);
        const formattedPhone = phoneUtils.format(customer.phone);
        
        return (
          customer.firstName.toLowerCase().includes(searchTerm) ||
          customer.lastName.toLowerCase().includes(searchTerm) ||
          normalizedPhone.includes(searchTerm.replace(/\D/g, '')) ||
          formattedPhone.includes(searchTerm) ||
          (customer.email && customer.email.toLowerCase().includes(searchTerm))
        );
      });
    } catch (error) {
      console.error('Error searching customers:', error);
      return [];
    }
  },

  /**
   * Check if phone number exists (utility function)
   */
  phoneExists: async (phoneNumber: string, excludeCustomerId?: string): Promise<boolean> => {
    const customers = await customerStorage.getAllCustomers();
    const customersList = Object.values(customers);
    const duplicateCheck = await customerValidation.checkForDuplicates(
      phoneNumber,
      undefined,
      customersList,
      excludeCustomerId
    );
    return duplicateCheck.phoneExists;
  },

  /**
   * Check if email exists (utility function)
   */
  emailExists: async (email: string, excludeCustomerId?: string): Promise<boolean> => {
    const customers = await customerStorage.getAllCustomers();
    const customersList = Object.values(customers);
    const duplicateCheck = await customerValidation.checkForDuplicates(
      '',
      email,
      customersList,
      excludeCustomerId
    );
    return duplicateCheck.emailExists;
  }
};