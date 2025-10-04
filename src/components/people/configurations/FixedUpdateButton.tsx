import { Button } from '../../ui/button';
import { Badge } from '../../ui/badge';
import { Save, RotateCcw, Loader2 } from 'lucide-react';
import { type SchemaChanges } from '../../../hooks/useLocalCommitteesSchema';

// Simple function to summarize changes
const getChangesSummary = (changes: SchemaChanges): string => {
  if (!changes.hasChanges) return 'No changes';
  return 'Changes detected';
};

interface FixedUpdateButtonProps {
  hasUnsavedChanges: boolean;
  changes: SchemaChanges;
  isUpdating: boolean;
  onUpdate: () => void;
  onReset: () => void;
}

export function FixedUpdateButton({
  hasUnsavedChanges,
  changes,
  isUpdating,
  onUpdate,
  onReset,
}: FixedUpdateButtonProps) {
  if (!hasUnsavedChanges) {
    return null;
  }

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-t">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Badge variant="outline" className="text-amber-600 border-amber-600">
              Unsaved Changes
            </Badge>
            <span className="text-sm text-muted-foreground">
              {getChangesSummary(changes)}
            </span>
          </div>
          
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={onReset}
              disabled={isUpdating}
              className="flex items-center gap-2"
            >
              <RotateCcw className="h-4 w-4" />
              Reset Changes
            </Button>
            
            <Button
              onClick={onUpdate}
              disabled={isUpdating}
              className="flex items-center gap-2 min-w-[120px]"
            >
              {isUpdating ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Updating...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4" />
                  Update Schema
                </>
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}