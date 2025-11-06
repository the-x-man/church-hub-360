import { DeleteConfirmationDialog } from '@/components/shared/DeleteConfirmationDialog';
import { Pagination } from '@/components/shared/Pagination';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import {
  useAttendanceOccasions,
  useDeleteAttendanceOccasion,
  useToggleAttendanceOccasionStatus,
} from '@/hooks/attendance';
import { useDebounceValue } from '@/hooks/useDebounce';
import { cn } from '@/lib/utils';
import type {
  AttendanceOccasion,
  AttendanceOccasionFilters,
} from '@/types/attendance';
import {
  formatRecurrenceRule,
  getRecurrenceBadgeText,
} from '@/utils/recurrence-formatter';
import {
  Clock,
  Edit,
  MapPin,
  Plus,
  Search,
  ToggleLeft,
  ToggleRight,
  Trash2,
  Users,
  X
} from 'lucide-react';
import { useMemo, useState } from 'react';
import { CreateOccasionForm } from './CreateOccasionForm';
import { EditOccasionForm } from './EditOccasionForm';

export function OccasionsServices() {
  const [filters, setFilters] = useState<AttendanceOccasionFilters>({
    is_active: true,
  });
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [
    editingOccasion,
    setEditingOccasion,
  ] = useState<AttendanceOccasion | null>(null);
  const [deleteDialog, setDeleteDialog] = useState({
    isOpen: false,
    occasionId: null as string | null,
    occasionName: '',
  });

  // Debounce search term to avoid excessive API calls
  const debouncedSearchTerm = useDebounceValue(searchTerm, 1000);

  // Hooks for data fetching and mutations
  const { data: occasions = [], isLoading, error } = useAttendanceOccasions({
    ...filters,
    search: debouncedSearchTerm || undefined,
  });
  const deleteOccasion = useDeleteAttendanceOccasion();
  const toggleStatus = useToggleAttendanceOccasionStatus();

  // Client-side pagination
  const paginatedOccasions = useMemo(() => {
    const startIndex = (currentPage - 1) * pageSize;
    const endIndex = startIndex + pageSize;
    return occasions.slice(startIndex, endIndex);
  }, [occasions, currentPage, pageSize]);

  const totalPages = Math.ceil(occasions.length / pageSize);


  const getStatusColor = (isActive: boolean) => {
    return isActive
      ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300'
      : 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300';
  };

  const handleToggleStatus = (id: string, currentStatus: boolean) => {
    toggleStatus.mutate({ id, isActive: !currentStatus });
  };

  const handleDelete = (id: string, name: string) => {
    setDeleteDialog({
      isOpen: true,
      occasionId: id,
      occasionName: name,
    });
  };

  const handleConfirmDelete = () => {
    if (deleteDialog.occasionId) {
      deleteOccasion.mutate(deleteDialog.occasionId);
      setDeleteDialog({
        isOpen: false,
        occasionId: null,
        occasionName: '',
      });
    }
  };

  const handleCreateSuccess = () => {
    setShowCreateForm(false);
  };

  const handleEditSuccess = () => {
    setEditingOccasion(null);
  };

  const handleCancelDelete = () => {
    setDeleteDialog({
      isOpen: false,
      occasionId: null,
      occasionName: '',
    });
  };

  // Reset to first page when search term or filters change
  const handleSearchChange = (value: string) => {
    setSearchTerm(value);
    setCurrentPage(1);
  };

  const handleFilterChange = (
    newFilters: Partial<AttendanceOccasionFilters>
  ) => {
    setFilters((prev) => ({ ...prev, ...newFilters }));
    setCurrentPage(1);
  };

  const handlePageSizeChange = (newPageSize: number) => {
    setPageSize(newPageSize);
    setCurrentPage(1);
  };

  if (error) {
    return (
      <div className="space-y-6">
        <div className="text-center py-8">
          <p className="text-red-600 dark:text-red-400">
            Error loading occasions: {error.message}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">
            Occasions & Services
          </h2>
          <p className="text-muted-foreground">
            Manage church services, events, and special occasions
          </p>
        </div>
        <Button className="w-fit" onClick={() => setShowCreateForm(true)}>
          <Plus className="w-4 h-4 mr-2" />
          New Occasion
        </Button>
      </div>

      {/* Search and Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
          <Input
            placeholder="Search occasions..."
            value={searchTerm}
            onChange={(e) => handleSearchChange(e.target.value)}
            className="pl-10"
          />
        </div>
        <div className="flex gap-2">
          <Button
            variant={filters.is_active === true ? 'default' : 'outline'}
            size="sm"
            onClick={() => handleFilterChange({ is_active: true })}
          >
            Active
          </Button>
          <Button
            variant={filters.is_active === false ? 'default' : 'outline'}
            size="sm"
            onClick={() => handleFilterChange({ is_active: false })}
          >
            Inactive
          </Button>
          <Button
            variant={filters.is_active === undefined ? 'default' : 'outline'}
            size="sm"
            onClick={() => handleFilterChange({ is_active: undefined })}
          >
            All
          </Button>
        </div>
      </div>

      {/* Occasions List */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">
            {filters.is_active === true
              ? 'Active'
              : filters.is_active === false
              ? 'Inactive'
              : 'All'}{' '}
            Occasions or Services
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-16">
              <p className="text-muted-foreground">Loading occasions...</p>
            </div>
          ) : occasions.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-muted-foreground">
                {searchTerm
                  ? 'No occasions found matching your search.'
                  : 'No occasions found.'}
              </p>
              <Button className="mt-4" onClick={() => setShowCreateForm(true)}>
                <Plus className="w-4 h-4 mr-2" />
                Create New Occasion
              </Button>
            </div>
          ) : (
            <div className="space-y-4 ">
              {paginatedOccasions.map((occasion) => (
                <div
                  key={occasion.id}
                  className="flex flex-col sm:flex-row sm:items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                >
                  <div className="flex-1 space-y-2 sm:space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="font-semibold">{occasion.name}</h3>
                      <Badge
                        variant="outline"
                        className={getStatusColor(occasion.is_active)}
                      >
                        {occasion.is_active ? 'Active' : 'Inactive'}
                      </Badge>
                      {occasion.recurrence_rule && (
                        <Badge variant="secondary" className="text-xs">
                          {getRecurrenceBadgeText(occasion.recurrence_rule)}
                        </Badge>
                      )}
                    </div>

                    {occasion.description && (
                      <p className="text-sm text-muted-foreground">
                        {occasion.description}
                      </p>
                    )}

                    <div className="flex items-center gap-4 text-sm text-muted-foreground flex-wrap">
                      {occasion.branch_name && (
                        <div className="flex items-center gap-1">
                          <MapPin className="w-3 h-3" />
                          {occasion.branch_name}
                        </div>
                      )}
                      {occasion.default_duration_minutes && (
                        <div className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {occasion.default_duration_minutes} minutes
                        </div>
                      )}
                      {occasion.created_by_name && (
                        <div className="flex items-center gap-1">
                          <Users className="w-3 h-3" />
                          Created by {occasion.created_by_name}
                        </div>
                      )}
                    </div>

                    {occasion.recurrence_rule && (
                      <div className="text-xs text-muted-foreground">
                        Recurrence:{' '}
                        {formatRecurrenceRule(occasion.recurrence_rule)}
                      </div>
                    )}
                  </div>

                  <div className="flex items-center gap-2 mt-3 sm:mt-0">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setEditingOccasion(occasion)}
                    >
                      <Edit className="w-3 h-3 mr-1" />
                      Edit
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDelete(occasion.id, occasion.name)}
                      disabled={deleteOccasion.isPending}
                      className="text-red-600 hover:text-red-700"
                    >
                      <Trash2 className="w-3 h-3" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() =>
                        handleToggleStatus(occasion.id, occasion.is_active)
                      }
                      disabled={toggleStatus.isPending}
                      className={cn(
                        'border',
                        occasion.is_active
                          ? 'bg-red-600/5 text-red-500 border-red-200 hover:bg-red-600/10 hover:text-red-600 dark:text-red-500'
                          : 'bg-green-600/5 text-green-500 border-green-200 hover:bg-green-600/10 hover:text-green-600 dark:text-green-500'
                      )}
                    >
                      {occasion.is_active ? (
                        <ToggleRight className="w-3 h-3 mr-1" />
                      ) : (
                        <ToggleLeft className="w-3 h-3 mr-1" />
                      )}
                      {occasion.is_active ? 'Deactivate' : 'Activate'}
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Pagination Controls */}
          {occasions.length > 0 && (
            <div className="px-4 py-3 border-t mt-2">
              <Pagination
                currentPage={currentPage}
                totalPages={Math.max(1, totalPages)}
                pageSize={pageSize}
                totalItems={occasions.length}
                onPageChange={(page) =>
                  setCurrentPage(Math.min(Math.max(1, page), Math.max(1, totalPages)))
                }
                onPageSizeChange={(size) => handlePageSizeChange(size)}
                itemName="occasions"
                pageSizeOptions={[5, 10, 20, 50]}
              />
            </div>
          )}
        </CardContent>
      </Card>

      {/* Delete Confirmation Dialog */}
      <DeleteConfirmationDialog
        isOpen={deleteDialog.isOpen}
        onClose={handleCancelDelete}
        onConfirm={handleConfirmDelete}
        title="Delete Occasion"
        description={`Are you sure you want to delete "${deleteDialog.occasionName}"? This action cannot be undone.`}
        confirmButtonText="Delete"
        cancelButtonText="Cancel"
        isLoading={deleteOccasion.isPending}
      />

      {/* Create Occasion Form Modal */}
      {showCreateForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-background rounded-lg shadow-lg w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b">
              <h3 className="text-lg font-semibold">Create New Occasion</h3>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowCreateForm(false)}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
            <div className="p-6">
              <CreateOccasionForm
                onSuccess={handleCreateSuccess}
                onCancel={() => setShowCreateForm(false)}
              />
            </div>
          </div>
        </div>
      )}

      {/* Edit Occasion Form Modal */}
      {editingOccasion && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-background rounded-lg shadow-lg w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b">
              <h3 className="text-lg font-semibold">Edit Occasion</h3>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setEditingOccasion(null)}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
            <div className="p-6">
              <EditOccasionForm
                occasion={editingOccasion}
                onSuccess={handleEditSuccess}
                onCancel={() => setEditingOccasion(null)}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
