// src/utils/test/validationTests.ts
import { phoneUtils } from '../phoneUtils';
import { customerValidation } from '../customerValidation';
import { Customer } from '../types';

export const testData = {
  validPhoneNumbers: [
    '5551234567',
    '(555) 123-4567',
    '555-123-4567',
    '555.123.4567',
    '15551234567', // With country code
    '+1 555 123 4567',
  ],
  invalidPhoneNumbers: [
    '555123456', // Too short
    '55512345678', // Too long
    '555-123-456a', // Contains letter
    '555-123-', // Incomplete
    '',
    '123',
  ],
  validEmails: [
    'test@example.com',
    'user.name@domain.co.uk',
    'firstname+lastname@example.org',
  ],
  invalidEmails: [
    'invalid-email',
    '@example.com',
    'test@',
    'test.example.com',
  ],
  sampleCustomers: [
    {
      id: '1',
      firstName: 'John',
      lastName: 'Doe',
      phone: '5551234567',
      email: 'john@example.com',
      notes: [],
      createdAt: new Date(),
    },
    {
      id: '2',
      firstName: 'Jane',
      lastName: 'Smith',
      phone: '5559876543',
      email: 'jane@example.com',
      notes: [],
      createdAt: new Date(),
    },
  ] as Customer[],
};

export const runPhoneValidationTests = () => {
  console.log('=== Phone Validation Tests ===');
  
  // Test phone normalization
  console.log('\n--- Phone Normalization Tests ---');
  testData.validPhoneNumbers.forEach(phone => {
    const normalized = phoneUtils.normalize(phone);
    console.log(`"${phone}" → "${normalized}"`);
  });
  
  // Test phone formatting
  console.log('\n--- Phone Formatting Tests ---');
  const testNumbers = ['5551234567', '555123456', '15551234567'];
  testNumbers.forEach(phone => {
    const formatted = phoneUtils.format(phone);
    console.log(`"${phone}" → "${formatted}"`);
  });
  
  // Test phone validation
  console.log('\n--- Phone Validation Tests ---');
  [...testData.validPhoneNumbers, ...testData.invalidPhoneNumbers].forEach(phone => {
    const isValid = phoneUtils.isValid(phone);
    console.log(`"${phone}" → ${isValid ? 'VALID' : 'INVALID'}`);
  });
  
  // Test phone equality
  console.log('\n--- Phone Equality Tests ---');
  const testPairs = [
    ['5551234567', '(555) 123-4567'],
    ['555-123-4567', '+1 555 123 4567'],
    ['5551234567', '5559876543'],
  ];
  testPairs.forEach(([phone1, phone2]) => {
    const areEqual = phoneUtils.areEqual(phone1, phone2);
    console.log(`"${phone1}" === "${phone2}" → ${areEqual}`);
  });
};

export const runCustomerValidationTests = async () => {
  console.log('\n=== Customer Validation Tests ===');
  
  // Test duplicate detection
  console.log('\n--- Duplicate Detection Tests ---');
  const customers = testData.sampleCustomers;
  
  // Test existing phone
  const duplicatePhone = await customerValidation.checkForDuplicates(
    '5551234567',
    'new@example.com',
    customers
  );
  console.log('Duplicate phone test:', duplicatePhone);
  
  // Test existing email
  const duplicateEmail = await customerValidation.checkForDuplicates(
    '5550000000',
    'john@example.com',
    customers
  );
  console.log('Duplicate email test:', duplicateEmail);
  
  // Test no duplicates
  const noDuplicates = await customerValidation.checkForDuplicates(
    '5550000000',
    'new@example.com',
    customers
  );
  console.log('No duplicates test:', noDuplicates);
  
  // Test customer data validation
  console.log('\n--- Customer Data Validation Tests ---');
  const testCustomers = [
    {
      firstName: 'John',
      lastName: 'Doe',
      phone: '5551234567',
      email: 'john@example.com',
    },
    {
      firstName: '',
      lastName: 'Doe',
      phone: '555123456', // Invalid
      email: 'invalid-email',
    },
    {
      firstName: 'Jane',
      lastName: 'Smith',
      phone: '5559876543',
      // No email (optional)
    },
  ];
  
  testCustomers.forEach((customer, index) => {
    const validation = customerValidation.validateCustomerData(customer);
    console.log(`Customer ${index + 1}:`, validation);
  });
  
  // Test data normalization
  console.log('\n--- Data Normalization Tests ---');
  const testDataForNormalization = {
    firstName: '  John  ',
    lastName: '  Doe  ',
    phone: '(555) 123-4567',
    email: '  JOHN@EXAMPLE.COM  ',
    address: '  123 Main St  ',
  };
  
  const normalized = customerValidation.normalizeCustomerData(testDataForNormalization);
  console.log('Original:', testDataForNormalization);
  console.log('Normalized:', normalized);
};

export const runAllTests = async () => {
  console.log('🧪 Running all validation tests...\n');
  
  try {
    runPhoneValidationTests();
    await runCustomerValidationTests();
    console.log('\n✅ All tests completed!');
  } catch (error) {
    console.error('❌ Test error:', error);
  }
};

// Usage example:
// import { runAllTests } from './src/utils/test/validationTests';
// runAllTests();