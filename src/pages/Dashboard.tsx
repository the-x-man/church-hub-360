import { useAuth } from '../contexts/AuthContext';
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from '../components/ui/card';
import { Button } from '../components/ui/button';
import { CheckCircle, Tags, Users, DollarSign } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { DashboardVisibilityDialog } from '@/components/dashboard/DashboardVisibilityDialog';
import { DashboardTopBar } from '@/components/dashboard/DashboardTopBar';
import { UpcomingBirthdaysCard } from '@/components/dashboard/UpcomingBirthdaysCard';
import { UpcomingEventsCard } from '@/components/dashboard/UpcomingEventsCard';
import { MembershipCard } from '@/components/dashboard/MembershipCard';
import { TagsGroupsCard } from '@/components/dashboard/TagsGroupsCard';
import { AttendanceCard } from '@/components/dashboard/AttendanceCard';
import { FinancesCard } from '@/components/dashboard/FinancesCard';
import { AssetsCard } from '@/components/dashboard/AssetsCard';
import { BranchesCard } from '@/components/dashboard/BranchesCard';
import { useOrganization } from '@/contexts/OrganizationContext';
import { useDashboardPreferences } from '@/hooks/dashboard/useDashboardPreferences';
import { RecentGroupsTable } from '@/components/dashboard/RecentGroupsTable';
import { AnnouncementsCard } from '@/components/dashboard/AnnouncementsCard';
import { AttendanceTrendChart } from '@/components/dashboard/charts/AttendanceTrendChart';
import { MembersGenderChart } from '@/components/dashboard/charts/MembersGenderChart';
import { FinanceBreakdownChart } from '@/components/dashboard/charts/FinanceBreakdownChart';
import { useAccess } from '@/registry/access/engine';
import React from 'react';

export function Dashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { currentOrganization } = useOrganization();
  const orgId = currentOrganization?.id;
  const { prefs } = useDashboardPreferences(orgId);
  const { canAccess, canAccessChild, canAccessPath } = useAccess();
  const canSeeFinance = canAccess('finance');
  const canSeeBranches = canAccess('branches');
  const canSeeAssets = canAccess('assets');
  const canSeeAnnouncements = canAccess('announcements');
  const canSeeEvents = canAccess('events');
  const canSeeMembership = canAccessChild('people', 'membership');
  const canSeeTagsGroups = canAccessChild('people', 'tags_groups');
  const canSeeAttendance = canAccessChild('people', 'attendance');
  const canSeeBirthdays = canAccessChild('people', 'birthdays');

  const show = (key: keyof NonNullable<typeof prefs>['sections']) => {
    const enabled = prefs?.sections?.[key];
    return enabled === undefined ? true : !!enabled;
  };

  const quickActions = [
    {
      title: 'Mark Attendance',
      description: 'Record service attendance',
      path: '/people/attendance',
      icon: CheckCircle,
    },
    {
      title: 'View Membership List',
      description: 'Manage church members',
      path: '/people/membership',
      icon: Users,
    },
    {
      title: 'Configure Tags',
      description: 'Organize member categories',
      path: '/people/tags',
      icon: Tags,
    },
    {
      title: 'Record Income',
      description: 'Add financial transactions',
      path: '/finance/income',
      icon: DollarSign,
    },
    // {
    //   title: 'Send a Message',
    //   description: 'Communicate with members',
    //   path: '/communication',
    //   icon: MessageSquare,
    // },
    // {
    //   title: 'Reports and Insights',
    //   description: 'View analytics and reports',
    //   path: '/reports',
    //   icon: BarChart3,
    // },
  ];
  const filteredQuickActions = quickActions.filter((a) => canAccessPath(a.path));
  const [selectedBranchId, setSelectedBranchId] = React.useState<string | null>(null);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Dashboard</h1>
        <p className="text-muted-foreground mt-2">
          Welcome back, {user?.profile?.first_name || 'User'}! Here's your
          overview.
        </p>
      </div>

      <DashboardTopBar
        branchId={selectedBranchId}
        onBranchChange={(id) => setSelectedBranchId(id ?? null)}
      />

      <div className="flex items-center justify-end">
        <DashboardVisibilityDialog />
      </div>

      <div className="space-y-4">
        {prefs?.componentsVisibility?.quick_actions === false ? null : (
          <Card className="hidden md:block">
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
              <CardDescription>Common church management tasks</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3 ">
                {filteredQuickActions.map((action) => {
                  const ActionIcon = action.icon;
                  return (
                    <Button
                      key={action.title}
                      variant="outline"
                      className="w-full justify-start h-auto p-3"
                      onClick={() => navigate(action.path)}
                    >
                      <div className="flex items-center space-x-3 w-full">
                        <div className="p-2 rounded-lg bg-muted">
                          <ActionIcon className="h-4 w-4" />
                        </div>
                        <div className="text-left flex-1">
                          <div className="font-medium text-sm">
                            {action.title}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {action.description}
                          </div>
                        </div>
                      </div>
                    </Button>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        )}
        <div className="space-y-6 col-span-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {canSeeBirthdays && show('birthdays') && (
              <UpcomingBirthdaysCard branchId={selectedBranchId || undefined} />
            )}
            {canSeeEvents && show('events') && (
              <UpcomingEventsCard branchId={selectedBranchId || undefined} />
            )}
            {canSeeMembership && show('membership') && (
              <MembershipCard branchId={selectedBranchId || undefined} />
            )}
            {canSeeTagsGroups && show('tags_groups') && (
              <TagsGroupsCard branchId={selectedBranchId || undefined} />
            )}
            {canSeeAttendance && show('attendance') && (
              <AttendanceCard branchId={selectedBranchId || undefined} />
            )}
            {canSeeFinance && show('finances') && (
              <FinancesCard branchId={selectedBranchId || undefined} />
            )}
            {canSeeAssets && show('assets') && (
              <AssetsCard branchId={selectedBranchId || undefined} />
            )}
            {canSeeBranches && show('branches') && <BranchesCard />}
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {canSeeAttendance && show('attendance') && show('attendance_trend_chart') && (
              <AttendanceTrendChart branchId={selectedBranchId || undefined} />
            )}
            {canSeeMembership && show('membership') && show('members_gender_chart') && (
              <MembersGenderChart branchId={selectedBranchId || undefined} />
            )}
            {canSeeFinance && show('finances') && show('finance_breakdown_chart') && (
              <FinanceBreakdownChart branchId={selectedBranchId || undefined} />
            )}
            {show('recent_groups') && (
              <RecentGroupsTable branchId={selectedBranchId || undefined} />
            )}
          </div>
          {canSeeAnnouncements && show('announcements') && (
            <AnnouncementsCard branchId={selectedBranchId || undefined} />
          )}
        </div>
      </div>
    </div>
  );
}
