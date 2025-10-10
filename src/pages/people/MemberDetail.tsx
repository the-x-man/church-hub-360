import { EditMemberView } from '@/components/people/members/EditMemberView';
import { CopyToClipboard } from '@/components/shared/CopyToClipboard';
import { MemberSearchTypeahead } from '@/components/shared/MemberSearchTypeahead';
import { MembershipCardModal } from '@/components/shared/MembershipCardModal';
import { MembershipDetailsPrintModal } from '@/components/shared/MembershipDetailsPrintModal';
import { MemberStatusRenderer } from '@/components/shared/MemberStatusRenderer';
import { TemplateSelectionDrawer } from '@/components/shared/TemplateSelectionDrawer';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import { useOrganization } from '@/contexts/OrganizationContext';
import { useMember } from '@/hooks/useMemberQueries';
import { useMemberTagAssignments } from '@/hooks/useMemberTagAssignments';
import type { MemberTagAssignment } from '@/hooks/useMemberTagAssignments';
import { type MemberSearchResult } from '@/hooks/useMemberSearch';
import { useRelationalTags } from '@/hooks/useRelationalTags';
import { useTemplateSelection } from '@/hooks/useTemplateSelection';
import { format } from 'date-fns';
import {
  AlertCircle,
  ArrowLeft,
  Calendar,
  CreditCard,
  Edit,
  FileText,
  Heart,
  IdCard,
  MailIcon,
  Phone,
  Printer,
  Tags,
  User
} from 'lucide-react';
import { useCallback, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';

export function MemberDetail() {
  const { memberId } = useParams<{ memberId: string }>();
  const navigate = useNavigate();
  const [isEditing, setIsEditing] = useState(false);

  // State for modals and drawers
  const [isCardModalOpen, setIsCardModalOpen] = useState(false);
  const [isPrintModalOpen, setIsPrintModalOpen] = useState(false);
  const [isTemplateDrawerOpen, setIsTemplateDrawerOpen] = useState(false);

  // Fetch member data
  const { data: member, isLoading, error } = useMember(memberId!);
  const { currentOrganization } = useOrganization();
  
  // Fetch tag assignments and related data
  const { assignments } = useMemberTagAssignments(memberId!);
  const { tags } = useRelationalTags();
  const { selectTemplate } = useTemplateSelection();

  const handleEditToggle = () => {
    setIsEditing(!isEditing);
  };

  // Handle member search selection
  const handleMemberSearchSelect = useCallback((members: MemberSearchResult[]) => {
    if (members.length > 0) {
      const selectedMember = members[0]; // Single select mode
      // Navigate to the selected member's detail page
      navigate(`/people/membership/${selectedMember.id}`);
    }
  }, [navigate]);

  // Handle print member details
  const handlePrintDetails = () => {
    setIsPrintModalOpen(true);
  };

  // Handle print membership card
  const handlePrintCard = () => {
    setIsCardModalOpen(true);
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
        <div className="mb-6">
          <div className="flex items-center justify-between gap-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate('/people/membership')}
              className="flex items-center gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to Members
            </Button>
            
            {/* Member Search */}
            <div className="w-full max-w-md">
              <MemberSearchTypeahead
                organizationId={currentOrganization?.id || ''}
                placeholder="Search for another member..."
                multiSelect={false}
                onChange={handleMemberSearchSelect}
                className="w-full"
              />
            </div>
          </div>
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



  // Edit mode
  if (isEditing) {
    return (
      <EditMemberView
        member={member}
        tags={tags}
        onCancel={() => setIsEditing(false)}
        onUpdateSuccess={() => setIsEditing(false)}
      />
    );
  }

  return (
    <div className="container mx-auto py-8 max-w-6xl">
      {/* Back Button */}
      <div className="mb-6">
        <div className="flex items-center justify-between gap-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate('/people/membership')}
            className="flex items-center gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Members
          </Button>
          
          {/* Member Search */}
          <div className="w-full max-w-md">
            <MemberSearchTypeahead
              organizationId={currentOrganization?.id || ''}
              placeholder="Search for a member..."
              multiSelect={false}
              onChange={handleMemberSearchSelect}
              className="w-full"
            />
          </div>
        </div>
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
                  <div className="flex items-center gap-2">
                    <p className="text-muted-foreground">
                      Member ID: {member.membership_id}
                    </p>
                    <CopyToClipboard 
                      text={member.membership_id} 
                      label="Member ID" 
                      size="sm"
                    />
                  </div>
                  <MemberStatusRenderer status={member.membership_status} />
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
              <div className='flex items-center gap-[2px]'>
              <Button
                variant="outline"
                size="sm"
                onClick={handlePrintCard}
                className="flex items-center gap-2 flex-1"
              >
                <CreditCard className="h-4 w-4" />
                Print Card
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsTemplateDrawerOpen(true)}
                className="flex items-center gap-2"
                title="Open card templates"
              >
                <IdCard className="h-4 w-4" />
              </Button>
              </div>
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
                  <MemberStatusRenderer status={member.membership_status} />
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
                    assignments.reduce((acc: Record<string, MemberTagAssignment[]>, assignment: MemberTagAssignment) => {
                      const parentName = assignment.tag_item.tag.name || 'Other';
                      if (!acc[parentName]) acc[parentName] = [];
                      acc[parentName].push(assignment);
                      return acc;
                    }, {})
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

      {/* Membership Details Print Modal */}
      {member && (
        <MembershipDetailsPrintModal
          isOpen={isPrintModalOpen}
          onClose={() => setIsPrintModalOpen(false)}
          member={member}
          organization={currentOrganization!}
          assignments={assignments}
        />
      )}

      {/* Template Selection Drawer */}
      {member && (
        <TemplateSelectionDrawer
          isOpen={isTemplateDrawerOpen}
          onClose={() => setIsTemplateDrawerOpen(false)}
          onTemplateSelect={(templateId) => {
            selectTemplate(templateId);
            setIsTemplateDrawerOpen(false);
          }}
        />
      )}
    </div>
  );
}