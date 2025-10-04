import { type SchemaChanges } from '../../../hooks/useLocalCommitteesSchema';

interface ConfigurationsHeaderProps {
  hasUnsavedChanges: boolean;
  changes: SchemaChanges;
}

export function ConfigurationsHeader({ hasUnsavedChanges }: ConfigurationsHeaderProps) {
  return (
   
      <div>
        <div className="flex items-center justify-between gap-3">
          <h1 className="text-2xl font-bold text-foreground">
            Configurations
          </h1>
          {hasUnsavedChanges && ( <div  className="bg-amber-600 rounded-full w-2 h-2 mx-4" />)}
        </div>
        <div className="space-y-1">
          <p className="text-muted-foreground">
            Manage tags, committees and membership form 
          </p>
        </div>
      </div>
    
  );
}