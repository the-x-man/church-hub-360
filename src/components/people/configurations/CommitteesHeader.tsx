import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';

interface ConfigurationsHeaderProps {
  onAddCommittee: () => void;
  isLoading?: boolean;
}

export function CommitteesHeader({ onAddCommittee, isLoading }: ConfigurationsHeaderProps) {
  return (
   <div className='flex items-center justify-between flex-wrap gap-2 bg-neutral-100 dark:bg-neutral-800/50 px-4 py-2 rounded-md border'>

      <div>
        <div className="flex items-center justify-between gap-3">
          <h1 className="text-2xl font-bold text-foreground">
            Committees
          </h1>
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
      disabled={isLoading}
    >
      <Plus className="h-4 w-4" />
      Add Committee
    </Button>
  </div>
    
  );
}