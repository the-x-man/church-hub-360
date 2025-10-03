import React, { forwardRef, useImperativeHandle, useEffect } from 'react';
import { useForm, FormProvider, type FieldValues } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';

export interface FormWrapperProps<T extends FieldValues> {
  schema: any;
  defaultValues?: any;
  onSubmit: (data: T) => Promise<void> | void;
  onValidationError?: (errors: any) => void;
  children: React.ReactNode;
  className?: string;
  resetOnSubmit?: boolean;
}

export interface FormWrapperMethods {
  validateForm: () => Promise<boolean>;
  getFormData: () => any;
  resetForm: () => void;
  validateAndClearFieldError: (fieldName: string, value?: any) => Promise<void>;
  validateField: (fieldName: string) => Promise<boolean>;
  clearFieldError: (fieldName: string) => void;
  getFieldValue: (fieldName: string) => any;
  setValue: (fieldName: string, value: any) => void;
  clearErrors: () => void;
  setError: any;
  trigger: (field?: any) => Promise<boolean>;
}

function FormWrapperComponent<T extends FieldValues>(
  {
    schema,
    defaultValues,
    onSubmit,
    onValidationError,
    children,
    className,
    resetOnSubmit = false,
  }: FormWrapperProps<T>,
  ref: React.Ref<FormWrapperMethods>
) {
  const methods = useForm({
    resolver: zodResolver(schema) as any,
    defaultValues,
    mode: 'onChange',
    reValidateMode: 'onChange',
    shouldFocusError: true,
  });

  const {
    handleSubmit,
    reset,
    formState: { errors },
    trigger,
    setValue,
    getValues,
    clearErrors,
    setError,
  } = methods;

  // Expose methods to parent component
  useImperativeHandle(ref, () => ({
    validateForm: async () => {
      const isValid = await trigger();
      return isValid;
    },
    getFormData: () => getValues(),
    resetForm: () => reset(defaultValues),
    validateAndClearFieldError: async (fieldName: string, value?: any) => {
      if (value !== undefined) {
        setValue(fieldName as any, value);
      }
      // Clear any existing error for this field
      clearErrors(fieldName as any);
      
      // Trigger validation for the field
      await trigger(fieldName as any);
    },
    validateField: async (fieldName: string) => {
      return await trigger(fieldName as any);
    },
    clearFieldError: (fieldName: string) => {
      clearErrors(fieldName as any);
    },
    getFieldValue: (fieldName: string) => getValues(fieldName as any),
    setValue: (fieldName: string, value: any) => {
      setValue(fieldName as any, value);
    },
    clearErrors,
    setError,
    trigger,
  }));

  // Handle form submission
  const onFormSubmit = async (data: T) => {
    try {
      await onSubmit(data);
      if (resetOnSubmit) {
        reset(defaultValues);
      }
    } catch (error) {
      console.error('Form submission error:', error);
      toast.error('An error occurred while submitting the form');
    }
  };

  // Handle validation errors
  useEffect(() => {
    if (Object.keys(errors).length > 0 && onValidationError) {
      onValidationError(errors);
    }
  }, [errors, onValidationError]);

  return (
    <FormProvider {...methods}>
      <form 
        onSubmit={handleSubmit(onFormSubmit as any)} 
        className={className}
        noValidate
      >
        {children}
      </form>
    </FormProvider>
  );
}

const FormWrapper = forwardRef(FormWrapperComponent) as <T extends FieldValues>(
  props: FormWrapperProps<T> & { ref?: React.Ref<FormWrapperMethods> }
) => React.ReactElement;

export { FormWrapper };
export default FormWrapper;