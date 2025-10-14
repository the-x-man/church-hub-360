import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Link, 
  Copy, 
  QrCode, 
  Share,
  Plus,
  Eye,
  Trash2,
} from "lucide-react";

export function PublicLinks() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Public Links</h2>
          <p className="text-muted-foreground">
            Manage public attendance links and QR codes for sessions
          </p>
        </div>
        <Button className="w-fit">
          <Plus className="w-4 h-4 mr-2" />
          Create Link
        </Button>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card className="cursor-pointer hover:shadow-md transition-shadow">
          <CardHeader className="text-center">
            <Link className="w-8 h-8 mx-auto text-blue-600 mb-2" />
            <CardTitle className="text-lg">Generate Session Link</CardTitle>
          </CardHeader>
          <CardContent className="text-center">
            <p className="text-sm text-muted-foreground mb-4">
              Create a public link for members to check in
            </p>
            <Button className="w-full">
              Generate Link
            </Button>
          </CardContent>
        </Card>

        <Card className="cursor-pointer hover:shadow-md transition-shadow">
          <CardHeader className="text-center">
            <QrCode className="w-8 h-8 mx-auto text-green-600 mb-2" />
            <CardTitle className="text-lg">Generate QR Code</CardTitle>
          </CardHeader>
          <CardContent className="text-center">
            <p className="text-sm text-muted-foreground mb-4">
              Create a QR code for easy mobile check-in
            </p>
            <Button className="w-full" variant="outline">
              Generate QR Code
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Active Links */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Active Links</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* Link Item Placeholder */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between p-4 border rounded-lg">
              <div className="flex-1 space-y-2 sm:space-y-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="font-semibold">Session Link Name</h3>
                  <Badge variant="outline" className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300">
                    Active
                  </Badge>
                </div>
                
                <div className="text-sm text-muted-foreground">
                  <div className="flex items-center gap-1 mb-1">
                    <Link className="w-3 h-3" />
                    https://example.com/attendance/session-id
                  </div>
                  <div>Created: Date • Expires: Date • Uses: 0</div>
                </div>
              </div>

              <div className="flex items-center gap-2 mt-3 sm:mt-0">
                <Button variant="outline" size="sm">
                  <Copy className="w-3 h-3 mr-1" />
                  Copy
                </Button>
                <Button variant="outline" size="sm">
                  <QrCode className="w-3 h-3 mr-1" />
                  QR
                </Button>
                <Button variant="outline" size="sm">
                  <Share className="w-3 h-3 mr-1" />
                  Share
                </Button>
              </div>
            </div>

            {/* Another Link Item */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between p-4 border rounded-lg">
              <div className="flex-1 space-y-2 sm:space-y-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="font-semibold">Another Session Link</h3>
                  <Badge variant="outline" className="bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300">
                    Expired
                  </Badge>
                </div>
                
                <div className="text-sm text-muted-foreground">
                  <div className="flex items-center gap-1 mb-1">
                    <Link className="w-3 h-3" />
                    https://example.com/attendance/another-session
                  </div>
                  <div>Created: Date • Expired: Date • Uses: 0</div>
                </div>
              </div>

              <div className="flex items-center gap-2 mt-3 sm:mt-0">
                <Button variant="outline" size="sm">
                  <Eye className="w-3 h-3 mr-1" />
                  View
                </Button>
                <Button variant="outline" size="sm">
                  <Trash2 className="w-3 h-3 mr-1" />
                  Delete
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Link Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Link Settings</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div>
                <h4 className="font-medium mb-2">Default Expiration</h4>
                <p className="text-sm text-muted-foreground">
                  Set how long new links remain active
                </p>
              </div>
              <div>
                <h4 className="font-medium mb-2">Access Control</h4>
                <p className="text-sm text-muted-foreground">
                  Configure who can use public links
                </p>
              </div>
            </div>
            <div className="space-y-4">
              <div>
                <h4 className="font-medium mb-2">Notifications</h4>
                <p className="text-sm text-muted-foreground">
                  Get notified when links are used
                </p>
              </div>
              <div>
                <h4 className="font-medium mb-2">Branding</h4>
                <p className="text-sm text-muted-foreground">
                  Customize the check-in page appearance
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Empty State */}
      <Card>
        <CardContent className="pt-6">
          <div className="text-center py-8">
            <Link className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">No active links</h3>
            <p className="text-muted-foreground mb-4">
              Create your first public attendance link
            </p>
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              Create Link
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}