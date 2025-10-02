import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import type { FormComponent } from '@/types/people-configurations';

interface FieldSettingsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  component: FormComponent | null | undefined;
  onSave: (updatedComponent: FormComponent) => void;
}

export function FieldSettingsDialog({
  open,
  onOpenChange,
  component,
  onSave,
}: FieldSettingsDialogProps) {
  const [formData, setFormData] = useState({
    label: '',
    placeholder: '',
    required: false,
  });

  // Update form data when component changes
  useEffect(() => {
    if (component) {
      setFormData({
        label: component.label || '',
        placeholder: component.placeholder || '',
        required: component.required || false,
      });
    }
  }, [component]);

  const handleSave = () => {
    if (!component) return;

    const updatedComponent: FormComponent = {
      ...component,
      label: formData.label,
      placeholder: formData.placeholder,
      required: formData.required,
    };

    onSave(updatedComponent);
    onOpenChange(false);
  };

  const handleCancel = () => {
    // Reset form data to original values
    if (component) {
      setFormData({
        label: component.label || '',
        placeholder: component.placeholder || '',
        required: component.required || false,
      });
    }
    onOpenChange(false);
  };

  if (!component) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Field Settings</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6 py-4">
          {/* Field Label */}
          <div className="space-y-2">
            <Label htmlFor="field-label">Field Label</Label>
            <Input
              id="field-label"
              value={formData.label}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, label: e.target.value }))
              }
              placeholder="Enter field label"
            />
          </div>

          {/* Field Placeholder - Only show for types that support placeholders */}
          {['text', 'email', 'phone', 'number', 'textarea'].includes(component.type) && (
            <div className="space-y-2">
              <Label htmlFor="field-placeholder">Placeholder Text</Label>
              {component.type === 'textarea' ? (
                <Textarea
                  id="field-placeholder"
                  value={formData.placeholder}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, placeholder: e.target.value }))
                  }
                  placeholder="Enter placeholder text"
                  rows={3}
                />
              ) : (
                <Input
                  id="field-placeholder"
                  value={formData.placeholder}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, placeholder: e.target.value }))
                  }
                  placeholder="Enter placeholder text"
                />
              )}
            </div>
          )}

          {/* Required Field */}
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="field-required">Required Field</Label>
              <div className="text-sm text-muted-foreground">
                Mark this field as required for form submission
              </div>
            </div>
            <Switch
              id="field-required"
              checked={formData.required}
              onCheckedChange={(checked) =>
                setFormData((prev) => ({ ...prev, required: checked }))
              }
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleCancel}>
            Cancel
          </Button>
          <Button onClick={handleSave}>
            Save Changes
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}