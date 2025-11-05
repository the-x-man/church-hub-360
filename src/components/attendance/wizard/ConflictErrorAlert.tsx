import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { AlertCircle } from 'lucide-react';
import type { FC } from 'react';

export interface ConflictErrorInfo {
  mode: 'single' | 'bulk';
  items: string[];
}

interface ConflictErrorAlertProps {
  info: ConflictErrorInfo;
  onDismiss: () => void;
}

export const ConflictErrorAlert: FC<ConflictErrorAlertProps> = ({ info, onDismiss }) => {
  const title = info.mode === 'single'
    ? 'Conflicting session detected'
    : 'Conflicting sessions detected';

  return (
    <div className="rounded-lg border border-destructive/40 bg-destructive/5 p-2">
      <Alert variant="destructive" className="bg-transparent">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>{title}</AlertTitle>
        <AlertDescription>
          <div className="space-y-3">
            <p className="text-sm">
              The following time ranges overlap with existing sessions. Adjust dates or times to resolve.
            </p>
            <ul className="list-disc pl-5 space-y-1">
              {info.items.map((item, idx) => (
                <li key={idx} className="text-sm">
                  {item}
                </li>
              ))}
            </ul>
            <Separator className="my-2" />
            <div className="text-xs text-muted-foreground">
              <p className="font-medium">Tips to resolve:</p>
              <ul className="list-disc pl-5 space-y-1 mt-1">
                <li>Pick a different start or end time that does not overlap.</li>
                <li>Choose dates that do not coincide with existing sessions.</li>
                <li>For bulk creation, edit or remove the conflicting drafts.</li>
              </ul>
            </div>
            <div className="flex items-center justify-end">
              <Button variant="outline" size="sm" onClick={onDismiss}>Dismiss</Button>
            </div>
          </div>
        </AlertDescription>
      </Alert>
    </div>
  );
};