import React, { useState } from 'react';
import {
  Settings,
  Plus,
  Edit,
  Trash2,
  Tag,
  Users,
  Shield,
  Briefcase,
  Heart,
  Building,
  UserCheck,
  AlertCircle,
  Loader2,
} from 'lucide-react';
import { Button } from '../../components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '../../components/ui/card';
import { Badge } from '../../components/ui/badge';
import { Label } from '../../components/ui/label';
import { Alert, AlertDescription } from '../../components/ui/alert';
import { toast } from 'sonner';
import { DeleteConfirmationDialog } from '../../components/shared/DeleteConfirmationDialog';
import { useTagsManagement } from '../../hooks/usePeopleConfigurationQueries';
import { TagModal } from '../../components/people/TagModal';
import { TagItemModal } from '../../components/people/TagItemModal';
import { useOrganization } from '../../contexts/OrganizationContext';
import type {
  TagCategory,
  TagItem,
  ComponentStyle,
  TagCategoryFormData,
  TagItemFormData,
} from '../../types/people-configurations';

// Tag icons mapping
const tagIcons: Record<string, React.ComponentType<any>> = {
  membership_categories: Users,
  membership_status: UserCheck,
  leadership_levels: Shield,
  positions: Briefcase,
  ministries: Heart,
  departments: Building,
  groups: Users,
};

// Component style options
const componentStyleOptions: {
  value: ComponentStyle;
  label: string;
  description: string;
}[] = [
  {
    value: 'dropdown',
    label: 'Dropdown',
    description: 'Single selection dropdown',
  },
  {
    value: 'multiselect',
    label: 'Multi-select',
    description: 'Multiple selection dropdown',
  },
  {
    value: 'checkbox',
    label: 'Checkboxes',
    description: 'Multiple checkboxes',
  },
  {
    value: 'radio',
    label: 'Radio buttons',
    description: 'Single selection radio buttons',
  },
  { value: 'list', label: 'List', description: 'Simple list display' },
];

