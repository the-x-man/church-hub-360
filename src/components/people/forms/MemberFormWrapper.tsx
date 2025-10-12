import  { forwardRef, useImperativeHandle, useRef, useState, useCallback, useEffect } from 'react';
import { DefaultMembershipForm, type DefaultMembershipFormMethods, type DefaultMembershipFormData } from '../configurations/DefaultMembershipForm';
import { CustomFieldsRenderer } from '@/modules/internal/custom-field-rendering/components/CustomFieldsRenderer';
import { useMembershipFormManagement } from '@/hooks/usePeopleConfigurationQueries';
import { useOrganization } from '@/contexts/OrganizationContext';
import { useFileUpload } from '@/hooks/useFileUpload';
import type { CreateMemberData, UpdateMemberData } from '@/types/members';
import { convertToFlattenedFieldData, convertSavedDataToFormValues } from '@/modules/internal/custom-field-rendering/utils';
import { toast } from 'sonner';

export interface MemberFormData {
  defaultFields: DefaultMembershipFormData;
  customFields: Record<string, any>;
}

export interface MemberFormValidationResult {
  isValid: boolean;
  errors: {
    defaultFields?: Record<string, string>;
    customFields?: Record<string, string>;
  };
}

export interface MemberFormProcessingResult {
  isValid: boolean;
  errors?: {
    defaultFields?: Record<string, string>;
    customFields?: Record<string, string>;
  };
  createData?: Omit<CreateMemberData, 'organization_id' | 'branch_id'>;
  updateData?: Omit<UpdateMemberData, 'id' | 'branch_id'>;
  processedCustomFields?: Record<string, any>;
}

export interface MemberFormWrapperMethods {
  validateForm: () => MemberFormValidationResult;
  resetForm: () => void;
  getFormData: () => MemberFormData | null;
  uploadCustomFieldFiles: (customFields: Record<string, any>) => Promise<Record<string, any>>;
  isUploading: () => boolean;
  processFormForSubmission: (mode: 'create' | 'update') => Promise<MemberFormProcessingResult>;
}

export interface MemberFormWrapperProps {
  initialData?: {
    defaultFields?: Partial<DefaultMembershipFormData>;
    customFields?: Record<string, any>;
  };
  onFormDataChange?: (data: MemberFormData) => void;
  onValidationChange?: (isValid: boolean) => void;
}

