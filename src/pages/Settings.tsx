import { Bell, Building2, Palette, Save, Trash2 } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Button } from '../components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '../components/ui/card';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../components/ui/select';
import { Switch } from '../components/ui/switch';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '../components/ui/tabs';
import { Textarea } from '../components/ui/textarea';
import { useOrganization } from '../contexts/OrganizationContext';

import { LogoSettingsMenu } from '../components/shared/LogoSettingsMenu';
import { OrganizationLogo } from '../components/shared/OrganizationLogo';
import { ThemeSelector } from '../components/shared/ThemeSelector';
import { ThemeSwitcher } from '../components/shared/ThemeSwitcher';
import type {
  LogoBackgroundSize,
  LogoOrientation,
  UpdateOrganizationData,
} from '../types/organizations';

export function Settings() {
  const { currentOrganization, updateOrganization } = useOrganization();

  const [orgData, setOrgData] = useState({
    name: '',
    email: '',
    phone: '',
    address: '',
    currency: 'GHS',
  });
  const [logoSettings, setLogoSettings] = useState({
    orientation: 'square' as LogoOrientation,
    backgroundSize: 'contain' as LogoBackgroundSize,
  });
  const [notificationSettings, setNotificationSettings] = useState({
    roleChanges: true,
    securityAlerts: true,
    appUpdates: true,
    newUserAdded: true,
  });
  const [isSavingOrgData, setIsSavingOrgData] = useState(false);

  // Load organization data on mount
  useEffect(() => {
    if (currentOrganization) {
      setOrgData({
        name: currentOrganization.name || '',
        email: currentOrganization.email || '',
        phone: currentOrganization.phone || '',
        address: currentOrganization.address || '',
        currency: currentOrganization.currency || 'GHS',
      });
      setLogoSettings({
        orientation: currentOrganization.logo_settings?.orientation || 'square',
        backgroundSize:
          currentOrganization.logo_settings?.backgroundSize || 'contain',
      });
      setNotificationSettings({
        roleChanges:
          currentOrganization.notification_settings?.roleChanges ?? true,
        securityAlerts:
          currentOrganization.notification_settings?.securityAlerts ?? true,
        appUpdates:
          currentOrganization.notification_settings?.appUpdates ?? true,
        newUserAdded:
          currentOrganization.notification_settings?.newUserAdded ?? true,
      });
    }
  }, [currentOrganization]);

  const handleSaveOrganizationDetails = async () => {
    if (!currentOrganization) return;

    setIsSavingOrgData(true);
    try {
      const updateData: UpdateOrganizationData = {
        id: currentOrganization.id,
        ...orgData,
        logo_settings: logoSettings,
      };

      await updateOrganization(updateData);
    } catch (error) {
      console.error('Error updating organization:', error);
    } finally {
      setIsSavingOrgData(false);
    }
  };

  const handleLogoUpload = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];
    if (!file || !currentOrganization || !updateOrganization) return;

    // In a real app, you would upload to a file storage service
    // For now, we'll just create a data URL
    const reader = new FileReader();
    reader.onload = async (e) => {
      const logoUrl = e.target?.result as string;
      try {
        await updateOrganization({
          id: currentOrganization.id,
          logo: logoUrl,
        });
      } catch (error) {
        console.error('Error updating logo:', error);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleRemoveLogo = async () => {
    if (!currentOrganization || !updateOrganization) return;

    try {
      await updateOrganization({
        id: currentOrganization.id,
        logo: undefined,
      });
    } catch (error) {
      console.error('Error removing logo:', error);
    }
  };
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Organization Settings</h1>
          <p className="text-muted-foreground mt-2">
            Configure your organization details, branding, and preferences
          </p>
        </div>
      </div>

      <Tabs defaultValue="organization" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger
            value="organization"
            className="flex items-center space-x-2"
          >
            <Building2 className="h-4 w-4" />
            <span>Organization Details</span>
          </TabsTrigger>
          <TabsTrigger
            value="appearance"
            className="flex items-center space-x-2"
          >
            <Palette className="h-4 w-4" />
            <span>Appearance</span>
          </TabsTrigger>
          <TabsTrigger
            value="notifications"
            className="flex items-center space-x-2"
          >
            <Bell className="h-4 w-4" />
            <span>Notifications</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="organization" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Organization Details</CardTitle>
              <CardDescription>
                Basic information about your organization
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Organization Name</Label>
                  <Input
                    id="name"
                    value={orgData.name}
                    onChange={(e) =>
                      setOrgData((prev) => ({ ...prev, name: e.target.value }))
                    }
                    placeholder="Enter organization name"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={orgData.email}
                    onChange={(e) =>
                      setOrgData((prev) => ({ ...prev, email: e.target.value }))
                    }
                    placeholder="Enter organization email"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone">Phone</Label>
                  <Input
                    id="phone"
                    value={orgData.phone}
                    onChange={(e) =>
                      setOrgData((prev) => ({ ...prev, phone: e.target.value }))
                    }
                    placeholder="Enter phone number"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="currency">Currency</Label>
                  <Select
                    value={orgData.currency}
                    onValueChange={(value) =>
                      setOrgData((prev) => ({ ...prev, currency: value }))
                    }
                  >
                    <SelectTrigger className="min-w-[200px]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="GHS">GHS</SelectItem>
                      <SelectItem value="USD">USD</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="address">Address</Label>
                <Textarea
                  id="address"
                  value={orgData.address}
                  onChange={(e) =>
                    setOrgData((prev) => ({ ...prev, address: e.target.value }))
                  }
                  placeholder="Enter organization address"
                  rows={3}
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Organization Logo</CardTitle>
              <CardDescription>
                Upload and configure your organization's logo
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-start space-x-6">
                <div className="flex flex-col items-center space-y-4">
                  <OrganizationLogo
                    src={currentOrganization?.logo}
                    fallback={currentOrganization?.name.substring(0, 3)}
                    size="xl"
                    orientation={logoSettings.orientation}
                    backgroundSize={logoSettings.backgroundSize}
                    className="border-2 border-dashed border-border"
                  />
                  <div className="flex items-center space-x-2">
                    <LogoSettingsMenu
                      logoOrientation={logoSettings.orientation}
                      logoBackgroundSize={logoSettings.backgroundSize}
                      setOrientation={(orientation) =>
                        setLogoSettings((prev) => ({ ...prev, orientation }))
                      }
                      setBackgroundSize={(backgroundSize) =>
                        setLogoSettings((prev) => ({ ...prev, backgroundSize }))
                      }
                    />
                  </div>
                </div>
                <div className="flex-1 space-y-4">
                  <div>
                    <Label
                      htmlFor="logo-upload"
                      className="text-base font-medium"
                    >
                      Upload Logo
                    </Label>
                    <div className="mt-2">
                      <Input
                        id="logo-upload"
                        type="file"
                        accept="image/*"
                        onChange={handleLogoUpload}
                        className="file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-medium file:bg-primary file:text-primary-foreground hover:file:bg-primary/90"
                      />
                    </div>
                    <p className="text-sm text-muted-foreground mt-1">
                      Recommended: PNG or SVG format, max 2MB
                    </p>
                  </div>
                  {currentOrganization?.logo && (
                    <Button
                      variant="outline"
                      onClick={handleRemoveLogo}
                      className="flex items-center space-x-2"
                    >
                      <Trash2 className="h-4 w-4" />
                      <span>Remove Logo</span>
                    </Button>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="flex justify-end">
            <Button
              onClick={handleSaveOrganizationDetails}
              disabled={isSavingOrgData}
              className="flex items-center space-x-2"
            >
              <Save className="h-4 w-4" />
              <span>{isSavingOrgData ? 'Saving...' : 'Save Changes'}</span>
            </Button>
          </div>
        </TabsContent>

        <TabsContent value="appearance" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Theme Settings</CardTitle>
              <CardDescription>
                Switch between light and dark modes
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ThemeSwitcher />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Theme Selection</CardTitle>
              <CardDescription>
                Choose from predefined themes, custom themes, or create custom
                colors
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <ThemeSelector />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="notifications" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Notification Preferences</CardTitle>
              <CardDescription>
                Configure which notifications you want to receive
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <Label
                    htmlFor="roleChanges"
                    className="text-base font-medium"
                  >
                    Role Changes
                  </Label>
                  <p className="text-sm text-muted-foreground">
                    Get notified when user roles are modified
                  </p>
                </div>
                <Switch
                  id="roleChanges"
                  checked={notificationSettings.roleChanges}
                  onCheckedChange={(checked) =>
                    setNotificationSettings((prev) => ({
                      ...prev,
                      roleChanges: checked,
                    }))
                  }
                />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <Label
                    htmlFor="securityAlerts"
                    className="text-base font-medium"
                  >
                    Security Alerts
                  </Label>
                  <p className="text-sm text-muted-foreground">
                    Important security notifications and alerts
                  </p>
                </div>
                <Switch
                  id="securityAlerts"
                  checked={notificationSettings.securityAlerts}
                  onCheckedChange={(checked) =>
                    setNotificationSettings((prev) => ({
                      ...prev,
                      securityAlerts: checked,
                    }))
                  }
                />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="appUpdates" className="text-base font-medium">
                    App Updates
                  </Label>
                  <p className="text-sm text-muted-foreground">
                    Notifications about new features and updates
                  </p>
                </div>
                <Switch
                  id="appUpdates"
                  checked={notificationSettings.appUpdates}
                  onCheckedChange={(checked) =>
                    setNotificationSettings((prev) => ({
                      ...prev,
                      appUpdates: checked,
                    }))
                  }
                />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <Label
                    htmlFor="newUserAdded"
                    className="text-base font-medium"
                  >
                    New Users
                  </Label>
                  <p className="text-sm text-muted-foreground">
                    Get notified when new users join the organization
                  </p>
                </div>
                <Switch
                  id="newUserAdded"
                  checked={notificationSettings.newUserAdded}
                  onCheckedChange={(checked) =>
                    setNotificationSettings((prev) => ({
                      ...prev,
                      newUserAdded: checked,
                    }))
                  }
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
