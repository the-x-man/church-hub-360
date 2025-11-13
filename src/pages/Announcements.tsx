import { DeleteConfirmationDialog } from '@/components/shared/DeleteConfirmationDialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  useAnnouncements,
  useCreateAnnouncement,
  useDeleteAnnouncement,
} from '@/hooks/announcements/useAnnouncements';
import type { AnnouncementWithMeta } from '@/types/announcements';
import { Edit, Megaphone, Plus, Trash2, Share2, Link as LinkIcon } from 'lucide-react';
import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
// removed SlideManager from creation flow; slides are edited in details page
import { Textarea } from '@/components/ui/textarea';

export default function Announcements() {
  const navigate = useNavigate();
  const announcementsQuery = useAnnouncements();
  const deleteAnnouncement = useDeleteAnnouncement();
  const createAnnouncement = useCreateAnnouncement();

  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [selected, setSelected] = useState<AnnouncementWithMeta | null>(null);
  const [shareOpen, setShareOpen] = useState(false);
  const [formTitle, setFormTitle] = useState('');
  const [formDescription, setFormDescription] = useState('');
  // preview removed
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const data = useMemo(() => announcementsQuery.data || [], [
    announcementsQuery.data,
  ]);

  const validate = () => {
    const e: Record<string, string> = {};
    if (!formTitle || formTitle.trim().length === 0)
      e.title = 'Title is required';
    if (formTitle.length > 100) e.title = 'Max 100 characters';
    if (!formDescription || formDescription.trim().length === 0)
      e.description = 'Description is required';
    if (formDescription.length > 255) e.description = 'Max 255 characters';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const onCreate = async () => {
    if (!validate()) return;
    try {
      if (saving) return;
      setSaving(true);
      const created = await createAnnouncement.mutateAsync({
        title: formTitle.trim(),
        description: formDescription,
      });
      setIsAddOpen(false);
      setFormTitle('');
      setFormDescription('');
      setSaving(false);
      navigate(`/announcements/${created.id}`);
    } catch {}
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center gap-3">
        <Megaphone className="h-8 w-8 text-primary" />
        <h1 className="text-3xl font-bold">Announcements</h1>
        <div className="ml-auto">
          <Button onClick={() => setIsAddOpen(true)}>
            <Plus className="h-4 w-4 mr-2" /> New Announcement
          </Button>
        </div>
      </div>

      <div className="space-y-4">
        {data.map((a) => (
          <Card key={a.id} className="w-full">
            <CardHeader className="flex flex-row items-center justify-between py-0">
              <CardTitle className="truncate">{a.title}</CardTitle>
              <div className="flex gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => navigate(`/announcements/${a.id}`)}
                >
                  <Edit className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setSelected(a);
                    setShareOpen(true);
                  }}
                >
                  <Share2 className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-destructive"
                  onClick={() => {
                    setSelected(a);
                    setIsDeleteOpen(true);
                  }}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-sm line-clamp-4">{a.description}</div>
              <div className="text-sm text-muted-foreground">
                Slides: {a.slides_count ?? '-'}
              </div>
            </CardContent>
          </Card>
        ))}
        {data.length === 0 && (
          <div className="rounded-lg border bg-card text-muted-foreground p-10 text-center">
            No announcements yet
          </div>
        )}
      </div>

      <DeleteConfirmationDialog
        isOpen={isDeleteOpen}
        onClose={() => setIsDeleteOpen(false)}
        onConfirm={async () => {
          if (!selected?.id) return;
          try {
            await deleteAnnouncement.mutateAsync(selected.id);
            setIsDeleteOpen(false);
            setSelected(null);
          } catch {}
        }}
        title="Delete Announcement"
        description="Are you sure you want to delete this announcement?"
        confirmButtonText="Delete"
        cancelButtonText="Cancel"
        isLoading={deleteAnnouncement.isPending}
      />

      <Dialog open={shareOpen} onOpenChange={setShareOpen}>
        <DialogContent className="sm:max-w-xl">
          <DialogHeader>
            <DialogTitle>Share Announcement</DialogTitle>
          </DialogHeader>
          {selected ? (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Shareable Link</Label>
                <div className="flex items-center gap-2">
                  <Input
                    readOnly
                    value={`${window.location.origin}${window.location.pathname}#/present/announcements/${selected.id}`}
                  />
                  <Button
                    variant="outline"
                    onClick={() => {
                      const url = `${window.location.origin}${window.location.pathname}#/present/announcements/${selected.id}`;
                      navigator.clipboard?.writeText(url).catch(() => {});
                    }}
                  >
                    <LinkIcon className="h-4 w-4 mr-2" /> Copy
                  </Button>
                </div>
              </div>
              <div className="space-y-2">
                <Label>Share via WhatsApp</Label>
                <div className="flex gap-2">
                  <Button
                    onClick={() => {
                      const url = `${window.location.origin}${window.location.pathname}#/present/announcements/${selected.id}`;
                      const wa = `https://wa.me/?text=${encodeURIComponent(url)}`;
                      window.open(wa, '_blank');
                    }}
                  >
                    Open WhatsApp
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => {
                      const url = `${window.location.origin}${window.location.pathname}#/present/announcements/${selected.id}`;
                      const waWeb = `https://web.whatsapp.com/send?text=${encodeURIComponent(url)}`;
                      window.open(waWeb, '_blank');
                    }}
                  >
                    WhatsApp Web
                  </Button>
                </div>
              </div>
            </div>
          ) : (
            <div className="text-muted-foreground">No announcement selected</div>
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
        <DialogContent className="sm:max-w-3xl h-[600px] overflow-auto">
          <DialogHeader>
            <DialogTitle>New Announcement</DialogTitle>
          </DialogHeader>

          <div className="space-y-3">
            <Label>Title</Label>
            <Input
              value={formTitle}
              onChange={(e) => setFormTitle(e.target.value)}
              placeholder="Announcement title"
            />
            {errors.title && (
              <div className="text-destructive text-xs">{errors.title}</div>
            )}
            <Label>Description</Label>
            <Textarea
              value={formDescription}
              onChange={(e) => setFormDescription(e.target.value)}
              rows={4}
              placeholder="Short description"
            />
            {errors.description && (
              <div className="text-destructive text-xs">
                {errors.description}
              </div>
            )}
            <div className="flex justify-end pt-2">
              <Button
                onClick={onCreate}
                disabled={createAnnouncement.isPending || saving}
              >
                {createAnnouncement.isPending || saving ? 'Saving…' : 'Save'}
              </Button>
            </div>
          </div>
          <div />
        </DialogContent>
      </Dialog>
    </div>
  );
}
