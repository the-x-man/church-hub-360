import { DatePresetPicker } from '@/components/attendance/reports/DatePresetPicker';
import { MembersFilter } from '@/components/attendance/reports/MembersFilter';
import { OccasionsSessionsFilter } from '@/components/attendance/reports/OccasionsSessionsFilter';
import { TagsGroupsFilter } from '@/components/attendance/reports/TagsGroupsFilter';
import { TopFiltersBar } from '@/components/attendance/reports/TopFiltersBar';
import { AgeGroupReport } from '@/components/attendance/reports/widgets/AgeGroupReport';
import { GenderReport } from '@/components/attendance/reports/widgets/GenderReport';
import { StatsReport } from '@/components/attendance/reports/widgets/StatsReport';
import { TableReport } from '@/components/attendance/reports/widgets/TableReport';
import { MembersAttendanceReport } from '@/components/attendance/reports/widgets/MembersAttendanceReport';
import { TagsGroupsReport } from '@/components/attendance/reports/widgets/TagsGroupsReport';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { useAttendanceReport } from '@/hooks/attendance/useAttendanceReports';
import { buildReportQuery } from '@/hooks/reports/buildReportQuery';
import { useReportFilters } from '@/hooks/reports/useReportFilters';
import { useMemo } from 'react';
import { AttendanceExportButtons } from '@/components/attendance/AttendanceExportButtons';

