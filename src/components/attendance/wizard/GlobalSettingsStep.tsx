import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Checkbox } from '@/components/ui/checkbox';
import { Settings } from 'lucide-react';
import { TagMultiCheckboxRenderer } from '@/components/people/tags/TagMultiCheckboxRenderer';
import { GroupsRenderer, type GroupAssignment } from '@/components/people/groups/GroupsRenderer';
import { MemberSearchTypeahead } from '@/components/shared/MemberSearchTypeahead';
import type { AttendanceMarkingModes } from '@/types/attendance';
import type { RelationalTagWithItems } from '@/hooks/useRelationalTags';
import type { Group } from '@/hooks/useGroups';

interface GlobalSettingsStepProps {
  baseName: string;
  onChangeBaseName: (v: string) => void;
  isOpen: boolean;
  onChangeIsOpen: (v: boolean) => void;
  globalStartISO: string;
  onChangeGlobalStartISO: (v: string) => void;
  globalEndISO: string;
  onChangeGlobalEndISO: (v: string) => void;
  tags: RelationalTagWithItems[];
  // Per-tag values: always multi-select for attendance settings
  allowedTagsByTag: Record<string, string[]>;
  onChangeAllowedTagForTag: (tagId: string, v: string[]) => void;
  groups: Group[];
  allowedGroups: GroupAssignment[];
  onChangeAllowedGroups: (v: GroupAssignment[]) => void;
  organizationId?: string;
  allowedMembers: any[]; // MemberSearchResult[] but avoid import cycle
  onChangeAllowedMembers: (v: any[]) => void;
  markingModes: AttendanceMarkingModes;
  onChangeMarkingModes: (v: AttendanceMarkingModes) => void;
  allowPublicMarking: boolean;
  onChangeAllowPublicMarking: (v: boolean) => void;
  proximityRequired: boolean;
  onChangeProximityRequired: (v: boolean) => void;
  location: { lat?: number; lng?: number; radius?: number };
  onChangeLocation: (loc: { lat?: number; lng?: number; radius?: number }) => void;
}

