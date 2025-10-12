import { useState, useRef } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { FileText, CreditCard, X } from 'lucide-react';
import PrintMemberDetails from './PrintMemberDetails';
import PrintMembershipCard from './PrintMembershipCard';
import PrintActions from './PrintActions';
import { useOrganization } from '@/contexts/OrganizationContext';
import type { Member } from '@/types/members';
import type { MemberSummary } from '@/types';

interface PrintMemberModalProps {
  member: MemberSummary | Member;
  isOpen: boolean;
  onClose: () => void;
}

export function PrintMemberModal({
  member,
  isOpen,
  onClose,
}: PrintMemberModalProps) {
  const { currentOrganization } = useOrganization();
  const [activeTab, setActiveTab] = useState<'details' | 'card'>('details');
  const memberDetailsRef = useRef<HTMLDivElement>(null);
  const membershipCardRef = useRef<HTMLDivElement>(null);

  if (!currentOrganization) {
    return null;
  }

  // Convert MemberSummary to Member format for print components
  const memberForPrint: Member = {
    id: member.id,
    organization_id: currentOrganization.id,
    branch_id: 'branch_id' in member ? member.branch_id : null,
    first_name: member.first_name,
    last_name: member.last_name,
    middle_name: 'middle_name' in member ? member.middle_name : null,
    email: member.email,
    phone: member.phone,
    date_of_birth: member.date_of_birth,
    gender: member.gender,
    marital_status: null,
    address_line_1: null,
    address_line_2: null,
    city: null,
    state: null,
    postal_code: null,
    country: null,
    profile_image_url: member.profile_image_url,
    membership_id: member.membership_id,
    membership_type: member.membership_type,
    membership_status: member.membership_status,
    date_joined: member.date_joined,
    baptism_date: null,
    confirmation_date: null,
    is_active: member.is_active,
    emergency_contact_name: null,
    emergency_contact_phone: null,
    emergency_contact_relationship: null,
    custom_form_data: {},
    notes: null,
    created_at:
      'created_at' in member ? member.created_at : new Date().toISOString(),
    updated_at:
      'updated_at' in member ? member.updated_at : new Date().toISOString(),
    created_by: null,
    last_updated_by: null,
  };

  const organizationForPrint = {
    id: currentOrganization.id,
    name: currentOrganization.name,
    email: currentOrganization.email,
    phone: currentOrganization.phone,
    logo: currentOrganization.logo,
    address: currentOrganization.address,
    brand_colors: currentOrganization.brand_colors,
    created_at: currentOrganization.created_at,
    updated_at: currentOrganization.updated_at,
    currency: currentOrganization.currency || 'GHS',
    logo_settings: currentOrganization.logo_settings,
    notification_settings: currentOrganization.notification_settings,
    theme_name: currentOrganization.theme_name,
    is_active: currentOrganization.is_active,
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="w-full sm:max-w-7xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader className="flex-shrink-0">
          <div className="flex items-center justify-between">
            <div>
              <DialogTitle className="flex items-center gap-2">
                Print Options for {member.first_name} {member.last_name}
              </DialogTitle>
              <DialogDescription>
                Choose what you'd like to print or download for this member.
              </DialogDescription>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="h-8 w-8 p-0"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </DialogHeader>

        <div className="flex-1 overflow-hidden">
          <Tabs
            value={activeTab}
            onValueChange={(value) => setActiveTab(value as 'details' | 'card')}
            className="h-full flex flex-col"
          >
            <TabsList className="grid w-full grid-cols-2 flex-shrink-0">
              <TabsTrigger value="details" className="flex items-center gap-2">
                <FileText className="h-4 w-4" />
                Member Details
              </TabsTrigger>
              <TabsTrigger value="card" className="flex items-center gap-2">
                <CreditCard className="h-4 w-4" />
                Membership Card
              </TabsTrigger>
            </TabsList>

            <div className="flex-1 overflow-hidden mt-4">
              <TabsContent value="details" className="h-full m-0">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 h-full">
                  {/* Preview */}
                  <div className="lg:col-span-2 overflow-auto">
                    <Card>
                      <CardContent className="p-4">
                        <div className="mb-4 flex items-center justify-between">
                          <Badge variant="outline">Preview</Badge>
                          <PrintActions
                            targetRef={memberDetailsRef}
                            fileName={`${member.first_name}_${member.last_name}_Details`}
                          />
                        </div>
                        <div
                          ref={memberDetailsRef}
                          id="print-member-details"
                          className="scale-75 origin-top-left transform"
                        >
                          <PrintMemberDetails
                            member={memberForPrint}
                            organization={organizationForPrint}
                          />
                        </div>
                      </CardContent>
                    </Card>
                  </div>

                  {/* Options */}
                  <div className="space-y-4">
                    <Card>
                      <CardContent className="p-4">
                        <h3 className="font-semibold mb-3">Print Options</h3>
                        <div className="space-y-3">
                          <div className="text-sm text-muted-foreground">
                            <p className="font-medium mb-1">What's included:</p>
                            <ul className="list-disc list-inside space-y-1 text-xs">
                              <li>Complete member profile</li>
                              <li>Contact information</li>
                              <li>Address details</li>
                              <li>Emergency contacts</li>
                              <li>Membership information</li>
                              <li>Important dates</li>
                            </ul>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="card" className="h-full m-0">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 h-full">
                  {/* Preview */}
                  <div className="lg:col-span-2 overflow-auto">
                    <Card>
                      <CardContent className="p-4">
                        <div className="mb-4 flex items-center justify-between">
                          <Badge variant="outline">Preview</Badge>
                          <PrintActions
                            targetRef={membershipCardRef}
                            fileName={`${member.first_name}_${member.last_name}_MembershipCard`}
                          />
                        </div>
                        <div
                          ref={membershipCardRef}
                          id="print-membership-card"
                          className="flex justify-center"
                        >
                          <PrintMembershipCard
                            member={memberForPrint}
                            organization={organizationForPrint}
                          />
                        </div>
                      </CardContent>
                    </Card>
                  </div>

                  {/* Options */}
                  <div className="space-y-4">
                    <Card>
                      <CardContent className="p-4">
                        <h3 className="font-semibold mb-3">Card Options</h3>
                        <div className="space-y-3">
                          <div className="text-sm text-muted-foreground">
                            <p className="font-medium mb-1">What's included:</p>
                            <ul className="list-disc list-inside space-y-1 text-xs">
                              <li>Member photo & name</li>
                              <li>Membership ID</li>
                              <li>Contact information</li>
                              <li>Key dates</li>
                              <li>Organization branding</li>
                              <li>QR code (placeholder)</li>
                            </ul>
                          </div>
                          <div className="text-xs text-muted-foreground p-2 bg-muted rounded">
                            <p className="font-medium">💡 Tip:</p>
                            <p>
                              Print on cardstock for best results. Standard
                              credit card size.
                            </p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                </div>
              </TabsContent>
            </div>
          </Tabs>
        </div>
      </DialogContent>
    </Dialog>
  );
}
