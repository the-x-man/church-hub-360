import { Download } from 'lucide-react';
import { tagIcons } from '../../../constants/people-configurations';
import { defaultTagsSchema } from '../../../utils/defaultTagsData';
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
import { Label } from '../../ui/label';

interface DefaultSchemasDialogProps {
  isOpen: boolean;
  onClose: () => void;
  selectedSchemas: string[];
  onSchemaToggle: (schemaKey: string, checked: boolean) => void;
  onAddSchemas: () => void;
  existingCategories: { [key: string]: any };
}

export function DefaultSchemasDialog({
  isOpen,
  onClose,
  selectedSchemas,
  onSchemaToggle,
  onAddSchemas,
  existingCategories,
}: DefaultSchemasDialogProps) {
  const availableSchemas = Object.entries(defaultTagsSchema.categories).filter(
    ([key]) => !existingCategories[key]
  );

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Download className="h-5 w-5" />
            Load Default Tag Templates
          </DialogTitle>
          <DialogDescription>
            Select from pre-configured tag categories to quickly set up your
            people management system. These templates include common categories
            used by churches.
          </DialogDescription>
        </DialogHeader>

        <div className="max-h-96 overflow-y-auto">
          {availableSchemas.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Download className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>All default templates have already been added</p>
            </div>
          ) : (
            <div className="space-y-4">
              {availableSchemas.map(([key, category]) => {
                const IconComponent = tagIcons[key] || tagIcons.groups;
                return (
                  <div
                    key={key}
                    className="flex items-start space-x-3 p-3 border rounded-lg hover:bg-muted/50 transition-colors"
                  >
                    <Checkbox
                      id={key}
                      checked={selectedSchemas.includes(key)}
                      onCheckedChange={(checked) =>
                        onSchemaToggle(key, checked as boolean)
                      }
                    />
                    <div className="flex-1 space-y-1">
                      <div className="flex items-center gap-2">
                        <IconComponent className="h-4 w-4 text-primary" />
                        <Label
                          htmlFor={key}
                          className="text-sm font-medium cursor-pointer"
                        >
                          {category.name}
                        </Label>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {category.description}
                      </p>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <span>{category.items.length} items</span>
                        <span>•</span>
                        <span className="capitalize">
                          {category.component_style.replace('_', ' ')}
                        </span>
                        {category.is_required && (
                          <>
                            <span>•</span>
                            <span>Required</span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button
            onClick={onAddSchemas}
            disabled={selectedSchemas.length === 0}
          >
            Add Selected ({selectedSchemas.length})
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
