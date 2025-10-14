import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Trash2,
  GripVertical,
  Type,
  Mail,
  Phone,
  Calendar,
  ChevronDown,
  CheckSquare,
  Circle,
  FileText,
  Hash,
  Upload,
  Eye,
  Edit,
  Save,
  Loader2,
} from 'lucide-react';

import { useMembershipFormManagement } from '@/hooks/usePeopleConfigurationQueries';
import { FieldSettingsDialog } from '../../components/people/configurations/FieldSettingsDialog';
import { FormColumn } from '../../components/people/configurations/FormColumn';
import { DefaultMembershipForm } from '../../components/people/configurations/DefaultMembershipForm';
import { CustomFieldsRenderer } from '@/modules/internal/custom-field-rendering/components/CustomFieldsRenderer';
import type {
  MembershipFormSchema,
  FormRow,
  ColumnLayout,
  FormComponentType,
  FormComponent,
} from '@/types/people-configurations';
import { useOrganization } from '@/contexts/OrganizationContext';
import { toast } from 'sonner';

interface MembershipFormBuilderProps {
  schema?: MembershipFormSchema;
  onSchemaChange?: (schema: MembershipFormSchema) => void;
}

interface ComponentType {
  type: FormComponentType;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  description: string;
}

const COMPONENT_TYPES: ComponentType[] = [
  {
    type: 'text',
    label: 'Text Input',
    icon: Type,
    description: 'Single line text field',
  },
  {
    type: 'email',
    label: 'Email',
    icon: Mail,
    description: 'Email address field',
  },
  {
    type: 'phone',
    label: 'Phone',
    icon: Phone,
    description: 'Phone number field',
  },
  {
    type: 'date',
    label: 'Date',
    icon: Calendar,
    description: 'Date picker field',
  },
  {
    type: 'select',
    label: 'Select',
    icon: ChevronDown,
    description: 'Dropdown selection',
  },
  {
    type: 'checkbox',
    label: 'Checkbox',
    icon: CheckSquare,
    description: 'Multiple choice options',
  },
  {
    type: 'radio',
    label: 'Radio',
    icon: Circle,
    description: 'Single choice options',
  },
  {
    type: 'textarea',
    label: 'Textarea',
    icon: FileText,
    description: 'Multi-line text field',
  },
  {
    type: 'number',
    label: 'Number',
    icon: Hash,
    description: 'Numeric input field',
  },
  {
    type: 'file',
    label: 'File Upload',
    icon: Upload,
    description: 'File upload field',
  },
];

