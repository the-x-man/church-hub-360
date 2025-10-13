import { Calendar, Edit, Trash2, Users, Loader2 } from 'lucide-react';
import type { Committee } from '../../../hooks/useCommittees';
import { Badge } from '../../ui/badge';
import { Button } from '../../ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '../../ui/card';

interface CommitteesListPanelProps {
  committees: Committee[];
  selectedCommittee: string | null;
  onSelectCommittee: (committeeId: string) => void;
  onEditCommittee: (committeeId: string, committee: Committee) => void;
  onDeleteCommittee: (committeeId: string) => void;
  isLoading?: boolean;
}

export function CommitteesListPanel({
  committees,
  selectedCommittee,
  onSelectCommittee,
  onEditCommittee,
  onDeleteCommittee,
  isLoading = false,
}: CommitteesListPanelProps) {
  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString();
  };

  const getCommitteeStatusBadge = (committee: Committee) => {
    if (committee.is_closed) {
      return (
        <Badge variant="destructive" className="text-xs">
          Closed
        </Badge>
      );
    }
    if (!committee.is_active) {
      return (
        <Badge variant="secondary" className="text-xs">
          Inactive
        </Badge>
      );
    }
    return null;
  };

  const getCommitteeTypeBadge = (committee: Committee) => {
    return (
      <Badge variant="outline" className="text-xs capitalize">
        {committee.type}
      </Badge>
    );
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Committees
          </CardTitle>
          <CardDescription>
            Manage church committees and their members
          </CardDescription>
        </CardHeader>
        <CardContent className="flex items-center justify-center py-8">
          <div className="text-center text-muted-foreground">
            <Loader2 className="h-8 w-8 animate-spin mx-auto mb-2" />
            <p>Loading committees...</p>
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
          Committees
        </CardTitle>
        <CardDescription>
          Manage church committees and their members
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-2">
        {committees.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <Users className="h-12 w-12 mx-auto mb-2 opacity-50" />
            <p>No committees yet</p>
            <p className="text-sm">
              Create your first committee to get started
            </p>
          </div>
        ) : (
          committees
            .sort((a, b) => a.name.localeCompare(b.name))
            .map((committee) => {
              const isSelected = selectedCommittee === committee.id;

              return (
                <div
                  key={committee.id}
                  className={`p-3 rounded-lg border cursor-pointer transition-colors overflow-hidden ${
                    isSelected
                      ? 'border-primary bg-primary/5'
                      : 'border-border hover:border-primary/50'
                  }`}
                  onClick={() => onSelectCommittee(committee.id)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 flex-1">
                      <Users className="h-4 w-4 text-muted-foreground" />
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <p className="font-medium text-sm">
                            {committee.name}
                          </p>
                          <div className="flex gap-1">
                            {getCommitteeStatusBadge(committee)}
                            {getCommitteeTypeBadge(committee)}
                          </div>
                        </div>
                        {(committee.start_date || committee.end_date) && (
                          <div className="flex items-center gap-1 text-xs text-muted-foreground mt-1">
                            <Calendar className="h-3 w-3" />
                            <span>
                              Started: {formatDate(committee.start_date)}
                            </span>
                            {committee.end_date && (
                              <>
                                <span>•</span>
                                <span>
                                  Ends: {formatDate(committee.end_date)}
                                </span>
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
                          onEditCommittee(committee.id, committee);
                        }}
                        disabled={committee.is_closed}
                      >
                        <Edit className="h-3 w-3" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          onDeleteCommittee(committee.id);
                        }}
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                  {committee.description && (
                    <p className="text-xs text-muted-foreground mt-2 line-clamp-2">
                      {committee.description}
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
