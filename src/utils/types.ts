// src/utils/types.ts
// Core business types
export interface Location {
  lat: number;
  long: number;
}

export interface Customer {
  id: string;
  firstName: string;
  lastName: string;
  address?: string;
  city?: string;
  state?: string;
  zipCode?: string;
  phone: string;
  coordinates?: Location;
  email?: string;
  businessId?: string;
  cognitoId?: string;
  notes: string[]; // Changed from optional to required array
  createdAt: Date;
  updatedAt?: Date;
}

export interface Business {
  id: string;
  businessName: string;
  firstName?: string;
  lastName?: string;
  address?: string;
  city?: string;
  state?: string;
  zipCode?: string;
  phone: string;
  coordinates?: Location;
  email: string;
  website?: string;
  hours?: string[];
  logoUrl?: string;
  logoSource?: string;
  userId?: string;
}

export interface OrderItem {
  id: string;
  name: string;
  description?: string;
  price?: number;
  discount?: number;
  category?: string;
  starch?: 'none' | 'light' | 'medium' | 'heavy';
  pressOnly?: boolean;
  notes?: string[];
}

export interface Order {
  id: string;
  businessId: string;
  customerId: string;
  employeeId: string;
  items: OrderItem[];
  paymentMethod: string;
  total: number;
  status: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface Employee {
  id: string;
  firstName: string;
  lastName: string;
  address?: string;
  city?: string;
  state?: string;
  zipCode?: string;
  phone: string;
  coordinates?: Location;
  email?: string;
  businessId?: string;
  cognitoId?: string;
  pin?: string;
}

// Form types
export interface FormField {
  name: string;
  label: string;
  placeholder?: string;
  type?: 'text' | 'number' | 'email' | 'password' | 'tel' | 'multiline' | 'phone'; // Added 'phone' type
  keyboardType?: 'default' | 'number-pad' | 'decimal-pad' | 'numeric' | 'email-address' | 'phone-pad';
  required?: boolean;
  validation?: Record<string, unknown>;
  autoCapitalize?: 'none' | 'sentences' | 'words' | 'characters';
  secureTextEntry?: boolean;
  disabled?: boolean;
  leftIcon?: string;
  rightIcon?: string;
  onRightIconPress?: () => void;
  multiline?: boolean;
  numberOfLines?: number;
}