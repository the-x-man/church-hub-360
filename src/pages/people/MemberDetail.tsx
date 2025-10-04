import { MemberForm } from '@/components/people/members';
import { TagRenderer } from '@/components/people/tags/TagRenderer';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import { useBranches } from '@/hooks/useBranchQueries';
import { useMember } from '@/hooks/useMemberQueries';
import { usePeopleConfiguration } from '@/hooks/usePeopleConfigurationQueries';
import { useRelationalTags } from '@/hooks/useRelationalTags';
import { useMemberTagAssignments } from '@/hooks/useMemberTagAssignments';
import { type MemberFormField, type MembershipStatus } from '@/types/members';
import type { MembershipFormSchema } from '@/types/people-configurations';
import { format } from 'date-fns';
import {
  AlertCircle,
  ArrowLeft,
  Calendar,
  CheckCircle,
  Clock,
  CreditCard,
  Edit,
  Heart,
  Mail,
  MapPin,
  Phone,
  Printer,
  User,
  XCircle,
  Tags
} from 'lucide-react';
import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';

// Helper function to convert MembershipFormSchema to MemberFormField[]
const convertSchemaToFormFields = (schema: MembershipFormSchema | undefined): MemberFormField[] => {
  if (!schema?.rows) return [];
  
  const fields: MemberFormField[] = [];
  
  schema.rows.forEach(row => {
    row.columns.forEach(column => {
      if (column.component) {
        const component = column.component;
        fields.push({
          id: component.id,
          type: component.type as any, // Type conversion needed
          label: component.label,
          required: component.required,
          placeholder: component.placeholder,
          options: component.options,
          validation: component.validation
        });
      }
    });
  });
  
  return fields;
};

