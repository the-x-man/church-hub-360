/**
 * AttendanceList Component
 * Displays attendance records for a selected occasion and date with filtering and actions
 */

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { useAttendanceMemberSearch, useAttendanceRecords } from '@/hooks/useAttendance';
import { cn } from '@/lib/utils';
import type {
  AttendanceFilters,
  AttendanceRecordWithMember
} from '@/types/attendance';
import { format } from 'date-fns';
import {
  Check,
  Clock,
  Download,
  Eye,
  EyeOff,
  Filter,
  MoreHorizontal,
  Printer,
  UserCheck,
  Users,
  UserX,
  X
} from 'lucide-react';
import { useMemo, useState } from 'react';

interface AttendanceListProps {
  organizationId: string;
  sessionId?: string;
  occasionId?: string;
  date?: Date;
  className?: string;
  showActions?: boolean;
  compact?: boolean;
}

const ATTENDANCE_STATUS_COLORS = {
  present: 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400',
  absent: 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400',
  late: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400',
  excused: 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400',
};

const FILTER_OPTIONS = [
  { value: 'all', label: 'All Members' },
  { value: 'present', label: 'Present' },
  { value: 'absent', label: 'Absent' },
  { value: 'late', label: 'Late' },
  { value: 'excused', label: 'Excused' },
];

