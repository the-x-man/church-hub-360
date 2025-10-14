import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Calendar, 
  Clock, 
  Users, 
  Plus,
  Search,
  Filter,
  Eye,
  Edit
} from "lucide-react";

export function AttendanceSessions() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Attendance Sessions</h2>
          <p className="text-muted-foreground">
            View and manage attendance records for all sessions
          </p>
        </div>
        <Button className="w-fit">
          <Plus className="w-4 h-4 mr-2" />
          New Session
        </Button>
      </div>

      {/* Filters and Search */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                <input
                  type="text"
                  placeholder="Search sessions..."
                  className="w-full pl-10 pr-4 py-2 border rounded-md bg-background"
                />
              </div>
            </div>
            <Button variant="outline">
              <Filter className="w-4 h-4 mr-2" />
              Filter
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Sessions List */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Recent Sessions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* Session Item Placeholder */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors">
              <div className="flex-1 space-y-2 sm:space-y-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="font-semibold">Session Name</h3>
                  <Badge variant="outline">Status</Badge>
                </div>
                
                <div className="flex items-center gap-4 text-sm text-muted-foreground flex-wrap">
                  <div className="flex items-center gap-1">
                    <Calendar className="w-3 h-3" />
                    Date
                  </div>
                  <div className="flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    Time
                  </div>
                  <div className="flex items-center gap-1">
                    <Users className="w-3 h-3" />
                    Attendance Count
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2 mt-3 sm:mt-0">
                <Button variant="outline" size="sm">
                  <Eye className="w-3 h-3 mr-1" />
                  View
                </Button>
                <Button variant="outline" size="sm">
                  <Edit className="w-3 h-3 mr-1" />
                  Edit
                </Button>
              </div>
            </div>

            {/* More placeholder items */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors">
              <div className="flex-1 space-y-2 sm:space-y-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="font-semibold">Another Session</h3>
                  <Badge variant="outline">Status</Badge>
                </div>
                
                <div className="flex items-center gap-4 text-sm text-muted-foreground flex-wrap">
                  <div className="flex items-center gap-1">
                    <Calendar className="w-3 h-3" />
                    Date
                  </div>
                  <div className="flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    Time
                  </div>
                  <div className="flex items-center gap-1">
                    <Users className="w-3 h-3" />
                    Attendance Count
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2 mt-3 sm:mt-0">
                <Button variant="outline" size="sm">
                  <Eye className="w-3 h-3 mr-1" />
                  View
                </Button>
                <Button variant="outline" size="sm">
                  <Edit className="w-3 h-3 mr-1" />
                  Edit
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Empty State Placeholder */}
      <Card>
        <CardContent className="pt-6">
          <div className="text-center py-8">
            <Calendar className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">No sessions found</h3>
            <p className="text-muted-foreground mb-4">
              Create your first attendance session to get started
            </p>
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              Create Session
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}