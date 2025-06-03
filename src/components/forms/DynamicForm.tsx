import React from 'react';
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
import { Control, Controller, FieldValues, FieldErrors, Path } from 'react-hook-form';
import { Ionicons } from '@expo/vector-icons';
import { FormField } from '../../utils/types';

// Predefined form field configurations
export const formFields = {
  customer: [
    {
      name: 'firstName',
      label: 'First Name',
      placeholder: 'Enter first name',
      required: true,
      leftIcon: 'person-outline',
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
    },
    {
      name: 'phone',
      label: 'Phone Number',
      placeholder: 'Enter phone number',
      keyboardType: 'phone-pad',
      leftIcon: 'call-outline',
      required: true,
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
}: DynamicFormProps<T>) {
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
          render={({ field: { onChange, onBlur, value } }) => (
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
              editable={!field.disabled}
              onBlur={onBlur}
              onChangeText={onChange}
              value={value as string}
            />
          )}
          name={field.name as Path<T>}
        />
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
              >
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
  scrollView: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '90%',
  },
  scrollViewContent: {
    padding: 24,
    paddingBottom: 40,
  },
  fieldContainer: {
    marginBottom: 20,
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
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
    paddingHorizontal: 12,
  },
  inputContainerError: {
    borderColor: '#ff4444',
    borderWidth: 1,
  },
  input: {
    flex: 1,
    paddingVertical: 12,
    fontSize: 16,
    color: '#333',
    minHeight: 48,
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
  errorText: {
    marginTop: 4,
    color: '#ff4444',
    fontSize: 12,
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