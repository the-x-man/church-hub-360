import React from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Separator } from '@/components/ui/separator';
import { Plus, Trash2, ChevronDown, Settings } from 'lucide-react';
import { useExpensePreferences } from '@/hooks/finance/useExpensePreferences';
import { toast } from 'sonner';

interface ExpensePreferencesDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

type CategoryItem = { key: string; label: string; purposes: string[] };

export const ExpensePreferencesDrawer: React.FC<ExpensePreferencesDrawerProps> = ({ open, onOpenChange }) => {
  const { prefs, savePreferences } = useExpensePreferences();
  const [local, setLocal] = React.useState<{ categories: CategoryItem[] }>({ categories: [] });
  const [newCategoryLabel, setNewCategoryLabel] = React.useState('');
  const [purposeInputs, setPurposeInputs] = React.useState<Record<string, string>>({});

  React.useEffect(() => {
    if (open) {
      setLocal({ categories: (prefs?.categories || []).map((c: any) => ({ key: c.key, label: c.label, purposes: [...(c.purposes || [])] })) });
      setNewCategoryLabel('');
      setPurposeInputs({});
    }
  }, [open, prefs]);

  const slugify = (s: string) => s.toLowerCase().trim().replace(/[^a-z0-9]+/g, '_').replace(/^_+|_+$/g, '');

  const addCategoryLocal = () => {
    const label = newCategoryLabel.trim();
    if (!label) return;
    const key = slugify(label) || 'other';
    if (local.categories.some((c) => c.key === key)) {
      toast.error('Category already exists');
      return;
    }
    setLocal((prev) => ({ categories: [...prev.categories, { key, label, purposes: [] }] }));
    setNewCategoryLabel('');
  };

  const removeCategoryLocal = (key: string) => {
    setLocal((prev) => ({ categories: prev.categories.filter((c) => c.key !== key) }));
  };

  const updateCategoryLabelLocal = (key: string, label: string) => {
    setLocal((prev) => ({ categories: prev.categories.map((c) => (c.key === key ? { ...c, label } : c)) }));
  };

  const addPurposeLocal = (key: string, label: string) => {
    const v = label.trim();
    if (!v) return;
    setLocal((prev) => ({
      categories: prev.categories.map((c) => (c.key === key ? { ...c, purposes: c.purposes.includes(v) ? c.purposes : [...c.purposes, v] } : c)),
    }));
    setPurposeInputs((prev) => ({ ...prev, [key]: '' }));
  };

  const removePurposeLocal = (key: string, label: string) => {
    setLocal((prev) => ({ categories: prev.categories.map((c) => (c.key === key ? { ...c, purposes: c.purposes.filter((p) => p !== label) } : c)) }));
  };

  const handleSave = async () => {
    await savePreferences({ categories: local.categories });
    toast.success('Preferences saved');
    onOpenChange(false);
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="p-0 w-full sm:max-w-xl">
        <div className="flex flex-col h-full">
          <SheetHeader className="border-b p-4">
            <div className="flex items-center justify-between">
              <div>
                <SheetTitle className="flex items-center gap-2">
                  <Settings className="h-5 w-5" />
                  Expense Preferences
                </SheetTitle>
                <SheetDescription>Configure categories and purposes used for expenses</SheetDescription>
              </div>
            </div>
          </SheetHeader>

          <div className="flex-1 overflow-hidden">
            <ScrollArea className="h-full">
              <div className="p-4 space-y-4">
                <div className="space-y-2">
                  <Label>New Category</Label>
                  <div className="flex gap-2">
                    <Input
                      value={newCategoryLabel}
                      onChange={(e) => setNewCategoryLabel(e.target.value)}
                      placeholder="Enter category name"
                    />
                    <Button type="button" onClick={addCategoryLocal}>
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                <Separator />

                <div className="space-y-3">
                  {local.categories.map((cat) => (
                    <Collapsible key={cat.key}>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2 flex-1">
                          <Input
                            value={cat.label}
                            onChange={(e) => updateCategoryLabelLocal(cat.key, e.target.value)}
                          />
                        </div>
                        <div className="flex items-center gap-2">
                          <CollapsibleTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8">
                              <ChevronDown className="h-4 w-4" />
                            </Button>
                          </CollapsibleTrigger>
                          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => removeCategoryLocal(cat.key)}>
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                      <CollapsibleContent className="mt-3">
                        <div className="space-y-2">
                          <Label>Purposes</Label>
                          <div className="flex flex-wrap gap-2">
                            {cat.purposes.map((p) => (
                              <div key={`${cat.key}-${p}`} className="flex items-center gap-2 rounded-md border px-2 py-1">
                                <span className="text-sm">{p}</span>
                                <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => removePurposeLocal(cat.key, p)}>
                                  <Trash2 className="h-3 w-3" />
                                </Button>
                              </div>
                            ))}
                          </div>
                          <div className="flex gap-2 pt-2">
                            <Input
                              value={purposeInputs[cat.key] || ''}
                              onChange={(e) => setPurposeInputs((prev) => ({ ...prev, [cat.key]: e.target.value }))}
                              placeholder="Add purpose"
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                  const v = purposeInputs[cat.key] || '';
                                  addPurposeLocal(cat.key, v);
                                }
                              }}
                            />
                            <Button type="button" onClick={() => addPurposeLocal(cat.key, purposeInputs[cat.key] || '')}>
                              <Plus className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      </CollapsibleContent>
                    </Collapsible>
                  ))}
                </div>
              </div>
            </ScrollArea>
          </div>

          <div className="border-t p-4">
            <Button className="w-full" onClick={handleSave}>Save Preferences</Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
};

export default ExpensePreferencesDrawer;