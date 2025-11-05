import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Pagination } from '@/components/shared/Pagination';
import { CheckCircle, XCircle } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useMemo } from 'react';
import type { MemberSummary } from '@/types/members';
import type { AttendanceSessionWithRelations, AttendanceMarkingModes } from '@/types/attendance';
import { cn } from '@/lib/utils';

interface ManualMarkingCardProps {
  session: AttendanceSessionWithRelations;
  search: string;
  setSearch: (val: string) => void;
  searchFields: ('name' | 'email' | 'phone' | 'membershipId')[];
  setSearchFields: (
    updater: (
      prev: ('name' | 'email' | 'phone' | 'membershipId')[]
    ) => ('name' | 'email' | 'phone' | 'membershipId')[]
  ) => void;
  filteredMembers: MemberSummary[];
  presentMap: Map<string, boolean>;
  onPresent: (memberId: string) => void;
  onAbsent: (memberId: string) => void;
  markPending: boolean;
  unmarkPending: boolean;
  hasAllowedList: boolean;
  loadingAllowed: boolean;
  loadingAll: boolean;
  page: number;
  pageSize: number;
  paginatedTotal: number;
  onPageChange: (page: number) => void;
  onPageSizeChange: (size: number) => void;
  markingModes?: AttendanceMarkingModes;
}

export function ManualMarkingCard({
  session,
  search,
  setSearch,
  searchFields,
  setSearchFields,
  filteredMembers,
  presentMap,
  onPresent,
  onAbsent,
  markPending,
  unmarkPending,
  hasAllowedList,
  loadingAllowed,
  loadingAll,
  page,
  pageSize,
  paginatedTotal,
  onPageChange,
  onPageSizeChange,
  markingModes,
}: ManualMarkingCardProps) {
  const manualEnabled = !!session.marking_modes?.manual;
  const modes = useMemo(
    () => markingModes || session.marking_modes || { manual: false, email: false, phone: false, membership_id: false },
    [markingModes, session.marking_modes]
  );
  const placeholderParts = useMemo(() => {
    const parts: string[] = [];
    if (searchFields.includes('name')) parts.push('name');
    if (searchFields.includes('email') && modes.email) parts.push('email');
    if (searchFields.includes('phone') && modes.phone) parts.push('phone');
    if (searchFields.includes('membershipId') && modes.membership_id) parts.push('membership ID');
    return parts.length ? parts : ['name'];
  }, [searchFields, modes.email, modes.phone, modes.membership_id]);

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-lg">Manual Marking</CardTitle>
        {!manualEnabled && (
          <Badge variant="outline" className="text-xs">
            Manual marking disabled
          </Badge>
        )}
      </CardHeader>
      <CardContent>
        <div className="flex flex-col sm:flex-row gap-4 mb-4">
          <div className="flex-1">
            <Input
              placeholder={`Search members by ${placeholderParts.join(', ')}`}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <div className="flex gap-2 items-center text-xs">
            <label className="flex items-center gap-1">
              <input
                type="checkbox"
                checked={searchFields.includes('name')}
                onChange={(e) =>
                  setSearchFields((prev) =>
                    e.target.checked
                      ? [...prev, 'name']
                      : prev.filter((f) => f !== 'name')
                  )
                }
              />{' '}
              Name
            </label>
            {modes.email && (
              <label className="flex items-center gap-1">
                <input
                  type="checkbox"
                  checked={searchFields.includes('email')}
                  onChange={(e) =>
                    setSearchFields((prev) =>
                      e.target.checked
                        ? [...prev, 'email']
                        : prev.filter((f) => f !== 'email')
                    )
                  }
                />{' '}
                Email
              </label>
            )}
            {modes.phone && (
              <label className="flex items-center gap-1">
                <input
                  type="checkbox"
                  checked={searchFields.includes('phone')}
                  onChange={(e) =>
                    setSearchFields((prev) =>
                      e.target.checked
                        ? [...prev, 'phone']
                        : prev.filter((f) => f !== 'phone')
                    )
                  }
                />{' '}
                Phone
              </label>
            )}
            {modes.membership_id && (
              <label className="flex items-center gap-1">
                <input
                  type="checkbox"
                  checked={searchFields.includes('membershipId')}
                  onChange={(e) =>
                    setSearchFields((prev) =>
                      e.target.checked
                        ? [...prev, 'membershipId']
                        : prev.filter((f) => f !== 'membershipId')
                    )
                  }
                />{' '}
                Membership ID
              </label>
            )}
          </div>
        </div>
        {/* Note: removed duplicate Enabled Marking Modes section per requirements */}

        {/* List */}
        <div className="space-y-3">
          {((hasAllowedList && !loadingAllowed) || !loadingAll) &&
            filteredMembers.map((member) => {
              const present = !!presentMap.get(member.id);
              return (
                <div
                  key={member.id}
                  className="flex items-center justify-between p-3 border rounded-lg"
                >
                  <div className="flex items-center gap-3">
                    <Avatar className="h-10 w-10">
                      <AvatarImage
                        src={member.profile_image_url || undefined}
                      />
                      <AvatarFallback className="bg-primary/10 text-primary font-semibold text-sm">
                        {`${member.first_name.charAt(
                          0
                        )}${member.last_name.charAt(0)}`.toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <div className="font-medium">
                        {member.full_name ||
                          `${member.first_name} ${member.last_name}`}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {[member.membership_id, member.email, member.phone]
                          .filter(Boolean)
                          .join(' • ')}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      size="sm"
                      variant={'outline'}
                      disabled={!manualEnabled || markPending || present}
                      onClick={() => onPresent(member.id)}
                      className={cn(
                        'bg-green-50/30 dark:bg-green-900/5 hover:bg-green-100/50 dark:hover:bg-green-900/15 hover:text-green-950 dark:hover:text-green-200',
                        present ? 'text-green-600 dark:text-green-400' : ''
                      )}
                    >
                      <CheckCircle className="w-4 h-4 mr-1 text-green-600" />
                      {present ? 'Marked' : 'Present'}
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      disabled={!manualEnabled || unmarkPending}
                      onClick={() => onAbsent(member.id)}
                      className={cn(
                        'bg-red-50/30 dark:bg-red-900/5 hover:bg-red-100/50 dark:hover:bg-red-900/15 hover:text-red-950 dark:hover:text-red-200'
                      )}
                    >
                      <XCircle className="w-4 h-4 mr-1 text-red-600" />
                      Absent
                    </Button>
                  </div>
                </div>
              );
            })}

          {filteredMembers.length === 0 && (
            <div className="text-sm text-muted-foreground py-6 text-center">
              No members found{search ? ' for your search' : ''}.
            </div>
          )}
        </div>

        {/* Pagination for fallback list only */}
        {!hasAllowedList && (
          <div className="mt-4">
            <Pagination
              currentPage={page}
              totalPages={Math.max(1, Math.ceil(paginatedTotal / pageSize))}
              pageSize={pageSize}
              totalItems={paginatedTotal}
              itemName="members"
              onPageChange={onPageChange}
              onPageSizeChange={(newSize) => {
                onPageSizeChange(newSize);
                onPageChange(1);
              }}
            />
          </div>
        )}
      </CardContent>
    </Card>
  );
}
