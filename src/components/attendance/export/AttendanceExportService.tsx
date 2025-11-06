import React, { useRef } from 'react';
import { useReactToPrint } from 'react-to-print';
import { saveAs } from 'file-saver';
import * as XLSX from 'xlsx';
import type { AttendanceReportData } from '@/hooks/attendance/useAttendanceReports';

export type ExportFormat = 'pdf' | 'csv' | 'excel';

export interface AttendanceExportOptions {
  sections: string[];
  recordFields?: string[];
}

interface AttendanceExportServiceProps {
  report: AttendanceReportData;
  filtersSummary?: {
    mode: 'occasions_sessions' | 'tags_groups' | 'members';
    date_from?: string;
    date_to?: string;
    occasion_ids?: string[];
    session_ids?: string[];
    tag_item_ids?: string[];
    group_ids?: string[];
    member_ids?: string[];
  };
  organizationName?: string;
  selectedTagNames?: string[];
  selectedGroupNames?: string[];
  selectedSessionNames?: string[];
  format: ExportFormat;
  options: AttendanceExportOptions;
  onComplete: () => void;
  onError: (error: string) => void;
}

// Utility helpers
const fmtDate = (iso?: string) => {
  if (!iso) return '';
  try {
    return new Date(iso).toLocaleString();
  } catch {
    return String(iso);
  }
};

const fmtYMD = (iso?: string) => {
  if (!iso) return '';
  try {
    return new Date(iso).toLocaleDateString();
  } catch {
    return String(iso);
  }
};

// Format a time range like "07:45 PM – 10:30 PM"
const fmtTimeRange = (startIso?: string, endIso?: string) => {
  try {
    if (!startIso) return '';
    const start = new Date(startIso);
    const end = endIso ? new Date(endIso) : undefined;
    const fmt = (d: Date) =>
      d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    return end ? `${fmt(start)} – ${fmt(end)}` : fmt(start);
  } catch {
    return '';
  }
};

