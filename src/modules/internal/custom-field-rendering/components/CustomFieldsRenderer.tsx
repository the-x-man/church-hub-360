import { useCallback, useMemo } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Textarea } from '@/components/ui/textarea';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Upload, AlertCircle, Info } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { DatePicker } from '@/components/shared/DatePicker';
import FileRenderer from './FileRenderer';
import type {
  MembershipFormSchema,
  FormComponent,
} from '@/types/people-configurations';
import {
  useFieldMapping,
  useSchemaValidation,
  useSchemaEvolution,
} from '../hooks';
import type { SavedFormData } from '../types';

interface CustomFieldsRendererProps {
  schema: MembershipFormSchema;
  isPreviewMode?: boolean;
  values?: Record<string, any>;
  onValuesChange?: (values: Record<string, any>) => void;
  errors?: Record<string, string>;
  disabled?: boolean;
  className?: string;
  savedData?:
    | SavedFormData
    | { version: string; timestamp: string; fields: Record<string, any> }
    | null;
  showValidationSummary?: boolean;
  showEvolutionInfo?: boolean;
}

export function CustomFieldsRenderer({
  schema,
  isPreviewMode = false,
  values = {},
  onValuesChange,
  errors = {},
  disabled = false,
  className = '',
  savedData = null,
  showValidationSummary = false,
  showEvolutionInfo = false,
}: CustomFieldsRendererProps) {
  // Convert savedData to proper SavedFormData format if needed
  const currentSavedData = useMemo<SavedFormData | null>(() => {
    if (!savedData) return null;

    // If savedData is already in the correct format, return it
    if (
      'schemaId' in savedData &&
      'schemaVersion' in savedData &&
      'savedAt' in savedData
    ) {
      return savedData as SavedFormData;
    }

    // Convert from the format passed by MemberFormWrapper
    return {
      schemaId: schema.id || 'default',
      schemaVersion: Date.now(),
      savedAt: Date.now(),
      fields: savedData.fields || {},
    } as SavedFormData;
  }, [savedData, schema.id]);

  // Use our custom hooks for enhanced functionality
  const fieldMapping = useFieldMapping(currentSavedData, schema);
  const validation = useSchemaValidation(currentSavedData, schema);
  const evolution = useSchemaEvolution(currentSavedData, schema);

  // Notify parent of value changes with enhanced validation
  const handleValueChange = useCallback(
    (fieldId: string, value: any) => {
      const newValues = { ...values, [fieldId]: value };

      // Validate the specific field
      const fieldValidation = validation.validateField(fieldId, value);

      // Update values
      if (onValuesChange) {
        onValuesChange(newValues);
      }

      // Log validation result for debugging
      if (!fieldValidation.isValid) {
        console.warn(
          `Field ${fieldId} validation failed:`,
          fieldValidation.errors
        );
      }
    },
    [values, onValuesChange, validation]
  );

  // Get default placeholder for field types
  const getDefaultPlaceholder = (type: string): string => {
    switch (type) {
      case 'text':
        return 'Enter text...';
      case 'email':
        return 'Enter email address...';
      case 'phone':
        return 'Enter phone number...';
      case 'number':
        return 'Enter number...';
      case 'textarea':
        return 'Enter your message...';
      case 'select':
        return 'Select an option...';
      case 'date':
        return 'Select date...';
      case 'file':
        return 'Choose file...';
      default:
        return 'Enter value...';
    }
  };

  // Render individual form field
  const renderFormField = (component: FormComponent, fieldId: string) => {
    const fieldValue = values[fieldId] || '';
    const placeholder =
      component.placeholder || getDefaultPlaceholder(component.type);
    const hasError = !!errors[fieldId];
    const errorClass = hasError
      ? 'border-destructive focus:border-destructive'
      : '';

    switch (component.type) {
      case 'text':
      case 'email':
      case 'phone':
      case 'number':
        return (
          <Input
            type={
              component.type === 'number'
                ? 'number'
                : component.type === 'email'
                ? 'email'
                : 'text'
            }
            placeholder={placeholder}
            value={fieldValue}
            onChange={(e) => handleValueChange(fieldId, e.target.value)}
            className={`w-full ${errorClass}`}
            disabled={disabled || isPreviewMode}
          />
        );

      case 'textarea':
        return (
          <Textarea
            placeholder={placeholder}
            value={fieldValue}
            onChange={(e) => handleValueChange(fieldId, e.target.value)}
            className={`w-full min-h-[80px] ${errorClass}`}
            disabled={disabled || isPreviewMode}
          />
        );

      case 'select':
        return (
          <Select
            value={fieldValue}
            onValueChange={(value) => handleValueChange(fieldId, value)}
            disabled={disabled || isPreviewMode}
          >
            <SelectTrigger className={`w-full ${errorClass}`}>
              <SelectValue placeholder={placeholder} />
            </SelectTrigger>
            <SelectContent>
              {(component.options || []).map((option, index) => (
                <SelectItem key={index} value={option}>
                  {option}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        );

      case 'radio':
        return (
          <RadioGroup
            value={fieldValue}
            onValueChange={(value) => handleValueChange(fieldId, value)}
            disabled={disabled || isPreviewMode}
            className={errorClass}
          >
            {(component.options || []).map((option, index) => (
              <div key={index} className="flex items-center space-x-2">
                <RadioGroupItem
                  value={option}
                  id={`${fieldId}-radio-${index}`}
                />
                <Label
                  htmlFor={`${fieldId}-radio-${index}`}
                  className="cursor-pointer"
                >
                  {option}
                </Label>
              </div>
            ))}
          </RadioGroup>
        );

      case 'checkbox':
        const checkboxValues = Array.isArray(fieldValue) ? fieldValue : [];
        return (
          <div className={`space-y-2 ${errorClass}`}>
            {(component.options || []).map((option, index) => (
              <div key={index} className="flex items-center space-x-2">
                <Checkbox
                  id={`${fieldId}-checkbox-${index}`}
                  checked={checkboxValues.includes(option)}
                  onCheckedChange={(checked) => {
                    const newValues = checked
                      ? [...checkboxValues, option]
                      : checkboxValues.filter((val) => val !== option);
                    handleValueChange(fieldId, newValues);
                  }}
                  disabled={disabled || isPreviewMode}
                />
                <Label
                  htmlFor={`${fieldId}-checkbox-${index}`}
                  className="cursor-pointer"
                >
                  {option}
                </Label>
              </div>
            ))}
          </div>
        );

      case 'date':
        return (
          <DatePicker
            value={fieldValue}
            onChange={(date) => handleValueChange(fieldId, date)}
            placeholder={placeholder}
            disabled={disabled || isPreviewMode}
            className={errorClass}
          />
        );

      case 'file':
        return (
          <div className={`space-y-2 ${errorClass}`}>
            <div className="flex items-center justify-center w-full">
              <label
                htmlFor={`${fieldId}-file`}
                className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-muted-foreground/25 rounded-lg cursor-pointer bg-muted/10 hover:bg-muted/20 transition-colors"
              >
                <div className="flex flex-col items-center justify-center pt-5 pb-6 px-4 text-center">
                  <Upload className="w-8 h-8 mb-2 text-muted-foreground" />
                  <p className="mb-2 text-sm text-muted-foreground">
                    <span className="font-semibold">
                      {component.fileSettings?.dropzoneText ||
                        'Click to upload'}
                    </span>{' '}
                    or drag and drop
                  </p>
                  {component.fileSettings?.acceptedFileTypes && (
                    <p className="text-xs text-muted-foreground">
                      {component.fileSettings.acceptedFileTypes.join(', ')}
                    </p>
                  )}
                </div>
                <input
                  id={`${fieldId}-file`}
                  type="file"
                  className="hidden"
                  accept={component.fileSettings?.acceptedFileTypes?.join(',')}
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      handleValueChange(fieldId, file);
                    }
                  }}
                  disabled={disabled || isPreviewMode}
                />
              </label>
            </div>
            {fieldValue && (
              <div className="mt-2">
                {typeof fieldValue === 'object' && fieldValue.name ? (
                  <FileRenderer
                    url={URL.createObjectURL(fieldValue)}
                    fileName={fieldValue.name}
                    className="w-full"
                  />
                ) : typeof fieldValue === 'string' && fieldValue ? (
                  <FileRenderer url={fieldValue} className="w-full" />
                ) : null}
              </div>
            )}
          </div>
        );

      default:
        return (
          <Input
            placeholder={placeholder}
            value={fieldValue}
            onChange={(e) => handleValueChange(fieldId, e.target.value)}
            className={`w-full ${errorClass}`}
            disabled={disabled || isPreviewMode}
          />
        );
    }
  };

  // Don't render anything if no schema or no rows
  if (!schema || !schema.rows || schema.rows.length === 0) {
    return null;
  }

  return (
    <div
      className={`my-3 border border-border rounded-lg p-6 shadow-sm ${className}`}
    >
      <div className="mb-4">
        <h3 className="text-lg font-semibold text-foreground">
          Additional Information
        </h3>

        {/* Schema Evolution Information */}
        {showEvolutionInfo && evolution.evolutionResult.changes.length > 0 && (
          <Alert className="mt-2">
            <Info className="h-4 w-4" />
            <AlertDescription>
              <div className="space-y-2">
                <p className="font-medium">
                  Schema has evolved since last save
                </p>

                {/* Orphaned Fields */}
                {fieldMapping.mappingResult &&
                  fieldMapping.mappingResult.orphaned.length > 0 && (
                    <div>
                      <p className="font-medium text-sm">
                        Fields no longer in form:
                      </p>
                      <ul className="list-disc list-inside text-sm">
                        {fieldMapping.mappingResult.orphaned.map((orphaned) => (
                          <li key={orphaned.fieldId}>
                            {orphaned.savedMetadata.label} (
                            {orphaned.savedMetadata.type})
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                {/* Missing Fields */}
                {fieldMapping.mappingResult &&
                  fieldMapping.mappingResult.missing.length > 0 && (
                    <div>
                      <p className="font-medium text-sm">New fields added:</p>
                      <ul className="list-disc list-inside text-sm">
                        {fieldMapping.mappingResult.missing.map((missing) => (
                          <li key={missing.fieldId}>
                            {missing.currentMetadata.label} (
                            {missing.currentMetadata.type})
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
              </div>
            </AlertDescription>
          </Alert>
        )}

        {/* Validation Summary */}
        {showValidationSummary && !validation.isValid && (
          <Alert variant="destructive" className="mt-2">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              <div className="space-y-1">
                <p className="font-medium">Form validation issues:</p>
                <ul className="text-sm list-disc list-inside">
                  {Object.entries(validation.fieldErrors).map(
                    ([fieldId, error]) => (
                      <li key={fieldId}>
                        {fieldId}: {error}
                      </li>
                    )
                  )}
                </ul>
              </div>
            </AlertDescription>
          </Alert>
        )}

        {/* Field Mapping Status */}
        {fieldMapping.hasOrphanedFields && (
          <Alert className="mt-2">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              <div className="space-y-1">
                <p className="font-medium">Data mapping issues detected</p>
                <div className="flex flex-wrap gap-1">
                  {fieldMapping.mappingResult?.orphaned.map((orphaned) => (
                    <Badge
                      key={orphaned.fieldId}
                      variant="outline"
                      className="text-xs"
                    >
                      Orphaned: {orphaned.savedMetadata.label}
                    </Badge>
                  ))}
                </div>
              </div>
            </AlertDescription>
          </Alert>
        )}
      </div>

      <div className="space-y-6">
        {schema.rows.map((row) => (
          <div key={row.id} className="space-y-4">
            {/* Columns Grid */}
            <div
              className={`grid gap-6 ${
                row.layout === 1
                  ? 'grid-cols-1'
                  : row.layout === 2
                  ? 'grid-cols-2'
                  : 'grid-cols-3'
              }`}
            >
              {row.columns.map((column) => {
                if (!column.component) return null;

                const fieldId = `${row.id}-${column.id}`;
                const component = column.component;

                // Enhanced error handling - check both props errors and validation errors
                const propError = errors[fieldId];
                const validationError = validation.fieldErrors[fieldId];
                const fieldError = propError || validationError;

                // Check if field has mapping issues
                const isMapped =
                  fieldMapping.mappingResult?.mapped.some(
                    (m) => m.fieldId === fieldId
                  ) || false;
                const isOrphaned =
                  fieldMapping.mappingResult?.orphaned.some(
                    (o) => o.fieldId === fieldId
                  ) || false;

                return (
                  <div key={column.id} className="space-y-2">
                    {/* Field Label with status indicators */}
                    <div className="flex items-center gap-2">
                      <Label htmlFor={fieldId} className="text-sm font-medium">
                        {component.label || 'Untitled Field'}
                        {component.required && (
                          <span className="text-destructive ml-1">*</span>
                        )}
                      </Label>

                      {/* Status badges */}
                      {isOrphaned && (
                        <Badge variant="outline" className="text-xs">
                          Orphaned
                        </Badge>
                      )}
                      {isMapped && (
                        <Badge variant="secondary" className="text-xs">
                          Mapped
                        </Badge>
                      )}
                    </div>

                    {/* Field Input */}
                    <div>
                      {renderFormField(component, fieldId)}
                      {fieldError && (
                        <p className="text-sm text-red-500 mt-1">
                          {fieldError}
                        </p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
