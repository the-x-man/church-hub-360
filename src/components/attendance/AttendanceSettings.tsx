import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Bell,
  Database,
  Save,
  Settings,
  Shield,
  Users
} from "lucide-react";

export function AttendanceSettings() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Attendance Settings</h2>
          <p className="text-muted-foreground">
            Configure attendance tracking preferences and options
          </p>
        </div>
        <Button>
          <Save className="w-4 h-4 mr-2" />
          Save Changes
        </Button>
      </div>

      {/* General Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Settings className="w-5 h-5" />
            General Settings
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div>
                <h4 className="font-medium mb-2">Default Session Duration</h4>
                <p className="text-sm text-muted-foreground mb-2">
                  How long attendance sessions remain active
                </p>
                <div className="text-sm">Setting placeholder</div>
              </div>
              
              <div>
                <h4 className="font-medium mb-2">Auto-Close Sessions</h4>
                <p className="text-sm text-muted-foreground mb-2">
                  Automatically close sessions after specified time
                </p>
                <div className="text-sm">Setting placeholder</div>
              </div>
            </div>
            
            <div className="space-y-4">
              <div>
                <h4 className="font-medium mb-2">Late Arrival Grace Period</h4>
                <p className="text-sm text-muted-foreground mb-2">
                  Allow check-ins after session start time
                </p>
                <div className="text-sm">Setting placeholder</div>
              </div>
              
              <div>
                <h4 className="font-medium mb-2">Attendance Threshold</h4>
                <p className="text-sm text-muted-foreground mb-2">
                  Minimum time to be marked present
                </p>
                <div className="text-sm">Setting placeholder</div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Marking Options */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Users className="w-5 h-5" />
            Marking Options
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div>
                <h4 className="font-medium mb-2">Default Marking Mode</h4>
                <p className="text-sm text-muted-foreground mb-2">
                  Preferred method for marking attendance
                </p>
                <div className="text-sm">Setting placeholder</div>
              </div>
              
              <div>
                <h4 className="font-medium mb-2">Allow Self Check-in</h4>
                <p className="text-sm text-muted-foreground mb-2">
                  Let members mark their own attendance
                </p>
                <div className="text-sm">Setting placeholder</div>
              </div>
            </div>
            
            <div className="space-y-4">
              <div>
                <h4 className="font-medium mb-2">Require Check-out</h4>
                <p className="text-sm text-muted-foreground mb-2">
                  Members must check out when leaving
                </p>
                <div className="text-sm">Setting placeholder</div>
              </div>
              
              <div>
                <h4 className="font-medium mb-2">Guest Registration</h4>
                <p className="text-sm text-muted-foreground mb-2">
                  Allow visitors to register attendance
                </p>
                <div className="text-sm">Setting placeholder</div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Notifications */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Bell className="w-5 h-5" />
            Notifications
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div>
                <h4 className="font-medium mb-2">Session Reminders</h4>
                <p className="text-sm text-muted-foreground mb-2">
                  Notify leaders before sessions start
                </p>
                <div className="text-sm">Setting placeholder</div>
              </div>
              
              <div>
                <h4 className="font-medium mb-2">Absence Alerts</h4>
                <p className="text-sm text-muted-foreground mb-2">
                  Alert when regular members are absent
                </p>
                <div className="text-sm">Setting placeholder</div>
              </div>
            </div>
            
            <div className="space-y-4">
              <div>
                <h4 className="font-medium mb-2">Report Notifications</h4>
                <p className="text-sm text-muted-foreground mb-2">
                  Email attendance reports automatically
                </p>
                <div className="text-sm">Setting placeholder</div>
              </div>
              
              <div>
                <h4 className="font-medium mb-2">Low Attendance Warnings</h4>
                <p className="text-sm text-muted-foreground mb-2">
                  Alert when attendance drops below threshold
                </p>
                <div className="text-sm">Setting placeholder</div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Privacy & Security */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Shield className="w-5 h-5" />
            Privacy & Security
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div>
                <h4 className="font-medium mb-2">Data Retention</h4>
                <p className="text-sm text-muted-foreground mb-2">
                  How long to keep attendance records
                </p>
                <div className="text-sm">Setting placeholder</div>
              </div>
              
              <div>
                <h4 className="font-medium mb-2">Access Control</h4>
                <p className="text-sm text-muted-foreground mb-2">
                  Who can view and modify attendance data
                </p>
                <div className="text-sm">Setting placeholder</div>
              </div>
            </div>
            
            <div className="space-y-4">
              <div>
                <h4 className="font-medium mb-2">Public Link Security</h4>
                <p className="text-sm text-muted-foreground mb-2">
                  Security settings for public check-in links
                </p>
                <div className="text-sm">Setting placeholder</div>
              </div>
              
              <div>
                <h4 className="font-medium mb-2">Audit Logging</h4>
                <p className="text-sm text-muted-foreground mb-2">
                  Track changes to attendance records
                </p>
                <div className="text-sm">Setting placeholder</div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Integration Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Database className="w-5 h-5" />
            Integration Settings
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div>
                <h4 className="font-medium mb-2">Member Sync</h4>
                <p className="text-sm text-muted-foreground mb-2">
                  Sync with member management system
                </p>
                <div className="text-sm">Setting placeholder</div>
              </div>
              
              <div>
                <h4 className="font-medium mb-2">Calendar Integration</h4>
                <p className="text-sm text-muted-foreground mb-2">
                  Connect with church calendar system
                </p>
                <div className="text-sm">Setting placeholder</div>
              </div>
            </div>
            
            <div className="space-y-4">
              <div>
                <h4 className="font-medium mb-2">Export Format</h4>
                <p className="text-sm text-muted-foreground mb-2">
                  Default format for data exports
                </p>
                <div className="text-sm">Setting placeholder</div>
              </div>
              
              <div>
                <h4 className="font-medium mb-2">Backup Settings</h4>
                <p className="text-sm text-muted-foreground mb-2">
                  Automatic backup configuration
                </p>
                <div className="text-sm">Setting placeholder</div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}