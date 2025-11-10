import React, { useMemo, useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Checkbox } from '@/components/ui/checkbox';
import { useReceiptPreferences } from '@/hooks/finance/useReceiptPreferences';
import type { ReceiptFieldKey } from '@/db/receiptPrefsDb';
import { compilePattern } from '@/utils/finance/receiptNumber';
import { useOrganization } from '@/contexts/OrganizationContext';
import { ScrollArea } from '../ui/scroll-area';
import { Card } from '../ui/card';

interface ReceiptPreferencesDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const PRESET_PATTERNS = [
  { label: 'Default', value: 'RCPT-{ORG4}-{YYMMDD}-{RAND3}' },
  { label: 'Org Initials + Date', value: 'RCPT-{ORGI}-{YYMMDD}-{RAND3}' },
  { label: 'Org-Date-Seq', value: '{ORG}-{YYYY}{MM}{DD}-{SEQ}' },
  { label: 'Compact', value: '{ORG4}-{YYMMDD}-{HHmm}-{RAND4}' },
];

export const ReceiptPreferencesDialog: React.FC<ReceiptPreferencesDialogProps> = ({
  open,
  onOpenChange,
}) => {
  const { currentOrganization } = useOrganization();
  const orgId = currentOrganization?.id;
  const orgName = currentOrganization?.name || 'Organization';
  const {
    prefs,
    isLoading,
    updateField,
    setPattern,
    setFooterEnabled,
    setFooterMessage,
    reset,
    DEFAULT_FIELD_PREFS,
  } = useReceiptPreferences(orgId);

  const [localPattern, setLocalPattern] = useState<string>('');

  React.useEffect(() => {
    setLocalPattern(prefs?.number?.pattern ?? PRESET_PATTERNS[0].value);
  }, [prefs?.number?.pattern]);

  const previewNumber = useMemo(
    () =>
      compilePattern(localPattern || PRESET_PATTERNS[0].value, {
        orgName,
        date: new Date(),
        seq: (prefs?.number?.seq ?? 0) + 1,
      }),
    [localPattern, orgName, prefs?.number?.seq]
  );

  const toggleField = async (key: ReceiptFieldKey, enabled: boolean) => {
    await updateField(key, { enabled });
  };

  const renameField = async (key: ReceiptFieldKey, label: string) => {
    await updateField(key, { label });
  };

  const applyPattern = async () => {
    await setPattern(localPattern || PRESET_PATTERNS[0].value);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-3xl max-h-[90vh]">
        <DialogHeader>
          <DialogTitle>Receipt Preferences</DialogTitle>
          <DialogDescription>
            Choose which fields appear on income receipts, rename labels, and
            set the receipt number pattern.
          </DialogDescription>
        </DialogHeader>

        {isLoading ? (
          <div className="text-sm text-muted-foreground">
            Loading preferences…
          </div>
        ) : (
          <ScrollArea className="h-[calc(90vh-170px)] px-4">
            <div className="space-y-6  overflow-auto">
              {/* Fields section */}
              <section>
                <h3 className="text-sm font-semibold mb-2">Fields</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {(prefs?.fields ?? DEFAULT_FIELD_PREFS).map((f) => (
                    <div
                      key={f.key}
                      className="rounded-md border p-3 flex items-start gap-3"
                    >
                      <Checkbox
                        id={`field-${f.key}`}
                        checked={f.enabled}
                        onCheckedChange={(v) => toggleField(f.key, Boolean(v))}
                      />
                      <div className="flex-1 space-y-2">
                        <Label htmlFor={`field-${f.key}`} className="text-sm">
                          {f.key}
                        </Label>
                        <Input
                          value={f.label}
                          onChange={(e) => renameField(f.key, e.target.value)}
                          placeholder="Label"
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </section>

              <Separator />

              {/* Pattern section */}
              <Card className="space-y-3 p-4">
                <h3 className="text-sm font-semibold">
                  Receipt Number Pattern
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <Label>Preset</Label>
                    <div className="flex flex-wrap gap-2">
                      {PRESET_PATTERNS.map((p) => (
                        <Button
                          key={p.value}
                          type="button"
                          variant={
                            localPattern === p.value ? 'default' : 'outline'
                          }
                          size="sm"
                          onClick={() => setLocalPattern(p.value)}
                        >
                          {p.label}
                        </Button>
                      ))}
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Custom Pattern</Label>
                    <Input
                      value={localPattern}
                      onChange={(e) => setLocalPattern(e.target.value)}
                      placeholder="e.g. RCPT-{ORG4}-{YYMMDD}-{RAND3}"
                    />
                  </div>
                </div>
                <div className="text-xs text-muted-foreground">
                  Supported tokens: {`{ORG}`}, {`{ORG4}`}, {`{ORGI}`},{' '}
                  {`{ORGI4}`}, {`{ORGI<n>}`}, {`{YYYY}`}, {`{YY}`}, {`{MM}`},{' '}
                  {`{DD}`}, {`{YYMMDD}`}, {`{HHmm}`}, {`{SEQ}`}, {`{RAND3}`},{' '}
                  {`{RAND4}`}, {`{RAND6}`}
                </div>
                <div className="flex items-center justify-between">
                  <div className="text-sm">
                    Preview: <span className="font-mono">{previewNumber}</span>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      type="button"
                      onClick={() => reset()}
                    >
                      Reset to Default
                    </Button>
                    <Button type="button" onClick={applyPattern}>
                      Save Pattern
                    </Button>
                  </div>
                </div>
              </Card>

              <Separator />

              {/* Footer message section */}
              <section className="space-y-3">
                <h3 className="text-sm font-semibold">
                  Receipt Footer Message
                </h3>
                <div className="flex items-center gap-3">
                  <Checkbox
                    id="footer-enabled"
                    checked={prefs?.footer?.enabled ?? true}
                    onCheckedChange={(v) => setFooterEnabled(Boolean(v))}
                  />
                  <Label htmlFor="footer-enabled">Show footer message</Label>
                </div>
                <Input
                  value={
                    prefs?.footer?.message ?? 'Thank you for your support.'
                  }
                  onChange={(e) => setFooterMessage(e.target.value)}
                  placeholder="Leave empty to use default"
                />
                <div className="text-xs text-muted-foreground">
                  This message appears at the bottom of printed receipts.
                </div>
              </section>
            </div>
          </ScrollArea>
        )}

        <div className="flex justify-end gap-2 mt-2">
          <Button variant="secondary" onClick={() => onOpenChange(false)}>
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ReceiptPreferencesDialog;
