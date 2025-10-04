import { useRelationalTags, type BulkCreateTagData, type RelationalTagWithItems } from '@/hooks/useRelationalTags';
import {
  defaultTagCategories,
} from '@/utils/defaultTagsData';
import {
  Briefcase,
  Building,
  Check,
  Heart,
  Loader2,
  Shield,
  Tag as TagIcon,
  UserCheck,
  Users,
  X,
} from 'lucide-react';
import React, { useState } from 'react';
import { toast } from 'sonner';
import { Badge } from '../../ui/badge';
import { Button } from '../../ui/button';
import { Checkbox } from '../../ui/checkbox';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '../../ui/dialog';
import { ScrollArea } from '../../ui/scroll-area';

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
  existingTags: RelationalTagWithItems[];
}

export function TagTemplateModal({
  isOpen,
  onClose,
}: TagTemplateModalProps) {
  const [selectedTemplates, setSelectedTemplates] = useState<Set<string>>(
    new Set()
  );
  const [isLoading, setIsLoading] = useState(false);
  const { bulkCreateTags } = useRelationalTags();

  const handleTemplateToggle = (templateKey: string) => {
    const newSelected = new Set(selectedTemplates);
    if (newSelected.has(templateKey)) {
      newSelected.delete(templateKey);
    } else {
      newSelected.add(templateKey);
    }
    setSelectedTemplates(newSelected);
  };

  const handleAddTemplates = async () => {
    if (selectedTemplates.size === 0) return;

    setIsLoading(true);
    try {
      // Prepare bulk create data
      const bulkCreateData: BulkCreateTagData[] = Array.from(selectedTemplates).map((templateKey) => {
        const template = defaultTagCategories[templateKey];
        if (!template) throw new Error(`Template ${templateKey} not found`);

        return {
          name: template.name,
          description: template.description,
          is_required: template.is_required,
          component_style: template.component_style,
          items: template.items?.map((item) => ({
            name: item.label,
            description: item.description,
            color: item.color,
          })) || [],
        };
      });

      // Use bulk create mutation
      const result = await bulkCreateTags(bulkCreateData);

      if (result) {
        toast.success(
          `Added ${selectedTemplates.size} tag template${
            selectedTemplates.size !== 1 ? 's' : ''
          } successfully`
        );

        setSelectedTemplates(new Set());
        onClose();
      } else {
        throw new Error('Failed to create tags');
      }
    } catch (error) {
      console.error('Error adding templates:', error);
      toast.error('Failed to add tag templates. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    setSelectedTemplates(new Set());
    onClose();
  };

  const availableTemplates = Object.entries(defaultTagCategories);
  
  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[80vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <TagIcon className="h-5 w-5" />
            Add Tag Templates
          </DialogTitle>
          <DialogDescription>
            Select from predefined tag templates.
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="max-h-[50vh] pr-4">
          <div className="space-y-4">
            {availableTemplates.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <TagIcon className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>All available templates have already been added.</p>
              </div>
            ) : (
              availableTemplates.map(([key, template]) => {
                const IconComponent = tagIcons[key] || TagIcon;
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
                          {template.items.slice(0, 5).map((item, index) => (
                            <Badge
                              key={`${key}-item-${index}`}
                              variant="outline"
                              className="text-xs"
                              style={{ borderColor: item.color }}
                            >
                              {item.label}
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
          <Button variant="outline" onClick={handleClose} disabled={isLoading}>
            <X className="h-4 w-4 mr-2" />
            Cancel
          </Button>
          <Button
            onClick={handleAddTemplates}
            disabled={selectedTemplates.size === 0 || isLoading}
          >
            {isLoading ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Check className="h-4 w-4 mr-2" />
            )}
            Add {selectedTemplates.size} Template
            {selectedTemplates.size !== 1 ? 's' : ''}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
