import React, { useState } from 'react';
import {
  Users,
  UserCheck,
  UserPlus,
  Calendar,
  TrendingUp,
  Baby,
  GraduationCap,
  Heart,
  Crown,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import type { MemberStatistics as MemberStatisticsType } from '@/types/members';

interface MemberStatisticsProps {
  statistics: MemberStatisticsType;
  isLoading?: boolean;
}

interface CompactStatProps {
  label: string;
  value: number;
  icon: React.ReactNode;
  color?: string;
  subtitle?: string;
}

function CompactStat({
  label,
  value,
  icon,
  color = 'text-muted-foreground',
  subtitle,
}: CompactStatProps) {
  return (
    <div className="flex items-center gap-2 min-w-0">
      <div className={`flex-shrink-0 ${color}`}>{icon}</div>
      <div className="min-w-0 flex-1">
        <div className="flex items-baseline gap-1">
          <span className="font-semibold text-sm">
            {value.toLocaleString()}
          </span>
          <span className="text-xs text-muted-foreground truncate">
            {label}
          </span>
        </div>
        {subtitle && (
          <div className="text-xs text-muted-foreground">{subtitle}</div>
        )}
      </div>
    </div>
  );
}

interface StatGroupProps {
  title: string;
  icon: React.ReactNode;
  children: React.ReactNode;
  defaultItemsToShow?: number;
}

function StatGroup({
  title,
  icon,
  children,
  defaultItemsToShow = 2,
}: StatGroupProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  // Convert children to array to handle slicing
  const childrenArray = React.Children.toArray(children);
  const hasMoreItems = childrenArray.length > defaultItemsToShow;
  const displayedChildren = isExpanded
    ? childrenArray
    : childrenArray.slice(0, defaultItemsToShow);

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
          {icon}
          <span>{title}</span>
        </div>
      </CardHeader>
      <CardContent className="px-6">
        <div className="grid grid-cols-1  gap-3">{displayedChildren}</div>
        {hasMoreItems && (
          <div className="flex pt-1 mt-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsExpanded(!isExpanded)}
              className="h-6 px-2 text-xs text-muted-foreground hover:text-foreground"
            >
              {isExpanded ? (
                <>
                  <ChevronUp className="h-3 w-3 mr-1" />
                  Show Less
                </>
              ) : (
                <>
                  <ChevronDown className="h-3 w-3 mr-1" />
                  View More ({childrenArray.length - defaultItemsToShow})
                </>
              )}
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default function MemberStatistics({
  statistics,
  isLoading,
}: MemberStatisticsProps) {
  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-4">
          <div className="animate-pulse space-y-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="space-y-2">
                <div className="h-4 bg-muted rounded w-24"></div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {[...Array(3)].map((_, j) => (
                    <div key={j} className="h-8 bg-muted rounded"></div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  // Calculate additional derived statistics
  const totalActivePercentage =
    statistics.total_members > 0
      ? Math.round((statistics.active_members / statistics.total_members) * 100)
      : 0;

  const maleCount = statistics.members_by_gender.male || 0;
  const femaleCount = statistics.members_by_gender.female || 0;
  const otherGenderCount =
    (statistics.members_by_gender.other || 0) +
    (statistics.members_by_gender.prefer_not_to_say || 0);

  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-2">
      {/* Membership Overview */}
      <StatGroup
        title="Membership Overview"
        icon={<Users className="h-3 w-3" />}
      >
        <CompactStat
          label="Total"
          value={statistics.total_members}
          icon={<Users className="h-4 w-4" />}
          color="text-blue-600"
        />
        <CompactStat
          label="Active"
          value={statistics.active_members}
          icon={<UserCheck className="h-4 w-4" />}
          color="text-green-600"
          subtitle={`${totalActivePercentage}%`}
        />
        <CompactStat
          label="Inactive"
          value={statistics.inactive_members}
          icon={<UserCheck className="h-4 w-4" />}
          color="text-orange-600"
        />
      </StatGroup>

      {/* Growth & Status */}
      <StatGroup
        title="Growth & Status"
        icon={<TrendingUp className="h-3 w-3" />}
      >
        <CompactStat
          label="New This Month"
          value={statistics.new_members_this_month}
          icon={<UserPlus className="h-4 w-4" />}
          color="text-blue-600"
        />
        <CompactStat
          label="New This Year"
          value={statistics.new_members_this_year}
          icon={<Calendar className="h-4 w-4" />}
          color="text-purple-600"
        />
        <CompactStat
          label="Pending"
          value={statistics.members_by_status.pending || 0}
          icon={<UserPlus className="h-4 w-4" />}
          color="text-yellow-600"
        />
      </StatGroup>

      {/* Demographics */}
      <StatGroup title="Demographics" icon={<Heart className="h-3 w-3" />}>
        <CompactStat
          label="Male"
          value={maleCount}
          icon={<Users className="h-4 w-4" />}
          color="text-blue-600"
          subtitle={
            statistics.total_members > 0
              ? `${Math.round((maleCount / statistics.total_members) * 100)}%`
              : '0%'
          }
        />
        <CompactStat
          label="Female"
          value={femaleCount}
          icon={<Users className="h-4 w-4" />}
          color="text-pink-600"
          subtitle={
            statistics.total_members > 0
              ? `${Math.round((femaleCount / statistics.total_members) * 100)}%`
              : '0%'
          }
        />
        {otherGenderCount > 0 && (
          <CompactStat
            label="Other"
            value={otherGenderCount}
            icon={<Users className="h-4 w-4" />}
            color="text-gray-600"
          />
        )}
      </StatGroup>

      {/* Age Groups */}
      <StatGroup
        title="Age Distribution"
        icon={<GraduationCap className="h-3 w-3" />}
      >
        <CompactStat
          label="Children (0-17)"
          value={statistics.members_by_age_group['0-17'] || 0}
          icon={<Baby className="h-4 w-4" />}
          color="text-green-600"
        />
        <CompactStat
          label="Young Adults (18-30)"
          value={statistics.members_by_age_group['18-30'] || 0}
          icon={<GraduationCap className="h-4 w-4" />}
          color="text-blue-600"
        />
        <CompactStat
          label="Adults (31-50)"
          value={statistics.members_by_age_group['31-50'] || 0}
          icon={<Users className="h-4 w-4" />}
          color="text-purple-600"
        />
        <CompactStat
          label="Mature (51-70)"
          value={statistics.members_by_age_group['51-70'] || 0}
          icon={<Users className="h-4 w-4" />}
          color="text-orange-600"
        />
        <CompactStat
          label="Seniors (71+)"
          value={statistics.members_by_age_group['71+'] || 0}
          icon={<Crown className="h-4 w-4" />}
          color="text-red-600"
        />
        {statistics.total_members -
          Object.values(statistics.members_by_age_group).reduce(
            (sum, count) => sum + count,
            0
          ) >
          0 && (
          <CompactStat
            label="Unknown Age"
            value={
              statistics.total_members -
              Object.values(statistics.members_by_age_group).reduce(
                (sum, count) => sum + count,
                0
              )
            }
            icon={<Users className="h-4 w-4" />}
            color="text-gray-600"
          />
        )}
      </StatGroup>
    </div>
  );
}
