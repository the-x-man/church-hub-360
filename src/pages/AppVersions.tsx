import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Plus, Download, Eye } from 'lucide-react';

export function AppVersions() {
  const versions = [
    {
      id: 1,
      version: '1.2.3',
      platform: 'Windows',
      status: 'Published',
      releaseDate: '2024-01-15',
      downloads: 1234,
      size: '45.2 MB',
    },
    {
      id: 2,
      version: '1.2.3',
      platform: 'macOS',
      status: 'Published',
      releaseDate: '2024-01-15',
      downloads: 856,
      size: '42.8 MB',
    },
    {
      id: 3,
      version: '1.2.2',
      platform: 'Windows',
      status: 'Published',
      releaseDate: '2024-01-10',
      downloads: 2156,
      size: '44.9 MB',
    },
    {
      id: 4,
      version: '1.3.0',
      platform: 'Windows',
      status: 'Draft',
      releaseDate: null,
      downloads: 0,
      size: '46.1 MB',
    },
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Published':
        return 'bg-green-100 text-green-700';
      case 'Draft':
        return 'bg-yellow-100 text-yellow-700';
      case 'Deprecated':
        return 'bg-red-100 text-red-700';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };

  const getPlatformColor = (platform: string) => {
    switch (platform) {
      case 'Windows':
        return 'bg-blue-100 text-blue-700';
      case 'macOS':
        return 'bg-gray-100 text-gray-700';
      case 'Linux':
        return 'bg-orange-100 text-orange-700';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">App Versions</h1>
          <p className="text-gray-600 mt-2">
            Manage application releases and versions
          </p>
        </div>
        <Button className="flex items-center space-x-2">
          <Plus className="h-4 w-4" />
          <span>New Version</span>
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Total Versions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-blue-600">12</div>
            <p className="text-sm text-gray-500">Across all platforms</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Total Downloads</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-green-600">4,246</div>
            <p className="text-sm text-gray-500">All time downloads</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Latest Version</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-purple-600">1.2.3</div>
            <p className="text-sm text-gray-500">Released Jan 15, 2024</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Version History</CardTitle>
          <CardDescription>
            All application versions and their release information
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="border rounded-lg">
            <div className="grid grid-cols-7 gap-4 p-4 bg-gray-50 border-b font-medium text-sm text-gray-600">
              <div>Version</div>
              <div>Platform</div>
              <div>Status</div>
              <div>Release Date</div>
              <div>Downloads</div>
              <div>Size</div>
              <div>Actions</div>
            </div>
            
            {versions.map((version) => (
              <div key={version.id} className="grid grid-cols-7 gap-4 p-4 border-b last:border-b-0 hover:bg-gray-50">
                <div className="font-medium">{version.version}</div>
                <div>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${getPlatformColor(version.platform)}`}>
                    {version.platform}
                  </span>
                </div>
                <div>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(version.status)}`}>
                    {version.status}
                  </span>
                </div>
                <div className="text-gray-600">
                  {version.releaseDate || 'Not released'}
                </div>
                <div className="text-gray-600">
                  {version.downloads.toLocaleString()}
                </div>
                <div className="text-gray-600">{version.size}</div>
                <div className="flex items-center space-x-2">
                  <Button variant="ghost" size="sm">
                    <Eye className="h-4 w-4" />
                  </Button>
                  {version.status === 'Published' && (
                    <Button variant="ghost" size="sm">
                      <Download className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}