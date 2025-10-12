import { MemberStatusRenderer } from '@/components/shared/MemberStatusRenderer'
import { Separator } from '@/components/ui/separator'
import  { useCallback, useEffect, useRef, useState } from 'react'
import { TagRenderer } from '../tags'
import { Label } from '@/components/ui/label'
import { BranchSelector } from '@/components/shared/BranchSelector'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ArrowLeft, Save, User, X } from 'lucide-react'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { MemberFormWrapper, type MemberFormWrapperMethods } from '@/components/people/forms/MemberFormWrapper'
import { Button } from '@/components/ui/button'
import type { Member } from '@/types'
import { format } from 'date-fns'
import type { RelationalTagWithItems } from '@/hooks/useRelationalTags'
import { useUpdateMember } from '@/hooks/useMemberQueries'
import { useBulkTagOperations } from '@/hooks/useBulkTagOperations'
import { useMemberTagAssignments, type MemberTagAssignment } from '@/hooks/useMemberTagAssignments'
import { useMembershipFormManagement } from '@/hooks/usePeopleConfigurationQueries'
import { useOrganization } from '@/contexts/OrganizationContext'
import { type UpdateMemberData } from '@/types/members'
import { compareTagAssignments } from '@/utils/tagAssignmentUtils'
import { toast } from 'sonner'

interface EditMemberViewProps {
  member: Member;
  tags?: RelationalTagWithItems[];
  onCancel: () => void;
  onUpdateSuccess: () => void;
}

export const EditMemberView = ({ member, tags, onCancel, onUpdateSuccess }: EditMemberViewProps) => {
  const formRef = useRef<MemberFormWrapperMethods>(null);
  const [tagValues, setTagValues] = useState<Record<string, string[]>>({});
  const [tagErrors, setTagErrors] = useState<Record<string, string>>({});
  const [branchId, setBranchId] = useState<string | null>(member?.branch_id || null);
  const [branchError, setBranchError] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Hooks
  const updateMemberMutation = useUpdateMember();
  const { currentOrganization } = useOrganization();
  const { 
    assignments,
    assignmentsByTag
  } = useMemberTagAssignments(member.id);
  const { membershipFormSchema } = useMembershipFormManagement(currentOrganization?.id);
  const { bulkUpdateTags } = useBulkTagOperations();

  // Initialize values when component mounts or member changes
  useEffect(() => {
    setBranchId(member.branch_id || '');
  }, [member.id]);

  // Initialize tag values when assignments change
  useEffect(() => {
    if (assignmentsByTag) {
      const initialTagValues: Record<string, any> = {};
      Object.entries(assignmentsByTag).forEach(([tagId, tagItemIds]) => {
        if (tagItemIds && tagItemIds.length > 0) {
          initialTagValues[tagId] = tagItemIds;
        }
      });
      setTagValues(initialTagValues);
    }
  }, [JSON.stringify(assignmentsByTag)]); // Use JSON.stringify to create a stable dependency

  // Callback handlers for branch and tag changes
  const handleBranchChange = useCallback((value: string | string[] | undefined) => {
    const branchValue = Array.isArray(value) ? value[0] : value;
    setBranchId(branchValue || '');
    setBranchError('');
  }, []);

  const handleTagValueChange = useCallback((tagId: string, value: string | string[]) => {
    // Convert single string to array for consistency
    const arrayValue = Array.isArray(value) ? value : [value];
    setTagValues(prev => ({
      ...prev,
      [tagId]: arrayValue
    }));
    setTagErrors(prev => ({
      ...prev,
      [tagId]: ''
    }));
  }, []);

  const handleUpdate = async () => {
    if (!member || !formRef.current) return;
    
    // Collect all validation errors before returning
    let hasValidationErrors = false;
    const newTagErrors: Record<string, string> = {};

    // Validate branch selection if required
    if (!branchId) {
      setBranchError('Branch selection is required');
      hasValidationErrors = true;
    } else {
      setBranchError('');
    }

    // Validate required tags
    if (tags && membershipFormSchema) {
      tags.forEach(tag => {
        if (tag.is_required && (!tagValues[tag.id] || tagValues[tag.id].length === 0)) {
          newTagErrors[tag.id] = `${tag.name} is required`;
          hasValidationErrors = true;
        }
      });
    }

    // Set tag errors regardless of other validation results
    setTagErrors(newTagErrors);

    // Validate form fields using wrapper
    const validationResult = formRef.current.validateForm();
    if (!validationResult.isValid) {
      hasValidationErrors = true;
    }

    // If there are any validation errors, show message and return
    if (hasValidationErrors) {
      toast.error('Please fix all validation errors in the form.');
      return;
    }
    
    setIsSubmitting(true);
    try {
      // Use wrapper's comprehensive processing method
      const processingResult = await formRef.current.processFormForSubmission('update');
      
      if (!processingResult.isValid) {
        if (processingResult.errors?.defaultFields) {
          toast.error('Please fix all validation errors in the form.');
        }
        if (processingResult.errors?.customFields) {
          toast.error('Please fix all validation errors in custom fields.');
        }
        return;
      }

      if (!processingResult.updateData) {
        toast.error('Failed to process form data');
        return;
      }

      // Add member ID and branch info to the processed data
      const updateData: UpdateMemberData = {
        ...processingResult.updateData,
        id: member.id,
        branch_id: branchId as string,
      };

      // Update member data
      await updateMemberMutation.mutateAsync(updateData);

      // Handle tag assignment changes
      if (assignments) {
        // Transform assignments to the format expected by compareTagAssignments
        const currentAssignments: Record<string, MemberTagAssignment[]> = {};
        assignments.forEach(assignment => {
          const tagId = assignment.tag_item.tag_id;
          if (!currentAssignments[tagId]) {
            currentAssignments[tagId] = [];
          }
          currentAssignments[tagId].push(assignment);
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
      onUpdateSuccess();
    } catch (error) {
      toast.error('Failed to update member');
      console.error('Error updating member:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="container mx-auto max-w-7xl">
        <Button
          variant="ghost"
          size="sm"
          onClick={onCancel}
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
               onClick={onCancel}
               disabled={isSubmitting}
             >
               <X className="h-4 w-4 mr-2" />
               Cancel
             </Button>
             <Button
               onClick={handleUpdate}
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
                <MemberFormWrapper
                  ref={formRef}
                  initialData={{
                    defaultFields: {
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
                    },
                    customFields: member.custom_form_data || {}
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
                <div className="space-y-2">
                  <Label htmlFor="branch-selector">Branch</Label>
                  <BranchSelector
                    variant="single"
                    value={branchId || undefined}
                    onValueChange={handleBranchChange}
                    allowClear={true}
                    placeholder="Select a branch..."
                  />
                  {branchError && <p className="text-sm text-red-500">{branchError}</p>}
                </div>
                <Separator />

                {/* Tag Renderer - Only show in edit mode */}
                {tags && tags.length > 0 && (
                  <>
                    <div className="space-y-4">
                      <Label>Tags & Information</Label>
                      {tags.map((tag) => (
                        <TagRenderer
                          key={tag.id}
                          tag={tag}
                          tagKey={tag.id}
                          value={tagValues[tag.id]}
                          onChange={(value) => handleTagValueChange(tag.id, value)}
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
                      <MemberStatusRenderer status={member.membership_status} />
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
  )
}
