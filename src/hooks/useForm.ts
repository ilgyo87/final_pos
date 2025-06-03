import { useForm as useReactHookForm, UseFormReturn, FieldValues, UseFormProps, DefaultValues } from 'react-hook-form';

type UseFormParams<T extends FieldValues> = {
  defaultValues?: DefaultValues<T> | (() => Promise<DefaultValues<T>>);
  mode?: 'onSubmit' | 'onChange' | 'onBlur' | 'onTouched' | 'all';
  reValidateMode?: 'onChange' | 'onBlur' | 'onSubmit';
  criteriaMode?: 'firstError' | 'all';
  shouldFocusError?: boolean;
};

export const useForm = <T extends FieldValues>({
  defaultValues,
  mode = 'onSubmit',
  reValidateMode = 'onChange',
  criteriaMode = 'firstError',
  shouldFocusError = true,
}: UseFormParams<T> = {}): UseFormReturn<T> => {
  return useReactHookForm<T>({
    mode,
    reValidateMode,
    criteriaMode,
    defaultValues: defaultValues as DefaultValues<T> | undefined,
    shouldFocusError,
  });
};
