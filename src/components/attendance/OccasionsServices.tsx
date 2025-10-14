import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Calendar, 
  Clock, 
  MapPin, 
  Users, 
  Plus,
  Edit,
  MoreHorizontal,
  CalendarDays
} from "lucide-react";

export function OccasionsServices() {
  // Mock data for demonstration
  const occasions = [
    {
      id: 1,
      name: "Sunday Morning Service",
      type: "Regular Service",
      date: "2024-01-14",
      time: "10:00 AM",
      location: "Main Sanctuary",
      expectedAttendance: 200,
      status: "upcoming",
      recurring: true
    },
    {
      id: 2,
      name: "Wednesday Bible Study",
      type: "Bible Study",
      date: "2024-01-17",
      time: "7:00 PM",
      location: "Fellowship Hall",
      expectedAttendance: 80,
      status: "upcoming",
      recurring: true
    },
    {
      id: 3,
      name: "Youth Service",
      type: "Youth Event",
      date: "2024-01-19",
      time: "6:00 PM",
      location: "Youth Center",
      expectedAttendance: 45,
      status: "upcoming",
      recurring: false
    },
    {
      id: 4,
      name: "Sunday Evening Service",
      type: "Regular Service",
      date: "2024-01-14",
      time: "6:00 PM",
      location: "Main Sanctuary",
      expectedAttendance: 150,
      status: "completed",
      recurring: true
    }
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case "upcoming":
        return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300";
      case "completed":
        return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300";
      case "cancelled":
        return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300";
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300";
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Occasions & Services</h2>
          <p className="text-muted-foreground">
            Manage church services, events, and special occasions
          </p>
        </div>
        <Button className="w-fit">
          <Plus className="w-4 h-4 mr-2" />
          New Occasion
        </Button>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">This Week</CardTitle>
            <CalendarDays className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">5</div>
            <p className="text-xs text-muted-foreground">
              Scheduled occasions
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Expected Attendance</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">475</div>
            <p className="text-xs text-muted-foreground">
              Total expected this week
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Recurring Services</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">3</div>
            <p className="text-xs text-muted-foreground">
              Regular weekly services
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Occasions List */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Upcoming Occasions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {occasions.map((occasion) => (
              <div
                key={occasion.id}
                className="flex flex-col sm:flex-row sm:items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors"
              >
                <div className="flex-1 space-y-2 sm:space-y-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="font-semibold">{occasion.name}</h3>
                    <Badge variant="outline" className={getStatusColor(occasion.status)}>
                      {occasion.status}
                    </Badge>
                    {occasion.recurring && (
                      <Badge variant="secondary" className="text-xs">
                        Recurring
                      </Badge>
                    )}
                  </div>
                  
                  <div className="flex items-center gap-4 text-sm text-muted-foreground flex-wrap">
                    <div className="flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      {occasion.date}
                    </div>
                    <div className="flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {occasion.time}
                    </div>
                    <div className="flex items-center gap-1">
                      <MapPin className="w-3 h-3" />
                      {occasion.location}
                    </div>
                    <div className="flex items-center gap-1">
                      <Users className="w-3 h-3" />
                      {occasion.expectedAttendance} expected
                    </div>
                  </div>
                  
                  <div className="text-xs text-muted-foreground">
                    {occasion.type}
                  </div>
                </div>

                <div className="flex items-center gap-2 mt-3 sm:mt-0">
                  <Button variant="outline" size="sm">
                    <Edit className="w-3 h-3 mr-1" />
                    Edit
                  </Button>
                  <Button variant="outline" size="sm">
                    <MoreHorizontal className="w-3 h-3" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Quick Actions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            <button className="flex items-center justify-center gap-2 p-3 rounded-lg border border-dashed border-muted-foreground/25 hover:border-muted-foreground/50 hover:bg-muted/50 transition-colors">
              <Plus className="w-4 h-4" />
              <span className="text-sm">Create Service Template</span>
            </button>
            <button className="flex items-center justify-center gap-2 p-3 rounded-lg border border-dashed border-muted-foreground/25 hover:border-muted-foreground/50 hover:bg-muted/50 transition-colors">
              <Calendar className="w-4 h-4" />
              <span className="text-sm">Schedule Special Event</span>
            </button>
            <button className="flex items-center justify-center gap-2 p-3 rounded-lg border border-dashed border-muted-foreground/25 hover:border-muted-foreground/50 hover:bg-muted/50 transition-colors">
              <CalendarDays className="w-4 h-4" />
              <span className="text-sm">View Calendar</span>
            </button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}