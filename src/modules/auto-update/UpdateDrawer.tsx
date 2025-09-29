import { useState } from 'react';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { UpdateSettings } from './UpdateSettings';
import { Download, X } from 'lucide-react';

interface UpdateDrawerProps {
  children: React.ReactNode;
  isOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
}

export function UpdateDrawer({
  children,
  isOpen,
  onOpenChange,
}: UpdateDrawerProps) {
  const [internalOpen, setInternalOpen] = useState(false);

  const open = isOpen !== undefined ? isOpen : internalOpen;
  const setOpen = onOpenChange || setInternalOpen;

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>{children}</SheetTrigger>
      <SheetContent side="bottom" className="h-screen max-h-screen w-full p-4">
        <div className="mx-auto w-full max-w-4xl h-full flex flex-col border">
          <SheetHeader className="flex flex-row items-center justify-between border-b pb-4">
            <div>
              <SheetTitle className="text-2xl flex items-center gap-2">
                <Download className="h-5 w-5" />
                Software Updates
              </SheetTitle>
              <SheetDescription>
                Check for application updates and install new versions
              </SheetDescription>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setOpen(false)}
              className="h-8 w-8"
            >
              <X className="h-4 w-4" />
            </Button>
          </SheetHeader>

          <div className="flex-1 overflow-y-auto p-6">
            <UpdateSettings className="bg-transparent" />
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
