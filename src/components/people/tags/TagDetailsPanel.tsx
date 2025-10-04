import React from 'react';
import {
  Plus,
  Edit,
  Trash2,
  Tag,
  Users,
  Shield,
  Briefcase,
  Heart,
  Building,
  UserCheck,
  Settings,
} from 'lucide-react';
import { Button } from '../../ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '../../ui/card';
import { Badge } from '../../ui/badge';
import { Label } from '../../ui/label';
import type { TagSchema, TagItemSchema } from '@/types/people-configurations';
import { componentStyleOptions } from '@/constants/people-configurations';

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

interface TagDetailsPanelProps {
  selectedTag: string | null;
  selectedTagData: TagSchema | null;
  onAddItem: () => void;
  onEditItem: (itemId: string, item: TagItemSchema) => void;
  onDeleteItem: (itemId: string, itemName: string) => void;
}

export function TagDetailsPanel({
  selectedTag,
  selectedTagData,
  onAddItem,
  onEditItem,
  onDeleteItem,
}: TagDetailsPanelProps) {
  if (!selectedTagData || !selectedTag) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center h-64">
          <div className="text-center text-muted-foreground">
            <Settings className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>Select a tag to view and manage its items</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const IconComponent = tagIcons[selectedTag] || Tag;

  const selectedComponentStyle = componentStyleOptions.find(
    (opt) => opt.value === selectedTagData.component_style
  );

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <IconComponent className="h-5 w-5" />
              {selectedTagData.name}
            </CardTitle>
            <CardDescription>{selectedTagData.description}</CardDescription>
          </div>
          <Button onClick={onAddItem} size="sm">
            <Plus className="h-4 w-4 mr-2" />
            Add Item
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* Tag Settings */}
          <div className="grid grid-cols-2 gap-4 p-4 bg-muted/50 rounded-lg">
            <div className="flex items-center gap-2">
              <Label className="text-sm font-medium">Component Style</Label>
              <p className="text-sm text-muted-foreground flex items-center">
                {selectedComponentStyle?.label}
                {selectedComponentStyle?.icon &&
                  (() => {
                    const IconComponent = selectedComponentStyle.icon;
                    return <IconComponent className="h-4 w-4 ml-1 inline" />;
                  })()}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Label className="text-sm font-medium">Required</Label>
              <p className="text-sm text-muted-foreground">
                {selectedTagData.is_required ? 'Yes' : 'No'}
              </p>
            </div>
          </div>

          {/* Items List */}
          <div>
            <Label className="text-sm font-medium mb-2 block">
              Tag Items ({selectedTagData.items.length})
            </Label>
            {selectedTagData.items.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground border border-dashed rounded-lg">
                <Tag className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p>No items in this tag</p>
                <p className="text-sm">Add items to organize your members</p>
              </div>
            ) : (
              <div className="space-y-2">
                {selectedTagData.items
                  .sort(
                    (a, b) => (a.display_order || 0) - (b.display_order || 0)
                  )
                  .map((item) => (
                    <div
                      key={item.id}
                      className="flex items-center justify-between p-3 border rounded-lg"
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className="w-4 h-4 rounded-full"
                          style={{ backgroundColor: item.color }}
                        />
                        <div>
                          <div className="flex items-center gap-2">
                            <p className="font-medium text-sm">{item.name}</p>
                            {!item.is_active && (
                              <Badge variant="outline" className="text-xs">
                                Inactive
                              </Badge>
                            )}
                          </div>
                          <p className="text-xs text-muted-foreground">
                            {item.description}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => onEditItem(item.id, item)}
                        >
                          <Edit className="h-3 w-3" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => onDeleteItem(item.id, item.name)}
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  ))}
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
