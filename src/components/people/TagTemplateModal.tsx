import React, { useState } from 'react';
import {
  Briefcase,
  Building,
  Check,
  Heart,
  Shield,
  Tag,
  UserCheck,
  Users,
  X,
} from 'lucide-react';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { Checkbox } from '../ui/checkbox';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '../ui/dialog';
import { ScrollArea } from '../ui/scroll-area';
import { defaultTagsSchema } from '../../utils/defaultTagsData';
import type { TagCategory } from '../../types/people-configurations';

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

interface TagTemplateModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddTemplates: (selectedTemplates: Record<string, TagCategory>) => void;
  existingTags: Record<string, TagCategory>;
}

export function TagTemplateModal({
  isOpen,
  onClose,
  onAddTemplates,
  existingTags,
}: TagTemplateModalProps) {
  const [selectedTemplates, setSelectedTemplates] = useState<Set<string>>(new Set());

  const handleTemplateToggle = (templateKey: string) => {
    const newSelected = new Set(selectedTemplates);
    if (newSelected.has(templateKey)) {
      newSelected.delete(templateKey);
    } else {
      newSelected.add(templateKey);
    }
    setSelectedTemplates(newSelected);
  };

  const handleAddTemplates = () => {
    const templatesToAdd: Record<string, TagCategory> = {};
    
    selectedTemplates.forEach((templateKey) => {
      const template = defaultTagsSchema.categories[templateKey];
      if (template && !existingTags[templateKey]) {
        templatesToAdd[templateKey] = template;
      }
    });

    onAddTemplates(templatesToAdd);
    setSelectedTemplates(new Set());
    onClose();
  };

  const handleClose = () => {
    setSelectedTemplates(new Set());
    onClose();
  };

  const availableTemplates = Object.entries(defaultTagsSchema.categories).filter(
    ([key]) => !existingTags[key]
  );

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[80vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Tag className="h-5 w-5" />
            Add Tag Templates
          </DialogTitle>
          <DialogDescription>
            Select from predefined tag templates to quickly set up common church management categories.
            Each template includes pre-configured items that you can customize later.
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="max-h-[50vh] pr-4">
          <div className="space-y-4">
            {availableTemplates.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Tag className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>All available templates have already been added.</p>
              </div>
            ) : (
              availableTemplates.map(([key, template]) => {
                const IconComponent = tagIcons[key] || Tag;
                const isSelected = selectedTemplates.has(key);

                return (
                  <div
                    key={key}
                    className={`border rounded-lg p-4 cursor-pointer transition-colors ${
                      isSelected
                        ? 'border-primary bg-primary/5'
                        : 'border-border hover:border-primary/50'
                    }`}
                    onClick={() => handleTemplateToggle(key)}
                  >
                    <div className="flex items-start gap-3">
                      <Checkbox
                        checked={isSelected}
                        onChange={() => handleTemplateToggle(key)}
                        className="mt-1"
                      />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-2">
                          <IconComponent className="h-5 w-5 text-primary" />
                          <h3 className="font-medium">{template.name}</h3>
                          <Badge variant="outline" className="text-xs">
                            {template.component_style}
                          </Badge>
                          {template.is_required && (
                            <Badge variant="secondary" className="text-xs">
                              Required
                            </Badge>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground mb-3">
                          {template.description}
                        </p>
                        <div className="flex flex-wrap gap-1">
                          {template.items.slice(0, 5).map((item) => (
                            <Badge
                              key={item.id}
                              variant="outline"
                              className="text-xs"
                              style={{ borderColor: item.color }}
                            >
                              {item.name}
                            </Badge>
                          ))}
                          {template.items.length > 5 && (
                            <Badge variant="outline" className="text-xs">
                              +{template.items.length - 5} more
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </ScrollArea>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose}>
            <X className="h-4 w-4 mr-2" />
            Cancel
          </Button>
          <Button
            onClick={handleAddTemplates}
            disabled={selectedTemplates.size === 0}
          >
            <Check className="h-4 w-4 mr-2" />
            Add {selectedTemplates.size} Template{selectedTemplates.size !== 1 ? 's' : ''}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}