export function AttendanceList({
  organizationId,
  sessionId,
  date,
  className,
  showActions = true,
  compact = false,
}: AttendanceListProps) {
  const { 
    getRecordsForSession, 
    markAttendance, 
    bulkMarkAttendance 
  } = useAttendanceRecords(organizationId);
  const { } = useAttendanceMemberSearch();

  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [selectedRecords, setSelectedRecords] = useState<Set<string>>(new Set());
  const [showFilters, setShowFilters] = useState(false);
  const [filters] = useState<AttendanceFilters & { tags?: string[] }>({});

  // Get attendance records
  const attendanceRecords = useMemo(() => {
    if (!sessionId) return [];
    return getRecordsForSession(sessionId);
  }, [sessionId, getRecordsForSession]);

  // Filter records based on search and filters
  const filteredRecords = useMemo(() => {
    let filtered = attendanceRecords;

    // Search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter((record: AttendanceRecordWithMember) => 
        record.member.first_name.toLowerCase().includes(query) ||
        record.member.last_name.toLowerCase().includes(query) ||
        record.member.membership_id?.toLowerCase().includes(query) ||
        record.member.email?.toLowerCase().includes(query) ||
        record.member.phone?.toLowerCase().includes(query)
      );
    }

    // Status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter((record: AttendanceRecordWithMember) => {
        const status = record.is_present ? 'present' : 'absent';
        return status === statusFilter;
      });
    }

    // Additional filters - removed tags filter as MemberSummary doesn't have tags property
    // Tags are handled through a separate relational structure

    return filtered;
  }, [attendanceRecords, searchQuery, statusFilter, filters]);

  const handleSelectRecord = (recordId: string, checked: boolean) => {
    const newSelected = new Set(selectedRecords);
    if (checked) {
      newSelected.add(recordId);
    } else {
      newSelected.delete(recordId);
    }
    setSelectedRecords(newSelected);
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedRecords(new Set(filteredRecords.map((r: AttendanceRecordWithMember) => r.id)));
    } else {
      setSelectedRecords(new Set());
    }
  };

  const handleBulkStatusChange = async (status: 'present' | 'absent' | 'late' | 'excused') => {
    if (!sessionId || selectedRecords.size === 0) return;

    const memberIds = Array.from(selectedRecords).map(recordId => {
      const record = filteredRecords.find((r: AttendanceRecordWithMember) => r.id === recordId);
      return record?.member_id;
    }).filter(Boolean) as string[];

    await bulkMarkAttendance({
      session_id: sessionId,
      member_ids: memberIds,
      is_present: status === 'present',
      marking_method: 'manual',
      marked_by: 'admin', // TODO: Get from auth context
      notes: '',
    });
    setSelectedRecords(new Set());
  };

  const handleStatusChange = async (recordId: string, status: 'present' | 'absent' | 'late' | 'excused') => {
    if (!sessionId) return;
    
    // Find the record to get member_id
    const record = filteredRecords.find((r: AttendanceRecordWithMember) => r.id === recordId);
    if (!record) return;
    
    await markAttendance({
      organization_id: 'org-1', // TODO: Get from context
      session_id: sessionId,
      member_id: record.member_id,
      is_present: status === 'present',
      marking_method: 'manual',
      marked_by: 'admin', // TODO: Get from auth context
      notes: '',
    });
  };

  const handleExport = () => {
    // Mock export functionality
    const csvContent = [
      ['Name', 'Membership ID', 'Status', 'Marked At'].join(','),
      ...filteredRecords.map((record: AttendanceRecordWithMember) => [
        `"${record.member.first_name} ${record.member.last_name}"`,
        record.member.membership_id || '',
        record.is_present ? 'present' : 'absent',
        record.marked_at ? format(new Date(record.marked_at), 'yyyy-MM-dd HH:mm:ss') : ''
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `attendance-${format(date || new Date(), 'yyyy-MM-dd')}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handlePrint = () => {
    window.print();
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'present':
        return <Check className="h-4 w-4" />;
      case 'absent':
        return <X className="h-4 w-4" />;
      case 'late':
        return <Clock className="h-4 w-4" />;
      case 'excused':
        return <UserCheck className="h-4 w-4" />;
      default:
        return null;
    }
  };

  if (compact) {
    return (
      <div className={cn('space-y-4', className)}>
        {/* Compact Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            <span className="font-medium">
              Attendance ({filteredRecords.length})
            </span>
          </div>
          {showActions && (
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={handleExport}>
                <Download className="h-4 w-4" />
              </Button>
              <Button variant="outline" size="sm" onClick={handlePrint}>
                <Printer className="h-4 w-4" />
              </Button>
            </div>
          )}
        </div>

        {/* Compact List */}
        <div className="space-y-2">
          {filteredRecords.map((record: AttendanceRecordWithMember) => (
            <div
              key={record.id}
              className="flex items-center justify-between p-3 border rounded-lg"
            >
              <div className="flex items-center gap-3">
                <Avatar className="h-8 w-8">
                  <AvatarImage src={record.member.profile_image_url || undefined} />
                  <AvatarFallback>
                    {record.member.first_name[0]}{record.member.last_name[0]}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-medium">
                    {record.member.first_name} {record.member.last_name}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {record.member.membership_id}
                  </p>
                </div>
              </div>
              <Badge 
                variant="outline" 
                className={cn(ATTENDANCE_STATUS_COLORS[(record.is_present ? 'present' : 'absent') as keyof typeof ATTENDANCE_STATUS_COLORS])}
              >
                {getStatusIcon(record.is_present ? 'present' : 'absent')}
                <span className="ml-1 capitalize">{record.is_present ? 'present' : 'absent'}</span>
              </Badge>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Attendance List
          </CardTitle>
          {showActions && (
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={() => setShowFilters(!showFilters)}>
                <Filter className="h-4 w-4 mr-2" />
                Filters
                {showFilters ? <EyeOff className="h-4 w-4 ml-2" /> : <Eye className="h-4 w-4 ml-2" />}
              </Button>
              <Button variant="outline" size="sm" onClick={handleExport}>
                <Download className="h-4 w-4 mr-2" />
                Export
              </Button>
              <Button variant="outline" size="sm" onClick={handlePrint}>
                <Printer className="h-4 w-4 mr-2" />
                Print
              </Button>
            </div>
          )}
        </div>

        {/* Search and Filters */}
        <div className="space-y-4">
          <div className="flex gap-4">
            <div className="flex-1">
              <Input
                placeholder="Search members..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                {FILTER_OPTIONS.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Bulk Actions */}
          {selectedRecords.size > 0 && (
            <div className="flex items-center gap-2 p-3 bg-muted/50 rounded-lg">
              <span className="text-sm font-medium">
                {selectedRecords.size} selected
              </span>
              <div className="flex gap-2">
                <Button 
                  size="sm" 
                  variant="outline"
                  onClick={() => handleBulkStatusChange('present')}
                >
                  <UserCheck className="h-4 w-4 mr-1" />
                  Mark Present
                </Button>
                <Button 
                  size="sm" 
                  variant="outline"
                  onClick={() => handleBulkStatusChange('absent')}
                >
                  <UserX className="h-4 w-4 mr-1" />
                  Mark Absent
                </Button>
              </div>
            </div>
          )}
        </div>
      </CardHeader>

      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-12">
                <Checkbox
                  checked={selectedRecords.size === filteredRecords.length && filteredRecords.length > 0}
                  onCheckedChange={handleSelectAll}
                />
              </TableHead>
              <TableHead>Member</TableHead>
              <TableHead>Contact</TableHead>
              <TableHead>Tags</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Marked At</TableHead>
              {showActions && <TableHead className="w-12">Actions</TableHead>}
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredRecords.length === 0 ? (
              <TableRow>
                <TableCell colSpan={showActions ? 7 : 6} className="text-center py-8">
                  <div className="flex flex-col items-center gap-2 text-muted-foreground">
                    <Users className="h-8 w-8" />
                    <p>No attendance records found</p>
                    {searchQuery && (
                      <p className="text-sm">Try adjusting your search or filters</p>
                    )}
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              filteredRecords.map((record: AttendanceRecordWithMember) => (
                <TableRow key={record.id}>
                  <TableCell>
                    <Checkbox
                      checked={selectedRecords.has(record.id)}
                      onCheckedChange={(checked) => handleSelectRecord(record.id, checked as boolean)}
                    />
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <Avatar className="h-8 w-8">
                        <AvatarImage src={record.member.profile_image_url || undefined} />
                        <AvatarFallback>
                          {record.member.first_name[0]}{record.member.last_name[0]}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-medium">
                          {record.member.first_name} {record.member.last_name}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          ID: {record.member.membership_id}
                        </p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="text-sm">
                      {record.member.email && (
                        <p>{record.member.email}</p>
                      )}
                      {record.member.phone && (
                        <p className="text-muted-foreground">{record.member.phone}</p>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-1">
                      {(record.member as any).tags?.slice(0, 2).map((tag: { id: string; name: string; color: string }) => (
                        <Badge key={tag.id} variant="secondary" className="text-xs">
                          {tag.name}
                        </Badge>
                      ))}
                      {(record.member as any).tags && (record.member as any).tags.length > 2 && (
                        <Badge variant="outline" className="text-xs">
                          +{(record.member as any).tags.length - 2}
                        </Badge>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge 
                      variant="outline" 
                      className={cn(ATTENDANCE_STATUS_COLORS[(record.is_present ? 'present' : 'absent') as keyof typeof ATTENDANCE_STATUS_COLORS])}
                    >
                      {getStatusIcon(record.is_present ? 'present' : 'absent')}
                      <span className="ml-1 capitalize">{record.is_present ? 'present' : 'absent'}</span>
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {record.marked_at ? (
                      <div className="text-sm">
                        <p>{format(new Date(record.marked_at), 'MMM dd, yyyy')}</p>
                        <p className="text-muted-foreground">
                          {format(new Date(record.marked_at), 'HH:mm')}
                        </p>
                      </div>
                    ) : (
                      <span className="text-muted-foreground">-</span>
                    )}
                  </TableCell>
                  {showActions && (
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuLabel>Mark as</DropdownMenuLabel>
                          <DropdownMenuItem onClick={() => handleStatusChange(record.id, 'present')}>
                            <Check className="h-4 w-4 mr-2" />
                            Present
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleStatusChange(record.id, 'absent')}>
                            <X className="h-4 w-4 mr-2" />
                            Absent
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleStatusChange(record.id, 'late')}>
                            <Clock className="h-4 w-4 mr-2" />
                            Late
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleStatusChange(record.id, 'excused')}>
                            <UserCheck className="h-4 w-4 mr-2" />
                            Excused
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  )}
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}