export const MemberFormWrapper = forwardRef<MemberFormWrapperMethods, MemberFormWrapperProps>(
  ({ initialData, onFormDataChange, onValidationChange }, ref) => {
    const { currentOrganization } = useOrganization();
    const formRef = useRef<DefaultMembershipFormMethods>(null);
    
    // Get the membership form schema first
    const { membershipFormSchema } = useMembershipFormManagement(currentOrganization?.id);
    const { uploadFile, isUploading: isFileUploading, error: fileUploadError } = useFileUpload();
    
    const [formData, setFormData] = useState<DefaultMembershipFormData | null>(null);
    const [customFieldValues, setCustomFieldValues] = useState<Record<string, any>>(() => {
      // Initialize with reverse-mapped values from saved data if available
      if (initialData?.customFields && membershipFormSchema) {
        return convertSavedDataToFormValues(initialData.customFields, membershipFormSchema);
      }
      return initialData?.customFields || {};
    });
    const [customFieldErrors, setCustomFieldErrors] = useState<Record<string, string>>({});

    // Show file upload errors as toast
    useEffect(() => {
      if (fileUploadError) {
        toast.error(`File upload failed: ${fileUploadError}`);
      }
    }, [fileUploadError]);

    // Initialize custom field values when initialData or schema changes
    useEffect(() => {
      if (initialData?.customFields && membershipFormSchema) {
        // Use reverse mapping to populate form values with validation
        const mappedValues = convertSavedDataToFormValues(initialData.customFields, membershipFormSchema);
        setCustomFieldValues(mappedValues);
      } else if (initialData?.customFields) {
        // Fallback to direct assignment if no schema available
        setCustomFieldValues(initialData.customFields);
      }
    }, [initialData?.customFields, membershipFormSchema]);

    const handleFormDataChange = useCallback((data: DefaultMembershipFormData) => {
      setFormData(data);
      
      if (onFormDataChange && data) {
        onFormDataChange({
          defaultFields: data,
          customFields: customFieldValues
        });
      }
    }, [customFieldValues, onFormDataChange]);

    const handleCustomFieldChange = useCallback((values: Record<string, any>) => {
      setCustomFieldValues(values);
      
      if (onFormDataChange && formData) {
        onFormDataChange({
          defaultFields: formData,
          customFields: values
        });
      }
    }, [formData, onFormDataChange]);

    // Helper function to upload files in custom fields
    const uploadCustomFieldFiles = async (customFields: Record<string, any>): Promise<Record<string, any>> => {
      const processedFields = { ...customFields };
      
      // Only process files for fields that are actually file type components
      if (membershipFormSchema?.rows) {
        for (const row of membershipFormSchema.rows) {
          for (const column of row.columns) {
            if (column.component?.type === 'file') {
              const fieldId = `${row.id}-${column.id}`;
              const value = processedFields[fieldId];
              
              if (value instanceof File) {
                try {
                  const result = await uploadFile({
                    file: value,
                    bucketName: 'church-hub-360',
                    fileName: `member-${Date.now()}-${value.name}`
                  });
                  
                  // The result is directly the UploadResponse with url property
                  processedFields[fieldId] = result.url;
                } catch (error) {
                  console.error(`Failed to upload file for field ${fieldId}:`, error);
                  throw new Error(`Failed to upload file: ${value.name}`);
                }
              }
            }
          }
        }
      }
      
      return processedFields;
    };

    const validateForm = useCallback((): MemberFormValidationResult => {
      let isValid = true;
      const errors: MemberFormValidationResult['errors'] = {};

      // Validate the default form
      const validationResult = formRef.current?.validateForm();
      const isFormValid = validationResult && validationResult.isValid;
      if (!isFormValid) {
        isValid = false;
        // Convert FormValidationErrors to Record<string, string>
        const formErrors = validationResult?.errors || {};
        const convertedErrors: Record<string, string> = {};
        Object.entries(formErrors).forEach(([key, value]) => {
          if (value) convertedErrors[key] = value;
        });
        errors.defaultFields = convertedErrors;
      }

      // Validate required custom fields
      const newCustomFieldErrors: Record<string, string> = {};
      if (membershipFormSchema?.rows) {
        for (const row of membershipFormSchema.rows) {
          for (const column of row.columns) {
            if (column.component?.required) {
              const fieldId = `${row.id}-${column.id}`;
              const value = customFieldValues[fieldId];
              let hasValue = false;

              // Check if field has a value based on component type
              switch (column.component.type) { 
                case 'text':
                case 'email':
                case 'phone':
                case 'number':
                case 'textarea':
                case 'date':
                  hasValue = value && value.toString().trim() !== '';
                  break;
                case 'select':
                case 'radio':
                  hasValue = value && value !== '';
                  break;
                case 'checkbox':
                  hasValue = Array.isArray(value) && value.length > 0;
                  break;
                case 'file':
                  hasValue = value instanceof File || (typeof value === 'string' && value.trim() !== '');
                  break;
                default:
                  hasValue = value !== undefined && value !== null && value !== '';
              }

              if (!hasValue) {
                newCustomFieldErrors[fieldId] = `${column.component.label} is required`;
                isValid = false;
              }
            }
          }
        }
      }

      if (Object.keys(newCustomFieldErrors).length > 0) {
        errors.customFields = newCustomFieldErrors;
      }

      // Set custom field errors for UI display
      setCustomFieldErrors(newCustomFieldErrors);

      // Notify parent of validation state change
      if (onValidationChange) {
        onValidationChange(isValid);
      }

      return { isValid, errors };
    }, [membershipFormSchema, customFieldValues, onValidationChange]);

    const resetForm = useCallback(() => {
      formRef.current?.resetForm();
      setFormData(null);
      setCustomFieldValues(initialData?.customFields || {});
      setCustomFieldErrors({});
    }, [initialData?.customFields]);

    const getFormData = useCallback((): MemberFormData | null => {
      if (!formData) return null;
      
      return {
        defaultFields: formData,
        customFields: customFieldValues
      };
    }, [formData, customFieldValues]);

    const isUploading = useCallback(() => {
      return isFileUploading;
    }, [isFileUploading]);

    const processFormForSubmission = useCallback(async (mode: 'create' | 'update'): Promise<MemberFormProcessingResult> => {
      // First validate the form
      const validationResult = validateForm();
      
      if (!validationResult.isValid) {
        return {
          isValid: false,
          errors: validationResult.errors
        };
      }

      try {
        // Upload custom field files if any
        const processedCustomFields = await uploadCustomFieldFiles(customFieldValues);
        
        // Get current form data
        const currentFormData = getFormData();
        if (!currentFormData) {
          return {
            isValid: false,
            errors: {
              defaultFields: { general: 'Form data is not available' }
            }
          };
        }

        // Create optimized Custom_form_data with flattened field metadata
        const optimizedFormData = convertToFlattenedFieldData(processedCustomFields, membershipFormSchema);

        // Convert form data to API format
        const baseData = {
          membership_id: currentFormData.defaultFields.membership_id,
          first_name: currentFormData.defaultFields.first_name,
          last_name: currentFormData.defaultFields.last_name,
          middle_name: currentFormData.defaultFields.middle_name,
          email: currentFormData.defaultFields.email,
          phone: currentFormData.defaultFields.phone,
          date_of_birth: currentFormData.defaultFields.date_of_birth ? currentFormData.defaultFields.date_of_birth.toISOString().split('T')[0] : undefined,
          gender: currentFormData.defaultFields.gender,
          marital_status: currentFormData.defaultFields.marital_status,
          address_line_1: currentFormData.defaultFields.address_line_1,
          address_line_2: currentFormData.defaultFields.address_line_2,
          city: currentFormData.defaultFields.city,
          state: currentFormData.defaultFields.state,
          postal_code: currentFormData.defaultFields.postal_code,
          country: currentFormData.defaultFields.country,
          membership_status: currentFormData.defaultFields.membership_status,
          membership_type: currentFormData.defaultFields.membership_type,
          date_joined: currentFormData.defaultFields.date_joined ? currentFormData.defaultFields.date_joined.toISOString().split('T')[0] : undefined,
          baptism_date: currentFormData.defaultFields.baptism_date ? currentFormData.defaultFields.baptism_date.toISOString().split('T')[0] : undefined,
          emergency_contact_name: currentFormData.defaultFields.emergency_contact_name,
          emergency_contact_phone: currentFormData.defaultFields.emergency_contact_phone,
          emergency_contact_relationship: currentFormData.defaultFields.emergency_contact_relationship,
          profile_image_url: currentFormData.defaultFields.profile_image_url,
          notes: currentFormData.defaultFields.notes,
          custom_form_data: optimizedFormData
        };

        if (mode === 'create') {
          return {
            isValid: true,
            createData: baseData,
            processedCustomFields
          };
        } else {
          return {
            isValid: true,
            updateData: baseData,
            processedCustomFields
          };
        }
      } catch (error) {
        console.error('Error processing form for submission:', error);
        return {
          isValid: false,
          errors: {
            defaultFields: { general: 'Failed to process form data' }
          }
        };
      }
    }, [validateForm, uploadCustomFieldFiles, customFieldValues, getFormData]);

    // Expose methods through ref
    useImperativeHandle(ref, () => ({
      validateForm,
      resetForm,
      getFormData,
      uploadCustomFieldFiles,
      isUploading,
      processFormForSubmission
    }), [validateForm, resetForm, getFormData, uploadCustomFieldFiles, isUploading, processFormForSubmission]);

    return (
      <div className="space-y-6">
        <DefaultMembershipForm
          ref={formRef}
          initialData={initialData?.defaultFields}
          onFormDataChange={handleFormDataChange}
        />

        {/* Custom Fields from Membership Form Schema */}
        {membershipFormSchema && (
          <CustomFieldsRenderer
            schema={membershipFormSchema}
            isPreviewMode={false}
            values={customFieldValues}
            onValuesChange={handleCustomFieldChange}
            errors={customFieldErrors}
            savedData={initialData?.customFields ? (() => {
              // Convert member.custom_form_data to SavedFormData format
              const savedFormData: any = {
                version: '1.0.0',
                timestamp: new Date().toISOString(),
                fields: {}
              };

              // Handle the custom_form_data structure which contains the actual field values
              Object.entries(initialData.customFields).forEach(([fieldKey, fieldValue]) => {
                // Find the field metadata from the schema
                let fieldMetadata = null;
                
                if (membershipFormSchema) {
                  // Look for the field in the schema by matching field IDs
                  for (const row of membershipFormSchema.rows) {
                    for (const column of row.columns) {
                      if (column.component && (
                        column.component.id === fieldKey || 
                        fieldKey.includes(column.component.id) ||
                        column.id === fieldKey
                      )) {
                        fieldMetadata = {
                          schemaId: column.component.id,
                          label: column.component.label,
                          type: column.component.type,
                          required: column.component.required || false,
                          version: '1.0.0',
                          lastModified: new Date().toISOString()
                        };
                        break;
                      }
                    }
                    if (fieldMetadata) break;
                  }
                }

                // If we found metadata, add the field to savedFormData
                if (fieldMetadata) {
                  savedFormData.fields[fieldKey] = {
                    value: fieldValue,
                    metadata: fieldMetadata
                  };
                }
              });

              return savedFormData;
            })() : undefined}
            showValidationSummary={false}
            showEvolutionInfo={true}
          />
        )}
      </div>
    );
  }
);

MemberFormWrapper.displayName = 'MemberFormWrapper';