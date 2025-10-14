import React, { useRef } from 'react';
import { useReactToPrint } from 'react-to-print';
import { saveAs } from 'file-saver';
import * as XLSX from 'xlsx';
import type { MemberSummary } from '@/types/members';
import type { ExportFormat } from './MemberExportModal';
import { parseTagsWithCategories, parseAssignedTags } from '@/utils/tagFormatUtils';

interface MemberExportServiceProps {
  members: MemberSummary[];
  selectedFields: string[];
  format: ExportFormat;
  organizationName?: string;
  onComplete: () => void;
  onError: (error: string) => void;
}

// Field labels mapping for export headers
const FIELD_LABELS: Record<string, string> = {
  first_name: 'First Name',
  last_name: 'Last Name',
  middle_name: 'Middle Name',
  full_name: 'Full Name',
  email: 'Email',
  phone: 'Phone',
  date_of_birth: 'Date of Birth',
  gender: 'Gender',
  membership_status: 'Membership Status',
  membership_type: 'Membership Type',
  date_joined: 'Join Date',
  is_active: 'Active',
  age: 'Age',
  membership_years: 'Membership Years',
  address: 'Address',
  address_line_1: 'Address Line 1',
  address_line_2: 'Address Line 2',
  city: 'City',
  state: 'State',
  postal_code: 'Postal Code',
  country: 'Country',
  branch_name: 'Branch',
  branch_location: 'Branch Location',
  profile_image_url: 'Profile Photo',
  created_at: 'Created Date',
  assigned_tags: 'All Tags',
  tag_count: 'Tag Count',
  tags_with_categories: 'Tags by Category',
};

