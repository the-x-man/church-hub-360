import { Calendar, Edit, Trash2, Users, Loader2 } from 'lucide-react';
import type { Group } from '../../../hooks/useGroups';
import { Badge } from '../../ui/badge';
import { Button } from '../../ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '../../ui/card';

interface GroupsListPanelProps {
  groups: Group[];
  selectedGroup: string | null;
  onSelectGroup: (groupId: string) => void;
  onEditGroup: (groupId: string, group: Group) => void;
  onDeleteGroup: (groupId: string) => void;
  isLoading?: boolean;
}

export function GroupsListPanel({
  groups,
  selectedGroup,
  onSelectGroup,
  onEditGroup,
  onDeleteGroup,
  isLoading = false,
}: GroupsListPanelProps) {
  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString();
  };

  const getGroupStatusBadge = (group: Group) => {
    if (group.is_closed) {
      return (
        <Badge variant="destructive" className="text-xs">
          Closed
        </Badge>
      );
    }
    if (!group.is_active) {
      return (
        <Badge variant="secondary" className="text-xs">
          Inactive
        </Badge>
      );
    }
    return null;
  };

  const getGroupTypeBadge = (group: Group) => {
    return (
      <Badge variant="outline" className="text-xs capitalize">
        {group.type}
      </Badge>
    );
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Groups
          </CardTitle>
          <CardDescription>
            Manage church groups and their members
          </CardDescription>
        </CardHeader>
        <CardContent className="flex items-center justify-center py-8">
          <div className="text-center text-muted-foreground">
            <Loader2 className="h-8 w-8 animate-spin mx-auto mb-2" />
            <p>Loading groups...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Users className="h-5 w-5" />
          Groups
        </CardTitle>
        <CardDescription>
          Manage church groups and their members
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-2">
        {groups.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <Users className="h-12 w-12 mx-auto mb-2 opacity-50" />
            <p>No groups yet</p>
            <p className="text-sm">Create your first group to get started</p>
          </div>
        ) : (
          groups
            .sort((a, b) => a.name.localeCompare(b.name))
            .map((group) => {
              const isSelected = selectedGroup === group.id;

              return (
                <div
                  key={group.id}
                  className={`p-3 rounded-lg border cursor-pointer transition-colors overflow-hidden ${
                    isSelected
                      ? 'border-primary bg-primary/5'
                      : 'border-border hover:border-primary/50'
                  }`}
                  onClick={() => onSelectGroup(group.id)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 flex-1">
                      <Users className="h-4 w-4 text-muted-foreground" />
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <p className="font-medium text-sm">{group.name}</p>
                          <div className="flex gap-1">
                            {getGroupStatusBadge(group)}
                            {getGroupTypeBadge(group)}
                          </div>
                        </div>
                        {(group.start_date || group.end_date) && (
                          <div className="flex items-center gap-1 text-xs text-muted-foreground mt-1">
                            <Calendar className="h-3 w-3" />
                            <span>Started: {formatDate(group.start_date)}</span>
                            {group.end_date && (
                              <>
                                <span>•</span>
                                <span>Ends: {formatDate(group.end_date)}</span>
                              </>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          onEditGroup(group.id, group);
                        }}
                        disabled={group.is_closed}
                      >
                        <Edit className="h-3 w-3" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          onDeleteGroup(group.id);
                        }}
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                  {group.description && (
                    <p className="text-xs text-muted-foreground mt-2 line-clamp-2">
                      {group.description}
                    </p>
                  )}
                </div>
              );
            })
        )}
      </CardContent>
    </Card>
  );
}
