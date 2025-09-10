import { useState } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Save, Bell, Shield, Database, Globe } from 'lucide-react';

export function Settings() {
  const [settings, setSettings] = useState({
    appName: 'FMT Template',
    appDescription: 'A modern application template',
    adminEmail: 'admin@example.com',
    maxUsers: '1000',
    enableNotifications: true,
    enableAnalytics: true,
    maintenanceMode: false,
  });

  const handleSave = () => {
    // Handle save logic here
    console.log('Settings saved:', settings);
  };

  interface SettingField {
    key: string;
    label: string;
    type: string;
    placeholder?: string;
  }

  interface SettingSection {
    title: string;
    description: string;
    icon: React.ComponentType<{ className?: string }>;
    fields: SettingField[];
  }

  const settingSections: SettingSection[] = [
    {
      title: 'General Settings',
      description: 'Basic application configuration',
      icon: Globe,
      fields: [
        {
          key: 'appName',
          label: 'Application Name',
          type: 'text',
          placeholder: 'Enter application name',
        },
        {
          key: 'appDescription',
          label: 'Application Description',
          type: 'text',
          placeholder: 'Enter application description',
        },
        {
          key: 'adminEmail',
          label: 'Admin Email',
          type: 'email',
          placeholder: 'Enter admin email',
        },
      ],
    },
    {
      title: 'User Management',
      description: 'User-related settings and limits',
      icon: Shield,
      fields: [
        {
          key: 'maxUsers',
          label: 'Maximum Users',
          type: 'number',
          placeholder: 'Enter maximum number of users',
        },
      ],
    },
    {
      title: 'Notifications',
      description: 'Configure notification preferences',
      icon: Bell,
      fields: [
        {
          key: 'enableNotifications',
          label: 'Enable Notifications',
          type: 'checkbox',
        },
      ],
    },
    {
      title: 'System',
      description: 'System-level configuration',
      icon: Database,
      fields: [
        {
          key: 'enableAnalytics',
          label: 'Enable Analytics',
          type: 'checkbox',
        },
        {
          key: 'maintenanceMode',
          label: 'Maintenance Mode',
          type: 'checkbox',
        },
      ],
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Settings</h1>
          <p className="text-gray-600 mt-2">
            Configure your application settings and preferences
          </p>
        </div>
        <Button onClick={handleSave} className="flex items-center space-x-2">
          <Save className="h-4 w-4" />
          <span>Save Changes</span>
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {settingSections.map((section) => {
          const Icon = section.icon;
          return (
            <Card key={section.title}>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Icon className="h-5 w-5" />
                  <span>{section.title}</span>
                </CardTitle>
                <CardDescription>{section.description}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {section.fields.map((field) => (
                    <div key={field.key} className="space-y-2">
                      {field.type === 'checkbox' ? (
                        <div className="flex items-center space-x-2">
                          <input
                            type="checkbox"
                            id={field.key}
                            checked={
                              settings[
                                field.key as keyof typeof settings
                              ] as boolean
                            }
                            onChange={(e) =>
                              setSettings({
                                ...settings,
                                [field.key]: e.target.checked,
                              })
                            }
                            className="rounded border-gray-300"
                          />
                          <Label htmlFor={field.key}>{field.label}</Label>
                        </div>
                      ) : (
                        <>
                          <Label htmlFor={field.key}>{field.label}</Label>
                          <Input
                            id={field.key}
                            type={field.type}
                            value={
                              settings[
                                field.key as keyof typeof settings
                              ] as string
                            }
                            onChange={(e) =>
                              setSettings({
                                ...settings,
                                [field.key]: e.target.value,
                              })
                            }
                            placeholder={field.placeholder || ''}
                          />
                        </>
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-red-600">Danger Zone</CardTitle>
          <CardDescription>
            Irreversible and destructive actions
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="p-4 border border-red-200 rounded-lg bg-red-50">
              <h3 className="font-medium text-red-800">
                Reset Application Data
              </h3>
              <p className="text-sm text-red-600 mt-1">
                This will permanently delete all application data. This action
                cannot be undone.
              </p>
              <Button variant="destructive" className="mt-3">
                Reset Data
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
