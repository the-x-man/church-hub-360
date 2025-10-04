import { useState } from 'react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  User,
  Mail,
  Phone,
  Calendar,
  MoreVertical,
  Edit,
  Trash2,
  Eye,
  UserCheck,
  UserX,
  Printer,
} from 'lucide-react';
import type { MemberSummary, MembershipStatus } from '@/types';
import { cn } from '@/lib/utils';

interface MemberCardProps {
  member: MemberSummary;
  onEdit?: (member: MemberSummary) => void;
  onDelete?: (memberId: string) => Promise<void>;
  onView?: (member: MemberSummary) => void;
  onToggleStatus?: (member: MemberSummary) => void;
  onPrint?: (member: MemberSummary) => void;
  onClick?: (memberId: string) => void;
  className?: string;
}

const statusColors: Record<MembershipStatus, string> = {
  active: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300',
  inactive: 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300',
  pending:
    'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300',
  suspended: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300',
  transferred: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300',
  deceased:
    'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300',
};

export function MemberCard({
  member,
  onEdit,
  onDelete,
  onView,
  onToggleStatus,
  onPrint,
  onClick,
  className,
}: MemberCardProps) {
  const [isLoading, setIsLoading] = useState(false);

  const handleAction = async (action: () => void | Promise<void>) => {
    setIsLoading(true);
    try {
      await action();
    } finally {
      setIsLoading(false);
    }
  };

  const getInitials = (firstName: string, lastName: string) => {
    return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString();
  };

  const getAgeDisplay = () => {
    if (member.age !== null) {
      return `${member.age} years old`;
    }
    return 'Age not specified';
  };

  const getMembershipDuration = () => {
    if (member.membership_years !== null) {
      const years = Math.floor(member.membership_years);
      if (years === 0) return 'Less than a year';
      return `${years} year${years !== 1 ? 's' : ''}`;
    }
    return 'Duration not available';
  };

  return (
    <Card
      className={cn(
        'hover:shadow-md transition-shadow duration-200',
        onClick &&
          'cursor-pointer hover:bg-neutral-100 dark:hover:bg-neutral-800/70',
        className
      )}
      onClick={() => onClick?.(member.id)}
    >
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center space-x-3">
            <Avatar className="h-12 w-12">
              <AvatarImage src={member.profile_image_url || undefined} />
              <AvatarFallback className="bg-primary/10 text-primary font-semibold">
                {getInitials(member.first_name, member.last_name)}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-lg truncate">
                {member.full_name}
              </h3>
              <p className="text-sm text-muted-foreground">
                ID: {member.membership_id}
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 w-8 p-0"
                  disabled={isLoading}
                >
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                {onView && (
                  <DropdownMenuItem
                    onClick={() => handleAction(() => onView(member))}
                  >
                    <Eye className="mr-2 h-4 w-4" />
                    View Details
                  </DropdownMenuItem>
                )}
                {onEdit && (
                  <DropdownMenuItem
                    onClick={() => handleAction(() => onEdit(member))}
                  >
                    <Edit className="mr-2 h-4 w-4" />
                    Edit Member
                  </DropdownMenuItem>
                )}
                {onPrint && (
                  <DropdownMenuItem
                    onClick={() => handleAction(() => onPrint(member))}
                  >
                    <Printer className="mr-2 h-4 w-4" />
                    Print Details
                  </DropdownMenuItem>
                )}
                {onToggleStatus && (
                  <>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      onClick={() => handleAction(() => onToggleStatus(member))}
                    >
                      {member.is_active ? (
                        <>
                          <UserX className="mr-2 h-4 w-4" />
                          Deactivate
                        </>
                      ) : (
                        <>
                          <UserCheck className="mr-2 h-4 w-4" />
                          Activate
                        </>
                      )}
                    </DropdownMenuItem>
                  </>
                )}
                {onDelete && (
                  <>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      onClick={() => handleAction(() => onDelete(member.id))}
                      className="text-destructive focus:text-destructive"
                    >
                      <Trash2 className="mr-2 h-4 w-4" />
                      Delete Member
                    </DropdownMenuItem>
                  </>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="space-y-3">
          {/* Contact Information */}
          <div className="space-y-2">
            {member.email && (
              <div className="flex items-center text-sm text-muted-foreground">
                <Mail className="mr-2 h-4 w-4 flex-shrink-0" />
                <span className="truncate">{member.email}</span>
              </div>
            )}
            {member.phone && (
              <div className="flex items-center text-sm text-muted-foreground">
                <Phone className="mr-2 h-4 w-4 flex-shrink-0" />
                <span>{member.phone}</span>
              </div>
            )}
          </div>

          {/* Membership Information */}
          <div className="space-y-2">
            <div className="flex items-center text-sm text-muted-foreground">
              <User className="mr-2 h-4 w-4 flex-shrink-0" />
              <span>{getAgeDisplay()}</span>
            </div>
            {member.date_joined && (
              <div className="flex items-center text-sm text-muted-foreground">
                <Calendar className="mr-2 h-4 w-4 flex-shrink-0" />
                <span>Joined {formatDate(member.date_joined)}</span>
              </div>
            )}
            <div className="flex items-center text-sm text-muted-foreground">
              <UserCheck className="mr-2 h-4 w-4 flex-shrink-0" />
              <span>Member for {getMembershipDuration()}</span>
            </div>
          </div>

          {/* Membership Type */}
          {member.membership_type && (
            <div className="pt-2 border-t flex items-center gap-2">
              <Badge
                className={cn(
                  'text-xs',
                  statusColors[member.membership_status]
                )}
              >
                {member.membership_status}
              </Badge>
              <Badge variant="outline" className="text-xs">
                {member.membership_type}
              </Badge>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