export function ReportsInsights() {
  const {
    filters,
    setMode,
    updateOccasionsSessions,
    updateTagsGroups,
    updateMembers,
    markGenerated,
    showOccasionsSessionsWidget,
    showTagsGroupsWidget,
    showMembersWidget,
    showDatePresetWidget,
    showReportWidgets,
    showGenderWidget,
    isGenerateEnabled,
    isSpecificSessionSelected,
  } = useReportFilters();

  const queryParams = useMemo(() => buildReportQuery(filters), [filters]);
  const { data: report, isLoading, error } = useAttendanceReport(
    showReportWidgets ? (queryParams as any) : null
  );

  const filtersSummary = useMemo(
    () => ({
      mode: filters.mode,
      date_from: (queryParams as any)?.date_from,
      date_to: (queryParams as any)?.date_to,
      occasion_ids: (queryParams as any)?.occasion_ids,
      session_ids: (queryParams as any)?.session_ids,
      tag_item_ids: (queryParams as any)?.tag_item_ids,
      group_ids: (queryParams as any)?.group_ids,
      member_ids: (queryParams as any)?.member_ids,
    }),
    [filters.mode, queryParams]
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">
            Attendance Reports & Insights
          </h2>
          <p className="text-muted-foreground">
            Analyze attendance patterns and generate reports
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <TopFiltersBar mode={filters.mode} onChange={setMode} />
        </div>
      </div>

      {/* Occasions & Sessions */}
      {showOccasionsSessionsWidget && (
        <Card>
          <CardContent className="space-y-4">
            <OccasionsSessionsFilter
              mode={
                filters.mode === 'members'
                  ? filters.members.occasionId === 'all' &&
                    (!Array.isArray(filters.members.sessionIds) ||
                      filters.members.sessionIds.includes('all'))
                    ? 'all'
                    : 'selected'
                  : isSpecificSessionSelected(
                      filters.occasionsSessions.sessionIds
                    ) || filters.occasionsSessions.occasionId !== 'all'
                  ? 'selected'
                  : 'all'
              }
              onModeChange={(m) => {
                if (m === 'all') {
                  if (filters.mode === 'members') {
                    updateMembers({ occasionId: 'all', sessionIds: ['all'] });
                  } else {
                    updateOccasionsSessions({
                      occasionId: 'all',
                      sessionIds: ['all'],
                    });
                  }
                }
              }}
              selectedOccasionIds={
                filters.mode === 'members'
                  ? filters.members.occasionId === 'all'
                    ? []
                    : [filters.members.occasionId]
                  : filters.occasionsSessions.occasionId === 'all'
                  ? []
                  : [filters.occasionsSessions.occasionId]
              }
              onOccasionsChange={(ids) => {
                const id = ids.length ? ids[0] : 'all';
                if (filters.mode === 'members') {
                  updateMembers({ occasionId: id });
                } else {
                  updateOccasionsSessions({ occasionId: id });
                }
              }}
              selectedSessionIds={
                filters.mode === 'members'
                  ? Array.isArray(filters.members.sessionIds) &&
                    !filters.members.sessionIds.includes('all')
                    ? (filters.members.sessionIds as string[])
                    : []
                  : Array.isArray(filters.occasionsSessions.sessionIds) &&
                    !filters.occasionsSessions.sessionIds.includes('all')
                  ? (filters.occasionsSessions.sessionIds as string[])
                  : []
              }
              onSessionsChange={(ids) => {
                if (filters.mode === 'members') {
                  updateMembers({ sessionIds: ids.length ? ids : ['all'] });
                } else {
                  updateOccasionsSessions({
                    sessionIds: ids.length ? ids : ['all'],
                  });
                }
              }}
            />
            {showDatePresetWidget && (
              <DatePresetPicker
                value={filters.occasionsSessions.datePreset}
                onChange={(v) => updateOccasionsSessions({ datePreset: v })}
              />
            )}
          </CardContent>
        </Card>
      )}

      {/* Tags & Groups */}
      {showTagsGroupsWidget && (
        <Card>
          <CardContent>
            <TagsGroupsFilter
              tagItemIds={filters.tagsGroups.tagItemIds}
              onTagItemIdsChange={(ids) =>
                updateTagsGroups({ tagItemIds: ids })
              }
              groupIds={filters.tagsGroups.groupIds}
              onGroupIdsChange={(ids) => updateTagsGroups({ groupIds: ids })}
              datePreset={filters.tagsGroups.datePreset}
              onDatePresetChange={(v) => updateTagsGroups({ datePreset: v })}
            />
          </CardContent>
        </Card>
      )}

      {/* Members */}
      {showMembersWidget && (
        <Card>
          <CardContent>
            <MembersFilter
              memberIds={filters.members.memberIds}
              onMemberIdsChange={(ids) => updateMembers({ memberIds: ids })}
            />
          </CardContent>
        </Card>
      )}

      {/* Actions */}
      <div className="flex items-center justify-between">
        <Button
          onClick={markGenerated}
          disabled={!isGenerateEnabled || isLoading}
        >
          Generate Report
        </Button>

        <AttendanceExportButtons
          report={report}
          filtersSummary={filtersSummary}
          className="ml-auto"
        />
      </div>

      {/* Error state */}
      {error && (
        <Card>
          <CardContent>
            <div className="text-red-600 dark:text-red-400 text-sm">
              Failed to load report:{' '}
              {(error as any)?.message || 'Unknown error'}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Report Widgets */}
      {showReportWidgets && (
        <div className="space-y-6">
          <StatsReport report={report} />

          {filters.mode === 'members' ? (
            <MembersAttendanceReport
              report={report}
              memberIds={filters.members.memberIds}
              filtersSummary={filtersSummary}
            />
          ) : (
            <TableReport
              report={report}
              showTagsColumn={
                filters.mode === 'tags_groups' &&
                filters.tagsGroups.tagItemIds.length > 0
              }
              showGroupsColumn={
                filters.mode === 'tags_groups' &&
                filters.tagsGroups.groupIds.length > 0
              }
              selectedTagItemIds={filters.tagsGroups.tagItemIds}
              selectedGroupIds={filters.tagsGroups.groupIds}
              filtersSummary={filtersSummary}
            />
          )}
          {filters.mode !== 'members' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <AgeGroupReport report={report} filtersSummary={filtersSummary} />
              <GenderReport
                report={report}
                disabled={!showGenderWidget}
                filtersSummary={filtersSummary}
              />
            </div>
          )}
          {filters.mode === 'tags_groups' && (
            <TagsGroupsReport
              report={report}
              showTags={filters.tagsGroups.tagItemIds.length > 0}
              showGroups={filters.tagsGroups.groupIds.length > 0}
              selectedTagItemIds={filters.tagsGroups.tagItemIds}
              selectedGroupIds={filters.tagsGroups.groupIds}
              filtersSummary={filtersSummary}
            />
          )}
        </div>
      )}
    </div>
  );
}
