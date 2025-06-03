// src/components/forms/DynamicForm.tsx - Simplified version
import React, { useState } from 'react';
import { 
  View, 
  StyleSheet, 
  TextInput, 
  TouchableOpacity, 
  Text, 
  ActivityIndicator,
  Modal,
  TouchableWithoutFeedback,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { 
  Control, 
  Controller, 
  FieldValues, 
  FieldErrors, 
  Path,
  UseFormWatch 
} from 'react-hook-form';
import { Ionicons } from '@expo/vector-icons';
import { FormField } from '../../utils/types';
import { phoneUtils } from '../../utils/phoneUtils';

// Enhanced form field configurations with new customer fields
export const formFields = {
  customer: [
    {
      name: 'firstName',
      label: 'First Name',
      placeholder: 'Enter first name',
      required: true,
      leftIcon: 'person-outline',
      autoCapitalize: 'words',
      validation: {
        minLength: {
          value: 2,
          message: 'First name must be at least 2 characters',
        },
      },
    },
    {
      name: 'lastName',
      label: 'Last Name',
      placeholder: 'Enter last name',
      required: true,
      leftIcon: 'person-outline',
      autoCapitalize: 'words',
    },
    {
      name: 'phone',
      label: 'Phone Number',
      placeholder: 'Enter phone number',
      keyboardType: 'phone-pad',
      leftIcon: 'call-outline',
      required: true,
      type: 'phone', // Special type for phone formatting
      validation: {
        validate: (value: string) => {
          if (!phoneUtils.isValid(value)) {
            return 'Please enter a valid 10-digit phone number';
          }
          return true;
        },
      },
    },
    {
      name: 'email',
      label: 'Email',
      placeholder: 'Enter email address',
      keyboardType: 'email-address',
      autoCapitalize: 'none',
      leftIcon: 'mail-outline',
      validation: {
        pattern: {
          value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
          message: 'Invalid email address',
        },
      },
    },
    {
      name: 'address',
      label: 'Address',
      placeholder: 'Enter street address',
      leftIcon: 'location-outline',
      autoCapitalize: 'words',
    },
    {
      name: 'city',
      label: 'City',
      placeholder: 'Enter city',
      leftIcon: 'business-outline',
      autoCapitalize: 'words',
    },
    {
      name: 'state',
      label: 'State',
      placeholder: 'Enter state',
      leftIcon: 'map-outline',
      autoCapitalize: 'characters',
    },
    {
      name: 'zipCode',
      label: 'ZIP Code',
      placeholder: 'Enter ZIP code',
      keyboardType: 'phone-pad',
      leftIcon: 'pin-outline',
    },
  ] as FormField[],
};

interface DynamicFormProps<T extends FieldValues = FieldValues> {
  control: Control<T>;
  errors: FieldErrors<T>;
  fields: FormField[];
  onSubmit: () => void;
  submitText?: string;
  loading?: boolean;
  isVisible?: boolean;
  onClose?: () => void;
  watch?: UseFormWatch<T>;
  serverErrors?: string[];
  formTitle?: string;
}

export function DynamicForm<T extends FieldValues = FieldValues>({
  control,
  errors,
  fields,
  onSubmit,
  submitText = 'Submit',
  loading = false,
  isVisible = true,
  onClose,
  watch,
  serverErrors = [],
  formTitle = 'Form',
}: DynamicFormProps<T>) {
  const [phoneDisplayValues, setPhoneDisplayValues] = useState<Record<string, string>>({});

  const renderValidationIcon = (fieldName: string, value: string, field: FormField) => {
    if (!value) return null;

    let isValid = true;
    if (field.type === 'phone') {
      isValid = phoneUtils.isValid(value);
    } else if (field.keyboardType === 'email-address' && field.validation?.pattern) {
      const pattern = field.validation.pattern as { value: RegExp };
      isValid = pattern.value.test(value);
    }

    if (!field.required && !value) return null;

    return (
      <Ionicons
        name={isValid ? "checkmark-circle" : "close-circle"}
        size={20}
        color={isValid ? "#4CAF50" : "#f44336"}
        style={styles.validationIcon}
      />
    );
  };

  const renderInput = (field: FormField) => (
    <View key={field.name} style={styles.fieldContainer}>
      <Text style={styles.label}>
        {field.label}
        {field.required && <Text style={styles.required}> *</Text>}
      </Text>
      <View style={[
        styles.inputContainer,
        errors[field.name as Path<T>] && styles.inputContainerError
      ]}>
        {field.leftIcon && (
          <Ionicons
            name={field.leftIcon as any}
            size={20}
            color="#666"
            style={styles.leftIcon}
          />
        )}
        <Controller
          control={control}
          rules={{
            required: field.required ? `${field.label} is required` : false,
            ...field.validation,
          }}
          render={({ field: { onChange, onBlur, value } }) => {
            // Handle phone number display and formatting
            if (field.type === 'phone') {
              const currentDisplayValue = phoneDisplayValues[field.name];
              const displayValue = currentDisplayValue !== undefined ? currentDisplayValue : phoneUtils.format(value || '');

              return (
                <TextInput
                  style={[
                    styles.input,
                    errors[field.name as Path<T>] && styles.inputError,
                  ]}
                  placeholder={field.placeholder || field.label}
                  placeholderTextColor="#999"
                  keyboardType={field.keyboardType}
                  autoCapitalize={field.autoCapitalize || 'none'}
                  editable={!field.disabled && !loading}
                  maxLength={14} // (555) 123-4567
                  onBlur={() => {
                    onBlur();
                    // Format and update display on blur
                    if (value) {
                      const formatted = phoneUtils.format(value);
                      setPhoneDisplayValues(prev => ({ ...prev, [field.name]: formatted }));
                    }
                  }}
                  onChangeText={(text) => {
                    // Normalize the input and limit to 10 digits
                    const normalized = phoneUtils.normalize(text);
                    if (normalized.length <= 10) {
                      // Update the form value with normalized number
                      onChange(normalized);
                      // Update display value with formatted number
                      const formatted = phoneUtils.format(text);
                      setPhoneDisplayValues(prev => ({ ...prev, [field.name]: formatted }));
                    }
                  }}
                  value={displayValue}
                />
              );
            }

            // Regular input for non-phone fields
            return (
              <TextInput
                style={[
                  styles.input,
                  field.multiline && styles.multilineInput,
                  errors[field.name as Path<T>] && styles.inputError,
                ]}
                placeholder={field.placeholder || field.label}
                placeholderTextColor="#999"
                keyboardType={field.keyboardType}
                autoCapitalize={field.autoCapitalize || 'none'}
                secureTextEntry={field.secureTextEntry}
                multiline={field.multiline}
                numberOfLines={field.numberOfLines}
                editable={!field.disabled && !loading}
                onBlur={onBlur}
                onChangeText={onChange}
                value={value as string}
              />
            );
          }}
          name={field.name as Path<T>}
        />
        {watch && renderValidationIcon(field.name, watch(field.name as Path<T>) || '', field)}
      </View>
      {errors[field.name as Path<T>] && (
        <Text style={styles.errorText}>
          {String(errors[field.name as Path<T>]?.message || `${field.label} is required`)}
        </Text>
      )}
    </View>
  );

  const formContent = (
    <View style={styles.formContent}>
      {/* Display server errors */}
      {serverErrors.length > 0 && (
        <View style={styles.serverErrorContainer}>
          {serverErrors.map((error, index) => (
            <Text key={index} style={styles.serverErrorText}>
              • {error}
            </Text>
          ))}
        </View>
      )}

      {fields.map(renderInput)}
      
      <TouchableOpacity
        style={[styles.submitButton, loading && styles.submitButtonDisabled]}
        onPress={onSubmit}
        disabled={loading}
      >
        {loading ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.submitText}>{submitText}</Text>
        )}
      </TouchableOpacity>
    </View>
  );

  if (!isVisible) {
    return formContent;
  }

  return (
    <Modal
      visible={isVisible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <TouchableWithoutFeedback onPress={onClose}>
        <View style={styles.modalOverlay}>
          <KeyboardAvoidingView 
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            style={styles.keyboardAvoidingView}
          >
            <TouchableWithoutFeedback>
              <ScrollView 
                style={styles.scrollView}
                contentContainerStyle={styles.scrollViewContent}
                keyboardShouldPersistTaps="handled"
                showsVerticalScrollIndicator={false}
              >
                <View style={styles.modalHeader}>
                  <Text style={styles.modalTitle}>{formTitle}</Text>
                  <TouchableOpacity onPress={onClose} style={styles.closeButton}>
                    <Ionicons name="close" size={24} color="#666" />
                  </TouchableOpacity>
                </View>
                {formContent}
              </ScrollView>
            </TouchableWithoutFeedback>
          </KeyboardAvoidingView>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
}

const styles = StyleSheet.create({
  formContent: {
    width: '100%',
    padding: 16,
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  keyboardAvoidingView: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: 'white',
    borderRadius: 12,
    width: '90%',
    maxWidth: 800, 
    maxHeight: '90%',
    padding: 0,
    overflow: 'hidden',
  },
  scrollView: {
    backgroundColor: '#fff',
    borderRadius: 20,
    maxHeight: '95%',
  },
  scrollViewContent: {
    paddingBottom: 24,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e5e5',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#333',
  },
  closeButton: {
    padding: 4,
  },
  fieldContainer: {
    marginBottom: 16,
    width: '48%',
    minWidth: 160,
  },
  label: {
    marginBottom: 8,
    fontSize: 16,
    color: '#333',
    fontWeight: '500',
  },
  required: {
    color: '#ff4444',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    backgroundColor: '#fff',
    width: '100%',
  },
  inputContainerError: {
    borderColor: '#ff4444',
  },
  input: {
    flex: 1,
    padding: 12,
    fontSize: 16,
    color: '#333',
    minWidth: 0, 
  },
  inputError: {
    borderColor: '#ff4444',
  },
  multilineInput: {
    minHeight: 100,
    textAlignVertical: 'top',
  },
  leftIcon: {
    marginRight: 8,
  },
  validationIcon: {
    marginLeft: 8,
  },
  errorText: {
    marginTop: 4,
    color: '#ff4444',
    fontSize: 12,
  },
  serverErrorContainer: {
    backgroundColor: '#ffebee',
    borderWidth: 1,
    borderColor: '#ff4444',
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
  },
  serverErrorText: {
    color: '#ff4444',
    fontSize: 14,
    marginBottom: 4,
  },
  submitButton: {
    backgroundColor: '#007AFF',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 8,
  },
  submitButtonDisabled: {
    backgroundColor: '#a5d6a7',
  },
  submitText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});