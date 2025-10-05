/**
 * MemberResultRow Component
 * Displays member information with quick attendance marking functionality
 */

import React, { useState } from 'react';
import { 
  Check, 
  X, 
  Phone, 
  Mail, 
  Hash, 
  Clock,
  Undo2,
  CheckCircle,
  XCircle,
  Loader2
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';
import type { 
  AttendanceMemberResult, 
  AttendanceRecord,
  AttendanceMarkingMode 
} from '@/types/attendance';

interface MemberResultRowProps {
  member: AttendanceMemberResult;
  sessionId: string;
  occasionId: string;
  sessionDate: string;
  attendanceRecord?: AttendanceRecord;
  markingMode?: AttendanceMarkingMode;
  onMarkAttendance: (memberId: string, isPresent: boolean) => Promise<void>;
  onUndoMark?: (memberId: string) => Promise<void>;
  showUndoOption?: boolean;
  className?: string;
  compact?: boolean;
}

export function MemberResultRow({
  member,
  attendanceRecord,
  onMarkAttendance,
  onUndoMark,
  showUndoOption = true,
  className,
  compact = false,
}: MemberResultRowProps) {
  const [isMarking, setIsMarking] = useState(false);
  const [showUndo, setShowUndo] = useState(false);
  const [undoTimeout, setUndoTimeout] = useState<NodeJS.Timeout | null>(null);

  const isPresent = attendanceRecord?.is_present;
  const isMarked = attendanceRecord !== undefined;
  const markedAt = attendanceRecord?.marked_at;

  const handleMarkAttendance = async (present: boolean) => {
    if (isMarking) return;

    setIsMarking(true);
    try {
      await onMarkAttendance(member.id, present);
      
      // Show undo option for a short time
      if (showUndoOption && onUndoMark) {
        setShowUndo(true);
        
        // Clear any existing timeout
        if (undoTimeout) {
          clearTimeout(undoTimeout);
        }
        
        // Set new timeout to hide undo option
        const timeout = setTimeout(() => {
          setShowUndo(false);
        }, 5000); // 5 seconds
        
        setUndoTimeout(timeout);
      }
    } catch (error) {
      console.error('Failed to mark attendance:', error);
    } finally {
      setIsMarking(false);
    }
  };

  const handleUndo = async () => {
    if (!onUndoMark || isMarking) return;

    setIsMarking(true);
    try {
      await onUndoMark(member.id);
      setShowUndo(false);
      
      if (undoTimeout) {
        clearTimeout(undoTimeout);
        setUndoTimeout(null);
      }
    } catch (error) {
      console.error('Failed to undo attendance:', error);
    } finally {
      setIsMarking(false);
    }
  };

  // Clean up timeout on unmount
  React.useEffect(() => {
    return () => {
      if (undoTimeout) {
        clearTimeout(undoTimeout);
      }
    };
  }, [undoTimeout]);

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  return (
    <TooltipProvider>
      <div className={cn(
        'flex items-center gap-3 p-4 border rounded-lg transition-all duration-200',
        isMarked && isPresent && 'bg-green-50 border-green-200 dark:bg-green-950/20 dark:border-green-800',
        isMarked && !isPresent && 'bg-red-50 border-red-200 dark:bg-red-950/20 dark:border-red-800',
        !isMarked && 'hover:bg-muted/50',
        compact && 'p-3',
        className
      )}>
        {/* Member Avatar */}
        <Avatar className={cn('flex-shrink-0', compact ? 'h-8 w-8' : 'h-12 w-12')}>
          <AvatarImage src={member.profile_image_url || undefined} alt={member.full_name} />
          <AvatarFallback className="bg-muted">
            {getInitials(member.full_name)}
          </AvatarFallback>
        </Avatar>

        {/* Member Details */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <h4 className={cn(
              'font-medium truncate',
              compact ? 'text-sm' : 'text-base'
            )}>
              {member.full_name}
            </h4>
            <Badge variant="outline" className="text-xs flex-shrink-0">
              <Hash className="h-3 w-3 mr-1" />
              {member.membership_id}
            </Badge>
          </div>

          {/* Contact Information */}
          {!compact && (
            <div className="flex items-center gap-4 text-sm text-muted-foreground mb-2">
              {member.phone && (
                <div className="flex items-center gap-1">
                  <Phone className="h-3 w-3" />
                  <span>{member.phone}</span>
                </div>
              )}
              {member.email && (
                <div className="flex items-center gap-1">
                  <Mail className="h-3 w-3" />
                  <span className="truncate max-w-48">{member.email}</span>
                </div>
              )}
            </div>
          )}

          {/* Tags */}
          {member.tags && member.tags.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {member.tags.slice(0, compact ? 2 : 4).map((tag) => (
                <Badge 
                  key={tag.id} 
                  variant="secondary" 
                  className={cn('text-xs', compact && 'px-1.5 py-0.5')}
                  style={{ backgroundColor: `${tag.color}20`, color: tag.color }}
                >
                  {tag.name}
                </Badge>
              ))}
              {member.tags.length > (compact ? 2 : 4) && (
                <Badge variant="secondary" className={cn('text-xs', compact && 'px-1.5 py-0.5')}>
                  +{member.tags.length - (compact ? 2 : 4)}
                </Badge>
              )}
            </div>
          )}

          {/* Attendance Status */}
          {isMarked && markedAt && (
            <div className="flex items-center gap-2 mt-2 text-xs text-muted-foreground">
              <Clock className="h-3 w-3" />
              <span>Marked {isPresent ? 'present' : 'absent'} at {formatTime(markedAt)}</span>
            </div>
          )}
        </div>

        {/* Attendance Actions */}
        <div className="flex items-center gap-2 flex-shrink-0">
          {showUndo && isMarked && (
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleUndo}
                  disabled={isMarking}
                  className="h-8 w-8 p-0"
                >
                  {isMarking ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Undo2 className="h-4 w-4" />
                  )}
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Undo attendance marking</p>
              </TooltipContent>
            </Tooltip>
          )}

          {!showUndo && (
            <>
              {/* Present Button */}
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant={isMarked && isPresent ? "default" : "outline"}
                    size="sm"
                    onClick={() => handleMarkAttendance(true)}
                    disabled={isMarking}
                    className={cn(
                      'h-8 w-8 p-0 transition-colors',
                      isMarked && isPresent && 'bg-green-600 hover:bg-green-700 border-green-600',
                      !isMarked && 'hover:bg-green-50 hover:border-green-300 hover:text-green-700 dark:hover:bg-green-950/20'
                    )}
                  >
                    {isMarking ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : isMarked && isPresent ? (
                      <CheckCircle className="h-4 w-4" />
                    ) : (
                      <Check className="h-4 w-4" />
                    )}
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Mark as present</p>
                </TooltipContent>
              </Tooltip>

              {/* Absent Button */}
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant={isMarked && !isPresent ? "default" : "outline"}
                    size="sm"
                    onClick={() => handleMarkAttendance(false)}
                    disabled={isMarking}
                    className={cn(
                      'h-8 w-8 p-0 transition-colors',
                      isMarked && !isPresent && 'bg-red-600 hover:bg-red-700 border-red-600',
                      !isMarked && 'hover:bg-red-50 hover:border-red-300 hover:text-red-700 dark:hover:bg-red-950/20'
                    )}
                  >
                    {isMarking ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : isMarked && !isPresent ? (
                      <XCircle className="h-4 w-4" />
                    ) : (
                      <X className="h-4 w-4" />
                    )}
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Mark as absent</p>
                </TooltipContent>
              </Tooltip>
            </>
          )}
        </div>
      </div>
    </TooltipProvider>
  );
}