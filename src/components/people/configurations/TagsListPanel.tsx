import {
  Briefcase,
  Building,
  ChevronDown,
  Edit,
  FileText,
  Heart,
  Plus,
  Shield,
  Tag,
  Trash2,
  UserCheck,
  Users,
} from 'lucide-react';
import React from 'react';
import type { TagCategory } from '../../../types/people-configurations';
import { Badge } from '../../ui/badge';
import { Button } from '../../ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '../../ui/card';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '../../ui/dropdown-menu';

// Tag icons mapping
const tagIcons: Record<string, React.ComponentType<any>> = {
  membership_categories: Users,
  membership_status: UserCheck,
  leadership_levels: Shield,
  positions: Briefcase,
  ministries: Heart,
  departments: Building,
  groups: Users,
};

interface TagsListPanelProps {
  tags: Record<string, TagCategory>;
  selectedTag: string | null;
  editingTag: string | null;
  onSelectTag: (tagKey: string) => void;
  onAddTag: () => void;
  onAddFromTemplate: () => void;
  onEditTag: (tagKey: string, tag: TagCategory) => void;
  onDeleteTag: (tagKey: string) => void;
}

export function TagsListPanel({
  tags,
  selectedTag,
  editingTag,
  onSelectTag,
  onAddTag,
  onAddFromTemplate,
  onEditTag,
  onDeleteTag,
}: TagsListPanelProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex justify-between items-center gap-2">
          <div className="flex items-center gap-2">
            <Tag className="h-5 w-5" />
            Tags
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                className="flex items-center gap-2"
                size="sm"
              >
                <Plus className="h-4 w-4" />
                Add Tag
                <ChevronDown className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={onAddTag}>
                <Plus className="h-4 w-4 mr-2" />
                Add new blank tag
              </DropdownMenuItem>
              <DropdownMenuItem onClick={onAddFromTemplate}>
                <FileText className="h-4 w-4 mr-2" />
                Add from templates
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </CardTitle>
        <CardDescription>
          Organize members with customizable tags
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-2">
        {Object.entries(tags).length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <Tag className="h-12 w-12 mx-auto mb-2 opacity-50" />
            <p>No tags yet</p>
            <p className="text-sm">Create your first tag to get started</p>
          </div>
        ) : (
          Object.entries(tags)
            .sort(
              ([, a], [, b]) => (a.display_order || 0) - (b.display_order || 0)
            )
            .map(([key, tag]) => {
              const IconComponent = tagIcons[key] || Tag;
              const isSelected = selectedTag === key;
              const isEditing = editingTag === key;

              return (
                <div
                  key={key}
                  className={`p-3 rounded-lg border cursor-pointer transition-colors overflow-hidden ${
                    isSelected
                      ? 'border-primary bg-primary/5'
                      : 'border-border hover:border-primary/50'
                  }`}
                  onClick={() => !isEditing && onSelectTag(key)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 flex-1">
                      <IconComponent className="h-4 w-4 text-muted-foreground" />
                      <div className="flex-1">
                        <p className="font-medium text-sm">{tag.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {tag.items.length} items
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-1">
                      {tag.is_required && (
                        <Badge variant="secondary" className="text-xs">
                          Required
                        </Badge>
                      )}
                      {!tag.is_active && (
                        <Badge variant="outline" className="text-xs">
                          Inactive
                        </Badge>
                      )}
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          onEditTag(key, tag);
                        }}
                      >
                        <Edit className="h-3 w-3" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          onDeleteTag(key);
                        }}
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                </div>
              );
            })
        )}
      </CardContent>
    </Card>
  );
}