function AttendancePrintView({
  report,
  organizationName,
  filtersSummary,
  sections,
  recordFields,
  selectedTagNames,
  selectedGroupNames,
  selectedSessionNames,
}: {
  report: AttendanceReportData;
  organizationName?: string;
  filtersSummary?: AttendanceExportServiceProps['filtersSummary'];
  sections: string[];
  recordFields?: string[];
  selectedTagNames?: string[];
  selectedGroupNames?: string[];
  selectedSessionNames?: string[];
}) {
  const pageStyle = `
    @page {
      size: A4 portrait;
      margin: 0.5in;
    }
    @media print {
      body { -webkit-print-color-adjust: exact; color-adjust: exact; }
      table { page-break-inside: auto; }
      tr { page-break-inside: avoid; page-break-after: auto; }
      thead { display: table-header-group; }
      tfoot { display: table-footer-group; }
    }
  `;

  const getRecordValue = (rec: any, field: string) => {
    switch (field) {
      case 'session_name': {
        const s = report.sessions.find((x) => x.id === rec.session_id);
        return (s as any)?.name || rec.session_id;
      }
      case 'marked_at':
        return fmtDate(rec.marked_at);
      case 'member_name': {
        const m = report.members.find((x) => x.id === rec.member_id);
        const name = `${m?.first_name || ''} ${m?.last_name || ''}`.trim();
        return name || rec.member_id;
      }
      case 'member_gender': {
        const m = report.members.find((x) => x.id === rec.member_id);
        return (m?.gender || '').toString();
      }
      case 'member_age': {
        const m = report.members.find((x) => x.id === rec.member_id);
        return m?.age != null ? String(m.age) : '';
      }
      default:
        return '';
    }
  };

  const selectedRecordFields =
    recordFields && recordFields.length > 0
      ? recordFields
      : ['session_name', 'marked_at', 'member_name'];

  return (
    <>
      <style>{pageStyle}</style>
      <div className="bg-white text-black p-6 text-[12px] leading-5">
        <div className="mb-4">
          {organizationName && (
            <h2 className="font-semibold mb-1 text-gray-700 text-lg">
              {organizationName}
            </h2>
          )}
          <h1 className="font-bold text-xl mb-2">Attendance Report</h1>
          <p className="text-gray-600 text-sm">
            Generated on {new Date().toLocaleDateString()}
          </p>
          {filtersSummary && (
            <div className="mt-2 text-gray-700 text-sm">
              {(filtersSummary.date_from || filtersSummary.date_to) && (
                <div>
                  <strong>Date Range:</strong>{' '}
                  {fmtYMD(filtersSummary.date_from)} –{' '}
                  {fmtYMD(filtersSummary.date_to)}
                </div>
              )}
              {/* Always show sessions count when present in report */}
              {report.sessions && report.sessions.length > 0 && (
                <div>
                  <strong>Sessions:</strong> {report.sessions.length}
                </div>
              )}
              {/* Show session names: selected if provided, otherwise all from report */}
              {(() => {
                const names =
                  selectedSessionNames && selectedSessionNames.length > 0
                    ? selectedSessionNames
                    : (report.sessions || []).map((s: any) =>
                        String(s?.name || s?.id || '')
                      );
                return names.length > 0 ? (
                  <div>
                    <strong>Session Names:</strong> <br />
                    {names.map((name) => (
                      <p key={name} className="ml-2">
                        {name}
                      </p>
                    ))}
                  </div>
                ) : null;
              })()}
              {filtersSummary.occasion_ids &&
                filtersSummary.occasion_ids.length > 0 && (
                  <div>
                    <strong>Occasions:</strong>{' '}
                    {filtersSummary.occasion_ids.length}
                  </div>
                )}
              {filtersSummary.tag_item_ids &&
                filtersSummary.tag_item_ids.length > 0 && (
                  <div>
                    <strong>Tags:</strong> {filtersSummary.tag_item_ids.length}
                  </div>
                )}
              {filtersSummary.group_ids && filtersSummary.group_ids.length > 0 && (
                <div>
                  <strong>Groups:</strong> {filtersSummary.group_ids.length}
                </div>
              )}
              {filtersSummary.member_ids &&
                filtersSummary.member_ids.length > 0 && (
                  <div>
                    <strong>Members:</strong> {filtersSummary.member_ids.length}
                  </div>
                )}
            </div>
          )}
        </div>

        {/* Summary metrics */}
        {sections.includes('summary') && (
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-4">
            <div className="bg-neutral-100 p-2 rounded">
              <div className="text-xs text-gray-500">
                Expected Attendance total
              </div>
              <div className="font-semibold">
                {report.summary.expected_total_members}
              </div>
            </div>

            <div className="bg-neutral-100 p-2 rounded">
              <div className="text-xs text-gray-500">Attendance recorded</div>
              <div className="font-semibold">
                {report.summary.total_attendance}
              </div>
            </div>
            <div className="bg-neutral-100 p-2 rounded">
              <div className="text-xs text-gray-500">Attendance Rate</div>
              <div className="font-semibold">
                {(report.summary.attendance_rate * 100).toFixed(1)}%
              </div>
            </div>
            <div className="bg-neutral-100 p-2 rounded">
              <div className="text-xs text-gray-500">Sessions</div>
              <div className="font-semibold">
                {report.summary.sessions_count}
              </div>
            </div>
          </div>
        )}

        {/* Records */}
        {sections.includes('records') && (
          <div className="mb-6">
            <h3 className="font-bold mb-2">Attendance Records</h3>
            <table
              style={{
                width: '100%',
                borderCollapse: 'collapse',
                border: '1px solid #d1d5db',
              }}
            >
              <thead>
                <tr style={{ backgroundColor: '#f3f4f6' }}>
                  {selectedRecordFields.map((k) => (
                    <th
                      key={k}
                      style={{
                        border: '1px solid #d1d5db',
                        padding: '6px 8px',
                        textAlign: 'left',
                        fontWeight: 600,
                      }}
                    >
                      {k.replace('_', ' ')}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {report.records.map((rec, idx) => (
                  <tr
                    key={rec.id}
                    style={{
                      backgroundColor: idx % 2 === 0 ? '#ffffff' : '#f9fafb',
                    }}
                  >
                    {selectedRecordFields.map((k) => (
                      <td
                        key={k}
                        style={{
                          border: '1px solid #d1d5db',
                          padding: '6px 8px',
                        }}
                      >
                        {getRecordValue(rec, k)}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Sessions */}
        {sections.includes('sessions') && (
          <div className="mb-6">
            <h3 className="font-bold mb-2">Session Participation</h3>
            <table
              style={{
                width: '100%',
                borderCollapse: 'collapse',
                border: '1px solid #d1d5db',
              }}
            >
              <thead>
                <tr style={{ backgroundColor: '#f3f4f6' }}>
                  <th
                    style={{
                      border: '1px solid #d1d5db',
                      padding: '6px 8px',
                      textAlign: 'left',
                    }}
                  >
                    Session
                  </th>
                  <th
                    style={{
                      border: '1px solid #d1d5db',
                      padding: '6px 8px',
                      textAlign: 'left',
                    }}
                  >
                    Start
                  </th>
                  <th
                    style={{
                      border: '1px solid #d1d5db',
                      padding: '6px 8px',
                      textAlign: 'left',
                    }}
                  >
                    End
                  </th>
                  <th
                    style={{
                      border: '1px solid #d1d5db',
                      padding: '6px 8px',
                      textAlign: 'left',
                    }}
                  >
                    Count
                  </th>
                </tr>
              </thead>
              <tbody>
                {report.sessionBreakdown.map((s, idx) => (
                  <tr
                    key={s.session_id}
                    style={{
                      backgroundColor: idx % 2 === 0 ? '#ffffff' : '#f9fafb',
                    }}
                  >
                    <td
                      style={{
                        border: '1px solid #d1d5db',
                        padding: '6px 8px',
                      }}
                    >
                      {s.session_name || s.session_id}
                    </td>
                    <td
                      style={{
                        border: '1px solid #d1d5db',
                        padding: '6px 8px',
                      }}
                    >
                      {fmtDate(s.start_time)}
                    </td>
                    <td
                      style={{
                        border: '1px solid #d1d5db',
                        padding: '6px 8px',
                      }}
                    >
                      {fmtDate(s.end_time)}
                    </td>
                    <td
                      style={{
                        border: '1px solid #d1d5db',
                        padding: '6px 8px',
                      }}
                    >
                      {s.count}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Trend */}
        {sections.includes('trend') && (
          <div className="mb-6">
            <h3 className="font-bold mb-2">Trend (per day)</h3>
            <table
              style={{
                width: '100%',
                borderCollapse: 'collapse',
                border: '1px solid #d1d5db',
              }}
            >
              <thead>
                <tr style={{ backgroundColor: '#f3f4f6' }}>
                  <th
                    style={{
                      border: '1px solid #d1d5db',
                      padding: '6px 8px',
                      textAlign: 'left',
                    }}
                  >
                    Date
                  </th>
                  <th
                    style={{
                      border: '1px solid #d1d5db',
                      padding: '6px 8px',
                      textAlign: 'left',
                    }}
                  >
                    Count
                  </th>
                </tr>
              </thead>
              <tbody>
                {report.trend.map((t, idx) => (
                  <tr
                    key={t.date}
                    style={{
                      backgroundColor: idx % 2 === 0 ? '#ffffff' : '#f9fafb',
                    }}
                  >
                    <td
                      style={{
                        border: '1px solid #d1d5db',
                        padding: '6px 8px',
                      }}
                    >
                      {t.date}
                    </td>
                    <td
                      style={{
                        border: '1px solid #d1d5db',
                        padding: '6px 8px',
                      }}
                    >
                      {t.count}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Demographics: Age Groups */}
        {sections.includes('age_groups') && (
          <div className="mb-6">
            <h3 className="font-bold mb-2">Age Group Breakdown</h3>
            <table
              style={{
                width: '100%',
                borderCollapse: 'collapse',
                border: '1px solid #d1d5db',
              }}
            >
              <thead>
                <tr style={{ backgroundColor: '#f3f4f6' }}>
                  <th
                    style={{
                      border: '1px solid #d1d5db',
                      padding: '6px 8px',
                      textAlign: 'left',
                    }}
                  >
                    Age Group
                  </th>
                  <th
                    style={{
                      border: '1px solid #d1d5db',
                      padding: '6px 8px',
                      textAlign: 'left',
                    }}
                  >
                    Count
                  </th>
                </tr>
              </thead>
              <tbody>
                {Object.entries(report.demographic.byAgeGroup).map(
                  ([g, count], idx) => (
                    <tr
                      key={g}
                      style={{
                        backgroundColor: idx % 2 === 0 ? '#ffffff' : '#f9fafb',
                      }}
                    >
                      <td
                        style={{
                          border: '1px solid #d1d5db',
                          padding: '6px 8px',
                        }}
                      >
                        {g}
                      </td>
                      <td
                        style={{
                          border: '1px solid #d1d5db',
                          padding: '6px 8px',
                        }}
                      >
                        {count}
                      </td>
                    </tr>
                  )
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* Demographics: Gender */}
        {sections.includes('gender') && (
          <div className="mb-6">
            <h3 className="font-bold mb-2">Gender Breakdown</h3>
            <table
              style={{
                width: '100%',
                borderCollapse: 'collapse',
                border: '1px solid #d1d5db',
              }}
            >
              <thead>
                <tr style={{ backgroundColor: '#f3f4f6' }}>
                  <th
                    style={{
                      border: '1px solid #d1d5db',
                      padding: '6px 8px',
                      textAlign: 'left',
                    }}
                  >
                    Gender
                  </th>
                  <th
                    style={{
                      border: '1px solid #d1d5db',
                      padding: '6px 8px',
                      textAlign: 'left',
                    }}
                  >
                    Count
                  </th>
                </tr>
              </thead>
              <tbody>
                {Object.entries(report.demographic.byGender).map(
                  ([g, count], idx) => (
                    <tr
                      key={g}
                      style={{
                        backgroundColor: idx % 2 === 0 ? '#ffffff' : '#f9fafb',
                      }}
                    >
                      <td
                        style={{
                          border: '1px solid #d1d5db',
                          padding: '6px 8px',
                        }}
                      >
                        {g}
                      </td>
                      <td
                        style={{
                          border: '1px solid #d1d5db',
                          padding: '6px 8px',
                        }}
                      >
                        {count}
                      </td>
                    </tr>
                  )
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* Tags & Groups Breakdown (selected only) */}
        {sections.includes('tags_groups') && (
          <div className="mb-6">
            <h3 className="font-bold mb-2">Tags & Groups Breakdown</h3>
            {(() => {
              const tagNameSet = new Set<string>(selectedTagNames || []);
              const groupNameSet = new Set<string>(selectedGroupNames || []);

              const tagCounts: Record<string, number> = {};
              const groupCounts: Record<string, number> = {};

              for (const m of report.members) {
                const tags = Array.isArray(m.tags_array) ? m.tags_array : [];
                tags
                  .filter((t) =>
                    tagNameSet.size === 0 ? false : tagNameSet.has(String(t))
                  )
                  .forEach((t) => {
                    const key = String(t);
                    tagCounts[key] = (tagCounts[key] || 0) + 1;
                  });

                const groups = Array.isArray(m.member_groups)
                  ? m.member_groups
                  : [];
                groups
                  .map((g) => String(g).split(' - ')[0] || String(g))
                  .filter((name) =>
                    groupNameSet.size === 0 ? false : groupNameSet.has(name)
                  )
                  .forEach((name) => {
                    groupCounts[name] = (groupCounts[name] || 0) + 1;
                  });
              }

              return (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <h4 className="font-semibold mb-1">Selected Tags</h4>
                    <table
                      style={{
                        width: '100%',
                        borderCollapse: 'collapse',
                        border: '1px solid #d1d5db',
                      }}
                    >
                      <thead>
                        <tr style={{ backgroundColor: '#f3f4f6' }}>
                          <th
                            style={{
                              border: '1px solid #d1d5db',
                              padding: '6px 8px',
                              textAlign: 'left',
                            }}
                          >
                            Tag
                          </th>
                          <th
                            style={{
                              border: '1px solid #d1d5db',
                              padding: '6px 8px',
                              textAlign: 'left',
                            }}
                          >
                            Count
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {Object.entries(tagCounts).map(
                          ([label, count], idx) => (
                            <tr
                              key={label}
                              style={{
                                backgroundColor:
                                  idx % 2 === 0 ? '#ffffff' : '#f9fafb',
                              }}
                            >
                              <td
                                style={{
                                  border: '1px solid #d1d5db',
                                  padding: '6px 8px',
                                }}
                              >
                                {label}
                              </td>
                              <td
                                style={{
                                  border: '1px solid #d1d5db',
                                  padding: '6px 8px',
                                }}
                              >
                                {count}
                              </td>
                            </tr>
                          )
                        )}
                        {Object.keys(tagCounts).length === 0 && (
                          <tr>
                            <td
                              style={{
                                border: '1px solid #d1d5db',
                                padding: '6px 8px',
                              }}
                              colSpan={2}
                            >
                              No tags selected or matching data
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>

                  <div>
                    <h4 className="font-semibold mb-1">Selected Groups</h4>
                    <table
                      style={{
                        width: '100%',
                        borderCollapse: 'collapse',
                        border: '1px solid #d1d5db',
                      }}
                    >
                      <thead>
                        <tr style={{ backgroundColor: '#f3f4f6' }}>
                          <th
                            style={{
                              border: '1px solid #d1d5db',
                              padding: '6px 8px',
                              textAlign: 'left',
                            }}
                          >
                            Group
                          </th>
                          <th
                            style={{
                              border: '1px solid #d1d5db',
                              padding: '6px 8px',
                              textAlign: 'left',
                            }}
                          >
                            Count
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {Object.entries(groupCounts).map(
                          ([label, count], idx) => (
                            <tr
                              key={label}
                              style={{
                                backgroundColor:
                                  idx % 2 === 0 ? '#ffffff' : '#f9fafb',
                              }}
                            >
                              <td
                                style={{
                                  border: '1px solid #d1d5db',
                                  padding: '6px 8px',
                                }}
                              >
                                {label}
                              </td>
                              <td
                                style={{
                                  border: '1px solid #d1d5db',
                                  padding: '6px 8px',
                                }}
                              >
                                {count}
                              </td>
                            </tr>
                          )
                        )}
                        {Object.keys(groupCounts).length === 0 && (
                          <tr>
                            <td
                              style={{
                                border: '1px solid #d1d5db',
                                padding: '6px 8px',
                              }}
                              colSpan={2}
                            >
                              No groups selected or matching data
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              );
            })()}
          </div>
        )}

        {/* Members */}
        {sections.includes('members') && (
          <div className="mb-6">
            {filtersSummary?.mode === 'members' ? (
              <div>
                <h3 className="font-bold mb-2">Members Attendance</h3>
                <div
                  className="grid grid-cols-1 sm:grid-cols-2 gap-2 rounded-md border p-3 bg-neutral-50 dark:bg-neutral-900/40 mb-4"
                >
                  {[
                    ['Selected Members',
                      (filtersSummary?.member_ids?.length ??
                        report.summary.unique_members)],
                    ['Sessions', report.summary.sessions_count],
                    ['Expected Eligible Across Sessions',
                      report.summary.expected_total_members],
                    ['Total Attendance Records',
                      report.summary.total_attendance],
                    ['Unique Members Recorded',
                      report.summary.unique_members],
                    ['Occasions', report.summary.occasions_count],
                    ['Days Span', report.summary.days_span],
                    ['Average per Day', report.summary.average_per_day],
                  ].map(([label, value], idx) => (
                    <div key={idx} className="flex items-center gap-4 text-sm">
                      <span className="text-muted-foreground">{String(label)}:</span>
                      <span className="font-medium truncate">{String(value)}</span>
                    </div>
                  ))}
                </div>

                <div className="space-y-6">
                  {report.members.map((m) => {
                    const fullName = `${m.first_name || ''} ${m.last_name || ''}`.trim();
                    const initials = `${(m.first_name || '').slice(0, 1)}${(m.last_name || '').slice(0, 1)}`.toUpperCase();
                    const idLabel = m.membership_id || m.id;
                    const statusLabel = (m.membership_status || '').toString();
                    return (
                      <div key={m.id} className="rounded-md border">
                        <div className="flex items-center gap-3 p-3">
                          {m.profile_image_url ? (
                            <img
                              src={m.profile_image_url}
                              alt={fullName || 'Member'}
                              style={{ width: 40, height: 40, borderRadius: 9999 }}
                            />
                          ) : (
                            <div
                              className="flex items-center justify-center"
                              style={{
                                width: 40,
                                height: 40,
                                borderRadius: 9999,
                                backgroundColor: '#e5e7eb',
                                color: '#111827',
                                fontWeight: 600,
                              }}
                            >
                              {initials || '?'}
                            </div>
                          )}
                          <div className="flex-1">
                            <div className="font-medium">{fullName || m.id}</div>
                            <div className="text-sm text-muted-foreground">ID: {String(idLabel)}</div>
                            {statusLabel && (
                              <div className="text-xs text-muted-foreground">Status: {statusLabel}</div>
                            )}
                          </div>
                        </div>

                        <div className="p-3">
                          <table
                            style={{
                              width: '100%',
                              borderCollapse: 'collapse',
                              border: '1px solid #d1d5db',
                            }}
                          >
                            <thead>
                              <tr style={{ backgroundColor: '#f3f4f6' }}>
                                {['Session', 'Date', 'Time', 'Status', 'Recorded at'].map((h) => (
                                  <th
                                    key={h}
                                    style={{
                                      border: '1px solid #d1d5db',
                                      padding: '6px 8px',
                                      textAlign: 'left',
                                    }}
                                  >
                                    {h}
                                  </th>
                                ))}
                              </tr>
                            </thead>
                            <tbody>
                              {report.sessions.map((s, idx) => {
                                const rec = report.records.find(
                                  (r) => r.member_id === m.id && r.session_id === s.id
                                );
                                const status = rec ? 'Present' : 'Absent';
                                return (
                                  <tr
                                    key={`${m.id}|${s.id}`}
                                    style={{ backgroundColor: idx % 2 === 0 ? '#ffffff' : '#f9fafb' }}
                                  >
                                    <td style={{ border: '1px solid #d1d5db', padding: '6px 8px' }}>
                                      {(s as any).name || s.id}
                                    </td>
                                    <td style={{ border: '1px solid #d1d5db', padding: '6px 8px' }}>
                                      {fmtYMD((s as any).start_time)}
                                    </td>
                                    <td style={{ border: '1px solid #d1d5db', padding: '6px 8px' }}>
                                      {fmtTimeRange((s as any).start_time, (s as any).end_time)}
                                    </td>
                                    <td style={{ border: '1px solid #d1d5db', padding: '6px 8px' }}>
                                      {status}
                                    </td>
                                    <td style={{ border: '1px solid #d1d5db', padding: '6px 8px' }}>
                                      {fmtDate(rec?.marked_at) || '-'}
                                    </td>
                                  </tr>
                                );
                              })}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ) : (
              <div>
                <h3 className="font-bold mb-2">Members Participated</h3>
                <table
                  style={{
                    width: '100%',
                    borderCollapse: 'collapse',
                    border: '1px solid #d1d5db',
                  }}
                >
                  <thead>
                    <tr style={{ backgroundColor: '#f3f4f6' }}>
                      {['Name', 'Gender', 'Age'].map((h) => (
                        <th
                          key={h}
                          style={{
                            border: '1px solid #d1d5db',
                            padding: '6px 8px',
                            textAlign: 'left',
                          }}
                        >
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {report.members.map((m, idx) => (
                      <tr
                        key={m.id}
                        style={{ backgroundColor: idx % 2 === 0 ? '#ffffff' : '#f9fafb' }}
                      >
                        <td style={{ border: '1px solid #d1d5db', padding: '6px 8px' }}>
                          {`${m.first_name || ''} ${m.last_name || ''}`.trim()}
                        </td>
                        <td style={{ border: '1px solid #d1d5db', padding: '6px 8px' }}>
                          {(m.gender || '').toString()}
                        </td>
                        <td style={{ border: '1px solid #d1d5db', padding: '6px 8px' }}>
                          {m.age != null ? String(m.age) : ''}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </div>
    </>
  );
}

export function AttendanceExportService({
  report,
  filtersSummary,
  organizationName,
  selectedTagNames,
  selectedGroupNames,
  selectedSessionNames,
  format,
  options,
  onComplete,
  onError,
}: AttendanceExportServiceProps) {
  const printRef = useRef<HTMLDivElement>(null);
  const tagNamesMemo = React.useMemo(() => selectedTagNames || [], [
    selectedTagNames,
  ]);
  const groupNamesMemo = React.useMemo(() => selectedGroupNames || [], [
    selectedGroupNames,
  ]);
  const sessionNamesMemo = React.useMemo(() => selectedSessionNames || [], [
    selectedSessionNames,
  ]);

  const computeTagGroupCounts = React.useCallback(() => {
    const tagCounts: Record<string, number> = {};
    const groupCounts: Record<string, number> = {};
    const tagSet = new Set(tagNamesMemo);
    const groupSet = new Set(groupNamesMemo);

    for (const m of report.members) {
      const tags = Array.isArray(m.tags_array) ? m.tags_array : [];
      tags
        .filter((t) => (tagSet.size === 0 ? false : tagSet.has(String(t))))
        .forEach((t) => {
          const key = String(t);
          tagCounts[key] = (tagCounts[key] || 0) + 1;
        });

      const groups = Array.isArray(m.member_groups) ? m.member_groups : [];
      groups
        .map((g) => String(g).split(' - ')[0] || String(g))
        .filter((name) => (groupSet.size === 0 ? false : groupSet.has(name)))
        .forEach((name) => {
          groupCounts[name] = (groupCounts[name] || 0) + 1;
        });
    }
    return { tagCounts, groupCounts };
  }, [report.members, selectedTagNames, selectedGroupNames]);

  const handlePrint = useReactToPrint({
    contentRef: printRef,
    documentTitle: `${
      organizationName ? `${organizationName} - ` : ''
    }Attendance Report - ${new Date().toLocaleDateString()}`,
    onAfterPrint: () => onComplete(),
    onPrintError: (error) => {
      console.error('Print error:', error);
      onError('Failed to generate PDF. Please try again.');
    },
  });

  const exportToCSV = () => {
    try {
      const parts: string[] = [];
      const escapeCsv = (val: unknown) =>
        `"${String(val ?? '').replace(/"/g, '""')}"`;

      // Header
      const orgHeader = organizationName
        ? [`${organizationName} - Attendance Report`]
        : ['Attendance Report'];
      parts.push(orgHeader.join(','));
      const dateHeader = [`Generated on ${new Date().toLocaleDateString()}`];
      parts.push(dateHeader.join(','));
      const filterHeader = [
        `Mode: ${filtersSummary?.mode ?? ''}`,
        `Date: ${fmtYMD(filtersSummary?.date_from)} – ${fmtYMD(
          filtersSummary?.date_to
        )}`,
      ];
      parts.push(filterHeader.join(','));
      parts.push('');

      // Summary metrics
      if (options.sections.includes('summary')) {
        parts.push(['Metric', 'Value'].join(','));
        parts.push(
          [
            escapeCsv('Expected Eligible'),
            escapeCsv(report.summary.expected_total_members),
          ].join(',')
        );
        parts.push(
          [
            escapeCsv('Attendance Rate'),
            escapeCsv(`${(report.summary.attendance_rate * 100).toFixed(1)}%`),
          ].join(',')
        );
        parts.push(
          [
            escapeCsv('Sessions'),
            escapeCsv(report.summary.sessions_count),
          ].join(',')
        );
        parts.push('');
      }

      // Records
      if (options.sections.includes('records')) {
        const selectedRecordFields =
          options.recordFields && options.recordFields.length > 0
            ? options.recordFields
            : ['session_name', 'marked_at', 'member_name'];
        parts.push(selectedRecordFields.join(','));
        for (const rec of report.records) {
          const row = selectedRecordFields.map((k) =>
            escapeCsv(
              (function () {
                switch (k) {
                  case 'session_name': {
                    const s = report.sessions.find(
                      (x) => x.id === rec.session_id
                    );
                    return (s as any)?.name || rec.session_id;
                  }
                  case 'marked_at':
                    return fmtDate(rec.marked_at);
                  case 'member_name': {
                    const m = report.members.find(
                      (x) => x.id === rec.member_id
                    );
                    const name = `${m?.first_name || ''} ${
                      m?.last_name || ''
                    }`.trim();
                    return name || rec.member_id;
                  }
                  case 'member_gender': {
                    const m = report.members.find(
                      (x) => x.id === rec.member_id
                    );
                    return (m?.gender || '').toString();
                  }
                  case 'member_age': {
                    const m = report.members.find(
                      (x) => x.id === rec.member_id
                    );
                    return m?.age != null ? String(m.age) : '';
                  }
                  default:
                    return '';
                }
              })()
            )
          );
          parts.push(row.join(','));
        }
        parts.push('');
      }

      // Sessions
      if (options.sections.includes('sessions')) {
        parts.push(['Session', 'Start', 'End', 'Count'].join(','));
        for (const s of report.sessionBreakdown) {
          parts.push(
            [
              escapeCsv(s.session_name || s.session_id),
              escapeCsv(fmtDate(s.start_time)),
              escapeCsv(fmtDate(s.end_time)),
              escapeCsv(s.count),
            ].join(',')
          );
        }
        parts.push('');
      }

      // Trend
      if (options.sections.includes('trend')) {
        parts.push(['Date', 'Count'].join(','));
        for (const t of report.trend) {
          parts.push([escapeCsv(t.date), escapeCsv(t.count)].join(','));
        }
        parts.push('');
      }

      // Session names summary (selected or all from report)
      if (sessionNamesMemo.length > 0) {
        parts.push(['Session Names', sessionNamesMemo.join('; ')].join(','));
        parts.push('');
      }

      // Demographics Age
      if (options.sections.includes('age_groups')) {
        parts.push(['Age Group', 'Count'].join(','));
        for (const [g, c] of Object.entries(report.demographic.byAgeGroup)) {
          parts.push([escapeCsv(g), escapeCsv(c)].join(','));
        }
        parts.push('');
      }

      // Demographics Gender
      if (options.sections.includes('gender')) {
        parts.push(['Gender', 'Count'].join(','));
        for (const [g, c] of Object.entries(report.demographic.byGender)) {
          parts.push([escapeCsv(g), escapeCsv(c)].join(','));
        }
        parts.push('');
      }

      // Tags & Groups
      if (options.sections.includes('tags_groups')) {
        const { tagCounts, groupCounts } = computeTagGroupCounts();
        parts.push(['Tag', 'Count'].join(','));
        for (const [label, count] of Object.entries(tagCounts)) {
          parts.push([escapeCsv(label), escapeCsv(count)].join(','));
        }
        if (Object.keys(tagCounts).length === 0)
          parts.push(['No tags selected or matching data', ''].join(','));
        parts.push('');

        parts.push(['Group', 'Count'].join(','));
        for (const [label, count] of Object.entries(groupCounts)) {
          parts.push([escapeCsv(label), escapeCsv(count)].join(','));
        }
        if (Object.keys(groupCounts).length === 0)
          parts.push(['No groups selected or matching data', ''].join(','));
        parts.push('');
      }

      // Members
      if (options.sections.includes('members')) {
        if (filtersSummary?.mode === 'members') {
          parts.push(['Member', 'Session', 'Date', 'Time', 'Status', 'Recorded At'].join(','));
          for (const m of report.members) {
            const memberName = `${m.first_name || ''} ${m.last_name || ''}`.trim();
            for (const s of report.sessions) {
              const rec = report.records.find(
                (r) => r.member_id === m.id && r.session_id === s.id
              );
              parts.push(
                [
                  escapeCsv(memberName || m.id),
                  escapeCsv((s as any).name || s.id),
                  escapeCsv(fmtYMD((s as any).start_time)),
                  escapeCsv(fmtTimeRange((s as any).start_time, (s as any).end_time)),
                  escapeCsv(rec ? 'Present' : 'Absent'),
                  escapeCsv(fmtDate(rec?.marked_at)),
                ].join(',')
              );
            }
          }
          parts.push('');
        } else {
          parts.push(['Name', 'Gender', 'Age'].join(','));
          for (const m of report.members) {
            parts.push(
              [
                escapeCsv(`${m.first_name || ''} ${m.last_name || ''}`.trim()),
                escapeCsv((m.gender || '').toString()),
                escapeCsv(m.age != null ? m.age : ''),
              ].join(',')
            );
          }
          parts.push('');
        }
      }

      const csvContent = parts.join('\n');
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const fileName = `${
        organizationName
          ? `${organizationName.replace(/[^a-zA-Z0-9]/g, '-')}-`
          : ''
      }attendance-export-${new Date().toISOString().split('T')[0]}.csv`;
      saveAs(blob, fileName);

      onComplete();
    } catch (error) {
      console.error('CSV export error:', error);
      onError('Failed to export CSV. Please try again.');
    }
  };

  const exportToExcel = () => {
    try {
      const wb = XLSX.utils.book_new();

      // Summary sheet
      if (options.sections.includes('summary')) {
        const summaryAoa: Array<Array<string | number>> = [
          ['Metric', 'Value'],
          ['Expected Eligible', report.summary.expected_total_members],
          [
            'Attendance Rate',
            `${(report.summary.attendance_rate * 100).toFixed(1)}%`,
          ],
          ['Sessions', report.summary.sessions_count],
          ['Total Attendance', report.summary.total_attendance],
          ['Unique Members', report.summary.unique_members],
        ];
        if (sessionNamesMemo.length > 0) {
          summaryAoa.push([]);
          summaryAoa.push(['Session Names']);
          sessionNamesMemo.forEach((n) => summaryAoa.push([n]));
        }
        const wsSummary = XLSX.utils.aoa_to_sheet(summaryAoa);
        XLSX.utils.book_append_sheet(wb, wsSummary, 'Summary');
      }

      // Records sheet
      if (options.sections.includes('records')) {
        const selectedRecordFields =
          options.recordFields && options.recordFields.length > 0
            ? options.recordFields
            : ['session_name', 'marked_at', 'member_name'];
        const headers = selectedRecordFields;
        const dataAoa: Array<Array<string | number>> = [headers];
        for (const rec of report.records) {
          const row = selectedRecordFields.map((k) => {
            switch (k) {
              case 'session_name': {
                const s = report.sessions.find((x) => x.id === rec.session_id);
                return (s as any)?.name || rec.session_id;
              }
              case 'marked_at':
                return fmtDate(rec.marked_at);
              case 'member_name': {
                const m = report.members.find((x) => x.id === rec.member_id);
                const name = `${m?.first_name || ''} ${
                  m?.last_name || ''
                }`.trim();
                return name || rec.member_id;
              }
              case 'member_gender': {
                const m = report.members.find((x) => x.id === rec.member_id);
                return (m?.gender || '').toString();
              }
              case 'member_age': {
                const m = report.members.find((x) => x.id === rec.member_id);
                return m?.age != null ? m.age : '';
              }
              default:
                return '';
            }
          });
          dataAoa.push(row);
        }
        const wsRecords = XLSX.utils.aoa_to_sheet(dataAoa);
        XLSX.utils.book_append_sheet(wb, wsRecords, 'Records');
      }

      // Sessions sheet
      if (options.sections.includes('sessions')) {
        const aoa: Array<Array<string | number>> = [
          ['Session', 'Start', 'End', 'Count'],
        ];
        for (const s of report.sessionBreakdown) {
          aoa.push([
            s.session_name || s.session_id,
            fmtDate(s.start_time),
            fmtDate(s.end_time),
            s.count,
          ]);
        }
        const ws = XLSX.utils.aoa_to_sheet(aoa);
        XLSX.utils.book_append_sheet(wb, ws, 'Sessions');
      }

      // Trend sheet
      if (options.sections.includes('trend')) {
        const aoa: Array<Array<string | number>> = [['Date', 'Count']];
        for (const t of report.trend) aoa.push([t.date, t.count]);
        const ws = XLSX.utils.aoa_to_sheet(aoa);
        XLSX.utils.book_append_sheet(wb, ws, 'Trend');
      }

      // Demographics: Age
      if (options.sections.includes('age_groups')) {
        const aoa: Array<Array<string | number>> = [['Age Group', 'Count']];
        for (const [g, c] of Object.entries(report.demographic.byAgeGroup))
          aoa.push([g, c]);
        const ws = XLSX.utils.aoa_to_sheet(aoa);
        XLSX.utils.book_append_sheet(wb, ws, 'Age Groups');
      }

      // Demographics: Gender
      if (options.sections.includes('gender')) {
        const aoa: Array<Array<string | number>> = [['Gender', 'Count']];
        for (const [g, c] of Object.entries(report.demographic.byGender))
          aoa.push([g, c]);
        const ws = XLSX.utils.aoa_to_sheet(aoa);
        XLSX.utils.book_append_sheet(wb, ws, 'Gender');
      }

      // Tags & Groups
      if (options.sections.includes('tags_groups')) {
        const { tagCounts, groupCounts } = computeTagGroupCounts();
        const aoaTags: Array<Array<string | number>> = [['Tag', 'Count']];
        for (const [label, count] of Object.entries(tagCounts))
          aoaTags.push([label, count]);
        if (Object.keys(tagCounts).length === 0)
          aoaTags.push(['No tags selected or matching data', '']);
        const wsTags = XLSX.utils.aoa_to_sheet(aoaTags);
        XLSX.utils.book_append_sheet(wb, wsTags, 'Tags');

        const aoaGroups: Array<Array<string | number>> = [['Group', 'Count']];
        for (const [label, count] of Object.entries(groupCounts))
          aoaGroups.push([label, count]);
        if (Object.keys(groupCounts).length === 0)
          aoaGroups.push(['No groups selected or matching data', '']);
        const wsGroups = XLSX.utils.aoa_to_sheet(aoaGroups);
        XLSX.utils.book_append_sheet(wb, wsGroups, 'Groups');
      }

      // Members
      if (options.sections.includes('members')) {
        if (filtersSummary?.mode === 'members') {
          const aoa: Array<Array<string | number>> = [
            ['Member', 'Session', 'Date', 'Time', 'Status', 'Recorded At'],
          ];
          for (const m of report.members) {
            const memberName = `${m.first_name || ''} ${m.last_name || ''}`.trim();
            for (const s of report.sessions) {
              const rec = report.records.find(
                (r) => r.member_id === m.id && r.session_id === s.id
              );
              aoa.push([
                memberName || m.id,
                (s as any).name || s.id,
                fmtYMD((s as any).start_time),
                fmtTimeRange((s as any).start_time, (s as any).end_time),
                rec ? 'Present' : 'Absent',
                fmtDate(rec?.marked_at),
              ]);
            }
          }
          const ws = XLSX.utils.aoa_to_sheet(aoa);
          XLSX.utils.book_append_sheet(wb, ws, 'Members');
        } else {
          const aoa: Array<Array<string | number>> = [['Name', 'Gender', 'Age']];
          for (const m of report.members)
            aoa.push([
              `${m.first_name || ''} ${m.last_name || ''}`.trim(),
              (m.gender || '').toString(),
              m.age != null ? m.age : '',
            ]);
          const ws = XLSX.utils.aoa_to_sheet(aoa);
          XLSX.utils.book_append_sheet(wb, ws, 'Members');
        }
      }

      const fileName = `${
        organizationName
          ? `${organizationName.replace(/[^a-zA-Z0-9]/g, '-')}-`
          : ''
      }attendance-export-${new Date().toISOString().split('T')[0]}.xlsx`;
      XLSX.writeFile(wb, fileName);

      onComplete();
    } catch (error) {
      console.error('Excel export error:', error);
      onError('Failed to export Excel file. Please try again.');
    }
  };

  const executeExport = () => {
    switch (format) {
      case 'pdf':
        handlePrint();
        break;
      case 'csv':
        exportToCSV();
        break;
      case 'excel':
        exportToExcel();
        break;
      default:
        onError('Unsupported export format');
    }
  };

  React.useEffect(() => {
    executeExport();
  }, []);

  return (
    <div style={{ display: 'none' }}>
      <div ref={printRef}>
        <AttendancePrintView
          report={report}
          organizationName={organizationName}
          filtersSummary={filtersSummary}
          sections={options.sections}
          recordFields={options.recordFields}
          selectedTagNames={tagNamesMemo}
          selectedGroupNames={groupNamesMemo}
          selectedSessionNames={sessionNamesMemo}
        />
      </div>
    </div>
  );
}
