import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import type { IncomeResponseRow, IncomeType } from '@/types/finance';
import { format } from 'date-fns';
import {
  useOccasionDetails,
  useSessionDetails,
} from '@/hooks/attendance/useAttendanceSearch';

interface IncomeViewDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  contribution: IncomeResponseRow | null;
  onEdit: (record: IncomeResponseRow) => void;
  incomeType?: IncomeType;
}

export const IncomeViewDialog: React.FC<IncomeViewDialogProps> = ({
  open,
  onOpenChange,
  contribution,
  onEdit,
  incomeType,
}) => {
  const occasionIds = contribution?.attendance_occasion_id
    ? [contribution.attendance_occasion_id]
    : [];
  const sessionIds = contribution?.attendance_session_id
    ? [contribution.attendance_session_id]
    : [];
  const occasionDetailsQuery = useOccasionDetails(occasionIds);
  const sessionDetailsQuery = useSessionDetails(sessionIds);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Record Details</DialogTitle>
        </DialogHeader>
        {contribution && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-sm font-medium text-muted-foreground">
                  {incomeType === 'contribution' ? 'Contributor' : 'Source'}
                </Label>
                <p className="font-semibold">
                  {(contribution as any).contributor_name}
                </p>
              </div>
              <div>
                <Label className="text-sm font-medium text-muted-foreground">
                  Amount
                </Label>
                <p className="text-lg font-semibold text-green-600">
                  GHS
                  {contribution.amount.toLocaleString('en-US', {
                    minimumFractionDigits: 2,
                  })}
                </p>
              </div>
            </div>

            <div>
              <Label className="text-sm font-medium text-muted-foreground">
                Income Type
              </Label>
              <p className="capitalize">
                {String(contribution.income_type).replace('_', ' ')}
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-sm font-medium text-muted-foreground">
                  Category
                </Label>
                <p className="capitalize">
                  {String(contribution.category).replace('_', ' ')}
                </p>
              </div>
              <div>
                <Label className="text-sm font-medium text-muted-foreground">
                  Payment Method
                </Label>
                <p className="capitalize">
                  {String(contribution.payment_method).replace('_', ' ')}
                </p>
              </div>
            </div>

            {(occasionIds.length > 0 || sessionIds.length > 0) && (
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">
                    Occasion
                  </Label>
                  <p>
                    {occasionDetailsQuery.data?.[0]?.display_name ||
                      contribution.occasion_name ||
                      'N/A'}
                  </p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">
                    Session
                  </Label>
                  <p>{sessionDetailsQuery.data?.[0]?.display_name || 'N/A'}</p>
                </div>
              </div>
            )}

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-sm font-medium text-muted-foreground">
                  Date
                </Label>
                <p>
                  {format(new Date(contribution.date), 'MMM d, yyyy h:mm a')}
                </p>
              </div>
              <div>
                <Label className="text-sm font-medium text-muted-foreground">
                  Envelope #
                </Label>
                <p>{contribution.envelope_number || 'N/A'}</p>
              </div>
            </div>

            {contribution.created_by_user && (
              <div>
                <Label className="text-sm font-medium text-muted-foreground">
                  Record Created By
                </Label>
                <p>
                  {`${contribution.created_by_user.first_name} ${contribution.created_by_user.last_name}`}
                </p>
              </div>
            )}

            {contribution.description && (
              <div>
                <Label className="text-sm font-medium text-muted-foreground">
                  Description
                </Label>
                <p>{contribution.description}</p>
              </div>
            )}

            {contribution.notes && (
              <div>
                <Label className="text-sm font-medium text-muted-foreground">
                  Notes
                </Label>
                <p>{contribution.notes}</p>
              </div>
            )}

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-sm font-medium text-muted-foreground">
                  Tax Deductible
                </Label>
                <p>{contribution.tax_deductible ? 'Yes' : 'No'}</p>
              </div>
              <div>
                <Label className="text-sm font-medium text-muted-foreground">
                  Receipt Issued
                </Label>
                <p>{contribution.receipt_issued ? 'Yes' : 'No'}</p>
              </div>
            </div>

            {contribution.receipt_number && (
              <div>
                <Label className="text-sm font-medium text-muted-foreground">
                  Receipt Number
                </Label>
                <p>{contribution.receipt_number}</p>
              </div>
            )}

            <div className="pt-4 border-t">
              <div className="flex justify-between text-sm text-muted-foreground">
                <span>
                  Created: {format(new Date(contribution.created_at), 'PPp')}
                </span>
                <span>
                  Updated: {format(new Date(contribution.updated_at), 'PPp')}
                </span>
              </div>
            </div>
          </div>
        )}
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Close
          </Button>
          {contribution && (
            <Button
              onClick={() => {
                onOpenChange(false);
                onEdit(contribution);
              }}
            >
              Edit Record
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