export function MembershipFormBuilder({
  schema,
  onSchemaChange,
}: MembershipFormBuilderProps) {
  const { currentOrganization: organization } = useOrganization();
  const {
    membershipFormSchema,
    operationLoading,
    error,
    updateMembershipFormSchema,
    saveMembershipForm,
  } = useMembershipFormManagement(organization?.id);

  const [formSchema, setFormSchema] = useState<MembershipFormSchema>(
    schema ||
      membershipFormSchema || {
        id: '',
        name: 'Custom Membership Form',
        description: '',
        rows: [],
        is_active: true,
        created_date: new Date().toISOString(),
      }
  );

  // Settings dialog state
  const [settingsDialogOpen, setSettingsDialogOpen] = useState(false);
  const [editingComponent, setEditingComponent] = useState<{
    component: FormComponent;
    rowId: string;
    columnId: string;
  } | null>(null);

  // Preview mode state
  const [isPreviewMode, setIsPreviewMode] = useState(false);

  // Update local state when schema from hook changes
  useEffect(() => {
    if (membershipFormSchema && !schema) {
      setFormSchema(membershipFormSchema);
    }
  }, [membershipFormSchema, schema]);

  // Save function
  const handleSave = async () => {
    try {
      await saveMembershipForm(formSchema);
      toast.success('Membership form saved successfully!');
    } catch (error) {
      console.error('Failed to save membership form:', error);
    }
  };

  // Update schema and notify parent
  const updateSchema = (updatedSchema: MembershipFormSchema) => {
    setFormSchema(updatedSchema);
    onSchemaChange?.(updatedSchema);
    // Optionally update the hook's state for optimistic updates
    updateMembershipFormSchema(updatedSchema);
  };

  const addRow = (layout: ColumnLayout) => {
    const newRow: FormRow = {
      id: `row-${crypto.randomUUID()}`,
      layout,
      columns: Array(layout)
        .fill(null)
        .map((_, index) => ({
          id: `col-${crypto.randomUUID()}-${index}`,
          component: null,
        })),
    };

    const updatedSchema = {
      ...formSchema,
      rows: [...formSchema.rows, newRow],
    };

    updateSchema(updatedSchema);
  };

  const removeRow = (rowId: string) => {
    const updatedSchema = {
      ...formSchema,
      rows: formSchema.rows.filter((row) => row.id !== rowId),
    };

    updateSchema(updatedSchema);
  };

  const addComponentToColumn = (
    rowId: string,
    columnId: string,
    componentType: FormComponentType
  ) => {
    const componentConfig = COMPONENT_TYPES.find(
      (comp) => comp.type === componentType
    );
    if (!componentConfig) return;

    // Define default placeholders for different field types
    const getDefaultPlaceholder = (type: FormComponentType): string => {
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
          return 'Enter your message';
        default:
          return '';
      }
    };

    const newComponent = {
      id: `comp-${crypto.randomUUID()}`,
      type: componentType,
      label: componentConfig.label,
      required: false,
      placeholder: getDefaultPlaceholder(componentType),
      options:
        componentType === 'select' ||
        componentType === 'radio' ||
        componentType === 'checkbox'
          ? ['Option 1', 'Option 2']
          : undefined,
    };

    const updatedSchema = {
      ...formSchema,
      rows: formSchema.rows.map((row) =>
        row.id === rowId
          ? {
              ...row,
              columns: row.columns.map((col) =>
                col.id === columnId ? { ...col, component: newComponent } : col
              ),
            }
          : row
      ),
    };

    updateSchema(updatedSchema);
  };

  const removeComponentFromColumn = (rowId: string, columnId: string) => {
    const updatedSchema = {
      ...formSchema,
      rows: formSchema.rows.map((row) =>
        row.id === rowId
          ? {
              ...row,
              columns: row.columns.map((col) =>
                col.id === columnId ? { ...col, component: null } : col
              ),
            }
          : row
      ),
    };

    updateSchema(updatedSchema);
  };

  const handleComponentUpdate = (updatedComponent: FormComponent) => {
    if (!editingComponent) return;

    const { rowId, columnId } = editingComponent;
    const updatedSchema = {
      ...formSchema,
      rows: formSchema.rows.map((row) =>
        row.id === rowId
          ? {
              ...row,
              columns: row.columns.map((col) =>
                col.id === columnId
                  ? { ...col, component: updatedComponent }
                  : col
              ),
            }
          : row
      ),
    };

    updateSchema(updatedSchema);
    setEditingComponent(null);
  };

  const updateComponentDirect = (
    rowId: string,
    columnId: string,
    updatedComponent: FormComponent
  ) => {
    const updatedSchema = {
      ...formSchema,
      rows: formSchema.rows.map((row) =>
        row.id === rowId
          ? {
              ...row,
              columns: row.columns.map((col) =>
                col.id === columnId
                  ? { ...col, component: updatedComponent }
                  : col
              ),
            }
          : row
      ),
    };

    updateSchema(updatedSchema);
  };

  const changeComponentType = (
    rowId: string,
    columnId: string,
    newType: FormComponentType
  ) => {
    const componentConfig = COMPONENT_TYPES.find(
      (comp) => comp.type === newType
    );

    const updatedSchema = {
      ...formSchema,
      rows: formSchema.rows.map((row) =>
        row.id === rowId
          ? {
              ...row,
              columns: row.columns.map((col) =>
                col.id === columnId && col.component
                  ? {
                      ...col,
                      component: {
                        ...col.component,
                        type: newType,
                        label: componentConfig?.label || col.component.label,
                        // Reset options for non-option types
                        options: ['select', 'radio', 'checkbox'].includes(
                          newType
                        )
                          ? col.component.options || ['Option 1', 'Option 2']
                          : undefined,
                      },
                    }
                  : col
              ),
            }
          : row
      ),
    };

    updateSchema(updatedSchema);
  };

  return (
    <div className="space-y-6">
      {/* Form Header */}
      <div className="flex items-center justify-between flex-wrap gap-2 bg-neutral-100 dark:bg-neutral-800/50 px-4 py-2 rounded-md border">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">
            Membership Form Builder
          </h2>
          <p className="text-muted-foreground">
            Generate custom form to be added to default membership form.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant={isPreviewMode ? 'outline' : 'default'}
            size="sm"
            onClick={() => setIsPreviewMode(false)}
          >
            <Edit className="h-4 w-4 mr-2" />
            Edit
          </Button>
          <Button
            variant={isPreviewMode ? 'default' : 'outline'}
            size="sm"
            onClick={() => setIsPreviewMode(true)}
          >
            <Eye className="h-4 w-4 mr-2" />
            Preview
          </Button>
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-4">
          <p className="text-sm text-destructive">
            Error saving membership form: {JSON.stringify(error)}
          </p>
        </div>
      )}

      <div className="mx-auto">
        <Card className="min-h-[300px]">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>
                  {isPreviewMode ? 'Membership Form Preview' : 'Form Layout'}
                </CardTitle>
                <p className="text-sm text-muted-foreground">
                  {isPreviewMode
                    ? 'Preview of the complete membership form including default and custom fields'
                    : 'Choose column layouts and add components to build your membership form'}
                </p>
              </div>
              {!isPreviewMode && (
                <Button
                  size="sm"
                  onClick={handleSave}
                  disabled={operationLoading || !organization?.id}
                >
                  {operationLoading ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <Save className="h-4 w-4 mr-2" />
                  )}
                  Save
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Show Default Membership Form in Preview Mode */}
            {isPreviewMode && (
              <div className="space-y-6">
                <div className="bg-background border border-border rounded-lg p-6 shadow-sm">
                  <DefaultMembershipForm />
                </div>

                {/* Additional Custom Fields */}
                <CustomFieldsRenderer
                  schema={formSchema}
                  values={{}}
                  isPreviewMode={true}
                  onValuesChange={() => {}}
                />
              </div>
            )}

            {/* Edit Mode - Show Builder Interface */}
            {!isPreviewMode && formSchema.rows.length !== 0 && (
              <div className="space-y-6">
                {formSchema.rows.map((row) => (
                  <div
                    key={row.id}
                    className="bg-background border border-border rounded-lg p-6 space-y-4 shadow-sm"
                  >
                    {/* Row Header */}
                    {!isPreviewMode && (
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <GripVertical className="h-5 w-5 text-muted-foreground cursor-move" />
                          <Badge variant="outline" className="text-xs">
                            {row.layout} Column{row.layout > 1 ? 's' : ''}
                          </Badge>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => removeRow(row.id)}
                          className="h-8 w-8 p-0 hover:bg-destructive/10 hover:text-destructive"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    )}

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
                      {row.columns.map((column) => (
                        <div
                          key={column.id}
                          className="space-y-3 bg-white dark:bg-neutral-800/30"
                        >
                          <FormColumn
                            component={column.component || undefined}
                            isPreviewMode={isPreviewMode}
                            onComponentChange={(updatedComponent) =>
                              updateComponentDirect(
                                row.id,
                                column.id,
                                updatedComponent
                              )
                            }
                            onComponentSelect={(componentType) =>
                              addComponentToColumn(
                                row.id,
                                column.id,
                                componentType
                              )
                            }
                            onComponentTypeChange={(newType) =>
                              changeComponentType(row.id, column.id, newType)
                            }
                            onComponentRemove={() =>
                              removeComponentFromColumn(row.id, column.id)
                            }
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Column Layout Buttons at Bottom */}
            {!isPreviewMode && (
              <div>
                <div className="text-center space-y-4">
                  <div>
                    <p className="text-xs text-muted-foreground">
                      Choose a layout to add a new row to your form
                    </p>
                  </div>
                  <div className="flex justify-center gap-3">
                    {[1, 2, 3].map((layout) => (
                      <Button
                        key={layout}
                        variant="outline"
                        size="lg"
                        onClick={() => {
                          addRow(layout as ColumnLayout);
                        }}
                        className="flex flex-col items-center gap-2 h-auto py-4 px-6 hover:bg-primary/5 hover:border-primary/50"
                      >
                        <div className="flex gap-1">
                          {Array.from({ length: layout }).map((_, i) => (
                            <div
                              key={i}
                              className="w-3 h-6 bg-current rounded-sm opacity-60"
                            />
                          ))}
                        </div>
                        <span className="text-xs font-medium">
                          {layout} Column{layout > 1 ? 's' : ''}
                        </span>
                      </Button>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Field Settings Dialog */}
      <FieldSettingsDialog
        open={settingsDialogOpen}
        onOpenChange={setSettingsDialogOpen}
        component={editingComponent?.component}
        onSave={handleComponentUpdate}
      />
    </div>
  );
}
