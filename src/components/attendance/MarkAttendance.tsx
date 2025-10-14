import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  UserCheck, 
  QrCode, 
  Link,
  Search,
  CheckCircle,
  XCircle,
  Clock
} from "lucide-react";

export function MarkAttendance() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Mark Attendance</h2>
          <p className="text-muted-foreground">
            Record member attendance using different methods
          </p>
        </div>
        <Badge variant="outline">
          <Clock className="w-3 h-3 mr-1" />
          Session Active
        </Badge>
      </div>

      {/* Marking Methods */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="cursor-pointer hover:shadow-md transition-shadow">
          <CardHeader className="text-center">
            <UserCheck className="w-8 h-8 mx-auto text-blue-600 mb-2" />
            <CardTitle className="text-lg">Manual Check-in</CardTitle>
          </CardHeader>
          <CardContent className="text-center">
            <p className="text-sm text-muted-foreground mb-4">
              Manually mark members present or absent
            </p>
            <Button className="w-full">
              Start Manual Check-in
            </Button>
          </CardContent>
        </Card>

        <Card className="cursor-pointer hover:shadow-md transition-shadow">
          <CardHeader className="text-center">
            <QrCode className="w-8 h-8 mx-auto text-green-600 mb-2" />
            <CardTitle className="text-lg">QR Code Scan</CardTitle>
          </CardHeader>
          <CardContent className="text-center">
            <p className="text-sm text-muted-foreground mb-4">
              Members scan QR codes to check themselves in
            </p>
            <Button className="w-full" variant="outline">
              Generate QR Code
            </Button>
          </CardContent>
        </Card>

        <Card className="cursor-pointer hover:shadow-md transition-shadow">
          <CardHeader className="text-center">
            <Link className="w-8 h-8 mx-auto text-purple-600 mb-2" />
            <CardTitle className="text-lg">Public Link</CardTitle>
          </CardHeader>
          <CardContent className="text-center">
            <p className="text-sm text-muted-foreground mb-4">
              Share a link for members to check in online
            </p>
            <Button className="w-full" variant="outline">
              Create Link
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Current Session Info */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Current Session</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center p-4 border rounded-lg">
              <div className="text-2xl font-bold text-green-600">0</div>
              <div className="text-sm text-muted-foreground">Present</div>
            </div>
            <div className="text-center p-4 border rounded-lg">
              <div className="text-2xl font-bold text-red-600">0</div>
              <div className="text-sm text-muted-foreground">Absent</div>
            </div>
            <div className="text-center p-4 border rounded-lg">
              <div className="text-2xl font-bold text-gray-600">0</div>
              <div className="text-sm text-muted-foreground">Total Members</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Member List Placeholder */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-lg">Member List</CardTitle>
          <div className="flex gap-2">
            <Button variant="outline" size="sm">
              <Search className="w-4 h-4 mr-1" />
              Search
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {/* Member Item Placeholder */}
            <div className="flex items-center justify-between p-3 border rounded-lg">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-muted rounded-full"></div>
                <div>
                  <div className="font-medium">Member Name</div>
                  <div className="text-sm text-muted-foreground">Member Info</div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Button size="sm" variant="outline">
                  <CheckCircle className="w-4 h-4 mr-1 text-green-600" />
                  Present
                </Button>
                <Button size="sm" variant="outline">
                  <XCircle className="w-4 h-4 mr-1 text-red-600" />
                  Absent
                </Button>
              </div>
            </div>

            {/* More placeholder items */}
            <div className="flex items-center justify-between p-3 border rounded-lg">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-muted rounded-full"></div>
                <div>
                  <div className="font-medium">Another Member</div>
                  <div className="text-sm text-muted-foreground">Member Info</div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Button size="sm" variant="outline">
                  <CheckCircle className="w-4 h-4 mr-1 text-green-600" />
                  Present
                </Button>
                <Button size="sm" variant="outline">
                  <XCircle className="w-4 h-4 mr-1 text-red-600" />
                  Absent
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Actions */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row gap-3 justify-end">
            <Button variant="outline">
              Save Draft
            </Button>
            <Button>
              Complete Session
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}