export function MemberDetail() {
  const { memberId } = useParams<{ memberId: string }>();
  const navigate = useNavigate();
  const [isEditing, setIsEditing] = useState(false);
  const [tagValues, setTagValues] = useState<Record<string, any>>({});

  // Fetch member data
  const { data: member, isLoading, error } = useMember(memberId!);
  const { configuration } = usePeopleConfiguration(member?.organization_id);
  const { data: branches } = useBranches(member?.organization_id);
  
  // Fetch tag data
  const { tags } = useRelationalTags();
  const { 
    assignmentsByTag, 
    updateTagAssignments 
  } = useMemberTagAssignments(memberId);
  
  // Convert membership form schema to form fields
  const membershipFormFields = convertSchemaToFormFields(configuration?.membership_form_schema);

  // Initialize tag values from current assignments
  useEffect(() => {
    if (assignmentsByTag && Object.keys(assignmentsByTag).length > 0) {
      setTagValues(assignmentsByTag);
    }
  }, [assignmentsByTag]);

  // Handle tag changes
  const handleTagChange = async (tagId: string, tagItemIds: string | string[]) => {
    if (!memberId) return;
    
    try {
      const itemIds = Array.isArray(tagItemIds) ? tagItemIds : [tagItemIds];
      await updateTagAssignments({
        memberId,
        tagId,
        tagItemIds: itemIds,
      });
      setTagValues(prev => ({ ...prev, [tagId]: itemIds }));
    } catch (error) {
      console.error('Error updating tag assignments:', error);
    }
  };

  // Handle edit mode
  const handleEditToggle = () => {
    setIsEditing(!isEditing);
  };

  // Handle print member details
  const handlePrintDetails = () => {
    const printWindow = window.open('', '_blank');
    if (!printWindow || !member) return;

    const printContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Member Details - ${member.first_name} ${member.last_name}</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 20px; }
            .header { text-align: center; margin-bottom: 30px; }
            .section { margin-bottom: 20px; }
            .section h3 { border-bottom: 2px solid #333; padding-bottom: 5px; }
            .field { margin: 5px 0; }
            .label { font-weight: bold; }
            .status { padding: 2px 8px; border-radius: 4px; }
            .active { background-color: #dcfce7; color: #166534; }
            .inactive { background-color: #fef2f2; color: #dc2626; }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>Member Details</h1>
            <h2>${member.first_name} ${member.last_name}</h2>
            <p>Member ID: ${member.membership_id}</p>
          </div>
          
          <div class="section">
            <h3>Personal Information</h3>
            <div class="field"><span class="label">Full Name:</span> ${member.first_name} ${member.middle_name || ''} ${member.last_name}</div>
            <div class="field"><span class="label">Date of Birth:</span> ${member.date_of_birth ? format(new Date(member.date_of_birth), 'PPP') : 'Not provided'}</div>
            <div class="field"><span class="label">Gender:</span> ${member.gender || 'Not specified'}</div>
            <div class="field"><span class="label">Marital Status:</span> ${member.marital_status || 'Not specified'}</div>
            <div class="field"><span class="label">Phone:</span> ${member.phone || 'Not provided'}</div>
            <div class="field"><span class="label">Email:</span> ${member.email || 'Not provided'}</div>
          </div>

          <div class="section">
            <h3>Address</h3>
            <div class="field">${member.address_line_1 || ''}</div>
            ${member.address_line_2 ? `<div class="field">${member.address_line_2}</div>` : ''}
            <div class="field">${member.city || ''}, ${member.state || ''} ${member.postal_code || ''}</div>
            <div class="field">${member.country || ''}</div>
          </div>

          <div class="section">
            <h3>Membership Information</h3>
            <div class="field"><span class="label">Status:</span> <span class="status ${member.membership_status === 'active' ? 'active' : 'inactive'}">${member.membership_status}</span></div>
            <div class="field"><span class="label">Type:</span> ${member.membership_type || 'Not specified'}</div>
            <div class="field"><span class="label">Join Date:</span> ${member.date_joined ? format(new Date(member.date_joined), 'PPP') : 'Not provided'}</div>
          </div>

          ${member.emergency_contact_name ? `
          <div class="section">
            <h3>Emergency Contact</h3>
            <div class="field"><span class="label">Name:</span> ${member.emergency_contact_name}</div>
            <div class="field"><span class="label">Relationship:</span> ${member.emergency_contact_relationship || 'Not specified'}</div>
            <div class="field"><span class="label">Phone:</span> ${member.emergency_contact_phone || 'Not provided'}</div>
          </div>
          ` : ''}

          ${member.notes ? `
          <div class="section">
            <h3>Notes</h3>
            <div class="field">${member.notes}</div>
          </div>
          ` : ''}

          <div class="section">
            <p><em>Printed on ${format(new Date(), 'PPP')} at ${format(new Date(), 'p')}</em></p>
          </div>
        </body>
      </html>
    `;

    printWindow.document.write(printContent);
    printWindow.document.close();
    printWindow.print();
  };

  // Handle print membership card
  const handlePrintCard = () => {
    const printWindow = window.open('', '_blank');
    if (!printWindow || !member) return;

    const printContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Membership Card - ${member.first_name} ${member.last_name}</title>
          <style>
            body { 
              font-family: Arial, sans-serif; 
              margin: 0; 
              padding: 20px;
              background-color: #f5f5f5;
            }
            .card {
              width: 3.375in;
              height: 2.125in;
              background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
              border-radius: 12px;
              padding: 16px;
              color: white;
              position: relative;
              box-shadow: 0 4px 8px rgba(0,0,0,0.2);
              margin: 0 auto;
            }
            .card-header {
              text-align: center;
              margin-bottom: 12px;
            }
            .church-name {
              font-size: 14px;
              font-weight: bold;
              margin-bottom: 4px;
            }
            .card-title {
              font-size: 10px;
              opacity: 0.9;
            }
            .member-info {
              text-align: center;
            }
            .member-name {
              font-size: 16px;
              font-weight: bold;
              margin-bottom: 4px;
            }
            .member-id {
              font-size: 12px;
              opacity: 0.9;
              margin-bottom: 8px;
            }
            .member-status {
              font-size: 10px;
              background-color: rgba(255,255,255,0.2);
              padding: 2px 8px;
              border-radius: 12px;
              display: inline-block;
            }
            .card-footer {
              position: absolute;
              bottom: 8px;
              right: 12px;
              font-size: 8px;
              opacity: 0.7;
            }
            @media print {
              body { background-color: white; }
              .card { box-shadow: none; }
            }
          </style>
        </head>
        <body>
          <div class="card">
            <div class="card-header">
              <div class="church-name">ChurchHub360</div>
              <div class="card-title">MEMBERSHIP CARD</div>
            </div>
            
            <div class="member-info">
              <div class="member-name">${member.first_name} ${member.last_name}</div>
              <div class="member-id">ID: ${member.membership_id}</div>
              <div class="member-status">${member.membership_status?.toUpperCase()}</div>
            </div>
            
            <div class="card-footer">
              ${format(new Date(), 'yyyy')}
            </div>
          </div>
        </body>
      </html>
    `;

    printWindow.document.write(printContent);
    printWindow.document.close();
    printWindow.print();
  };

  // Get status icon and color
  const getStatusDisplay = (status: MembershipStatus) => {
    switch (status) {
      case 'active':
        return { icon: CheckCircle, color: 'text-green-600', bg: 'bg-green-100', text: 'Active' };
      case 'inactive':
        return { icon: XCircle, color: 'text-red-600', bg: 'bg-red-100', text: 'Inactive' };
      case 'pending':
        return { icon: Clock, color: 'text-yellow-600', bg: 'bg-yellow-100', text: 'Pending' };
      default:
        return { icon: AlertCircle, color: 'text-gray-600', bg: 'bg-gray-100', text: 'Unknown' };
    }
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="container mx-auto py-8">
        <div className="flex items-center gap-4 mb-6">
          <Skeleton className="h-10 w-10" />
          <div>
            <Skeleton className="h-8 w-48 mb-2" />
            <Skeleton className="h-4 w-32" />
          </div>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <Card>
              <CardHeader>
                <Skeleton className="h-6 w-40" />
              </CardHeader>
              <CardContent className="space-y-4">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-4 w-1/2" />
              </CardContent>
            </Card>
          </div>
          
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <Skeleton className="h-6 w-32" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-20 w-20 rounded-full mx-auto mb-4" />
                <Skeleton className="h-4 w-full mb-2" />
                <Skeleton className="h-4 w-3/4 mx-auto" />
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    );
  }

  // Error state
  if (error || !member) {
    return (
      <div className="container mx-auto py-8">
        <div className="flex items-center gap-4 mb-6">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate('/people/membership')}
            className="flex items-center gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Members
          </Button>
        </div>
        
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            {error ? 'Failed to load member details.' : 'Member not found.'}
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  const statusDisplay = getStatusDisplay(member.membership_status);
  const StatusIcon = statusDisplay.icon;

  // Edit mode
  if (isEditing) {
    return (
      <div className="container mx-auto py-8">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsEditing(false)}
              className="flex items-center gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              Cancel Edit
            </Button>
            <div>
              <h1 className="text-3xl font-bold">Edit Member</h1>
              <p className="text-muted-foreground">
                {member.first_name} {member.last_name}
              </p>
            </div>
          </div>
        </div>

        <MemberForm
          member={member}
          membershipFormSchema={membershipFormFields}
          branches={branches || []}
          onCancel={() => setIsEditing(false)}
          onSubmit={async (_data) => {
            // Handle member update
            try {
              // Add update logic here if needed
              setIsEditing(false);
            } catch (error) {
              console.error('Error updating member:', error);
            }
          }}
        />
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate('/people/membership')}
            className="flex items-center gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Members
          </Button>
          <div>
            <h1 className="text-3xl font-bold">
              {member.first_name} {member.last_name}
            </h1>
            <p className="text-muted-foreground">
              Member ID: {member.membership_id}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handlePrintDetails}
            className="flex items-center gap-2"
          >
            <Printer className="h-4 w-4" />
            Print Details
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handlePrintCard}
            className="flex items-center gap-2"
          >
            <CreditCard className="h-4 w-4" />
            Print Card
          </Button>
          <Button
            onClick={handleEditToggle}
            className="flex items-center gap-2"
          >
            <Edit className="h-4 w-4" />
            Edit Member
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Personal Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                Personal Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Full Name</label>
                  <p className="text-sm">
                    {member.first_name} {member.middle_name && `${member.middle_name} `}{member.last_name}
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Date of Birth</label>
                  <p className="text-sm">
                    {member.date_of_birth ? format(new Date(member.date_of_birth), 'PPP') : 'Not provided'}
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Gender</label>
                  <p className="text-sm">{member.gender || 'Not specified'}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Marital Status</label>
                  <p className="text-sm">{member.marital_status || 'Not specified'}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Contact Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Phone className="h-5 w-5" />
                Contact Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-center gap-3">
                  <Phone className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Phone</label>
                    <p className="text-sm">{member.phone || 'Not provided'}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Mail className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Email</label>
                    <p className="text-sm">{member.email || 'Not provided'}</p>
                  </div>
                </div>
              </div>
              
              <Separator />
              
              <div className="flex items-start gap-3">
                <MapPin className="h-4 w-4 text-muted-foreground mt-1" />
                <div className="flex-1">
                  <label className="text-sm font-medium text-muted-foreground">Address</label>
                  <div className="text-sm space-y-1">
                    {member.address_line_1 && <p>{member.address_line_1}</p>}
                    {member.address_line_2 && <p>{member.address_line_2}</p>}
                    {(member.city || member.state || member.postal_code) && (
                      <p>{member.city}, {member.state} {member.postal_code}</p>
                    )}
                    {member.country && <p>{member.country}</p>}
                    {!member.address_line_1 && !member.city && <p>No address provided</p>}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Emergency Contact */}
          {member.emergency_contact_name && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Heart className="h-5 w-5" />
                  Emergency Contact
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Name</label>
                    <p className="text-sm">{member.emergency_contact_name}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Relationship</label>
                    <p className="text-sm">{member.emergency_contact_relationship || 'Not specified'}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Phone</label>
                    <p className="text-sm">{member.emergency_contact_phone || 'Not provided'}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Additional Information */}
          {member.form_data && Object.keys(member.form_data).length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Additional Information</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {Object.entries(member.form_data).map(([key, value]) => (
                    <div key={key}>
                      <label className="text-sm font-medium text-muted-foreground capitalize">
                        {key.replace(/_/g, ' ')}
                      </label>
                      <p className="text-sm">{String(value)}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Notes */}
          {member.notes && (
            <Card>
              <CardHeader>
                <CardTitle>Notes</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm whitespace-pre-wrap">{member.notes}</p>
              </CardContent>
            </Card>
          )}

          {/* Tags */}
          {tags && tags.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Tags className="h-5 w-5" />
                  Tags
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {tags.map((category) => (
                  <TagRenderer
                    key={category.id}
                    tag={category}
                    tagKey={category.id}
                    value={tagValues[category.id] || []}
                    onChange={(value) => handleTagChange(category.id, value)}
                    disabled={!isEditing}
                  />
                ))}
              </CardContent>
            </Card>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Member Summary */}
          <Card>
            <CardHeader>
              <CardTitle>Member Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex flex-col items-center text-center">
                <Avatar className="h-20 w-20 mb-4">
                  <AvatarImage src="" alt={`${member.first_name} ${member.last_name}`} />
                  <AvatarFallback className="text-lg">
                    {member.first_name[0]}{member.last_name[0]}
                  </AvatarFallback>
                </Avatar>
                <h3 className="font-semibold">{member.first_name} {member.last_name}</h3>
                <p className="text-sm text-muted-foreground">{member.membership_id}</p>
              </div>
              
              <Separator />
              
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Status</span>
                  <Badge variant="secondary" className={`${statusDisplay.bg} ${statusDisplay.color}`}>
                    <StatusIcon className="h-3 w-3 mr-1" />
                    {statusDisplay.text}
                  </Badge>
                </div>
                
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Type</span>
                  <span className="text-sm">{member.membership_type || 'Not specified'}</span>
                </div>
                
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Join Date</span>
                  <span className="text-sm">
                    {member.date_joined ? format(new Date(member.date_joined), 'MMM d, yyyy') : 'Not provided'}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleEditToggle}
                className="w-full justify-start"
              >
                <Edit className="h-4 w-4 mr-2" />
                Edit Member
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handlePrintDetails}
                className="w-full justify-start"
              >
                <Printer className="h-4 w-4 mr-2" />
                Print Details
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handlePrintCard}
                className="w-full justify-start"
              >
                <CreditCard className="h-4 w-4 mr-2" />
                Print Membership Card
              </Button>
            </CardContent>
          </Card>

          {/* Audit Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                Audit Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <label className="text-sm font-medium text-muted-foreground">Created</label>
                <p className="text-sm">{format(new Date(member.created_at), 'PPP')}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">Last Updated</label>
                <p className="text-sm">{format(new Date(member.updated_at), 'PPP')}</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}