export function PeopleConfigurations() {
  const { currentOrganization } = useOrganization();

  const {
    tagsSchema,
    loading,
    operationLoading,
    error,
    createCategory,
    updateCategory,
    deleteCategory,
    createTagItem,
    updateTagItem,
    deleteTagItem,
  } = useTagsManagement(currentOrganization?.id);

  const [selectedTag, setSelectedTag] = useState<string | null>(null);
  const [editingTag, setEditingTag] = useState<string | null>(null);
  const [editingItem, setEditingItem] = useState<string | null>(null);
  const [showAddTag, setShowAddTag] = useState(false);
  const [showAddItem, setShowAddItem] = useState(false);

  // Form states
  const [tagForm, setTagForm] = useState<TagCategoryFormData>({
    name: '',
    description: '',
    is_required: false,
    component_style: 'dropdown',
    is_active: true,
  });

  const [itemForm, setItemForm] = useState<TagItemFormData>({
    name: '',
    description: '',
    color: '#10B981',
    is_active: true,
  });

  // Confirmation dialog states
  const [deleteTagDialog, setDeleteTagDialog] = useState<{
    isOpen: boolean;
    tagId: string | null;
    tagName: string;
  }>({
    isOpen: false,
    tagId: null,
    tagName: '',
  });

  const [deleteItemDialog, setDeleteItemDialog] = useState<{
    isOpen: boolean;
    itemId: string | null;
    itemName: string;
  }>({
    isOpen: false,
    itemId: null,
    itemName: '',
  });

  // Reset forms
  const resetTagForm = () => {
    setTagForm({
      name: '',
      description: '',
      is_required: false,
      component_style: 'dropdown',
      is_active: true,
    });
  };

  const resetItemForm = () => {
    setItemForm({
      name: '',
      description: '',
      color: '#10B981',
      is_active: true,
    });
  };

  // Handle tag operations
  const handleCreateTag = async () => {
    if (!tagForm.name.trim()) return;

    try {
      const tagKey = tagForm.name
        .toLowerCase()
        .replace(/\s+/g, '_')
        .replace(/[^a-z0-9_]/g, '');
      await createCategory(tagKey, tagForm);
      resetTagForm();
      setShowAddTag(false);
    } catch (err) {
      console.error('Failed to create tag:', err);
      toast.error('Failed to create tag. Please try again.');
    }
  };

  const handleUpdateTag = async (tagKey: string) => {
    try {
      await updateCategory(tagKey, tagForm);
      setEditingTag(null);
      resetTagForm();
    } catch (err) {
      console.error('Failed to update tag:', err);
      toast.error('Failed to update tag. Please try again.');
    }
  };

  const handleDeleteTag = (tagKey: string) => {
    const tag = tagsSchema?.categories[tagKey];
    setDeleteTagDialog({
      isOpen: true,
      tagId: tagKey,
      tagName: tag?.name || tagKey,
    });
  };

  const confirmDeleteTag = async () => {
    if (!deleteTagDialog.tagId) return;

    try {
      await deleteCategory(deleteTagDialog.tagId);
      if (selectedTag === deleteTagDialog.tagId) {
        setSelectedTag(null);
      }
      setDeleteTagDialog({ isOpen: false, tagId: null, tagName: '' });
    } catch (err) {
      console.error('Failed to delete tag:', err);
      toast.error('Failed to delete tag. Please try again.');
    }
  };

  // Handle item operations
  const handleCreateItem = async () => {
    if (!selectedTag || !itemForm.name.trim()) return;

    try {
      await createTagItem(selectedTag, itemForm);
      resetItemForm();
      setShowAddItem(false);
    } catch (err) {
      console.error('Failed to create item:', err);
      toast.error('Failed to create item. Please try again.');
    }
  };

  const handleUpdateItem = async (itemId: string) => {
    if (!selectedTag) return;

    try {
      await updateTagItem(selectedTag, itemId, itemForm);
      setEditingItem(null);
      resetItemForm();
    } catch (err) {
      console.error('Failed to update item:', err);
      toast.error('Failed to update item. Please try again.');
    }
  };

  const handleDeleteItem = (itemId: string) => {
    if (!selectedTag) return;

    const item = tagsSchema?.categories[selectedTag]?.items.find(
      (i: any) => i.id === itemId
    );
    setDeleteItemDialog({
      isOpen: true,
      itemId: itemId,
      itemName: item?.name || 'this item',
    });
  };

  const confirmDeleteItem = async () => {
    if (!selectedTag || !deleteItemDialog.itemId) return;

    try {
      await deleteTagItem(selectedTag, deleteItemDialog.itemId);
      setDeleteItemDialog({ isOpen: false, itemId: null, itemName: '' });
    } catch (err) {
      console.error('Failed to delete item:', err);
      toast.error('Failed to delete item. Please try again.');
    }
  };

  // Start editing
  const startEditingTag = (tagKey: string, tag: TagCategory) => {
    setTagForm({
      name: tag.name,
      description: tag.description,
      is_required: tag.is_required,
      component_style: tag.component_style,
      is_active: tag.is_active,
    });
    setEditingTag(tagKey);
  };

  const startEditingItem = (item: TagItem) => {
    setItemForm({
      name: item.name,
      description: item.description,
      color: item.color,
      is_active: item.is_active,
    });
    setEditingItem(item.id);
  };

  // Show loading if organization is not available yet
  if (!currentOrganization) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        <span className="ml-2 text-muted-foreground">
          Loading organization...
        </span>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        <span className="ml-2 text-muted-foreground">
          Loading configurations...
        </span>
      </div>
    );
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          Failed to load configurations: {error}
        </AlertDescription>
      </Alert>
    );
  }

  const tags = tagsSchema?.categories || {};
  const selectedTagData = selectedTag ? tags[selectedTag] : null;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">
            People Configurations
          </h1>
          <p className="text-muted-foreground">
            Manage member tags and member groupings
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Tags List */}
        <div className="lg:col-span-1">
          <Card>
            <CardHeader>
              <CardTitle className="flex justify-between items-center gap-2">
                <div className="flex items-baseline-last gap-2">
                  <Tag className="h-5 w-5" />
                  Tags
                </div>
                <Button
                  onClick={() => setShowAddTag(true)}
                  className="flex items-center gap-2"
                >
                  <Plus className="h-4 w-4" />
                  Add Tag
                </Button>
              </CardTitle>
              <CardDescription>
                Organize members with customizable tags
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              {Object.entries(tags).length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Tag className="h-12 w-12 mx-auto mb-2 opacity-50" />
                  <p>No tags yet</p>
                  <p className="text-sm">
                    Create your first tag to get started
                  </p>
                </div>
              ) : (
                Object.entries(tags)
                  .sort(
                    ([, a], [, b]) =>
                      (a.display_order || 0) - (b.display_order || 0)
                  )
                  .map(([key, tag]) => {
                    const IconComponent = tagIcons[key] || Tag;
                    const isSelected = selectedTag === key;
                    const isEditing = editingTag === key;

                    return (
                      <div
                        key={key}
                        className={`p-3 rounded-lg border cursor-pointer transition-colors overflow-hidden ${
                          isSelected
                            ? 'border-primary bg-primary/5'
                            : 'border-border hover:border-primary/50'
                        }`}
                        onClick={() => !isEditing && setSelectedTag(key)}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2 flex-1">
                            <IconComponent className="h-4 w-4 text-muted-foreground" />
                            <div className="flex-1">
                              <p className="font-medium text-sm">{tag.name}</p>
                              <p className="text-xs text-muted-foreground">
                                {tag.items.length} items
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-1">
                            {tag.is_required && (
                              <Badge variant="secondary" className="text-xs">
                                Required
                              </Badge>
                            )}
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation();
                                startEditingTag(key, tag);
                              }}
                            >
                              <Edit className="h-3 w-3" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDeleteTag(key);
                              }}
                            >
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    );
                  })
              )}
            </CardContent>
          </Card>
        </div>

        {/* Tag Details and Items */}
        <div className="lg:col-span-2">
          {selectedTagData ? (
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      {React.createElement(tagIcons[selectedTag!] || Tag, {
                        className: 'h-5 w-5',
                      })}
                      {selectedTagData.name}
                    </CardTitle>
                    <CardDescription>
                      {selectedTagData.description}
                    </CardDescription>
                  </div>
                  <Button onClick={() => setShowAddItem(true)} size="sm">
                    <Plus className="h-4 w-4 mr-2" />
                    Add Item
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {/* Tag Settings */}
                  <div className="grid grid-cols-2 gap-4 p-4 bg-muted/50 rounded-lg">
                    <div>
                      <Label className="text-sm font-medium">
                        Component Style
                      </Label>
                      <p className="text-sm text-muted-foreground">
                        {
                          componentStyleOptions.find(
                            (opt) =>
                              opt.value === selectedTagData.component_style
                          )?.label
                        }
                      </p>
                    </div>
                    <div>
                      <Label className="text-sm font-medium">
                        Required Field
                      </Label>
                      <p className="text-sm text-muted-foreground">
                        {selectedTagData.is_required ? 'Yes' : 'No'}
                      </p>
                    </div>
                  </div>

                  {/* Items List */}
                  <div>
                    <Label className="text-sm font-medium mb-2 block">
                      Tag Items
                    </Label>
                    {selectedTagData.items.length === 0 ? (
                      <div className="text-center py-8 text-muted-foreground border border-dashed rounded-lg">
                        <Tag className="h-8 w-8 mx-auto mb-2 opacity-50" />
                        <p>No items in this tag</p>
                        <p className="text-sm">
                          Add items to organize your members
                        </p>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        {selectedTagData.items
                          .sort(
                            (a, b) =>
                              (a.display_order || 0) - (b.display_order || 0)
                          )
                          .map((item) => (
                            <div
                              key={item.id}
                              className="flex items-center justify-between p-3 border rounded-lg"
                            >
                              <div className="flex items-center gap-3">
                                <div
                                  className="w-4 h-4 rounded-full"
                                  style={{ backgroundColor: item.color }}
                                />
                                <div>
                                  <p className="font-medium text-sm">
                                    {item.name}
                                  </p>
                                  <p className="text-xs text-muted-foreground">
                                    {item.description}
                                  </p>
                                </div>
                              </div>
                              <div className="flex items-center gap-1">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => startEditingItem(item)}
                                >
                                  <Edit className="h-3 w-3" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleDeleteItem(item.id)}
                                >
                                  <Trash2 className="h-3 w-3" />
                                </Button>
                              </div>
                            </div>
                          ))}
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="flex items-center justify-center h-64">
                <div className="text-center text-muted-foreground">
                  <Settings className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>Select a tag to view and manage its items</p>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* Tag Modal */}
      <TagModal
        isOpen={showAddTag || editingTag !== null}
        onClose={() => {
          setShowAddTag(false);
          setEditingTag(null);
          resetTagForm();
        }}
        onSave={
          editingTag ? () => handleUpdateTag(editingTag) : handleCreateTag
        }
        formData={tagForm}
        setFormData={setTagForm}
        isEditing={editingTag !== null}
        loading={operationLoading}
      />

      {/* Tag Item Modal */}
      <TagItemModal
        isOpen={showAddItem || editingItem !== null}
        onClose={() => {
          setShowAddItem(false);
          setEditingItem(null);
          resetItemForm();
        }}
        onSave={
          editingItem ? () => handleUpdateItem(editingItem) : handleCreateItem
        }
        formData={itemForm}
        setFormData={setItemForm}
        isEditing={editingItem !== null}
        tagName={selectedTagData?.name}
        loading={operationLoading}
      />

      {/* Delete Tag Confirmation Dialog */}
      <DeleteConfirmationDialog
        isOpen={deleteTagDialog.isOpen}
        onClose={() =>
          setDeleteTagDialog({ isOpen: false, tagId: null, tagName: '' })
        }
        onConfirm={confirmDeleteTag}
        title="Delete Tag"
        description={`Are you sure you want to delete the tag "${deleteTagDialog.tagName}"? This action cannot be undone and will remove all associated items.`}
        confirmButtonText="Delete Tag"
        isLoading={operationLoading}
      />

      {/* Delete Item Confirmation Dialog */}
      <DeleteConfirmationDialog
        isOpen={deleteItemDialog.isOpen}
        onClose={() =>
          setDeleteItemDialog({ isOpen: false, itemId: null, itemName: '' })
        }
        onConfirm={confirmDeleteItem}
        title="Delete Item"
        description={`Are you sure you want to delete "${deleteItemDialog.itemName}"? This action cannot be undone.`}
        confirmButtonText="Delete Item"
        isLoading={operationLoading}
      />
    </div>
  );
}
