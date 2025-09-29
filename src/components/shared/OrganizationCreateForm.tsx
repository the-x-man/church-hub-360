import React, { useState } from 'react';
import { Button } from '../ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '../ui/dialog';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Plus } from 'lucide-react';
import type { CreateOrganizationData } from '../../types/organizations';
import { useOrganization } from '../../contexts/OrganizationContext';
import { PREDEFINED_PALETTES } from '@/data/predefined-palettes';

interface OrganizationCreateFormProps {
  trigger?: React.ReactNode;
  onSuccess?: () => void;
  dialogTitle?: string;
  dialogDescription?: string;
}

export function OrganizationCreateForm({
  trigger,
  onSuccess,
  dialogTitle = 'Create New Organization',
  dialogDescription = 'Add a new organization to your account.',
}: OrganizationCreateFormProps) {
  const { createOrganization } = useOrganization();
  const [isOpen, setIsOpen] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [createForm, setCreateForm] = useState<CreateOrganizationData>({
    name: '',
    email: '',
    phone: '',
    address: '',
    currency: 'GHS',
    is_active: true,
  });

  const handleCreateOrganization = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!createForm.name.trim()) return;

    try {
      setIsCreating(true);
      await createOrganization({
        ...createForm,
        name: createForm.name.trim(),
        brand_colors: PREDEFINED_PALETTES['default'],
      });
      setIsOpen(false);
      setCreateForm({
        name: '',
        email: '',
        phone: '',
        address: '',
        currency: 'GHS',
        is_active: true,
      });
      onSuccess?.();
    } catch (error) {
      console.error('Failed to create organization:', error);
    } finally {
      setIsCreating(false);
    }
  };

  const handleInputChange = (
    field: keyof CreateOrganizationData,
    value: string
  ) => {
    setCreateForm((prev) => ({ ...prev, [field]: value }));
  };

  const defaultTrigger = (
    <Button variant="outline">
      <Plus className="h-4 w-4 mr-2" />
      Create New Organization
    </Button>
  );

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>{trigger || defaultTrigger}</DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <form onSubmit={handleCreateOrganization}>
          <DialogHeader>
            <DialogTitle>{dialogTitle}</DialogTitle>
            <DialogDescription>{dialogDescription}</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="name" className="text-right">
                Name *
              </Label>
              <Input
                id="name"
                value={createForm.name}
                onChange={(e) => handleInputChange('name', e.target.value)}
                className="col-span-3"
                placeholder="Organization name"
                required
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="email" className="text-right">
                Email
              </Label>
              <Input
                id="email"
                type="email"
                value={createForm.email || ''}
                onChange={(e) => handleInputChange('email', e.target.value)}
                className="col-span-3"
                placeholder="contact@organization.com"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="phone" className="text-right">
                Phone
              </Label>
              <Input
                id="phone"
                value={createForm.phone || ''}
                onChange={(e) => handleInputChange('phone', e.target.value)}
                className="col-span-3"
                placeholder="+233 (0) 551234567"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="currency" className="text-right">
                Currency
              </Label>
              <Input
                id="currency"
                value={createForm.currency}
                onChange={(e) => handleInputChange('currency', e.target.value)}
                className="col-span-3"
                placeholder="GHS"
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsOpen(false)}
              disabled={isCreating}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isCreating || !createForm.name.trim()}
            >
              {isCreating ? 'Creating...' : 'Create Organization'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
