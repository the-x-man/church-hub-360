import { forwardRef } from 'react';
import type { Group } from '@/hooks/useGroups';

interface GroupMember {
  id: string;
  member_id: string;
  member_full_name: string;
  member_email: string | null;
  member_phone: string | null;
  position: string | null;
  assigned_at: string;
}

interface GroupMembersPrintViewProps {
  group: Group;
  members: GroupMember[];
  organizationName?: string;
  branchName?: string;
}

export const GroupMembersPrintView = forwardRef<
  HTMLDivElement,
  GroupMembersPrintViewProps
>(({ group, members, organizationName, branchName }, ref) => {
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  return (
    <div ref={ref} className="bg-white text-black p-8 print:p-0">
      {/* Header */}
      <div className="text-center mb-8">
        {organizationName && (
          <h1 className="text-xl font-bold mb-2">{organizationName}</h1>
        )}
        {branchName && (
          <h2 className="text-xl text-gray-600 mb-4">{branchName}</h2>
        )}
        <h3 className="text-lg font-semibold mb-4">{group.name}</h3>
        {group.description && (
          <p className="text-gray-500 mb-4">{group.description}</p>
        )}
        <div className="flex justify-center gap-8 text-sm text-gray-500">
          {group.start_date && (
            <div>
              <strong>Start Date:</strong> {formatDate(group.start_date)}
            </div>
          )}
          {group.end_date && (
            <div>
              <strong>End Date:</strong> {formatDate(group.end_date)}
            </div>
          )}
          <div>
            <strong>Total Members:</strong> {members.length}
          </div>
        </div>
      </div>

      {/* Members Table */}
      <div className="mb-8">
        <table className="w-full border-collapse border border-gray-300">
          <thead>
            <tr className="bg-gray-100">
              <th className="border border-gray-300 px-4 py-3 text-left font-semibold">
                #
              </th>
              <th className="border border-gray-300 px-4 py-3 text-left font-semibold">
                Member Name
              </th>
              <th className="border border-gray-300 px-4 py-3 text-left font-semibold">
                Contact Information
              </th>
              <th className="border border-gray-300 px-4 py-3 text-left font-semibold">
                Position/Role
              </th>
              <th className="border border-gray-300 px-4 py-3 text-left font-semibold">
                Date Assigned
              </th>
            </tr>
          </thead>
          <tbody>
            {members.length === 0 ? (
              <tr>
                <td
                  colSpan={5}
                  className="border border-gray-300 px-4 py-8 text-center text-gray-500"
                >
                  No members assigned to this group
                </td>
              </tr>
            ) : (
              members.map((member, index) => (
                <tr key={member.id} className="hover:bg-gray-50">
                  <td className="border border-gray-300 px-4 py-3">
                    {index + 1}
                  </td>
                  <td className="border border-gray-300 px-4 py-3 font-medium">
                    {member.member_full_name}
                  </td>
                  <td className="border border-gray-300 px-4 py-3">
                    <div className="space-y-1">
                      {member.member_email && (
                        <div className="text-sm">
                          <span className="font-medium">Email:</span>{' '}
                          {member.member_email}
                        </div>
                      )}
                      {member.member_phone && (
                        <div className="text-sm">
                          <span className="font-medium">Phone:</span>{' '}
                          {member.member_phone}
                        </div>
                      )}
                      {!member.member_email && !member.member_phone && (
                        <div className="text-sm text-gray-500">
                          No contact info
                        </div>
                      )}
                    </div>
                  </td>
                  <td className="border border-gray-300 px-4 py-3">
                    {member.position || 'Member'}
                  </td>
                  <td className="border border-gray-300 px-4 py-3">
                    {formatDate(member.assigned_at)}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Footer */}
      <div className="text-center text-sm text-gray-500 mt-8">
        <p>
          Generated on{' '}
          {new Date().toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
          })}
        </p>
      </div>
    </div>
  );
});

GroupMembersPrintView.displayName = 'GroupMembersPrintView';
