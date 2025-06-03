// src/utils/validation/customerValidation.ts
import { Customer } from './types';
import { phoneUtils } from './phoneUtils';

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
}

export interface DuplicateCheckResult {
  phoneExists: boolean;
  emailExists: boolean;
  existingCustomer?: Customer;
}

export const customerValidation = {
  /**
   * Check for duplicate phone numbers and emails in customer list
   */
  checkForDuplicates: async (
    phoneNumber: string, 
    email: string | undefined, 
    customers: Customer[], 
    excludeCustomerId?: string
  ): Promise<DuplicateCheckResult> => {
    const normalizedPhone = phoneUtils.normalize(phoneNumber);
    const normalizedEmail = email?.toLowerCase().trim();

    let phoneExists = false;
    let emailExists = false;
    let existingCustomer: Customer | undefined;

    for (const customer of customers) {
      // Skip the customer we're updating
      if (excludeCustomerId && customer.id === excludeCustomerId) {
        continue;
      }

      // Check phone number
      if (phoneUtils.areEqual(customer.phone, phoneNumber)) {
        phoneExists = true;
        existingCustomer = customer;
      }

      // Check email (only if email is provided)
      if (normalizedEmail && customer.email?.toLowerCase().trim() === normalizedEmail) {
        emailExists = true;
        existingCustomer = customer;
      }
    }

    return {
      phoneExists,
      emailExists,
      existingCustomer
    };
  },

  /**
   * Validate customer data before saving
   */
  validateCustomerData: (data: Partial<Customer>): ValidationResult => {
    const errors: string[] = [];

    // Required field validation
    if (!data.firstName?.trim()) {
      errors.push('First name is required');
    }

    if (!data.lastName?.trim()) {
      errors.push('Last name is required');
    }

    if (!data.phone?.trim()) {
      errors.push('Phone number is required');
    } else if (!phoneUtils.isValid(data.phone)) {
      errors.push('Please enter a valid 10-digit phone number');
    }

    // Email validation (optional but must be valid if provided)
    if (data.email?.trim()) {
      const emailRegex = /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i;
      if (!emailRegex.test(data.email.trim())) {
        errors.push('Please enter a valid email address');
      }
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  },

  /**
   * Normalize customer data before saving
   */
  normalizeCustomerData: (data: Partial<Customer>): Partial<Customer> => {
    return {
      ...data,
      firstName: data.firstName?.trim(),
      lastName: data.lastName?.trim(),
      phone: data.phone ? phoneUtils.normalize(data.phone) : '',
      email: data.email?.toLowerCase().trim() || undefined,
      address: data.address?.trim() || undefined,
      city: data.city?.trim() || undefined,
      state: data.state?.trim() || undefined,
      zipCode: data.zipCode?.trim() || undefined,
    };
  }
};