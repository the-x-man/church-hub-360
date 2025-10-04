import { Plus, Edit, Trash2, Tag } from 'lucide-react';
import { Button } from '../../ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '../../ui/card';
import { Badge } from '../../ui/badge';
import type { TagSchema, TagItemSchema } from '@/types/people-configurations';

interface TagItemsPanelProps {
  selectedTagData: TagSchema | null;
  onAddItem: () => void;
  onEditItem: (item: TagItemSchema) => void;
  onDeleteItem: (itemId: string) => void;
}

export function TagItemsPanel({
  selectedTagData,
  onAddItem,
  onEditItem,
  onDeleteItem,
}: TagItemsPanelProps) {
  if (!selectedTagData) {
    return (
      <Card className="h-fit">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Tag className="h-5 w-5" />
            Tag Items
          </CardTitle>
          <CardDescription>
            Select a tag category to view and manage its items
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <Card className="h-fit">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Tag className="h-5 w-5" />
              {selectedTagData.name} Items
            </CardTitle>
            <CardDescription>
              Manage items for this tag category
            </CardDescription>
          </div>
          <Button onClick={onAddItem} size="sm">
            <Plus className="h-4 w-4 mr-2" />
            Add Item
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {selectedTagData.items.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <Tag className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>No items in this category yet</p>
            <p className="text-sm">Click "Add Item" to create the first one</p>
          </div>
        ) : (
          <div className="space-y-3">
            {selectedTagData.items
              .sort(
                (a: TagItemSchema, b: TagItemSchema) =>
                  (a.display_order ?? 0) - (b.display_order ?? 0)
              )
              .map((item: TagItemSchema) => (
                <div
                  key={item.id}
                  className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div
                      className="w-4 h-4 rounded-full border-2 border-white shadow-sm"
                      style={{ backgroundColor: item.color }}
                    />
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{item.name}</span>
                        {!item.is_active && (
                          <Badge variant="outline" className="text-xs">
                            Inactive
                          </Badge>
                        )}
                      </div>
                      {item.description && (
                        <p className="text-sm text-muted-foreground">
                          {item.description}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onEditItem(item)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onDeleteItem(item.id)}
                      className="text-destructive hover:text-destructive"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
