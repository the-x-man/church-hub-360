import { format } from 'date-fns';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Calendar, Clock, MapPin, Tag, Users, CheckSquare } from 'lucide-react';
import type { AttendanceSessionWithRelations } from '@/types/attendance';
import { Separator } from '@/components/ui/separator';

interface SessionInfoCardProps {
  session: AttendanceSessionWithRelations;
  allowedTagLabels: string[];
}

const formattedDateTime = (iso: string) =>
  format(new Date(iso), "MMM dd, yyyy 'at' h:mm a");
const formattedTime = (iso: string) => format(new Date(iso), 'h:mm a');

export function SessionInfoCard({
  session,
  allowedTagLabels,
}: SessionInfoCardProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">
          {session.name || session.occasion_name || 'Session'}
        </CardTitle>
        {session.occasion_name && (
          <CardDescription>Occasion: {session.occasion_name}</CardDescription>
        )}
        <Separator className="mt-2" />
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2 text-sm">
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4" />{' '}
              {formattedDateTime(session.start_time)}
            </div>
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4" /> {formattedTime(session.start_time)}{' '}
              - {formattedTime(session.end_time)}
            </div>
            {session.location && (
              <div className="flex items-center gap-2">
                <MapPin className="w-4 h-4" />{' '}
                {`${session.location.lat}, ${session.location.lng}`}{' '}
                {session.location.radius ? `• ${session.location.radius}m` : ''}
              </div>
            )}

            {/* Marking Modes */}
            <div className="my-4">
              <div className="flex items-center gap-2 text-xs uppercase tracking-wide text-muted-foreground">
                <CheckSquare className="w-3 h-3" /> Marking Modes
              </div>
              {(() => {
                const modes = session.marking_modes || {
                  manual: false,
                  email: false,
                  phone: false,
                  membership_id: false,
                };
                const entries = Object.entries(modes).filter(([_, v]) => !!v);
                const label = (key: string) => {
                  switch (key) {
                    case 'manual':
                      return 'Manual';
                    case 'email':
                      return 'Email';
                    case 'phone':
                      return 'Phone';
                    case 'membership_id':
                      return 'Member ID';
                    default:
                      return key;
                  }
                };
                return entries.length > 0 ? (
                  <div className="mt-2 flex flex-wrap gap-2">
                    {entries.map(([key]) => (
                      <Badge
                        key={key}
                        variant="secondary"
                        className="px-2 py-1 text-xs"
                      >
                        {label(key)}
                      </Badge>
                    ))}
                  </div>
                ) : (
                  <div className="mt-1 text-muted-foreground">None</div>
                );
              })()}
            </div>
          </div>
          <div className="space-y-3 text-sm">
            <div>
              <div className="flex items-center gap-2 text-xs uppercase tracking-wide text-muted-foreground">
                <Tag className="w-3 h-3" /> Allowed Tags
              </div>
              {(session.allowed_tags?.length || 0) > 0 ? (
                <div className="mt-2">
                  <div className="flex flex-wrap gap-2">
                    {allowedTagLabels.slice(0, 8).map((label) => (
                      <Badge
                        key={label}
                        variant="secondary"
                        className="px-2 py-1"
                      >
                        {label}
                      </Badge>
                    ))}
                    {allowedTagLabels.length > 8 && (
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button
                            variant="outline"
                            size="sm"
                            className="h-7 px-2"
                          >
                            +{allowedTagLabels.length - 8} more
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-64" align="start">
                          <ScrollArea className="h-40">
                            <div className="flex flex-wrap gap-2">
                              {allowedTagLabels.map((label) => (
                                <Badge
                                  key={label}
                                  variant="secondary"
                                  className="px-2 py-1"
                                >
                                  {label}
                                </Badge>
                              ))}
                            </div>
                          </ScrollArea>
                        </PopoverContent>
                      </Popover>
                    )}
                  </div>
                </div>
              ) : (
                <div className="mt-1 text-muted-foreground">None</div>
              )}
            </div>

            <div>
              <div className="flex items-center gap-2 text-xs uppercase tracking-wide text-muted-foreground">
                <Users className="w-3 h-3" /> Allowed Groups
              </div>
              {(session.allowed_groups?.length || 0) > 0 ? (
                <div className="mt-1">
                  <Badge variant="outline" className="px-2 py-1">
                    {session.allowed_groups?.length} group(s)
                  </Badge>
                </div>
              ) : (
                <div className="mt-1 text-muted-foreground">None</div>
              )}
            </div>

            <div>
              <div className="flex items-center gap-2 text-xs uppercase tracking-wide text-muted-foreground">
                <Users className="w-3 h-3" /> Allowed Members
              </div>
              {(session.allowed_members?.length || 0) > 0 ? (
                <div className="mt-1">
                  <Badge variant="outline" className="px-2 py-1">
                    {session.allowed_members?.length} member(s)
                  </Badge>
                </div>
              ) : (
                <div className="mt-1 text-muted-foreground">None</div>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
