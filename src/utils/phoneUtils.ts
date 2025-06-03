export const phoneUtils = {
    /**
     * Normalize phone number to digits only
     * Removes all non-digit characters and handles +1 country code
     */
    normalize: (phoneNumber: string): string => {
      // Remove all non-digit characters
      const digitsOnly = phoneNumber.replace(/\D/g, '');
      
      // Handle US country code (+1)
      if (digitsOnly.length === 11 && digitsOnly.startsWith('1')) {
        return digitsOnly.slice(1); // Remove leading 1
      }
      
      return digitsOnly;
    },
  
    /**
     * Format phone number for display
     * Converts 10-digit number to (XXX) XXX-XXXX format
     */
    format: (phoneNumber: string): string => {
      const normalized = phoneUtils.normalize(phoneNumber);
      
      if (normalized.length !== 10) {
        return phoneNumber; // Return original if not 10 digits
      }
      
      return `(${normalized.slice(0, 3)}) ${normalized.slice(3, 6)}-${normalized.slice(6)}`;
    },
  
    /**
     * Validate phone number format
     * Returns true if phone number is valid (10 digits after normalization)
     */
    isValid: (phoneNumber: string): boolean => {
      const normalized = phoneUtils.normalize(phoneNumber);
      return normalized.length === 10 && /^\d{10}$/.test(normalized);
    },
  
    /**
     * Check if two phone numbers are the same after normalization
     */
    areEqual: (phone1: string, phone2: string): boolean => {
      return phoneUtils.normalize(phone1) === phoneUtils.normalize(phone2);
    }
  };