export function GlobalSettingsStep({
  baseName,
  onChangeBaseName,
  isOpen,
  onChangeIsOpen,
  globalStartISO,
  onChangeGlobalStartISO,
  globalEndISO,
  onChangeGlobalEndISO,
  tags,
  allowedTagsByTag,
  onChangeAllowedTagForTag,
  groups,
  allowedGroups,
  onChangeAllowedGroups,
  organizationId,
  allowedMembers,
  onChangeAllowedMembers,
  markingModes,
  onChangeMarkingModes,
  allowPublicMarking,
  onChangeAllowPublicMarking,
  proximityRequired,
  onChangeProximityRequired,
  location,
  onChangeLocation,
}: GlobalSettingsStepProps) {
  const startTime = new Date(globalStartISO).toTimeString().split(' ')[0].slice(0, 5);
  const endTime = new Date(globalEndISO).toTimeString().split(' ')[0].slice(0, 5);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2"><Settings className="h-4 w-4" /> Global Settings</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>Base Name</Label>
            <Input value={baseName} onChange={(e) => onChangeBaseName(e.target.value)} placeholder="Optional base name" />
            <p className="text-xs text-muted-foreground">Will append the date automatically</p>
          </div>
          <div className="space-y-2">
            <Label>Status</Label>
            <div className='space-y-1'>
              <div className="flex items-center justify-between p-2 border rounded-md">
                <div className="text-sm font-medium">Session Open</div>
              <Switch checked={isOpen} onCheckedChange={onChangeIsOpen} />
              </div>
                <div className="text-xs text-muted-foreground">Allow marking while open</div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>Start Time</Label>
            <Input
              type="time"
              step="60"
              value={startTime}
              onChange={(e) => {
                const [h, m] = e.target.value.split(':').map(Number);
                const base = new Date(globalStartISO);
                const updated = new Date(base);
                updated.setHours(h ?? 0, m ?? 0, 0, 0);
                onChangeGlobalStartISO(updated.toISOString());
              }}
            />
          </div>
          <div className="space-y-2">
            <Label>End Time</Label>
            <Input
              type="time"
              step="60"
              value={endTime}
              onChange={(e) => {
                const [h, m] = e.target.value.split(':').map(Number);
                const base = new Date(globalEndISO);
                const updated = new Date(base);
                updated.setHours(h ?? 0, m ?? 0, 0, 0);
                onChangeGlobalEndISO(updated.toISOString());
              }}
            />
          </div>
        </div>

      
          {/* Allowed Tags */}
            {tags.length > 0 && (
              <div className="space-y-2 my-12">
                <Label>Allowed Tags (Optional)</Label>
                <p className="text-sm text-muted-foreground mb-4">
                  Restrict attendance to members with specific tags
                </p>
                <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
                {tags.map((tag: RelationalTagWithItems) => (
                  <div key={tag.id} className="space-y-2 border border-border p-4 rounded-md">
                    <TagMultiCheckboxRenderer
                      tag={tag}
                      tagKey={tag.id}
                      value={allowedTagsByTag[tag.id] ?? []}
                      onChange={(val) => onChangeAllowedTagForTag(tag.id, val)}
                      className="w-full"
                    />
                  </div>
                ) )}
                </div>
              </div>
            )}

          <div className='pace-y-6 mt-12'>
            {/* Allowed Groups */}
            <div className="space-y-2 mb-6">
              <Label className='mb-4'>Allowed Groups (Optional)</Label>
              <GroupsRenderer
                groups={groups}
                value={allowedGroups}
                onChange={onChangeAllowedGroups}
                allowPositions={false}
              />
            </div>

            {/* Allowed Members */}
            {organizationId && (
              <div className="space-y-2">
                <Label>Allowed Members (Optional)</Label>
                <MemberSearchTypeahead
                  organizationId={organizationId}
                  multiSelect
                  value={allowedMembers as any}
                  onChange={onChangeAllowedMembers as any}
                  placeholder="Search and select members"
                />
              </div>
            )}
          </div>
       

        {/* Marking Modes */}
        <Card className="space-y-2 my-8">
          <CardHeader>
          <CardTitle>Marking Modes</CardTitle>
          <p className="text-sm text-muted-foreground">
            Select how attendance can be marked for this session
          </p>
        </CardHeader>
          <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {(['manual', 'email', 'phone', 'membership_id'] as (keyof AttendanceMarkingModes)[]).map((mode) => (
              <label key={mode} className="flex items-center gap-2 text-sm">
                <Checkbox
                  checked={markingModes[mode]}
                  onCheckedChange={(checked) => onChangeMarkingModes({ ...markingModes, [mode]: Boolean(checked) })}
                />
                <span className="capitalize">{String(mode).replace('_', ' ')}</span>
              </label>
            ))}
          </div>
          </CardContent>
        </Card>

        {/* Public marking */}
        <Card className="my-4 shadow-none">
          <CardContent className='space-y-2'>
            <div className="flex items-center justify-between p-2 border rounded-md">
              <div>
                <div className="text-sm font-medium">Allow Public Marking</div>
                <div className="text-xs text-muted-foreground">Members can self check-in via link</div>
              </div>
              <Switch checked={allowPublicMarking} onCheckedChange={onChangeAllowPublicMarking} />
            </div>

       

          {/* Proximity */}
          <div className="space-y-2">
            <div className="flex items-center justify-between p-2 border rounded-md">
              <div>
                <div className="text-sm font-medium">Require Proximity</div>
                <div className="text-xs text-muted-foreground">Validate location when marking attendance</div>
              </div>
              <Switch checked={proximityRequired} onCheckedChange={onChangeProximityRequired} />
            </div>
            {proximityRequired && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Input type="number" placeholder="Latitude" value={location.lat ?? ''} onChange={(e) => onChangeLocation({ ...location, lat: Number(e.target.value) })} />
                <Input type="number" placeholder="Longitude" value={location.lng ?? ''} onChange={(e) => onChangeLocation({ ...location, lng: Number(e.target.value) })} />
                <Input type="number" placeholder="Radius (m)" value={location.radius ?? ''} onChange={(e) => onChangeLocation({ ...location, radius: Number(e.target.value) })} />
              </div>
            )}
          </div>
         </CardContent>
        </Card>
      </CardContent>
    </Card>
  );
}