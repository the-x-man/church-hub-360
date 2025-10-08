import { DefaultMembershipForm, type DefaultMembershipFormData, type DefaultMembershipFormMethods } from '@/components/people/configurations/DefaultMembershipForm';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import { Label } from '@/components/ui/label';
import { BranchSelector } from '@/components/shared/BranchSelector';
import { CopyToClipboard } from '@/components/shared/CopyToClipboard';
import { MembershipCardModal } from '@/components/shared/MembershipCardModal';
import { TagRenderer } from '@/components/people/tags/TagRenderer';
import { useMember, useUpdateMember } from '@/hooks/useMemberQueries';
import { useMemberTagAssignments } from '@/hooks/useMemberTagAssignments';
import { useRelationalTags } from '@/hooks/useRelationalTags';
import { useMembershipFormManagement } from '@/hooks/usePeopleConfigurationQueries';
import { useOrganization } from '@/contexts/OrganizationContext';
import { useBulkTagOperations } from '@/hooks/useBulkTagOperations';
import { compareTagAssignments } from '@/utils/tagAssignmentUtils';
import { type MembershipStatus, type UpdateMemberData } from '@/types/members';
import { type MemberTagAssignment } from '@/hooks/useMemberTagAssignments';
import { format } from 'date-fns';
import {
  AlertCircle,
  ArrowLeft,
  Calendar,
  CheckCircle,
  Clock,
  CreditCard,
  Edit,
  FileText,
  Heart,
  Phone,
  Printer,
  User,
  XCircle,
  Tags,
  Save,
  X,
  MailIcon
} from 'lucide-react';
import { useState, useRef, useEffect, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { toast } from 'sonner';

export function MemberDetail() {
  const { memberId } = useParams<{ memberId: string }>();
  const navigate = useNavigate();
  const [isEditing, setIsEditing] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const formRef = useRef<DefaultMembershipFormMethods>(null);

  // State for branch and tag management
  const [branchId, setBranchId] = useState<string>('');
  const [tagValues, setTagValues] = useState<Record<string, any>>({});
  const [tagErrors, setTagErrors] = useState<Record<string, string>>({});
  const [branchError, setBranchError] = useState<string>('');
  const [customFieldValues, setCustomFieldValues] = useState<Record<string, any>>({});
  const [isCardModalOpen, setIsCardModalOpen] = useState(false);

  // Fetch member data
  const { data: member, isLoading, error } = useMember(memberId!);
  const updateMemberMutation = useUpdateMember();
  const { currentOrganization } = useOrganization();
  
  // Fetch tag assignments and related data
  const { 
    assignments,
    assignmentsByTag
  } = useMemberTagAssignments(memberId || '');
  
  const { tags } = useRelationalTags();
  const { membershipFormSchema } = useMembershipFormManagement(currentOrganization?.id);
  const { bulkUpdateTags } = useBulkTagOperations();

  const handleEditToggle = () => {
    setIsEditing(!isEditing);
  };

  // Initialize default values when member data is loaded
  useEffect(() => {
    if (member && !isEditing) {
      setBranchId(member.branch_id || '');
      
      // Initialize tag values from existing assignments
      const initialTagValues: Record<string, any> = {};
      if (assignmentsByTag) {
        Object.entries(assignmentsByTag).forEach(([tagId, tagItemIds]) => {
          if (tagItemIds && tagItemIds.length > 0) {
            // assignmentsByTag contains arrays of tag_item_ids
            initialTagValues[tagId] = tagItemIds;
          }
        });
      }
      setTagValues(initialTagValues);
      
      // Initialize custom field values
      const initialCustomFields: Record<string, any> = {};
      if (member.form_data) {
        Object.entries(member.form_data).forEach(([fieldId, value]) => {
          initialCustomFields[fieldId] = value;
        });
      }
      setCustomFieldValues(initialCustomFields);
    }
  }, [member, isEditing]);

  // Callback handlers for branch and tag changes
  const handleBranchChange = useCallback((value: string | string[] | undefined) => {
    // For single branch selection, we expect a string
    const branchValue = Array.isArray(value) ? value[0] : value;
    setBranchId(branchValue || '');
    setBranchError('');
  }, []);

  const handleTagChange = useCallback((tagId: string, value: any) => {
    setTagValues(prev => ({
      ...prev,
      [tagId]: value
    }));
    setTagErrors(prev => ({
      ...prev,
      [tagId]: ''
    }));
  }, []);

  const handleUpdateMember = async () => {
    if (!member || !formRef.current) return;
    
    setIsSubmitting(true);
    try {
      // Get form data and validate
      const { isValid, errors } = formRef.current.validateForm();
      if (!isValid) {
        toast.error('Please fix the form errors before submitting');
        console.error('Form validation errors:', errors);
        return;
      }

      // Validate branch selection if required
      // Note: branch_required is not part of MembershipFormSchema, 
      // branch validation should be handled by form validation
      if (!branchId) {
        setBranchError('Branch selection is required');
      }

      // Validate required tags
      let hasTagErrors = false;
      const newTagErrors: Record<string, string> = {};
      
      if (tags && membershipFormSchema) {
        tags.forEach(tag => {
          if (tag.is_required && (!tagValues[tag.id] || tagValues[tag.id] === '')) {
            newTagErrors[tag.id] = `${tag.name} is required`;
            hasTagErrors = true;
          }
        });
      }

      if (hasTagErrors) {
        setTagErrors(newTagErrors);
      }

      if(!isValid || !branchId || hasTagErrors) {
        toast.error('Please fill in all required fields');
        return;
      }

      const formData: DefaultMembershipFormData = formRef.current.getFormData();
      
      // Convert DefaultMembershipFormData to UpdateMemberData
      const updateData: UpdateMemberData = {
        id: member.id,
        first_name: formData.first_name,
        middle_name: formData.middle_name,
        last_name: formData.last_name,
        date_of_birth: formData.date_of_birth ? formData.date_of_birth.toISOString().split('T')[0] : undefined,
        gender: formData.gender,
        marital_status: formData.marital_status,
        phone: formData.phone,
        email: formData.email,
        address_line_1: formData.address_line_1,
        address_line_2: formData.address_line_2,
        city: formData.city,
        state: formData.state,
        postal_code: formData.postal_code,
        country: formData.country,
        membership_id: formData.membership_id,
        membership_status: formData.membership_status,
        membership_type: formData.membership_type,
        date_joined: formData.date_joined ? formData.date_joined.toISOString().split('T')[0] : undefined,
        baptism_date: formData.baptism_date ? formData.baptism_date.toISOString().split('T')[0] : undefined,
        notes: formData.notes,
        profile_image_url: formData.profile_image_url,
        emergency_contact_name: formData.emergency_contact_name,
        emergency_contact_phone: formData.emergency_contact_phone,
        emergency_contact_relationship: formData.emergency_contact_relationship,
        branch_id: branchId || undefined,
        form_data: customFieldValues
      };

      // Update member data
      await updateMemberMutation.mutateAsync(updateData);

      // Handle tag assignment changes
      if (assignments) {
        // Transform assignments to the format expected by compareTagAssignments
        const currentAssignments: Record<string, MemberTagAssignment | null> = {};
        assignments.forEach(assignment => {
          currentAssignments[assignment.tag_item.tag_id] = assignment;
        });
        
        const tagComparison = compareTagAssignments(currentAssignments, tagValues);
        
        if (tagComparison.hasChanges) {
          await bulkUpdateTags({
            memberId: member.id,
            changes: tagComparison.changes
          });
        }
      }

      toast.success('Member updated successfully');
      setIsEditing(false);
    } catch (error) {
      toast.error('Failed to update member');
      console.error('Error updating member:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    setIsEditing(false);
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
    setIsCardModalOpen(true);
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
      <div className="container mx-auto max-w-7xl">
        <Button
          variant="ghost"
          size="sm"
          onClick={handleCancel}
          className="flex items-center gap-2 mb-2"
        >
          <ArrowLeft className="h-4 w-4" />
          Cancel Edit
        </Button>
        
        {/* Header */}
        <div className="flex items-center justify-between mb-6 bg-neutral-100 dark:bg-neutral-800/50 px-4 py-2 rounded-md border">
          <div className="flex items-center gap-4">
            <div>
              <h1 className="text-2xl font-bold">Edit Member</h1>
              <p className="text-muted-foreground">
                {member.first_name} {member.last_name}
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <Button
               variant="outline"
               onClick={handleCancel}
               disabled={isSubmitting}
             >
               <X className="h-4 w-4 mr-2" />
               Cancel
             </Button>
             <Button
               onClick={handleUpdateMember}
               disabled={isSubmitting}
             >
               <Save className="h-4 w-4 mr-2" />
               {isSubmitting ? 'Saving...' : 'Save Changes'}
             </Button>
          </div>
        </div>

        {/* Main Content Grid - Similar to AddMember */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Form Section - Left Side */}
          <div className="lg:col-span-2">
            <Card>
              <CardContent>
                <DefaultMembershipForm
                  ref={formRef}
                  initialData={{
                    first_name: member.first_name || '',
                    middle_name: member.middle_name || '',
                    last_name: member.last_name || '',
                    date_of_birth: member.date_of_birth ? new Date(member.date_of_birth) : undefined,
                    gender: member.gender || '',
                    marital_status: member.marital_status || '',
                    phone: member.phone || '',
                    email: member.email || '',
                    address_line_1: member.address_line_1 || '',
                    address_line_2: member.address_line_2 || '',
                    city: member.city || '',
                    state: member.state || '',
                    postal_code: member.postal_code || '',
                    country: member.country || '',
                    membership_id: member.membership_id || '',
                    membership_status: member.membership_status || 'active',
                    membership_type: member.membership_type || 'Regular',
                    date_joined: member.date_joined ? new Date(member.date_joined) : undefined,
                    baptism_date: member.baptism_date ? new Date(member.baptism_date) : undefined,
                    notes: member.notes || '',
                    profile_image_url: member.profile_image_url || '',
                    emergency_contact_name: member.emergency_contact_name || '',
                    emergency_contact_phone: member.emergency_contact_phone || '',
                    emergency_contact_relationship: member.emergency_contact_relationship || '',
                  }}
                />
              </CardContent>
            </Card>
          </div>

          {/* Right Sidebar - Member Info */}
          <div className="lg:col-span-1">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="h-5 w-5" />
                  Member Info
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-3">
                  <Avatar className="h-12 w-12">
                    <AvatarImage src={member.profile_image_url || undefined} />
                    <AvatarFallback>
                      {member.first_name?.[0]}{member.last_name?.[0]}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-medium">{member.first_name} {member.last_name}</p>
                    <p className="text-sm text-muted-foreground">
                      Member ID: {member.membership_id || 'Not assigned'}
                    </p>
                  </div>
                </div>
                
                <Separator />

                {/* Branch Selector - Only show in edit mode */}
                {isEditing && (
                  <>
                    <div className="space-y-2">
                      <Label htmlFor="branch-selector">Branch</Label>
                      <BranchSelector
                        variant="single"
                        value={branchId}
                        onValueChange={handleBranchChange}
                        allowClear={true}
                        placeholder="Select a branch..."
                      />
                      {branchError && <p className="text-sm text-red-500">{branchError}</p>}
                    </div>
                    <Separator />
                  </>
                )}

                {/* Tag Renderer - Only show in edit mode */}
                {isEditing && tags && tags.length > 0 && (
                  <>
                    <div className="space-y-4">
                      <Label>Tags & Information</Label>
                      {tags.map((tag) => (
                        <TagRenderer
                          key={tag.id}
                          tag={tag}
                          tagKey={tag.id}
                          value={tagValues[tag.id]}
                          onChange={(value) => handleTagChange(tag.id, value)}
                          error={tagErrors[tag.id]}
                        />
                      ))}
                    </div>
                    <Separator />
                  </>
                )}
                
                <div className="space-y-2">
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Status</label>
                    <div className="flex items-center gap-2 mt-1">
                      <Badge
                        variant="secondary"
                        className="flex items-center gap-1"
                        style={{
                          backgroundColor: statusDisplay.color + '20',
                          color: statusDisplay.color,
                          borderColor: statusDisplay.color + '40',
                        }}
                      >
                        <StatusIcon className="h-3 w-3" />
                        {statusDisplay.text}
                      </Badge>
                    </div>
                  </div>
                  
                  {member.date_joined && (
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">Joined</label>
                      <p className="text-sm">{format(new Date(member.date_joined), 'MMM d, yyyy')}</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 max-w-6xl">
      {/* Back Button */}
      <div className="mb-6">
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

      {/* Main Header Card */}
      <Card className="mb-8">
        <CardContent className="py-4 px-8">
          <div className="flex flex-col lg:flex-row gap-8">
            {/* Profile Section */}
            <div className="flex flex-col items-center lg:items-start">
              <Avatar className="h-32 w-32 mb-4 rounded-xl border">
                <AvatarImage src={member.profile_image_url || ''} alt={`${member.first_name} ${member.last_name}`} />
                <AvatarFallback className="text-2xl">
                  {member.first_name[0]}{member.last_name[0]}
                </AvatarFallback>
              </Avatar>
              <div className="text-left">
                <h1 className="text-3xl font-bold mb-2">
                   {member.first_name} {member.last_name}
                 </h1>
                 <div className='flex justify-between items-center'>
                  <div className="flex items-center gap-2 mb-4">
                    <p className="text-muted-foreground">
                      Member ID: {member.membership_id}
                    </p>
                    <CopyToClipboard 
                      text={member.membership_id} 
                      label="Member ID" 
                      size="sm"
                    />
                  </div>
                  <Badge variant="secondary" className={`${statusDisplay.bg} ${statusDisplay.color} mb-4`}>
                    <StatusIcon className="h-3 w-3 mr-1" />
                    {statusDisplay.text}
                  </Badge>
                </div>
              </div>
            </div>

            {/* Quick Info Grid */}
            <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-6">
               <div className="space-y-4">
                 <div className="flex items-center gap-3">
                   <Phone className="h-5 w-5 text-muted-foreground" />
                   <div className="flex-1">
                     <p className="text-sm font-medium text-muted-foreground">Mobile</p>
                     <div className="flex items-center gap-2">
                       <p className="text-lg">{member.phone || 'Not provided'}</p>
                       {member.phone && (
                         <CopyToClipboard 
                           text={member.phone} 
                           label="Phone number" 
                           size="sm"
                         />
                       )}
                     </div>
                   </div>
                 </div>
                 <div className="flex items-center gap-3">
                   <MailIcon className="h-5 w-5 text-muted-foreground" />
                   <div className="flex-1">
                     <p className="text-sm font-medium text-muted-foreground">Email</p>
                     <div className="flex items-center gap-2">
                       <p className="text-lg truncate max-w-[140px]" title={member.email || 'Not provided'}>{member.email || 'Not provided'}</p>
                       {member.email && (
                         <CopyToClipboard 
                           text={member.email} 
                           label="Email" 
                           size="sm"
                         />
                       )}
                     </div>
                   </div>
                 </div>
               </div>
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <User className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Gender</p>
                    <p className="text-lg">{member.gender || 'Not specified'}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Calendar className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Join Date</p>
                    <p className="text-lg">
                      {member.date_joined ? format(new Date(member.date_joined), 'MMM d, yyyy') : 'Not provided'}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col gap-2 lg:w-48">
              <Button
                onClick={handleEditToggle}
                className="flex items-center gap-2"
              >
                <Edit className="h-4 w-4" />
                Edit Member
              </Button>
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
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Left Column */}
        <div className="space-y-6">
          {/* Personal Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                Personal Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Full Name */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="text-sm font-medium text-muted-foreground">First Name</label>
                  <div className="flex items-center gap-2">
                    <p className="text-sm">{member.first_name}</p>
                    <CopyToClipboard 
                      text={member.first_name} 
                      label="First name" 
                      size="sm"
                    />
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Middle Name</label>
                  <p className="text-sm">{member.middle_name || 'Not provided'}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Last Name</label>
                  <div className="flex items-center gap-2">
                    <p className="text-sm">{member.last_name}</p>
                    <CopyToClipboard 
                      text={member.last_name} 
                      label="Last name" 
                      size="sm"
                    />
                  </div>
                </div>
              </div>

              <Separator />

              {/* Personal Details */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Date of Birth</label>
                  <p className="text-sm">
                    {member.date_of_birth ? format(new Date(member.date_of_birth), 'MMM d, yyyy') : 'Not provided'}
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
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Phone</label>
                  <div className="flex items-center gap-2">
                    <p className="text-sm">{member.phone || 'Not provided'}</p>
                    {member.phone && (
                      <CopyToClipboard 
                        text={member.phone} 
                        label="Phone number" 
                        size="sm"
                      />
                    )}
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Email</label>
                  <div className="flex items-center gap-2">
                    <p className="text-sm">{member.email || 'Not provided'}</p>
                    {member.email && (
                      <CopyToClipboard 
                        text={member.email} 
                        label="Email" 
                        size="sm"
                      />
                    )}
                  </div>
                </div>
              </div>
              
              <Separator />
              
              <div>
                <label className="text-sm font-medium text-muted-foreground">Address</label>
                <div className="text-sm mt-1 space-y-1">
                  {member.address_line_1 && (
                    <div className="flex items-center gap-2">
                      <p>{member.address_line_1}</p>
                      <CopyToClipboard 
                        text={member.address_line_1} 
                        label="Address" 
                        size="sm"
                        className="h-4 w-4 p-0"
                      />
                    </div>
                  )}
                  {member.address_line_2 && <p>{member.address_line_2}</p>}
                  {(member.city || member.state || member.postal_code) && (
                    <p>
                      {[member.city, member.state, member.postal_code].filter(Boolean).join(', ')}
                    </p>
                  )}
                  {member.country && <p>{member.country}</p>}
                  {!member.address_line_1 && !member.city && <p>No address provided</p>}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Emergency Contact */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Heart className="h-5 w-5" />
                Emergency Contact
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {member.emergency_contact_name || member.emergency_contact_phone ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Name</label>
                    <div className="flex items-center gap-2">
                      <p className="text-sm">{member.emergency_contact_name || 'Not provided'}</p>
                      {member.emergency_contact_name && (
                        <CopyToClipboard 
                          text={member.emergency_contact_name} 
                          label="Emergency contact name" 
                          size="sm"
                        />
                      )}
                    </div>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Phone</label>
                    <div className="flex items-center gap-2">
                      <p className="text-sm">{member.emergency_contact_phone || 'Not provided'}</p>
                      {member.emergency_contact_phone && (
                        <CopyToClipboard 
                          text={member.emergency_contact_phone} 
                          label="Emergency contact phone" 
                          size="sm"
                        />
                      )}
                    </div>
                  </div>
                  <div className="md:col-span-2">
                    <label className="text-sm font-medium text-muted-foreground">Relationship</label>
                    <p className="text-sm">{member.emergency_contact_relationship || 'Not specified'}</p>
                  </div>
                </div>
              ) : (
                <div className="text-center py-4">
                  <Heart className="h-8 w-8 text-muted-foreground/50 mx-auto mb-2" />
                  <p className="text-sm text-muted-foreground">No emergency contact information</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Right Column */}
        <div className="space-y-6">
          {/* Membership Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CreditCard className="h-5 w-5" />
                Membership Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Membership ID</label>
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-mono">{member.membership_id}</p>
                    <CopyToClipboard 
                      text={member.membership_id} 
                      label="Membership ID" 
                      size="sm"
                    />
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Membership Type</label>
                  <p className="text-sm">{member.membership_type || 'Not specified'}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Status</label>
                  <Badge variant="secondary" className={`${statusDisplay.bg} ${statusDisplay.color}`}>
                     <StatusIcon className="h-3 w-3 mr-1" />
                     {statusDisplay.text}
                   </Badge>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Date Joined</label>
                  <p className="text-sm">
                    {member.date_joined ? format(new Date(member.date_joined), 'MMM d, yyyy') : 'Not provided'}
                  </p>
                </div>
              </div>

              <Separator />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Baptism Date</label>
                  <p className="text-sm">
                    {member.baptism_date ? format(new Date(member.baptism_date), 'MMM d, yyyy') : 'Not provided'}
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Confirmation Date</label>
                  <p className="text-sm">
                    {member.confirmation_date ? format(new Date(member.confirmation_date), 'MMM d, yyyy') : 'Not provided'}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Additional Notes */}
          {member.notes && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  Notes
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm whitespace-pre-wrap">{member.notes}</p>
              </CardContent>
            </Card>
          )}

          {/* Custom Fields */}
          {member.form_data && Object.keys(member.form_data).length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  Additional Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {Object.entries(member.form_data).map(([key, value]) => (
                  <div key={key}>
                    <label className="text-sm font-medium text-muted-foreground capitalize">
                      {key.replace(/_/g, ' ')}
                    </label>
                    <p className="text-sm">{String(value) || 'Not provided'}</p>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          {/* Tags Section */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Tags className="h-5 w-5" />
                Tags
              </CardTitle>
            </CardHeader>
            <CardContent>
              {assignments && assignments.length > 0 ? (
                <div className="space-y-4">
                  {Object.entries(
                    assignments.reduce((acc, assignment) => {
                      const parentName = assignment.tag_item.tag.name || 'Other';
                      if (!acc[parentName]) acc[parentName] = [];
                      acc[parentName].push(assignment);
                      return acc;
                    }, {} as Record<string, typeof assignments>)
                  ).map(([parentName, tagAssignments]) => (
                    <div key={parentName}>
                      <h4 className="text-sm font-medium text-muted-foreground mb-2">
                        {parentName}
                      </h4>
                      <div className="flex flex-wrap gap-2">
                        {tagAssignments.map((assignment) => (
                          <Badge
                            key={assignment.id}
                            variant="secondary"
                            style={{
                              backgroundColor: assignment.tag_item.color + '20',
                              color: assignment.tag_item.color,
                              borderColor: assignment.tag_item.color + '40',
                            }}
                            className="border"
                          >
                            {assignment.tag_item.name}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <Tags className="h-12 w-12 text-muted-foreground/50 mx-auto mb-4" />
                  <p className="text-muted-foreground">No tags assigned to this member</p>
                  <p className="text-sm text-muted-foreground/70 mt-1">
                    Tags can be used to organize and categorize members
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Membership Card Modal */}
      {member && (
        <MembershipCardModal
          isOpen={isCardModalOpen}
          onClose={() => setIsCardModalOpen(false)}
          member={{
            first_name: member.first_name,
            last_name: member.last_name,
            email: member.email,
            membership_id: member.membership_id,
            date_of_birth: member.date_of_birth,
            gender: member.gender,
            profile_image_url: member.profile_image_url,
            date_joined: member.date_joined,
          }}
        />
      )}
    </div>
  );
}