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
  StyleProp,
  ViewStyle,
} from 'react-native';
import { Control, Controller, FieldValues, FieldErrors } from 'react-hook-form';
import { Ionicons } from '@expo/vector-icons';

// Common form field configurations that can be reused across the app
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
      keyboardType: 'numeric',
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
  ],
} as const;

// Type for the form fields
export interface FormField {
  name: string;
  label: string;
  placeholder?: string;
  type?: 'text' | 'number' | 'email' | 'password' | 'tel' | 'multiline';
  keyboardType?: 'default' | 'number-pad' | 'decimal-pad' | 'numeric' | 'email-address' | 'phone-pad';
  required?: boolean;
  validation?: Record<string, unknown>;
  autoCapitalize?: 'none' | 'sentences' | 'words' | 'characters';
  secureTextEntry?: boolean;
  disabled?: boolean;
  leftIcon?: keyof typeof Ionicons.glyphMap;
  rightIcon?: keyof typeof Ionicons.glyphMap;
  onRightIconPress?: () => void;
  multiline?: boolean;
  numberOfLines?: number;
}

interface DynamicFormProps {
  control: Control<FieldValues>;
  errors: FieldErrors<FieldValues>;
  fields: FormField[];
  onSubmit: () => void;
  submitText?: string;
  showSubmitButton?: boolean;
  loading?: boolean;
  isVisible?: boolean;
  onClose?: () => void;
  containerStyle?: StyleProp<ViewStyle>;
  scrollViewStyle?: StyleProp<ViewStyle>;
  formContainerStyle?: StyleProp<ViewStyle>;
}

export const DynamicForm: React.FC<DynamicFormProps> = ({
  control,
  errors,
  fields,
  onSubmit,
  submitText = 'Submit',
  showSubmitButton = true,
  loading = false,
  isVisible = true,
  onClose,
  containerStyle,
  scrollViewStyle,
  formContainerStyle,
}) => {
  const renderInput = (field: FormField) => {
    return (
      <View key={field.name} style={styles.fieldContainer}>
        <Text style={styles.label}>
          {field.label}
          {field.required && <Text style={styles.required}> *</Text>}
        </Text>
        <View style={[
          styles.inputContainer,
          errors[field.name] && styles.inputContainerError
        ]}>
          {field.leftIcon && (
            <Ionicons
              name={field.leftIcon}
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
                  errors[field.name] && styles.inputError,
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
            name={field.name}
          />
          {field.rightIcon && (
            <TouchableOpacity 
              onPress={field.onRightIconPress} 
              style={styles.rightIcon}
            >
              <Ionicons name={field.rightIcon} size={20} color="#666" />
            </TouchableOpacity>
          )}
        </View>
        {errors[field.name] && (
          <Text style={styles.errorText}>
            {String(errors[field.name]?.message || `${field.label} is required`)}
          </Text>
        )}
      </View>
    );
  };

  const formContent = (
    <View style={[styles.formContent, formContainerStyle]}>
      {fields.map(renderInput)}
      {showSubmitButton && (
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
      )}
    </View>
  );

  // If isVisible is false, just render the form content directly
  if (!isVisible) {
    return formContent;
  }

  // Otherwise, wrap in modal and keyboard handling
  return (
    <Modal
      visible={isVisible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <TouchableWithoutFeedback onPress={onClose}>
        <View style={[styles.modalOverlay, containerStyle]}>
          <KeyboardAvoidingView 
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            keyboardVerticalOffset={Platform.OS === 'ios' ? 64 : 0}
            style={styles.keyboardAvoidingView}
          >
            <ScrollView 
              style={[styles.scrollView, scrollViewStyle]}
              contentContainerStyle={styles.scrollViewContent}
              keyboardShouldPersistTaps="handled"
            >
              <TouchableWithoutFeedback>
                {formContent}
              </TouchableWithoutFeedback>
            </ScrollView>
          </KeyboardAvoidingView>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
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
    borderRadius: 20,
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
    maxHeight: '90%',
    width: '100%',
    paddingBottom: 0,
    overflow: 'hidden',
  },
  scrollViewContent: {
    padding: 24,
    paddingBottom: 80, // Extra padding at the bottom for better spacing
    minHeight: '100%',
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
  rightIcon: {
    padding: 8,
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
