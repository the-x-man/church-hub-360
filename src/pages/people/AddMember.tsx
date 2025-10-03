import type { DefaultMembershipFormData } from '@/components/people/configurations/DefaultMembershipForm';
import { DefaultMembershipForm, type DefaultMembershipFormMethods } from '@/components/people/configurations/DefaultMembershipForm';
import { CustomFieldsRenderer } from '@/components/people/configurations/CustomFieldsRenderer';
import { TagRenderer } from '@/components/people/configurations/TagRenderer';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useOrganization } from '@/contexts/OrganizationContext';
import { useCreateMember } from '@/hooks/useMemberQueries';
import { useMembershipFormManagement, useTagsManagement } from '@/hooks/usePeopleConfigurationQueries';
import type { CreateMemberData } from '@/types/members';
import { ArrowLeft, Save, X, Tags } from 'lucide-react';
import { useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { BranchSelector } from '@/components/shared/BranchSelector';
import { Label } from '@/components/ui/label';

export function AddMember() {
  const navigate = useNavigate();
  const { currentOrganization } = useOrganization();
  const formRef = useRef<DefaultMembershipFormMethods>(null);
  
  const [formData, setFormData] = useState<DefaultMembershipFormData | null>(null);
  const [customFieldValues, setCustomFieldValues] = useState<Record<string, any>>({});
  const [tagValues, setTagValues] = useState<Record<string, any>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [branchId, setBranchId] = useState<string | string[]>('');
  const [branchError, setBranchError] = useState<string>('');
  
  const createMemberMutation = useCreateMember();
  const { membershipFormSchema } = useMembershipFormManagement(currentOrganization?.id);
  const { tagsSchema } = useTagsManagement(currentOrganization?.id);
  
  const organizationId = currentOrganization?.id;

  useEffect(() => {
    setBranchError('');
  }, [branchId]);

  

  const handleFormDataChange = useCallback((data: DefaultMembershipFormData) => {
    console.log("trigger onChange");
    setFormData(data);
  }, []);

  const handleCustomFieldChange = useCallback((values: Record<string, any>) => {
    setCustomFieldValues(values);
  }, []);

  const handleTagChange = useCallback((categoryKey: string, value: any) => {
    setTagValues(prev => ({
      ...prev,
      [categoryKey]: value
    }));
  }, []);

  const handleSave = async () => {
    if (!formData || !organizationId) {
      toast.error('Please fill in the required fields');
      return;
    }

    // Validate branch selection
    if (!branchId || (typeof branchId === 'string' && branchId.trim() === '')) {
      setBranchError('Please select a branch');
    }

    // Validate the form
    const validationResult = formRef.current?.validateForm();
    if (!validationResult || !validationResult.isValid || !branchId || (typeof branchId === 'string' && branchId.trim() === '')) {
      toast.error('Please fix the validation errors');
      return;
    }

    setIsSubmitting(true);
    
    try {
      // Convert DefaultMembershipFormData to CreateMemberData
      const createData: CreateMemberData = {
        organization_id: organizationId,
        branch_id: branchId as string,
        first_name: formData.first_name,
        middle_name: formData.middle_name || undefined,
        last_name: formData.last_name,
        date_of_birth: formData.date_of_birth ? formData.date_of_birth.toISOString().split('T')[0] : undefined,
        gender: formData.gender || undefined,
        marital_status: formData.marital_status || undefined,
        phone: formData.phone || undefined,
        email: formData.email || undefined,
        address_line_1: formData.address_line_1 || undefined,
        address_line_2: formData.address_line_2 || undefined,
        city: formData.city || undefined,
        state: formData.state || undefined,
        postal_code: formData.postal_code || undefined,
        country: formData.country || undefined,
        membership_id: formData.membership_id || undefined,
        date_joined: formData.date_joined ? formData.date_joined.toISOString().split('T')[0] : undefined,
        baptism_date: formData.baptism_date ? formData.baptism_date.toISOString().split('T')[0] : undefined,
        notes: formData.notes || undefined,
        profile_image_url: formData.profile_image_url || undefined,
        form_data: Object.keys(customFieldValues).length > 0 || Object.keys(tagValues).length > 0 
          ? { 
              ...customFieldValues, 
              tags: tagValues 
            } 
          : undefined,
      };

      await createMemberMutation.mutateAsync(createData);
      toast.success('Member added successfully');
      navigate('/people/membership');
    } catch (error) {
      toast.error('Failed to add member');
      console.error('Error creating member:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    navigate('/people/membership');
  };

  const handleReset = () => {
    formRef.current?.resetForm();
    setFormData(null);
    setCustomFieldValues({});
    setTagValues({});
  };

  return (
    <div className="container mx-auto max-w-7xl">
       <Button
          variant="ghost"
          size="sm"
          onClick={handleCancel}
          className="flex items-center gap-2 mb-2"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Membership
      </Button>
      {/* Header */}
      <div className="flex items-center justify-between mb-6 bg-neutral-100 dark:bg-neutral-800/50 px-4 py-2 rounded-md border">
        <div className="flex items-center gap-4">
          <div>
            <h1 className="text-2xl font-bold">Add New Member</h1>
            <p className="text-muted-foreground">
              Fill in the member information below
            </p>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            onClick={handleReset}
            disabled={isSubmitting}
          >
            <X className="h-4 w-4 mr-2" />
            Reset
          </Button>
          <Button
            onClick={handleSave}
            disabled={isSubmitting || !formData}
          >
            <Save className="h-4 w-4 mr-2" />
            {isSubmitting ? 'Saving...' : 'Save Member'}
          </Button>
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Form Section - Left Side */}
        <div className="lg:col-span-2">
          <Card>
            <CardContent>
             
              <DefaultMembershipForm
                ref={formRef}
                onFormDataChange={handleFormDataChange}
              />

              {/* Custom Fields from Membership Form Schema */}
              {membershipFormSchema && (
                <CustomFieldsRenderer
                  schema={membershipFormSchema}
                  isPreviewMode={false}
                  values={customFieldValues}
                  onValuesChange={handleCustomFieldChange}
                />
              )}

              <div className='flex justify-end pt-4'>
                <Button
                  onClick={handleSave}
                  disabled={isSubmitting || !formData}
                >
                  <Save className="h-4 w-4 mr-2" />
                  {isSubmitting ? 'Saving...' : 'Save Member'}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Tags Section - Right Sidebar */}
        <div className="lg:col-span-1">
          <Card>
            <div className='px-4 py-2'>
              <Label className='mb-1'>Branch</Label>
              <BranchSelector 
                variant="single" 
                value={typeof branchId === 'string' ? branchId : undefined}
                onValueChange={(value) => setBranchId(value || '')} 
                allowClear={true}
                placeholder="Select a branch..."
              />
              {branchError && <p className="text-sm text-red-500">{branchError}</p>}
            </div>

            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Tags className="h-5 w-5" />
                Tags
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
               {tagsSchema && Object.keys(tagsSchema.categories).length > 0 ? (
                 Object.entries(tagsSchema.categories)
                   .sort(([, a], [, b]) => (a.display_order ?? 999) - (b.display_order ?? 999))
                   .map(([categoryKey, category]) => (
                     <TagRenderer
                       key={categoryKey}
                       category={{ ...category, id: categoryKey }}
                       categoryKey={categoryKey}
                       value={tagValues[categoryKey]}
                       onChange={(value) => handleTagChange(categoryKey, value)}
                     />
                   ))
               ) : (
                 <div className="text-sm text-muted-foreground">
                   No tag categories configured
                 </div>
               )}
             </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}