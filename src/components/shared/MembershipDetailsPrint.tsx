import { OrganizationLogo } from '@/components/shared/OrganizationLogo';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import type { MemberTagAssignment } from '@/hooks/useMemberTagAssignments';
import CustomFieldRenderer from '@/modules/internal/custom-field-rendering/components/CustomFieldRenderer';
import type { MemberSummary } from '@/types';
import type { Member } from '@/types/members';
import type { Organization } from '@/types/organizations';
import {
  parseAssignedTags,
  parseTagsWithCategories,
} from '@/utils/tagFormatUtils';
import { useMemberGroupAssignments } from '@/hooks/useGroups';
import { format } from 'date-fns';
import { Mail, Phone } from 'lucide-react';

interface MembershipDetailsPrintProps {
  member: Member | MemberSummary;
  organization: Organization;
  className?: string;
  assignments?: MemberTagAssignment[];
}

export function MembershipDetailsPrint({
  member,
  organization,
  className = '',
  assignments,
}: MembershipDetailsPrintProps) {
  // Group assignments by tag name
  const groupedAssignments =
    assignments?.reduce((acc, assignment) => {
      const tagName = assignment.tag_item.tag.name;
      if (!acc[tagName]) {
        acc[tagName] = [];
      }
      acc[tagName].push(assignment);
      return acc;
    }, {} as Record<string, MemberTagAssignment[]>) || {};

  // Fetch group memberships for the member
  const {
    data: groupAssignments,
    isLoading: isGroupsLoading,
  } = useMemberGroupAssignments(member.id);

  const printDate = format(new Date(), 'PPP');
  const printTime = format(new Date(), 'p');

  return (
    <>
      <div className={`bg-transparent print:bg-white ${className}`}>
        {/* Header Section */}
        <div className="bg-gradient-to-r from-primary to-primary/60 text-primary-foreground mb-6 p-4">
          <div className="flex flex-col md:flex-row justify-between gap-4 md:gap-0">
            <div className="flex items-center space-x-4 flex-wrap">
              <OrganizationLogo
                src={organization.logo}
                fallback={organization.name?.charAt(0) || 'C'}
                size="md"
                className="rounded-lg shadow-lg"
              />
              <div>
                <h1 className="text-xl sm:text-2xl print:text-lg font-bold mb-1 print:mb-1">
                  {organization.name || 'ChurchHub360'}
                </h1>
                <div className="flex items-center space-x-4 mt-2 text-sm opacity-90 print:text-xs print:space-x-2 flex-wrap">
                  {organization.phone && (
                    <span className="flex items-center">
                      <Phone className="h-3 w-3 mr-1 print:h-2 print:w-2" />
                      {organization.phone}
                    </span>
                  )}
                  {organization.email && (
                    <span className="flex items-center">
                      <Mail className="h-3 w-3 mr-1 print:h-2 print:w-2" />
                      {organization.email}
                    </span>
                  )}
                </div>
              </div>
            </div>

            <div className="text-left md:text-right py-2">
              <p className="text-xs opacity-90">Date: {printDate}</p>
            </div>
          </div>
        </div>

        <div className="print:px-2">
          {/* Member Profile Section */}
          <div className="mb-8">
            <div className="flex flex-col lg:flex-row gap-8 print:grid print:grid-cols-2">
              {/* Profile Card */}
              <div className="lg:w-1/3 print:col-span-1">
                <div className="bg-gray-100 dark:bg-neutral-800/50 py-4 px-6 flex flex-col items-center border rounded-lg ">
                  <Avatar className="h-28 w-28 sm:h-32 sm:w-32 md:h-40 md:w-40 mx-auto mb-4 rounded-2xl">
                    <AvatarImage src={member.profile_image_url || undefined} />
                    <AvatarFallback className="text-2xl font-bold bg-emerald-50 text-emerald-700">
                      {member.first_name?.[0]}
                      {member.last_name?.[0]}
                    </AvatarFallback>
                  </Avatar>

                  <h2 className="text-xl sm:text-2xl font-bold mb-2 text-gray-900 dark:text-gray-300">
                    {member.first_name} {member.middle_name} {member.last_name}
                  </h2>

                  <div className="flex gap-2 flex-wrap">
                    <div className="flex gap-2 flex-wrap">
                      <span>
                        Member ID: {member.membership_id || 'Not assigned'}
                      </span>
                    </div>

                    {/* <MemberStatusRenderer status={member.membership_status} /> */}
                    <span className="bg-primary text-primary-foreground px-2 py-[2px] rounded-full text-xs flex items-center justify-center">
                      {member.membership_type || 'Not specified'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Personal Information */}
              <div className="flex-1 print:col-span-1">
                <h3 className="text-xl font-bold mb-2 bg-neutral-100 dark:bg-neutral-800/50 px-2 py-1 print:text-lg">
                  Personal Information
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 print:gap-2">
                  <div className="space-y-4 print:space-y-2">
                    <div>
                      <label className="text-sm font-medium text-gray-500 print:text-xs">
                        Date of Birth
                      </label>
                      <p className="text-gray-900 dark:text-gray-300 mt-1 print:text-xs print:mt-0">
                        {member.date_of_birth
                          ? format(new Date(member.date_of_birth), 'PPP')
                          : 'Not provided'}
                      </p>
                    </div>

                    <div>
                      <label className="text-sm font-medium text-gray-500 print:text-xs">
                        Gender
                      </label>
                      <p className="text-gray-900 dark:text-gray-300 uppercase mt-1 print:text-xs print:mt-0">
                        {member.gender || 'Not specified'}
                      </p>
                    </div>

                    <div>
                      <label className="text-sm font-medium text-gray-500 print:text-xs">
                        Marital Status
                      </label>
                      <p className="text-gray-900 dark:text-gray-300 uppercase mt-1 print:text-xs print:mt-0">
                        {'marital_status' in member
                          ? member.marital_status || 'Not specified'
                          : 'Not specified'}
                      </p>
                    </div>

                    {'confirmation_date' in member && member.confirmation_date && (
                      <div>
                        <label className="text-sm font-medium text-gray-500 print:text-xs">
                          Confirmation Date
                        </label>
                        <p className="text-gray-900 dark:text-gray-300 mt-1 print:text-xs print:mt-0">
                          {format(new Date(member.confirmation_date), 'PPP')}
                        </p>
                      </div>
                    )}
                  </div>

                  <div className="space-y-4 print:space-y-2">
                    <div>
                      <label className="text-sm font-medium text-gray-500 print:text-xs">
                        Phone
                      </label>
                      <p className="text-gray-900 dark:text-gray-300 mt-1 print:text-xs print:mt-0">
                        {member.phone || 'Not provided'}
                      </p>
                    </div>

                    <div>
                      <label className="text-sm font-medium text-gray-500 print:text-xs">
                        Email
                      </label>
                      <p className="text-gray-900 dark:text-gray-300 mt-1 print:text-xs print:mt-0">
                        {member.email || 'Not provided'}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Address and Membership Details */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8 print:gap-4 print:mb-4 print:grid-cols-2">
            {/* Address Information */}
            {(member.address_line_1 ||
              member.address_line_2 ||
              member.city ||
              member.state ||
              member.postal_code ||
              member.country) && (
              <div>
                <h3 className="text-xl font-bold mb-2 bg-neutral-100 dark:bg-neutral-800/50 px-2 py-1 print:text-lg">
                  Address Information
                </h3>

                <div className="space-y-2 text-gray-900 dark:text-gray-300 print:space-y-1 print:text-xs">
                  {member.address_line_1 && (
                    <div>
                      <label className="text-sm font-medium text-gray-500 print:text-xs">
                        Address 1
                      </label>
                      <p>{member.address_line_1}</p>
                    </div>
                  )}
                  {member.address_line_2 && (
                    <div>
                      <label className="text-sm font-medium text-gray-500 print:text-xs">
                        Address 2
                      </label>
                      <p>{member.address_line_2}</p>
                    </div>
                  )}
                  {member.city && (
                    <div>
                      <label className="text-sm font-medium text-gray-500 print:text-xs">
                        City
                      </label>
                      <p>{member.city}</p>
                    </div>
                  )}
                  {member.state && (
                    <div>
                      <label className="text-sm font-medium text-gray-500 print:text-xs">
                        State/Region
                      </label>
                      <p>{member.state}</p>
                    </div>
                  )}
                  {member.postal_code && (
                    <div>
                      <label className="text-sm font-medium text-gray-500 print:text-xs">
                        Postal Code
                      </label>
                      <p>{member.postal_code}</p>
                    </div>
                  )}
                  {member.country && (
                    <div>
                      <label className="text-sm font-medium text-gray-500 print:text-xs">
                        Country
                      </label>
                      <p>{member.country}</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Membership Details */}
            <div>
              <h3 className="text-xl font-bold mb-2 bg-neutral-100 dark:bg-neutral-800/50 px-2 py-1 print:text-lg">
                Membership Details
              </h3>

              <div className="space-y-4 text-gray-900 dark:text-gray-300 print:space-y-2">
                <div>
                  <label className="text-sm font-medium text-gray-500 print:text-xs">
                    Join Date
                  </label>
                  <p className="mt-1 print:text-xs print:mt-0">
                    {member.date_joined
                      ? format(new Date(member.date_joined), 'PPP')
                      : 'Not provided'}
                  </p>
                </div>

                {'baptism_date' in member && member.baptism_date && (
                  <div>
                    <label className="text-sm font-medium text-gray-500 print:text-xs">
                      Baptism Date
                    </label>
                    <p className="flex items-center mt-1 print:text-xs print:mt-0">
                      {format(new Date(member.baptism_date), 'PPP')}
                    </p>
                  </div>
                )}

                <div>
                  <label className="text-sm font-medium text-gray-500 print:text-xs">
                    Member Since
                  </label>
                  <p className="mt-1 print:text-xs print:mt-0">
                    {member.date_joined
                      ? `${Math.floor(
                          (new Date().getTime() -
                            new Date(member.date_joined).getTime()) /
                            (1000 * 60 * 60 * 24 * 365.25)
                        )} years`
                      : 'Unknown'}
                  </p>
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-500 print:text-xs">
                    Active Status
                  </label>
                  <p className="mt-1 print:text-xs print:mt-0">
                    {member.is_active ? 'Yes' : 'No'}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Emergency Contact */}
          {'emergency_contact_name' in member &&
            (member.emergency_contact_name ||
              member.emergency_contact_phone ||
              member.emergency_contact_relationship) && (
              <div className="mb-8">
                <h3 className="text-xl font-bold mb-2 bg-neutral-100 dark:bg-neutral-800/50 px-2 py-1 print:text-lg">
                  Emergency Contact
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-gray-900 dark:text-gray-300 print:gap-3 print:grid-cols-3">
                  <div>
                    <label className="text-sm font-medium text-gray-500 print:text-xs">
                      Name
                    </label>
                    <p className=" mt-1 print:text-xs print:mt-0">
                      {member.emergency_contact_name || 'Not provided'}
                    </p>
                  </div>

                  <div>
                    <label className="text-sm font-medium text-gray-500 print:text-xs">
                      Relationship
                    </label>
                    <p className=" mt-1 print:text-xs print:mt-0">
                      {member.emergency_contact_relationship || 'Not specified'}
                    </p>
                  </div>

                  <div>
                    <label className="text-sm font-medium text-gray-500 print:text-xs">
                      Phone
                    </label>
                    <p className=" mt-1 print:text-xs print:mt-0">
                      {member.emergency_contact_phone || 'Not provided'}
                    </p>
                  </div>
                </div>
              </div>
            )}

          {/* Tags Section */}
          {(assignments && assignments.length > 0) ||
          ('assigned_tags' in member &&
            (member.assigned_tags || member.tags_with_categories)) ? (
            <div className="mb-8">
              <h3 className="text-xl font-bold mb-2 bg-neutral-100 dark:bg-neutral-800/50 px-2 py-1 print:text-lg">
                Tags & Categories
              </h3>

              {/* Display assignments-based tags (existing format) */}
              {assignments && assignments.length > 0 && (
                <div className="space-y-4 grid grid-cols-1 md:grid-cols-3 print:space-y-2 print:grid print:grid-cols-3">
                  {Object.entries(groupedAssignments).map(
                    ([tagName, tagAssignments]) => (
                      <div key={tagName}>
                        <h4 className="font-medium text-gray-500 mb-2 print:text-sm print:mb-1">
                          {tagName}
                        </h4>
                        <div className="flex flex-wrap gap-2 print:gap-1">
                          {tagAssignments.map((assignment) => (
                            <span
                              key={assignment.id}
                              className="px-3 py-1 rounded-full text-xs font-medium border print:px-2 print:py-0.5 print:text-xs"
                              style={{
                                backgroundColor:
                                  assignment.tag_item.color + '20',
                                color: assignment.tag_item.color,
                                borderColor: assignment.tag_item.color + '40',
                              }}
                            >
                              {assignment.tag_item.name}
                            </span>
                          ))}
                        </div>
                      </div>
                    )
                  )}
                </div>
              )}

              {/* Display string-based tags (members_summary format) */}
              {'assigned_tags' in member &&
                (!assignments || assignments.length === 0) &&
                (member.assigned_tags || member.tags_with_categories) && (
                  <div className="space-y-4 print:space-y-2">
                    {/* Tags with categories */}
                    {member.tags_with_categories && (
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 print:gap-2 print:grid-cols-3">
                        {Object.entries(
                          parseTagsWithCategories(member.tags_with_categories)
                        ).map(([category, tags]) => (
                          <div key={category}>
                            <h5 className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1 print:text-xs">
                              {category}
                            </h5>
                            <div className="flex flex-wrap gap-1">
                              {tags.map((tag, index) => (
                                <span
                                  key={`${category}-${tag}-${index}`}
                                  className="px-2 py-1 rounded-full text-xs font-medium bg-primary/10 text-primary border border-primary/20 print:px-1 print:py-0.5 print:text-xs"
                                >
                                  {tag}
                                </span>
                              ))}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* All assigned tags (fallback if no categories) */}
                    {member.assigned_tags && !member.tags_with_categories && (
                      <div>
                        <h4 className="font-medium text-gray-500 mb-2 print:text-sm print:mb-1">
                          Assigned Tags
                        </h4>
                        <div className="flex flex-wrap gap-2 print:gap-1">
                          {parseAssignedTags(member.assigned_tags).map(
                            (tag, index) => (
                              <span
                                key={`${tag}-${index}`}
                                className="px-3 py-1 rounded-full text-xs font-medium bg-primary/10 text-primary border border-primary/20 print:px-2 print:py-0.5 print:text-xs"
                              >
                                {tag}
                              </span>
                            )
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                )}
            </div>
          ) : null}

          {/* Groups Section */}
          <div className="mb-8">
            <h3 className="text-xl font-bold mb-2 bg-neutral-100 dark:bg-neutral-800/50 px-2 py-1 print:text-lg">
              Groups
            </h3>

            {isGroupsLoading ? (
              <p className="text-sm text-gray-500 print:text-xs">
                Loading groups…
              </p>
            ) : groupAssignments && groupAssignments.length > 0 ? (
              <div className="flex flex-wrap gap-2 print:gap-1">
                {groupAssignments.map((g) => (
                  <span
                    key={`${g.group_id}-${g.member_id}-${
                      g.assigned_at ?? g.assignment_id ?? g.id ?? Math.random()
                    }`}
                    className="px-3 py-1 rounded-full text-xs font-medium  bg-secondary text-secondary-foreground [a&]:hover:bg-secondary/90 border border-primary/20 print:px-2 print:py-0.5 print:text-xs"
                  >
                    {g.group_name || 'Unnamed Group'}
                    {g.position ? ` — ${g.position}` : ''}
                  </span>
                ))}
              </div>
            ) : (
              <p className="text-gray-500 print:text-xs">No groups assigned</p>
            )}
          </div>

          {/* Additional Information (Form Data) */}
          {'custom_form_data' in member &&
            member.custom_form_data &&
            Object.keys(member.custom_form_data).length > 0 && (
              <div className="mb-8">
                <CustomFieldRenderer
                  formData={member.custom_form_data}
                  className="w-full print:mb-4"
                  printMode={true}
                />
              </div>
            )}

          

          {/* Footer */}
          <Separator className="my-8 print:my-4" />

          <div className="text-center text-sm text-gray-500 print:text-xs">
            <p>
              {printDate} - {printTime}
            </p>
            <p className="mb-2 print:mb-1">
              {organization.name || 'ChurchHub360'}
            </p>
            <p>For enquiries, please contact the church administration.</p>
          </div>
        </div>
      </div>
    </>
  );
}
