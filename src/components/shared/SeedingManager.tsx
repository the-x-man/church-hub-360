import { useState } from 'react';
import { Button } from '../ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '../ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '../ui/dialog';
import { Label } from '../ui/label';
import { Switch } from '../ui/switch';
import { Badge } from '../ui/badge';
import { 
  Database, 
  RefreshCw, 
  CheckCircle, 
  AlertCircle,
  Info
} from 'lucide-react';
import { useOrganizationSeeding, useSeedingMonitoring } from '../../hooks/useSeedingOperations';
import { useOrganization } from '../../contexts/OrganizationContext';
import { toast } from 'sonner';

interface SeedingManagerProps {
  organizationId?: string;
  showStats?: boolean;
  compact?: boolean;
}

export function SeedingManager({ 
  organizationId, 
  showStats = true, 
  compact = false 
}: SeedingManagerProps) {
  const { currentOrganization } = useOrganization();
  const targetOrgId = organizationId || currentOrganization?.id;
  
  const {
    hasConfiguration,
    isCheckingConfiguration,
    seedThisOrganization,
    seedThisOrganizationIfNeeded,
    updateThisOrganization,
    isSeeding,
    refetchHasConfiguration,
  } = useOrganizationSeeding(targetOrgId || '');

  const { stats, refetchStats } = useSeedingMonitoring();

  const [seedingOptions, setSeedingOptions] = useState({
    useMinimalSchema: false,
    forceUpdate: false,
  });

  const [isDialogOpen, setIsDialogOpen] = useState(false);

  if (!targetOrgId) {
    return (
      <Card className="border-dashed">
        <CardContent className="flex items-center justify-center py-6">
          <div className="text-center">
            <AlertCircle className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
            <p className="text-sm text-muted-foreground">
              No organization selected
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const handleSeed = async () => {
    try {
      if (hasConfiguration && !seedingOptions.forceUpdate) {
        await seedThisOrganizationIfNeeded({
          useMinimalSchema: seedingOptions.useMinimalSchema,
        });
        toast.success('Organization already has configuration');
      } else if (seedingOptions.forceUpdate) {
        await updateThisOrganization({
          useMinimalSchema: seedingOptions.useMinimalSchema,
        });
        toast.success('Configuration updated successfully');
      } else {
        await seedThisOrganization({
          useMinimalSchema: seedingOptions.useMinimalSchema,
        });
        toast.success('Organization seeded successfully');
      }
      
      await refetchHasConfiguration();
      await refetchStats();
      setIsDialogOpen(false);
    } catch (error) {
      console.error('Seeding failed:', error);
      toast.error('Failed to seed organization');
    }
  };

  const ConfigurationStatus = () => {
    if (isCheckingConfiguration) {
      return (
        <Badge variant="secondary" className="gap-1">
          <RefreshCw className="h-3 w-3 animate-spin" />
          Checking...
        </Badge>
      );
    }

    return hasConfiguration ? (
      <Badge variant="default" className="gap-1">
        <CheckCircle className="h-3 w-3" />
        Configured
      </Badge>
    ) : (
      <Badge variant="destructive" className="gap-1">
        <AlertCircle className="h-3 w-3" />
        Not Configured
      </Badge>
    );
  };

  const SeedingDialog = () => (
    <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
      <DialogTrigger asChild>
        <Button 
          variant={hasConfiguration ? "outline" : "default"} 
          size={compact ? "sm" : "default"}
          className="gap-2"
        >
          <Database className="h-4 w-4" />
          {hasConfiguration ? 'Update Configuration' : 'Seed Configuration'}
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>
            {hasConfiguration ? 'Update' : 'Seed'} People Configuration
          </DialogTitle>
          <DialogDescription>
            {hasConfiguration 
              ? 'Update the existing people configuration with new defaults.'
              : 'Initialize this organization with default people management categories and tags.'
            }
          </DialogDescription>
        </DialogHeader>
        
        <div className="grid gap-4 py-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="minimal-schema">Use Minimal Schema</Label>
              <p className="text-xs text-muted-foreground">
                Only include basic membership categories and status
              </p>
            </div>
            <Switch
              id="minimal-schema"
              checked={seedingOptions.useMinimalSchema}
              onCheckedChange={(checked) =>
                setSeedingOptions(prev => ({ ...prev, useMinimalSchema: checked }))
              }
            />
          </div>
          
          {hasConfiguration && (
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="force-update">Force Update</Label>
                <p className="text-xs text-muted-foreground">
                  Override existing configuration with new defaults
                </p>
              </div>
              <Switch
                id="force-update"
                checked={seedingOptions.forceUpdate}
                onCheckedChange={(checked) =>
                  setSeedingOptions(prev => ({ ...prev, forceUpdate: checked }))
                }
              />
            </div>
          )}

          <div className="rounded-lg border p-3 bg-muted/50">
            <div className="flex items-start gap-2">
              <Info className="h-4 w-4 text-blue-500 mt-0.5 flex-shrink-0" />
              <div className="text-xs text-muted-foreground">
                <p className="font-medium text-foreground mb-1">What will be created:</p>
                <ul className="space-y-1">
                  <li>• Membership categories and status</li>
                  {!seedingOptions.useMinimalSchema && (
                    <>
                      <li>• Leadership levels and positions</li>
                      <li>• Ministry and department categories</li>
                      <li>• Fellowship groups and committees</li>
                    </>
                  )}
                </ul>
              </div>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => setIsDialogOpen(false)}
            disabled={isSeeding}
          >
            Cancel
          </Button>
          <Button
            onClick={handleSeed}
            disabled={isSeeding}
            className="gap-2"
          >
            {isSeeding ? (
              <>
                <RefreshCw className="h-4 w-4 animate-spin" />
                {hasConfiguration ? 'Updating...' : 'Seeding...'}
              </>
            ) : (
              <>
                <Database className="h-4 w-4" />
                {hasConfiguration ? 'Update' : 'Seed'} Configuration
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );

  if (compact) {
    return (
      <div className="flex items-center gap-2">
        <ConfigurationStatus />
        <SeedingDialog />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="h-5 w-5" />
            People Configuration
          </CardTitle>
          <CardDescription>
            Manage default categories and tags for people management
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium">Configuration Status</p>
              <p className="text-xs text-muted-foreground">
                Current state of people management configuration
              </p>
            </div>
            <ConfigurationStatus />
          </div>

          <div className="flex gap-2">
            <SeedingDialog />
            <Button
              variant="outline"
              size="sm"
              onClick={() => refetchHasConfiguration()}
              disabled={isCheckingConfiguration}
              className="gap-2"
            >
              <RefreshCw className={`h-4 w-4 ${isCheckingConfiguration ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
          </div>
        </CardContent>
      </Card>

      {showStats && stats && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Seeding Statistics</CardTitle>
            <CardDescription>
              Overview of seeded organizations
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4">
              <div className="text-center">
                <p className="text-2xl font-bold text-primary">{stats.totalSeeded}</p>
                <p className="text-xs text-muted-foreground">Total Seeded</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-green-600">{stats.recentlySeeded}</p>
                <p className="text-xs text-muted-foreground">This Week</p>
              </div>
            </div>
            
            {Object.keys(stats.categoriesDistribution).length > 0 && (
              <div className="mt-4">
                <p className="text-sm font-medium mb-2">Popular Categories</p>
                <div className="flex flex-wrap gap-1">
                  {Object.entries(stats.categoriesDistribution)
                    .sort(([,a], [,b]) => b - a)
                    .slice(0, 5)
                    .map(([category, count]) => (
                      <Badge key={category} variant="secondary" className="text-xs">
                        {category.replace(/_/g, ' ')}: {count}
                      </Badge>
                    ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}