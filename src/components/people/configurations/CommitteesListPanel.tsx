import { Calendar, Edit, Plus, Trash2, User, Users } from 'lucide-react';
import type { Committee } from '../../../types/people-configurations';
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
  committees: Record<string, Committee>;
  selectedCommittee: string | null;
  editingCommittee: string | null;
  onSelectCommittee: (committeeKey: string) => void;
  onAddCommittee: () => void;
  onEditCommittee: (committeeKey: string, committee: Committee) => void;
  onDeleteCommittee: (committeeKey: string) => void;
}

export function CommitteesListPanel({
  committees,
  selectedCommittee,
  editingCommittee,
  onSelectCommittee,
  onAddCommittee,
  onEditCommittee,
  onDeleteCommittee,
}: CommitteesListPanelProps) {
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex justify-between items-center gap-2">
          <div className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Committees
          </div>
          <Button
            className="flex items-center gap-2"
            size="sm"
            onClick={onAddCommittee}
          >
            <Plus className="h-4 w-4" />
            Add
          </Button>
        </CardTitle>
        <CardDescription>
          Manage church committees and their members
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-2">
        {Object.entries(committees).length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <Users className="h-12 w-12 mx-auto mb-2 opacity-50" />
            <p>No committees yet</p>
            <p className="text-sm">
              Create your first committee to get started
            </p>
          </div>
        ) : (
          Object.entries(committees)
            .sort(([, a], [, b]) => a.name.localeCompare(b.name))
            .map(([key, committee]) => {
              const isSelected = selectedCommittee === key;
              const isEditing = editingCommittee === key;

              return (
                <div
                  key={key}
                  className={`p-3 rounded-lg border cursor-pointer transition-colors overflow-hidden ${
                    isSelected
                      ? 'border-primary bg-primary/5'
                      : 'border-border hover:border-primary/50'
                  }`}
                  onClick={() => !isEditing && onSelectCommittee(key)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 flex-1">
                      <Users className="h-4 w-4 text-muted-foreground" />
                      <div className="flex-1">
                        <p className="font-medium text-sm">{committee.name}</p>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          {committee.positions.length > 0 && (
                            <>
                              <span>•</span>
                              <div className="flex items-center gap-1">
                                <User className="h-3 w-3" />
                                <span>
                                  {committee.positions.length} positions
                                </span>
                              </div>
                            </>
                          )}
                        </div>
                        {committee.created_date && (
                          <div className="flex items-center gap-1 text-xs text-muted-foreground mt-1">
                            <Calendar className="h-3 w-3" />
                            <span>
                              Created: {formatDate(committee.created_date)}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-1">
                      {!committee.is_active && (
                        <Badge variant="outline" className="text-xs">
                          Inactive
                        </Badge>
                      )}
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          onEditCommittee(key, committee);
                        }}
                      >
                        <Edit className="h-3 w-3" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          onDeleteCommittee(key);
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
