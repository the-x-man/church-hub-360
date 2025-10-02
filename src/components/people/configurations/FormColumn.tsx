import React, {
  useState,
  useEffect,
  forwardRef,
  useImperativeHandle,
} from 'react';
import { Button } from '@/components/ui/button';
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

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Plus, X, Edit2, Check, XIcon, Trash2, Settings } from 'lucide-react';

import { ComponentSelector } from './ComponentSelector';
import { ComponentTypeSelector } from './ComponentTypeSelector';
import type {
  FormComponent,
  FormComponentType,
} from '@/types/people-configurations';

interface FormColumnProps {
  component?: FormComponent;
  isPreviewMode?: boolean;
  onComponentChange?: (updatedComponent: FormComponent) => void;
  onComponentSelect?: (componentType: FormComponentType) => void;
  onComponentTypeChange?: (newType: FormComponentType) => void;
  onComponentRemove?: () => void;
}

export interface FormColumnRef {
  openSettingsModal: () => void;
}

export const FormColumn = forwardRef<FormColumnRef, FormColumnProps>(
  (
    {
      component,
      isPreviewMode = false,
      onComponentChange,
      onComponentSelect,
      onComponentTypeChange,
      onComponentRemove,
    },
    ref
  ) => {
    // If no component, show ComponentSelector
    if (!component) {
      return (
        <div className="space-y-3">
          {!isPreviewMode && onComponentSelect && (
            <ComponentSelector onSelect={onComponentSelect} />
          )}
        </div>
      );
    }

    // Modal state
    const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);

    // Inline editing state
    const [isEditingLabel, setIsEditingLabel] = useState(false);
    const [tempLabelValue, setTempLabelValue] = useState(component.label);
    const [editingOptionIndex, setEditingOptionIndex] = useState<number | null>(
      null
    );
    const [tempOptionValue, setTempOptionValue] = useState('');

    // All component state management for the modal
    const [labelValue, setLabelValue] = useState(component.label);
    const [placeholderValue, setPlaceholderValue] = useState(
      component.placeholder || ''
    );
    const [requiredValue, setRequiredValue] = useState(
      component.required || false
    );
    const [optionValue, setOptionValue] = useState('');
    const [optionsValue, setOptionsValue] = useState<string[]>(
      component.options || []
    );

    // Reset ALL state when component changes (type, id, or any core property)
    useEffect(() => {
      if (component) {
        setLabelValue(component.label);
        setPlaceholderValue(component.placeholder || '');
        setRequiredValue(component.required || false);
        setIsEditingLabel(false);
        setTempLabelValue(component.label);
        setEditingOptionIndex(null);
        setTempOptionValue('');
        setOptionValue('');
        setOptionsValue(component.options || []);
        setIsSettingsModalOpen(false);
      }
    }, [component]);

    // Inline label editing functions
    const handleLabelClick = () => {
      if (!isPreviewMode) {
        setIsEditingLabel(true);
        setTempLabelValue(component.label);
      }
    };

    const handleLabelSave = () => {
      if (tempLabelValue.trim() && onComponentChange) {
        onComponentChange({
          ...component,
          label: tempLabelValue.trim(),
        });
      }
      setIsEditingLabel(false);
    };

    const handleLabelCancel = () => {
      setLabelValue(component.label);
      setIsEditingLabel(false);
    };

    const handleLabelKeyDown = (e: React.KeyboardEvent) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        handleLabelSave();
      } else if (e.key === 'Escape') {
        e.preventDefault();
        handleLabelCancel();
      }
    };

    // Inline option editing functions
    const handleOptionClick = (index: number, option: string) => {
      if (!isPreviewMode) {
        setEditingOptionIndex(index);
        setTempOptionValue(option);
      }
    };

    const handleOptionSaveInline = () => {
      if (
        tempOptionValue.trim() &&
        editingOptionIndex !== null &&
        onComponentChange
      ) {
        const updatedOptions = [...(component.options || [])];
        updatedOptions[editingOptionIndex] = tempOptionValue.trim();
        onComponentChange({
          ...component,
          options: updatedOptions,
        });
      }
      setEditingOptionIndex(null);
      setTempOptionValue('');
    };

    const handleOptionCancelInline = () => {
      setEditingOptionIndex(null);
      setTempOptionValue('');
    };

    const handleOptionKeyDownInline = (e: React.KeyboardEvent) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        handleOptionSaveInline();
      } else if (e.key === 'Escape') {
        e.preventDefault();
        handleOptionCancelInline();
      }
    };

    const handleAddOptionInline = () => {
      if (onComponentChange) {
        const updatedOptions = [...(component.options || []), 'New Option'];
        onComponentChange({
          ...component,
          options: updatedOptions,
        });
      }
    };

    const handleRemoveOptionInline = (index: number) => {
      if (
        onComponentChange &&
        component.options &&
        component.options.length > 1
      ) {
        const updatedOptions = component.options.filter((_, i) => i !== index);
        onComponentChange({
          ...component,
          options: updatedOptions,
        });
      }
    };

    // Helper function to get default placeholder based on component type
    const getDefaultPlaceholder = (type: string): string => {
      switch (type) {
        case 'text':
          return 'Enter text';
        case 'email':
          return 'Enter email address';
        case 'phone':
          return 'Enter phone number';
        case 'number':
          return 'Enter number';
        case 'textarea':
          return 'Enter description';
        case 'select':
          return 'Select an option';
        case 'date':
          return 'Pick a date';
        case 'file':
          return 'Upload a file';
        default:
          return 'Enter value';
      }
    };

    // Expose openSettingsModal function through ref
    useImperativeHandle(ref, () => ({
      openSettingsModal: () => setIsSettingsModalOpen(true),
    }));

    // Modal handlers
    const openSettingsModal = () => {
      setIsSettingsModalOpen(true);
    };

    const closeSettingsModal = () => {
      setIsSettingsModalOpen(false);
      // Reset to current component values
      if (component) {
        setLabelValue(component.label);
        setPlaceholderValue(component.placeholder || '');
        setRequiredValue(component.required || false);
        setOptionsValue(component.options || []);
        setEditingOptionIndex(null);
        setOptionValue('');
      }
    };

    const saveChanges = () => {
      if (onComponentChange && component) {
        const updatedComponent: FormComponent = {
          ...component,
          label: labelValue.trim(),
          placeholder: placeholderValue.trim() || undefined,
          required: requiredValue,
        };

        // Add options for components that support them
        if (['select', 'radio', 'checkbox'].includes(component.type)) {
          updatedComponent.options = optionsValue;
        }

        onComponentChange(updatedComponent);
      }
      setIsSettingsModalOpen(false);
    };

    // Options editing handlers for the modal
    const handleOptionEdit = (index: number, value: string) => {
      setEditingOptionIndex(index);
      setOptionValue(value);
    };

    const handleOptionSave = () => {
      if (optionValue.trim() && editingOptionIndex !== null) {
        const updatedOptions = [...optionsValue];
        updatedOptions[editingOptionIndex] = optionValue.trim();
        setOptionsValue(updatedOptions);
      }
      setEditingOptionIndex(null);
      setOptionValue('');
    };

    const handleOptionCancel = () => {
      setEditingOptionIndex(null);
      setOptionValue('');
    };

    const handleOptionKeyDown = (e: React.KeyboardEvent) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        handleOptionSave();
      } else if (e.key === 'Escape') {
        e.preventDefault();
        handleOptionCancel();
      }
    };

    const handleAddOption = () => {
      setOptionsValue([...optionsValue, 'New Option']);
    };

    const handleRemoveOption = (index: number) => {
      if (optionsValue.length > 1) {
        const updatedOptions = optionsValue.filter((_, i) => i !== index);
        setOptionsValue(updatedOptions);
      }
    };

    // Helper function to render editable options in modal
    const renderEditableOption = (option: string, index: number) => {
      const isEditing = editingOptionIndex === index;

      return (
        <div key={index} className="flex items-center gap-2 group">
          {isEditing ? (
            <div className="flex items-center gap-1 flex-1">
              <Input
                value={optionValue}
                onChange={(e) => setOptionValue(e.target.value)}
                onKeyDown={handleOptionKeyDown}
                className="h-8 text-sm flex-1"
                autoFocus
              />
              <Button
                variant="ghost"
                size="sm"
                onClick={handleOptionSave}
                className="h-8 w-8 p-0 text-green-600 hover:text-green-700 hover:bg-green-50  dark:hover:bg-green-800/50"
              >
                <Check className="h-3 w-3" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleOptionCancel}
                className="h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-800/50"
              >
                <XIcon className="h-3 w-3" />
              </Button>
            </div>
          ) : (
            <>
              <span
                onClick={() => handleOptionEdit(index, option)}
                className="flex-1 px-2 py-1 text-sm rounded cursor-pointer hover:bg-muted"
              >
                {option}
              </span>
              <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleOptionEdit(index, option)}
                  className="h-6 w-6 p-0 hover:bg-blue-50 hover:text-blue-600"
                >
                  <Edit2 className="h-3 w-3" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleRemoveOption(index)}
                  className="h-6 w-6 p-0 hover:bg-destructive/10 hover:text-destructive"
                  disabled={optionsValue.length <= 1}
                >
                  <X className="h-3 w-3" />
                </Button>
              </div>
            </>
          )}
        </div>
      );
    };

    // Helper function to render add option button in modal
    const renderAddOptionButton = () => (
      <Button
        variant="ghost"
        size="sm"
        onClick={handleAddOption}
        className="h-8 w-full border-2 border-dashed border-muted-foreground/25 hover:border-muted-foreground/50 text-muted-foreground hover:text-foreground"
      >
        <Plus className="h-3 w-3 mr-1" />
        Add Option
      </Button>
    );

    // Check if component supports placeholders
    const supportsPlaceholder = [
      'text',
      'email',
      'phone',
      'number',
      'textarea',
      'select',
      'date',
      'file',
    ].includes(component.type);

    // Check if component supports options
    const supportsOptions = ['select', 'radio', 'checkbox'].includes(
      component.type
    );

    // Form field renderer with inline editing
    const renderFormField = () => {
      const [fieldValue, setFieldValue] = useState<any>('');
      const [date, setDate] = useState<Date>();
      const [checkboxValues, setCheckboxValues] = useState<string[]>([]);

      const handleCheckboxChange = (optionValue: string, checked: boolean) => {
        if (checked) {
          setCheckboxValues((prev) => [...prev, optionValue]);
        } else {
          setCheckboxValues((prev) =>
            prev.filter((val) => val !== optionValue)
          );
        }
      };

      const placeholder =
        component.placeholder || getDefaultPlaceholder(component.type);

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
              onChange={(e) => setFieldValue(e.target.value)}
              className="w-full"
              disabled={isPreviewMode}
            />
          );

        case 'textarea':
          return (
            <Textarea
              placeholder={placeholder}
              value={fieldValue}
              onChange={(e) => setFieldValue(e.target.value)}
              className="w-full min-h-[80px]"
              disabled={isPreviewMode}
            />
          );

        case 'select':
          return (
            <div className="space-y-2">
              <Select
                value={fieldValue}
                onValueChange={setFieldValue}
                disabled={isPreviewMode}
              >
                <SelectTrigger className="w-full">
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
              {!isPreviewMode && (
                <div className="space-y-1">
                  {(component.options || []).map((option, index) => (
                    <div key={index} className="flex items-center gap-2 group">
                      {editingOptionIndex === index ? (
                        <div className="flex items-center gap-1 flex-1">
                          <Input
                            value={tempOptionValue}
                            onChange={(e) => setTempOptionValue(e.target.value)}
                            onKeyDown={handleOptionKeyDownInline}
                            className="h-8 text-sm flex-1"
                            autoFocus
                          />
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={handleOptionSaveInline}
                            className="h-8 w-8 p-0 text-green-600 hover:text-green-700 hover:bg-green-50  dark:hover:bg-green-800/50"
                          >
                            <Check className="h-3 w-3" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={handleOptionCancelInline}
                            className="h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-800/50"
                          >
                            <X className="h-3 w-3" />
                          </Button>
                        </div>
                      ) : (
                        <>
                          <span
                            onClick={() => handleOptionClick(index, option)}
                            className="flex-1 px-2 py-1 text-sm rounded cursor-pointer hover:bg-muted"
                          >
                            {option}
                          </span>
                          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleOptionClick(index, option)}
                              className="h-6 w-6 p-0 hover:bg-blue-50 hover:text-blue-600"
                            >
                              <Edit2 className="h-3 w-3" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleRemoveOptionInline(index)}
                              className="h-6 w-6 p-0 hover:bg-red-50 hover:text-red-600"
                            >
                              <X className="h-3 w-3" />
                            </Button>
                          </div>
                        </>
                      )}
                    </div>
                  ))}
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleAddOptionInline}
                    className="w-full h-8 text-xs"
                  >
                    <Plus className="h-3 w-3 mr-1" />
                    Add Option
                  </Button>
                </div>
              )}
            </div>
          );

        case 'radio':
          return (
            <div className="space-y-2">
              <RadioGroup
                value={fieldValue}
                onValueChange={setFieldValue}
                disabled={isPreviewMode}
              >
                {(component.options || []).map((option, index) => (
                  <div
                    key={index}
                    className="flex items-center space-x-2 group"
                  >
                    <RadioGroupItem value={option} id={`radio-${index}`} />
                    {!isPreviewMode && editingOptionIndex === index ? (
                      <div className="flex items-center gap-1 flex-1">
                        <Input
                          value={tempOptionValue}
                          onChange={(e) => setTempOptionValue(e.target.value)}
                          onKeyDown={handleOptionKeyDownInline}
                          className="h-8 text-sm flex-1"
                          autoFocus
                        />
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={handleOptionSaveInline}
                          className="h-8 w-8 p-0 text-green-600 hover:text-green-700 hover:bg-green-50 dark:hover:bg-green-800/50"
                        >
                          <Check className="h-3 w-3" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={handleOptionCancelInline}
                          className="h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-800/50"
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      </div>
                    ) : (
                      <>
                        <Label
                          htmlFor={`radio-${index}`}
                          className="flex-1 cursor-pointer"
                          onClick={() =>
                            !isPreviewMode && handleOptionClick(index, option)
                          }
                        >
                          {option}
                        </Label>
                        {!isPreviewMode && (
                          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleOptionClick(index, option)}
                              className="h-6 w-6 p-0 hover:bg-blue-50 hover:text-blue-600"
                            >
                              <Edit2 className="h-3 w-3" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleRemoveOptionInline(index)}
                              className="h-6 w-6 p-0 hover:bg-red-50 hover:text-red-600"
                            >
                              <X className="h-3 w-3" />
                            </Button>
                          </div>
                        )}
                      </>
                    )}
                  </div>
                ))}
              </RadioGroup>
              {!isPreviewMode && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleAddOptionInline}
                  className="w-full h-8 text-xs"
                >
                  <Plus className="h-3 w-3 mr-1" />
                  Add Option
                </Button>
              )}
            </div>
          );

        case 'checkbox':
          return (
            <div className="space-y-2">
              {(component.options || []).map((option, index) => (
                <div key={index} className="flex items-center space-x-2 group">
                  <Checkbox
                    id={`checkbox-${index}`}
                    checked={checkboxValues.includes(option)}
                    onCheckedChange={(checked) =>
                      handleCheckboxChange(option, checked as boolean)
                    }
                    disabled={isPreviewMode}
                  />
                  {!isPreviewMode && editingOptionIndex === index ? (
                    <div className="flex items-center gap-1 flex-1">
                      <Input
                        value={tempOptionValue}
                        onChange={(e) => setTempOptionValue(e.target.value)}
                        onKeyDown={handleOptionKeyDownInline}
                        className="h-8 text-sm flex-1"
                        autoFocus
                      />
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={handleOptionSaveInline}
                        className="h-8 w-8 p-0 text-green-600 hover:text-green-700 hover:bg-green-50  dark:hover:bg-green-800/50"
                      >
                        <Check className="h-3 w-3" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={handleOptionCancelInline}
                        className="h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-800/50"
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </div>
                  ) : (
                    <>
                      <Label
                        htmlFor={`checkbox-${index}`}
                        className="flex-1 cursor-pointer"
                        onClick={() =>
                          !isPreviewMode && handleOptionClick(index, option)
                        }
                      >
                        {option}
                      </Label>
                      {!isPreviewMode && (
                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleOptionClick(index, option)}
                            className="h-6 w-6 p-0 hover:bg-blue-50 hover:text-blue-600"
                          >
                            <Edit2 className="h-3 w-3" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleRemoveOptionInline(index)}
                            className="h-6 w-6 p-0 hover:bg-red-50 hover:text-red-600"
                          >
                            <X className="h-3 w-3" />
                          </Button>
                        </div>
                      )}
                    </>
                  )}
                </div>
              ))}
              {!isPreviewMode && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleAddOptionInline}
                  className="w-full h-8 text-xs"
                >
                  <Plus className="h-3 w-3 mr-1" />
                  Add Option
                </Button>
              )}
            </div>
          );

        case 'date':
          return (
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className="w-full justify-start text-left font-normal"
                  disabled={isPreviewMode}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {date ? format(date, 'PPP') : <span>{placeholder}</span>}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0">
                <Calendar
                  mode="single"
                  selected={date}
                  onSelect={setDate}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          );

        case 'file':
          return (
            <div className="flex items-center justify-center w-full">
              <Label
                htmlFor="file-upload"
                className="flex flex-col items-center justify-center w-full h-32 border-2 border-border border-dashed rounded-lg cursor-pointer bg-muted/50 hover:bg-muted"
              >
                <div className="flex flex-col items-center justify-center pt-5 pb-6">
                  <Upload className="w-8 h-8 mb-4 text-muted-foreground" />
                  <p className="mb-2 text-sm text-muted-foreground">
                    <span className="font-semibold">Click to upload</span> or
                    drag and drop
                  </p>
                  <p className="text-xs text-muted-foreground">Any file type</p>
                </div>
                <Input
                  id="file-upload"
                  type="file"
                  className="hidden"
                  disabled={isPreviewMode}
                />
              </Label>
            </div>
          );

        default:
          return (
            <Input
              placeholder={placeholder}
              value={fieldValue}
              onChange={(e) => setFieldValue(e.target.value)}
              className="w-full"
              disabled={isPreviewMode}
            />
          );
      }
    };

    return (
      <>
        <div className="bg-gray-200/5 dark:bg-gray-900/10 border border-border rounded-lg p-4 space-y-3">
          {/* Component Header with Controls */}
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-2 flex-1">
              {!isPreviewMode && onComponentTypeChange && (
                <ComponentTypeSelector
                  value={component.type}
                  onValueChange={onComponentTypeChange}
                />
              )}
            </div>
            {!isPreviewMode && (
              <div className="flex items-center gap-1">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={openSettingsModal}
                  className="h-7 w-7 p-0 hover:bg-gray-100 dark:hover:bg-gray-800/50"
                >
                  <Settings className="h-3 w-3" />
                </Button>
                {onComponentRemove && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={onComponentRemove}
                    className="h-7 w-7 p-0 hover:bg-destructive/10 hover:text-destructive dark:hover:bg-destructive/10 dark:hover:text-destructive"
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                )}
              </div>
            )}
          </div>

          {/* Form Field Label with Inline Editing */}
          <div className="space-y-2">
            {isEditingLabel ? (
              <div className="flex items-center gap-2">
                <Input
                  value={tempLabelValue}
                  onChange={(e) => setTempLabelValue(e.target.value)}
                  onKeyDown={handleLabelKeyDown}
                  className="flex-1 h-8 text-sm font-medium"
                  autoFocus
                />
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleLabelSave}
                  className="h-8 w-8 p-0 text-green-600 hover:text-green-700 hover:bg-green-50 dark:hover:bg-green-800/50"
                >
                  <Check className="h-3 w-3" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleLabelCancel}
                  className="h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-800/50"
                >
                  <X className="h-3 w-3" />
                </Button>
              </div>
            ) : (
              <div className="flex items-center gap-2 group">
                <Label
                  className="text-sm font-medium cursor-pointer flex-1 hover:bg-muted/50 px-2 py-1 rounded"
                  onClick={handleLabelClick}
                >
                  {component.label || 'Untitled Field'}
                  {component.required && (
                    <span className="text-destructive ml-1">*</span>
                  )}
                </Label>
                {!isPreviewMode && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleLabelClick}
                    className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-blue-50 hover:text-blue-600"
                  >
                    <Edit2 className="h-3 w-3" />
                  </Button>
                )}
              </div>
            )}

            {/* Actual Form Field */}
            <div className="pt-1">{renderFormField()}</div>
          </div>
        </div>

        {/* Field Settings Modal */}
        <Dialog
          open={isSettingsModalOpen}
          onOpenChange={setIsSettingsModalOpen}
        >
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Field Settings</DialogTitle>
            </DialogHeader>

            <div className="space-y-4">
              {/* Field Label */}
              <div className="space-y-2">
                <Label htmlFor="field-label" className="text-sm font-medium">
                  Field Label
                </Label>
                <Input
                  id="field-label"
                  value={labelValue}
                  onChange={(e) => setLabelValue(e.target.value)}
                  placeholder="Enter field label"
                />
              </div>

              {/* Placeholder Text */}
              {supportsPlaceholder && (
                <div className="space-y-2">
                  <Label
                    htmlFor="placeholder-text"
                    className="text-sm font-medium"
                  >
                    Placeholder Text
                  </Label>
                  <Input
                    id="placeholder-text"
                    value={placeholderValue}
                    onChange={(e) => setPlaceholderValue(e.target.value)}
                    placeholder={getDefaultPlaceholder(component.type)}
                  />
                </div>
              )}

              {/* Required Field */}
              <div>
                <div className="flex items-center gap-2">
                  <Checkbox
                    id="required-field"
                    checked={requiredValue}
                    onCheckedChange={(checked) =>
                      setRequiredValue(checked as boolean)
                    }
                  />
                  <Label
                    htmlFor="required-field"
                    className="text-sm font-medium"
                  >
                    Required Field
                  </Label>
                </div>
                <div className="text-xs text-muted-foreground mt-1">
                  Mark this field as required for form submission
                </div>
              </div>

              {/* Options */}
              {supportsOptions && (
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Options</Label>
                  <div className="space-y-2 max-h-48 overflow-y-auto">
                    {optionsValue.map((option, index) =>
                      renderEditableOption(option, index)
                    )}
                    {renderAddOptionButton()}
                  </div>
                </div>
              )}
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={closeSettingsModal}>
                Cancel
              </Button>
              <Button onClick={saveChanges}>Save Changes</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </>
    );
  }
);

FormColumn.displayName = 'FormColumn';
