import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  BarChart3, 
  TrendingUp, 
  Calendar, 
  Users,
  Download,
  Filter,
  Eye,
  FileText
} from "lucide-react";

export function ReportsInsights() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Reports & Insights</h2>
          <p className="text-muted-foreground">
            Analyze attendance patterns and generate reports
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline">
            <Filter className="w-4 h-4 mr-2" />
            Filter
          </Button>
          <Button>
            <Download className="w-4 h-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      {/* Quick Insights */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Attendance</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">--</div>
            <p className="text-xs text-muted-foreground">
              Last 30 days
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Growth Rate</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">--%</div>
            <p className="text-xs text-muted-foreground">
              Month over month
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Peak Day</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">--</div>
            <p className="text-xs text-muted-foreground">
              Highest attendance
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Consistency</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">--%</div>
            <p className="text-xs text-muted-foreground">
              Regular attendees
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Charts Placeholder */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Attendance Trends</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64 flex items-center justify-center border-2 border-dashed border-muted-foreground/25 rounded-lg">
              <div className="text-center">
                <BarChart3 className="w-12 h-12 text-muted-foreground mx-auto mb-2" />
                <p className="text-muted-foreground">Chart Placeholder</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Member Participation</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64 flex items-center justify-center border-2 border-dashed border-muted-foreground/25 rounded-lg">
              <div className="text-center">
                <Users className="w-12 h-12 text-muted-foreground mx-auto mb-2" />
                <p className="text-muted-foreground">Chart Placeholder</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Report Templates */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Report Templates</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="p-4 border rounded-lg hover:bg-muted/50 transition-colors cursor-pointer">
              <div className="flex items-center gap-3 mb-2">
                <FileText className="w-5 h-5 text-blue-600" />
                <h3 className="font-semibold">Weekly Summary</h3>
              </div>
              <p className="text-sm text-muted-foreground mb-3">
                Overview of weekly attendance patterns
              </p>
              <Button size="sm" variant="outline" className="w-full">
                <Eye className="w-3 h-3 mr-1" />
                Generate
              </Button>
            </div>

            <div className="p-4 border rounded-lg hover:bg-muted/50 transition-colors cursor-pointer">
              <div className="flex items-center gap-3 mb-2">
                <FileText className="w-5 h-5 text-green-600" />
                <h3 className="font-semibold">Monthly Report</h3>
              </div>
              <p className="text-sm text-muted-foreground mb-3">
                Comprehensive monthly attendance analysis
              </p>
              <Button size="sm" variant="outline" className="w-full">
                <Eye className="w-3 h-3 mr-1" />
                Generate
              </Button>
            </div>

            <div className="p-4 border rounded-lg hover:bg-muted/50 transition-colors cursor-pointer">
              <div className="flex items-center gap-3 mb-2">
                <FileText className="w-5 h-5 text-purple-600" />
                <h3 className="font-semibold">Member Insights</h3>
              </div>
              <p className="text-sm text-muted-foreground mb-3">
                Individual member attendance patterns
              </p>
              <Button size="sm" variant="outline" className="w-full">
                <Eye className="w-3 h-3 mr-1" />
                Generate
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Recent Reports */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Recent Reports</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 border rounded-lg">
              <div className="flex items-center gap-3">
                <FileText className="w-4 h-4 text-muted-foreground" />
                <div>
                  <div className="font-medium">Report Name</div>
                  <div className="text-sm text-muted-foreground">Generated on Date</div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="outline">PDF</Badge>
                <Button size="sm" variant="outline">
                  <Download className="w-3 h-3 mr-1" />
                  Download
                </Button>
              </div>
            </div>

            <div className="flex items-center justify-between p-3 border rounded-lg">
              <div className="flex items-center gap-3">
                <FileText className="w-4 h-4 text-muted-foreground" />
                <div>
                  <div className="font-medium">Another Report</div>
                  <div className="text-sm text-muted-foreground">Generated on Date</div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="outline">Excel</Badge>
                <Button size="sm" variant="outline">
                  <Download className="w-3 h-3 mr-1" />
                  Download
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}