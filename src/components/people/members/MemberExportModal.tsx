import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { FileText, FileSpreadsheet, Download, Loader2 } from 'lucide-react';
import type { MemberSummary } from '@/types/members';

export interface ExportField {
  key: keyof MemberSummary | string;
  label: string;
  category: 'basic' | 'contact' | 'membership' | 'dates';
}

export const AVAILABLE_EXPORT_FIELDS: ExportField[] = [
  // Profile Photo (first)
  { key: 'profile_image_url', label: 'Profile Photo', category: 'basic' },

  // Basic Information (name fields prioritized)
  { key: 'first_name', label: 'First Name', category: 'basic' },
  { key: 'last_name', label: 'Last Name', category: 'basic' },
  { key: 'middle_name', label: 'Middle Name', category: 'basic' },
  { key: 'full_name', label: 'Full Name', category: 'basic' },
  { key: 'gender', label: 'Gender', category: 'basic' },
  { key: 'date_of_birth', label: 'Date of Birth', category: 'basic' },
  { key: 'age', label: 'Age', category: 'basic' },

  // Contact Information
  { key: 'email', label: 'Email', category: 'contact' },
  { key: 'phone', label: 'Phone', category: 'contact' },
  { key: 'address', label: 'Address', category: 'contact' },
  { key: 'address_line_1', label: 'Address Line 1', category: 'contact' },
  { key: 'address_line_2', label: 'Address Line 2', category: 'contact' },
  { key: 'city', label: 'City', category: 'contact' },
  { key: 'state', label: 'State', category: 'contact' },
  { key: 'postal_code', label: 'Postal Code', category: 'contact' },
  { key: 'country', label: 'Country', category: 'contact' },

  // Membership Information
  {
    key: 'membership_status',
    label: 'Membership Status',
    category: 'membership',
  },
  { key: 'membership_type', label: 'Membership Type', category: 'membership' },
  {
    key: 'membership_years',
    label: 'Membership Years',
    category: 'membership',
  },
  { key: 'branch_name', label: 'Branch', category: 'membership' },
  { key: 'branch_location', label: 'Branch Location', category: 'membership' },
  { key: 'is_active', label: 'Active Status', category: 'membership' },
  
  // Tag Information
  { key: 'assigned_tags', label: 'All Tags', category: 'membership' },
  { key: 'tag_count', label: 'Tag Count', category: 'membership' },
  { key: 'tags_with_categories', label: 'Tags by Category', category: 'membership' },

  // Groups from summary view
  { key: 'groups', label: 'Groups', category: 'membership' },

  // Dates
  { key: 'date_joined', label: 'Join Date', category: 'dates' },
  { key: 'created_at', label: 'Created Date', category: 'dates' },
  { key: 'updated_at', label: 'Updated Date', category: 'dates' },
];

export const DEFAULT_SELECTED_FIELDS = [
  'first_name',
  'last_name',
  'email',
  'phone',
  'membership_status',
  'branch_name',
];

export type ExportFormat = 'pdf' | 'csv' | 'excel';

interface MemberExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  members: MemberSummary[];
  onExport: (format: ExportFormat, selectedFields: string[]) => Promise<void>;
}

