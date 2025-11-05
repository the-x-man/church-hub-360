import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Link as LinkIcon, QrCode } from 'lucide-react';

export function LinksQrCard() {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Links & QR</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground mb-4">
          Generate public links and QR codes for this session. Coming soon.
        </p>
        <div className="grid grid-cols-2 gap-2">
          <Button variant="outline" disabled>
            <LinkIcon className="w-4 h-4 mr-2" /> Generate Link
          </Button>
          <Button variant="outline" disabled>
            <QrCode className="w-4 h-4 mr-2" /> Generate QR
          </Button>
        </div>
        <Separator className="my-4" />
        <div className="text-xs text-muted-foreground">
          This area will include link configuration, expiration, and QR styling options.
        </div>
      </CardContent>
    </Card>
  );
}