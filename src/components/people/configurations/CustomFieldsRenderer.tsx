import { useState, useEffect, useCallback } from 'react';
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
import { Calendar } from '@/components/ui/calendar';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { CalendarIcon, Upload } from 'lucide-react';
import { format } from 'date-fns';
import { Button } from '@/components/ui/button';
import type {
  MembershipFormSchema,
  FormComponent,
} from '@/types/people-configurations';

interface CustomFieldsRendererProps {
  schema: MembershipFormSchema;
  isPreviewMode?: boolean;
  values?: Record<string, any>;
  onValuesChange?: (values: Record<string, any>) => void;
  errors?: Record<string, string>;
  disabled?: boolean;
  className?: string;
}

interface FieldState {
  [fieldId: string]: any;
}

export function CustomFieldsRenderer({
  schema,
  isPreviewMode = false,
  values = {},
  onValuesChange,
  errors = {},
  disabled = false,
  className = '',
}: CustomFieldsRendererProps) {
  const [fieldValues, setFieldValues] = useState<FieldState>(values);

  // Update internal state when external values change
  useEffect(() => {
    setFieldValues(values);
  }, [values]);

  // Notify parent of value changes
  const handleValueChange = useCallback(
    (fieldId: string, value: any) => {
      const newValues = { ...fieldValues, [fieldId]: value };
      setFieldValues(newValues);
      onValuesChange?.(newValues);
    },
    [fieldValues, onValuesChange]
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
    const fieldValue = fieldValues[fieldId] || '';
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
        const dateValue = fieldValue ? new Date(fieldValue) : undefined;
        return (
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className={`w-full justify-start text-left font-normal ${
                  !dateValue ? 'text-muted-foreground' : ''
                } ${errorClass}`}
                disabled={disabled || isPreviewMode}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {dateValue ? (
                  format(dateValue, component.dateFormat || 'PPP')
                ) : (
                  <span>{placeholder}</span>
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="single"
                selected={dateValue}
                onSelect={(date) =>
                  handleValueChange(fieldId, date?.toISOString())
                }
                initialFocus
              />
            </PopoverContent>
          </Popover>
        );

      case 'file':
        return (
          <div className={`space-y-2 ${errorClass}`}>
            <div className="flex items-center justify-center w-full">
              <label
                htmlFor={`${fieldId}-file`}
                className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-muted-foreground/25 rounded-lg cursor-pointer bg-muted/10 hover:bg-muted/20 transition-colors"
              >
                <div className="flex flex-col items-center justify-center pt-5 pb-6">
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
            {fieldValue &&
              typeof fieldValue === 'object' &&
              fieldValue.name && (
                <p className="text-sm text-muted-foreground">
                  Selected: {fieldValue.name}
                </p>
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

                return (
                  <div key={column.id} className="space-y-2">
                    {/* Field Label */}
                    <Label htmlFor={fieldId} className="text-sm font-medium">
                      {component.label || 'Untitled Field'}
                      {component.required && (
                        <span className="text-destructive ml-1">*</span>
                      )}
                    </Label>

                    {/* Field Input */}
                    <div>
                      {renderFormField(component, fieldId)}
                      {errors[fieldId] && (
                        <p className="text-sm text-destructive mt-1">
                          {errors[fieldId]}
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
