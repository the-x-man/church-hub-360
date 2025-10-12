import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import FileRenderer from '@/modules/internal/custom-field-rendering/components/FileRenderer';
import { useMembershipFormManagement } from '@/hooks/usePeopleConfigurationQueries';
import { useOrganization } from '@/contexts/OrganizationContext';
import { getValidFieldsForRendering } from '@/modules/internal/custom-field-rendering/utils';

// Interface for the new flattened field data format
interface FlattenedFieldData {
  rowId: string;
  columnId: string;
  componentId: string;
  componentType: string;
  value: any;
}

interface CustomFieldRendererProps {
  formData: FlattenedFieldData[] | Record<string, FlattenedFieldData>;
  className?: string;
}

const CustomFieldRenderer: React.FC<CustomFieldRendererProps> = ({
  formData,
  className = '',
}) => {
  const { currentOrganization: organization } = useOrganization();
  const { membershipFormSchema } = useMembershipFormManagement(
    organization?.id
  );

  // Normalize formData to array format
  let normalizedFormData: FlattenedFieldData[];

  if (Array.isArray(formData)) {
    normalizedFormData = formData;
  } else if (formData && typeof formData === 'object') {
    // Convert object format to array format
    normalizedFormData = Object.values(formData);
  } else {
    console.warn(
      'CustomFieldRenderer: Expected flattened array or object format, received:',
      typeof formData
    );
    return (
      <Card className={className}>
        <CardContent className="p-4">
          <p className="text-muted-foreground">
            Invalid custom fields data format
          </p>
        </CardContent>
      </Card>
    );
  }

  const renderFieldValue = (value: any, fieldType?: string) => {
    if (value === null || value === undefined || value === '') {
      return <span className="text-muted-foreground">No value</span>;
    }

    switch (fieldType) {
      case 'file':
        if (typeof value === 'string' && value.startsWith('http')) {
          return <FileRenderer url={value} />;
        }
        return <span className="text-muted-foreground">Invalid file URL</span>;

      case 'checkbox':
        if (Array.isArray(value) && value.length > 0) {
          return (
            <div className="flex flex-wrap gap-1">
              {value.map((option, index) => (
                <Badge key={index} variant="default">
                  {option}
                </Badge>
              ))}
            </div>
          );
        } else if (typeof value === 'boolean') {
          return (
            <Badge variant={value ? 'default' : 'secondary'}>
              {value ? 'Yes' : 'No'}
            </Badge>
          );
        } else if (typeof value === 'string' && value) {
          return <Badge variant="default">{value}</Badge>;
        }
        return <span className="text-muted-foreground">No selection</span>;

      case 'date':
        if (typeof value === 'string') {
          const date = new Date(value);
          return date.toLocaleDateString();
        }
        return value;

      case 'email':
        return (
          <a href={`mailto:${value}`} className="text-blue-600 hover:underline">
            {value}
          </a>
        );

      case 'phone':
        return (
          <a href={`tel:${value}`} className="text-blue-600 hover:underline">
            {value}
          </a>
        );

      case 'textarea':
        return <div className="whitespace-pre-wrap max-w-md">{value}</div>;

      default:
        return <span>{String(value)}</span>;
    }
  };

  // Get valid fields using schema validation
  const validFields = getValidFieldsForRendering(
    normalizedFormData,
    membershipFormSchema
  );

  if (validFields.length === 0) {
    return (
      <Card className={className}>
        <CardContent className="p-4">
          <p className="text-muted-foreground">
            No valid custom fields data available
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle>Additional Information</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {validFields.map((field, index) => {
          const label =
            field.schemaComponent?.label ||
            `Field ${field.rowId}_${field.columnId}`;
          const fieldType = field.schemaComponent?.type || field.componentType;

          return (
            <div
              key={`${field.rowId}_${field.columnId}_${index}`}
              className="border-b pb-3 last:border-b-0"
            >
              <div className="flex items-center gap-2 mb-1">
                <span className="text-sm font-medium text-muted-foreground">
                  {label}
                </span>
              </div>
              <div className="text-sm">
                {renderFieldValue(field.value, fieldType)}
              </div>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
};

export default CustomFieldRenderer;