export function MemberExportModal({
  isOpen,
  onClose,
  members,
  onExport,
}: MemberExportModalProps) {
  // Helper function to sort fields according to AVAILABLE_EXPORT_FIELDS order
  const sortFieldsByOrder = (fields: string[]): string[] => {
    const fieldOrder = AVAILABLE_EXPORT_FIELDS.map((field) => field.key);
    return fields.sort((a, b) => {
      const indexA = fieldOrder.indexOf(a);
      const indexB = fieldOrder.indexOf(b);
      return indexA - indexB;
    });
  };

  const [selectedFields, setSelectedFields] = useState<string[]>(
    sortFieldsByOrder(DEFAULT_SELECTED_FIELDS)
  );
  const [isExporting, setIsExporting] = useState(false);
  const [exportingFormat, setExportingFormat] = useState<ExportFormat | null>(
    null
  );

  const handleFieldToggle = (fieldKey: string) => {
    setSelectedFields((prev) => {
      const newFields = prev.includes(fieldKey)
        ? prev.filter((key) => key !== fieldKey)
        : [...prev, fieldKey];

      // Sort fields according to AVAILABLE_EXPORT_FIELDS order
      return sortFieldsByOrder(newFields);
    });
  };

  const handleSelectAll = (category: string) => {
    const categoryFields = AVAILABLE_EXPORT_FIELDS.filter(
      (field) => field.category === category
    ).map((field) => field.key);

    const allSelected = categoryFields.every((key) =>
      selectedFields.includes(key)
    );

    if (allSelected) {
      // Deselect all in category
      const newFields = selectedFields.filter(
        (key) => !categoryFields.includes(key)
      );
      setSelectedFields(sortFieldsByOrder(newFields));
    } else {
      // Select all in category
      const newFields = [...new Set([...selectedFields, ...categoryFields])];
      setSelectedFields(sortFieldsByOrder(newFields));
    }
  };

  const handleExport = async (format: ExportFormat) => {
    if (selectedFields.length === 0) {
      return;
    }

    setIsExporting(true);
    setExportingFormat(format);

    try {
      // Sort selected fields to maintain proper order
      const sortedFields = sortFieldsByOrder(selectedFields);
      await onExport(format, sortedFields);
      
      // Only auto-close modal for file downloads (CSV/Excel), not for PDF print dialogs
      if (format === 'csv' || format === 'excel') {
        onClose();
      }
    } catch (error) {
      console.error('Export failed:', error);
    } finally {
      setIsExporting(false);
      setExportingFormat(null);
    }
  };

  const groupedFields = AVAILABLE_EXPORT_FIELDS.reduce((acc, field) => {
    if (!acc[field.category]) {
      acc[field.category] = [];
    }
    acc[field.category].push(field);
    return acc;
  }, {} as Record<string, ExportField[]>);

  const categoryLabels = {
    basic: 'Basic Information',
    contact: 'Contact Information',
    membership: 'Membership Information',
    dates: 'Dates',
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Export Members</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Export Info */}
          <div className="text-sm text-muted-foreground">
            Exporting {members.length} members (filtered results)
          </div>

          {/* Field Selection */}
          <div className="space-y-4">
            <div className="flex items-center gap-4">
              <h3 className="text-sm font-medium">Select Fields to Export</h3>
              <div className="text-xs text-muted-foreground">
                ({selectedFields.length} field
                {selectedFields.length !== 1 ? 's' : ''} selected)
              </div>
            </div>

            {Object.entries(groupedFields).map(([category, fields]) => {
              const categoryFieldKeys = fields.map((f) => f.key);
              const allSelected = categoryFieldKeys.every((key) =>
                selectedFields.includes(key)
              );
              const someSelected = categoryFieldKeys.some((key) =>
                selectedFields.includes(key)
              );

              return (
                <div key={category} className="space-y-2">
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id={`category-${category}`}
                      checked={allSelected}
                      ref={(el) => {
                        const element = el as HTMLInputElement;
                        if (element)
                          element.indeterminate = someSelected && !allSelected;
                      }}
                      onCheckedChange={() => handleSelectAll(category)}
                    />
                    <Label
                      htmlFor={`category-${category}`}
                      className="text-sm font-medium cursor-pointer"
                    >
                      {categoryLabels[category as keyof typeof categoryLabels]}
                    </Label>
                  </div>

                  <div className="ml-6 grid grid-cols-2 gap-2">
                    {fields.map((field) => (
                      <div
                        key={field.key}
                        className="flex items-center space-x-2"
                      >
                        <Checkbox
                          id={field.key}
                          checked={selectedFields.includes(field.key)}
                          onCheckedChange={() => handleFieldToggle(field.key)}
                        />
                        <Label
                          htmlFor={field.key}
                          className="text-sm cursor-pointer"
                        >
                          {field.label}
                        </Label>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>

          <Separator />

          {/* Export Buttons */}
          <div className="space-y-3">
            <h3 className="text-sm font-medium">Export Format</h3>
            <div className="grid grid-cols-3 gap-3">
              <Button
                variant="outline"
                onClick={() => handleExport('pdf')}
                disabled={selectedFields.length === 0 || isExporting}
                className="flex flex-col items-center gap-2 h-auto py-4"
              >
                {isExporting && exportingFormat === 'pdf' ? (
                  <Loader2 className="h-6 w-6 animate-spin" />
                ) : (
                  <FileText className="h-6 w-6" />
                )}
                <span className="text-xs">PDF Table</span>
              </Button>

              <Button
                variant="outline"
                onClick={() => handleExport('csv')}
                disabled={selectedFields.length === 0 || isExporting}
                className="flex flex-col items-center gap-2 h-auto py-4"
              >
                {isExporting && exportingFormat === 'csv' ? (
                  <Loader2 className="h-6 w-6 animate-spin" />
                ) : (
                  <Download className="h-6 w-6" />
                )}
                <span className="text-xs">CSV File</span>
              </Button>

              <Button
                variant="outline"
                onClick={() => handleExport('excel')}
                disabled={selectedFields.length === 0 || isExporting}
                className="flex flex-col items-center gap-2 h-auto py-4"
              >
                {isExporting && exportingFormat === 'excel' ? (
                  <Loader2 className="h-6 w-6 animate-spin" />
                ) : (
                  <FileSpreadsheet className="h-6 w-6" />
                )}
                <span className="text-xs">Excel File</span>
              </Button>
            </div>
          </div>

          {selectedFields.length === 0 && (
            <div className="text-sm text-destructive text-center py-2">
              Please select at least one field to export
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
