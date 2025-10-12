import { Button } from '@/components/ui/button';
import { type SchemaChanges } from '../../../hooks/useLocalCommitteesSchema';
import { Plus } from 'lucide-react';

interface ConfigurationsHeaderProps {
  hasUnsavedChanges: boolean;
  changes: SchemaChanges;
  onAddCommittee: () => void;
}

export function CommitteesHeader({ hasUnsavedChanges, onAddCommittee }: ConfigurationsHeaderProps) {
  return (
   <div className='flex items-center justify-between flex-wrap gap-2 bg-neutral-100 dark:bg-neutral-800/50 px-4 py-2 rounded-md border'>

      <div>
        <div className="flex items-center justify-between gap-3">
          <h1 className="text-2xl font-bold text-foreground">
            Committees
          </h1>
          {hasUnsavedChanges && ( <div  className="bg-amber-600 rounded-full w-2 h-2 mx-4" />)}
        </div>
        <div className="space-y-1">
          <p className="text-muted-foreground">
            Manage all committees
          </p>
        </div>
   </div>

    <Button
      className="flex items-center gap-2"
      size="sm"
      onClick={onAddCommittee}
    >
      <Plus className="h-4 w-4" />
      Add Committee
    </Button>
  </div>
    
  );
}