// Print component for PDF export
function MembersPrintView({
  members,
  selectedFields,
  organizationName,
}: {
  members: MemberSummary[];
  selectedFields: string[];
  organizationName?: string;
}) {
  const formatValue = (value: any, fieldKey: string): string => {
    if (value === null || value === undefined) return '';

    // Format dates
    if (fieldKey.includes('date') || fieldKey === 'created_at') {
      try {
        return new Date(value).toLocaleDateString();
      } catch {
        return String(value);
      }
    }

    return String(value);
  };

  const getFieldValue = (member: MemberSummary, fieldKey: string): string => {
    // Handle special field mappings
    if (fieldKey === 'address') {
      // Concatenate address fields into a single string
      const addressParts = [
        member.address_line_1,
        member.address_line_2,
        member.city,
        member.state,
        member.postal_code,
        member.country,
      ].filter(Boolean);

      return addressParts.length > 0
        ? addressParts.join(', ')
        : 'No address provided';
    }

    if (fieldKey === 'branch_name') {
      return member.branch_name || 'No branch assigned';
    }

    // Handle profile photo - return placeholder text for PDF export
    if (fieldKey === 'profile_image_url') {
      return member.profile_image_url ? 'Photo Available' : 'No Photo';
    }

    // Handle tags with better formatting for PDF
    if (fieldKey === 'tags_with_categories') {
      const tagsByCategory = parseTagsWithCategories(member.tags_with_categories || '');
      if (Object.keys(tagsByCategory).length === 0) {
        return 'No tags assigned';
      }
      
      // Format as "**Category**: Tag1, Tag2 | **Category2**: Tag3, Tag4" with bold categories
      return Object.entries(tagsByCategory)
        .map(([category, tags]) => `${category}: ${tags.join(', ')}`)
        .join(' | ');
    }

    if (fieldKey === 'assigned_tags') {
      const tags = parseAssignedTags(member.assigned_tags || '');
      return tags.length > 0 ? tags.join(', ') : 'No tags assigned';
    }

    const value = member[fieldKey as keyof MemberSummary];
    return formatValue(value, fieldKey);
  };

  // Determine if we should use landscape orientation
  const isLandscape = selectedFields.length > 5;

  // Calculate column width based on number of columns
  const getColumnWidth = () => {
    if (selectedFields.length <= 3) return 'auto';
    if (selectedFields.length <= 5)
      return `${Math.floor(100 / selectedFields.length)}%`;
    return `${Math.floor(100 / selectedFields.length)}%`;
  };

  const pageStyle = `
    @page {
      size: ${isLandscape ? 'A4 landscape' : 'A4 portrait'};
      margin: 0.5in;
    }
    @media print {
      body { 
        -webkit-print-color-adjust: exact;
        color-adjust: exact;
      }
      table {
        page-break-inside: auto;
      }
      tr {
        page-break-inside: avoid;
        page-break-after: auto;
      }
      thead {
        display: table-header-group;
      }
      tfoot {
        display: table-footer-group;
      }
    }
  `;

  return (
    <>
      <style>{pageStyle}</style>
      <div
        className="bg-white text-black"
        style={{
          padding: isLandscape ? '16px' : '32px',
          fontSize: isLandscape ? '11px' : '12px',
          lineHeight: '1.4',
        }}
      >
        <div className="mb-4">
          {organizationName && (
            <h2
              className={`font-semibold mb-1 text-gray-700 ${
                isLandscape ? 'text-base' : 'text-lg'
              }`}
            >
              {organizationName}
            </h2>
          )}
          <h1
            className={`font-bold mb-2 ${isLandscape ? 'text-lg' : 'text-2xl'}`}
          >
            Members Directory
          </h1>
          <p
            className="text-gray-600"
            style={{ fontSize: isLandscape ? '10px' : '14px' }}
          >
            Generated on {new Date().toLocaleDateString()} • {members.length}{' '}
            members
          </p>
        </div>

        <table
          style={{
            width: '100%',
            borderCollapse: 'collapse',
            border: '1px solid #d1d5db',
            tableLayout: 'fixed',
          }}
        >
          <thead>
            <tr style={{ backgroundColor: '#f3f4f6' }}>
              {selectedFields.map((fieldKey) => (
                <th
                  key={fieldKey}
                  style={{
                    border: '1px solid #d1d5db',
                    padding: isLandscape ? '6px 4px' : '8px 12px',
                    textAlign: 'left',
                    fontWeight: '600',
                    fontSize: isLandscape ? '10px' : '12px',
                    width: getColumnWidth(),
                    wordWrap: 'break-word',
                    overflow: 'hidden',
                  }}
                >
                  {FIELD_LABELS[fieldKey] || fieldKey}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {members.map((member, index) => (
              <tr
                key={member.id}
                style={{
                  backgroundColor: index % 2 === 0 ? '#ffffff' : '#f9fafb',
                }}
              >
                {selectedFields.map((fieldKey) => (
                  <td
                    key={fieldKey}
                    style={{
                      border: '1px solid #d1d5db',
                      padding: isLandscape ? '4px 4px' : '8px 12px',
                      fontSize: isLandscape ? '9px' : '11px',
                      wordWrap: 'break-word',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      maxWidth: '0',
                      textAlign:
                        fieldKey === 'profile_image_url' ? 'center' : 'left',
                      verticalAlign:
                        fieldKey === 'profile_image_url' ? 'middle' : 'top',
                    }}
                  >
                    {fieldKey === 'profile_image_url' &&
                    member.profile_image_url ? (
                      <img
                        src={member.profile_image_url}
                        alt={`${member.first_name} ${member.last_name}`}
                        style={{
                          width: isLandscape ? '24px' : '32px',
                          height: isLandscape ? '24px' : '32px',
                          borderRadius: '50%',
                          objectFit: 'cover',
                          border: '1px solid #d1d5db',
                        }}
                        onError={(e) => {
                          const target = e.target as HTMLImageElement;
                          target.style.display = 'none';
                          target.parentElement!.innerHTML = 'No Photo';
                        }}
                      />
                    ) : fieldKey === 'profile_image_url' ? (
                      <span
                        style={{
                          color: '#6b7280',
                          fontSize: isLandscape ? '8px' : '10px',
                        }}
                      >
                        No Photo
                      </span>
                    ) : (
                      getFieldValue(member, fieldKey)
                    )}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}

export function MemberExportService({
  members,
  selectedFields,
  format,
  organizationName,
  onComplete,
  onError,
}: MemberExportServiceProps) {
  const printRef = useRef<HTMLDivElement>(null);

  const handlePrint = useReactToPrint({
    contentRef: printRef,
    documentTitle: `${
      organizationName ? `${organizationName} - ` : ''
    }Members Directory - ${new Date().toLocaleDateString()}`,
    onAfterPrint: () => {
      onComplete();
    },
    onPrintError: (error) => {
      console.error('Print error:', error);
      onError('Failed to generate PDF. Please try again.');
    },
  });

  const formatValueForExport = (
    value: any,
    fieldKey: string,
    member?: MemberSummary
  ): string => {
    if (value === null || value === undefined) return '';

    // Handle special field mappings
    if (fieldKey === 'address' && member) {
      // Concatenate address fields into a single string
      const addressParts = [
        member.address_line_1,
        member.address_line_2,
        member.city,
        member.state,
        member.postal_code,
        member.country,
      ].filter(Boolean);

      return addressParts.length > 0
        ? addressParts.join(', ')
        : 'No address provided';
    }

    if (fieldKey === 'branch_name' && member) {
      return member.branch_name || 'No branch assigned';
    }

    // Handle profile photo for CSV/Excel export
    if (fieldKey === 'profile_image_url' && member) {
      return member.profile_image_url || 'No Photo';
    }

    // Handle tags with better formatting
    if (fieldKey === 'tags_with_categories' && member) {
      const tagsByCategory = parseTagsWithCategories(member.tags_with_categories || '');
      if (Object.keys(tagsByCategory).length === 0) {
        return 'No tags assigned';
      }
      
      // Format as "**Category**: Tag1, Tag2 | **Category2**: Tag3, Tag4" with bold categories
      return Object.entries(tagsByCategory)
        .map(([category, tags]) => `${category}: ${tags.join(', ')}`)
        .join(' | ');
    }

    if (fieldKey === 'assigned_tags' && member) {
      const tags = parseAssignedTags(member.assigned_tags || '');
      return tags.length > 0 ? tags.join(', ') : 'No tags assigned';
    }

    // Format dates for export
    if (fieldKey.includes('date') || fieldKey === 'created_at') {
      try {
        return new Date(value).toLocaleDateString();
      } catch {
        return String(value);
      }
    }

    return String(value);
  };

  const exportToCSV = () => {
    try {
      // Create organization header if available
      const orgHeader = organizationName
        ? [`${organizationName} - Members Directory`]
        : ['Members Directory'];

      const dateHeader = [`Generated on ${new Date().toLocaleDateString()}`];
      const countHeader = [`${members.length} members`];
      const emptyRow = [''];

      // Create field headers
      const headers = selectedFields.map(
        (fieldKey) => FIELD_LABELS[fieldKey] || fieldKey
      );

      // Create rows
      const rows = members.map((member) =>
        selectedFields.map((fieldKey) => {
          // Handle special field mappings
          if (fieldKey === 'address') {
            return formatValueForExport(null, fieldKey, member);
          }
          if (fieldKey === 'branch_name') {
            return formatValueForExport(null, fieldKey, member);
          }

          const value = member[fieldKey as keyof MemberSummary];
          return formatValueForExport(value, fieldKey, member);
        })
      );

      // Combine all content with organization header
      const csvContent = [
        orgHeader,
        dateHeader,
        countHeader,
        emptyRow,
        headers,
        ...rows,
      ]
        .map((row) =>
          row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(',')
        )
        .join('\n');

      // Create and download file
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const fileName = `${
        organizationName
          ? `${organizationName.replace(/[^a-zA-Z0-9]/g, '-')}-`
          : ''
      }members-export-${new Date().toISOString().split('T')[0]}.csv`;
      saveAs(blob, fileName);

      onComplete();
    } catch (error) {
      console.error('CSV export error:', error);
      onError('Failed to export CSV. Please try again.');
    }
  };

  const exportToExcel = () => {
    try {
      // Create organization header data
      const orgTitle = organizationName
        ? `${organizationName} - Members Directory`
        : 'Members Directory';

      const headerData = [
        { [selectedFields[0]]: orgTitle },
        {
          [selectedFields[0]]: `Generated on ${new Date().toLocaleDateString()}`,
        },
        { [selectedFields[0]]: `${members.length} members` },
        {}, // Empty row
      ];

      // Create field headers
      const headers = selectedFields.map(
        (fieldKey) => FIELD_LABELS[fieldKey] || fieldKey
      );

      // Create data rows
      const data = members.map((member) =>
        selectedFields.reduce((row, fieldKey) => {
          const label = FIELD_LABELS[fieldKey] || fieldKey;

          // Handle special field mappings
          if (fieldKey === 'address') {
            row[label] = formatValueForExport(null, fieldKey, member);
          } else if (fieldKey === 'branch_name') {
            row[label] = formatValueForExport(null, fieldKey, member);
          } else {
            const value = member[fieldKey as keyof MemberSummary];
            row[label] = formatValueForExport(value, fieldKey, member);
          }
          return row;
        }, {} as Record<string, string>)
      );

      // Combine header data with member data
      const allData = [...headerData, ...data];

      // Create workbook and worksheet
      const wb = XLSX.utils.book_new();
      const ws = XLSX.utils.json_to_sheet(allData, { skipHeader: false });

      // Set column widths
      const colWidths = headers.map((header) => ({
        wch: Math.max(header.length, 15),
      }));
      ws['!cols'] = colWidths;

      // Add worksheet to workbook
      XLSX.utils.book_append_sheet(wb, ws, 'Members');

      // Generate and download file
      const fileName = `${
        organizationName
          ? `${organizationName.replace(/[^a-zA-Z0-9]/g, '-')}-`
          : ''
      }members-export-${new Date().toISOString().split('T')[0]}.xlsx`;
      XLSX.writeFile(wb, fileName);

      onComplete();
    } catch (error) {
      console.error('Excel export error:', error);
      onError('Failed to export Excel file. Please try again.');
    }
  };

  // Execute export based on format
  const executeExport = () => {
    switch (format) {
      case 'pdf':
        handlePrint();
        break;
      case 'csv':
        exportToCSV();
        break;
      case 'excel':
        exportToExcel();
        break;
      default:
        onError('Unsupported export format');
    }
  };

  // Auto-execute export when component mounts
  React.useEffect(() => {
    executeExport();
  }, []);

  return (
    <div style={{ display: 'none' }}>
      <div ref={printRef}>
        <MembersPrintView
          members={members}
          selectedFields={selectedFields}
          organizationName={organizationName}
        />
      </div>
    </div>
  );
}
