import { Edit, Trash2, ChevronDown } from 'lucide-react';
import { Button } from '../../ui/button';
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from '../../ui/card';
import { Badge } from '../../ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '../../ui/dropdown-menu';
import { tagIcons } from '../../../constants/people-configurations';
import type { TagCategory } from '../../../types/people-configurations';

interface TagCategoriesListProps {
  tags: { [key: string]: TagCategory };
  selectedTag: string | null;
  onSelectTag: (tagKey: string) => void;
  onEditTag: (tagKey: string, tag: TagCategory) => void;
  onDeleteTag: (tagKey: string) => void;
}

export function TagCategoriesList({
  tags,
  selectedTag,
  onSelectTag,
  onEditTag,
  onDeleteTag,
}: TagCategoriesListProps) {
  return (
    <div className="space-y-4">
      {Object.entries(tags)
        .sort(([, a], [, b]) => ((a as TagCategory).display_order ?? 0) - ((b as TagCategory).display_order ?? 0))
        .map(([tagKey, tag]) => {
          const typedTag = tag as TagCategory;
          const IconComponent = tagIcons[tagKey] || tagIcons.groups;
          
          return (
            <Card
              key={tagKey}
              className={`cursor-pointer transition-all hover:shadow-md ${
                selectedTag === tagKey
                  ? 'ring-2 ring-primary border-primary'
                  : ''
              }`}
              onClick={() => onSelectTag(tagKey)}
            >
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-primary/10">
                      <IconComponent className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <CardTitle className="text-lg flex items-center gap-2">
                        {typedTag.name}
                        {typedTag.is_required && (
                          <Badge variant="secondary" className="text-xs">
                            Required
                          </Badge>
                        )}
                        {!typedTag.is_active && (
                          <Badge variant="outline" className="text-xs">
                            Inactive
                          </Badge>
                        )}
                      </CardTitle>
                      <CardDescription>{typedTag.description}</CardDescription>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="capitalize">
                      {typedTag.component_style.replace('_', ' ')}
                    </Badge>
                    <Badge variant="secondary">
                      {typedTag.items.length} items
                    </Badge>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <ChevronDown className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem
                          onClick={(e) => {
                            e.stopPropagation();
                            onEditTag(tagKey, typedTag);
                          }}
                        >
                          <Edit className="h-4 w-4 mr-2" />
                          Edit Category
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={(e) => {
                            e.stopPropagation();
                            onDeleteTag(tagKey);
                          }}
                          className="text-destructive"
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          Delete Category
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
              </CardHeader>
            </Card>
          );
        })}
    </div>
  );
}