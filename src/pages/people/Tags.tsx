import { useState } from 'react';
import { AlertCircle, Plus, Tag as TagIcon } from 'lucide-react';
import { Alert, AlertDescription } from '../../components/ui/alert';
import { Button } from '../../components/ui/button';
import {
  Card,
  CardContent,
} from '../../components/ui/card';
import { toast } from 'sonner';

import {
  useRelationalTags,
  type CreateTagData,
  type UpdateTagData,
  type CreateTagItemData,
  type UpdateTagItemData,
} from '@/hooks/useRelationalTags';
import type { ComponentStyle, TagSchema } from '@/types/people-configurations';
// Form data types are now defined inline since the old types were removed
import {
  TagsListPanel,
  TagDetailsPanel,
  TagModal,
  TagItemModal,
  TagTemplateModal,
} from '@/components/people/tags';
import { DeleteConfirmationDialog } from '@/components/shared/DeleteConfirmationDialog';
import { cn } from '@/lib/utils';

// Form data types
interface TagFormData {
  name: string;
  description: string;
  is_required: boolean;
  component_style: ComponentStyle;
  is_active: boolean;
  display_order?: number;
}

interface TagItemFormData {
  name: string;
  description: string;
  color: string;
  is_active: boolean;
  display_order?: number;
}

export function PeopleTags() {
  const {
    tags,
    loading,
    error,
    createTag,
    updateTag,
    deleteTag,
    createTagItem,
    updateTagItem,
    deleteTagItem,
  } = useRelationalTags();

  // UI State
  const [selectedTag, setSelectedTag] = useState<string | null>(null);
  const [editingTag, setEditingTag] = useState<string | null>(null);
  const [editingItem, setEditingItem] = useState<string | null>(null);
  const [showAddTag, setShowAddTag] = useState(false);
  const [showAddItem, setShowAddItem] = useState(false);

  // Form state
  const [tagForm, setTagForm] = useState<TagFormData>({
    name: '',
    description: '',
    is_required: false,
    component_style: 'dropdown',
    is_active: true,
  });

  const [itemForm, setItemForm] = useState<TagItemFormData>({
    name: '',
    description: '',
    color: '#3B82F6',
    is_active: true,
  });

  // Get selected tag data
  const selectedTagData = selectedTag ? tags.find(tag => tag.id === selectedTag) : null;
  const selectedTagItems = selectedTagData ? selectedTagData.tag_items || [] : [];

  // Adapt relational tags to the format expected by existing components
  const adaptedTagsForList = tags.reduce((acc, tag) => {
    const items = tag.tag_items || [];
    acc[tag.id] = {
      id: tag.id,
      name: tag.name,
      description: tag.description || '',
      is_required: tag.is_required,
      component_style: tag.component_style,
      is_active: tag.is_active,
      display_order: tag.display_order || 0,
      items: items.map(item => ({
        id: item.id,
        name: item.name,
        description: item.description || '',
        color: item.color || '#3B82F6',
        is_active: item.is_active,
        display_order: item.display_order || 0,
      })),
    };
    return acc;
  }, {} as Record<string, TagSchema>);

  const adaptedSelectedTagData = selectedTagData ? {
    id: selectedTagData.id,
    name: selectedTagData.name,
    description: selectedTagData.description || '',
    color: '#3B82F6', // Default color for tag categories
    is_required: selectedTagData.is_required,
    component_style: selectedTagData.component_style,
    is_active: selectedTagData.is_active,
    display_order: selectedTagData.display_order || 0,
    items: selectedTagItems.map(item => ({
      id: item.id,
      name: item.name,
      description: item.description || '',
      color: item.color || '#3B82F6',
      is_active: item.is_active,
      display_order: item.display_order || 0,
    })),
  } : null;

  const [showTemplateModal, setShowTemplateModal] = useState(false);

  // Delete confirmation dialogs
  const [deleteTagDialog, setDeleteTagDialog] = useState({
    isOpen: false,
    tagId: null as string | null,
    tagName: '',
  });
  const [deleteItemDialog, setDeleteItemDialog] = useState({
    isOpen: false,
    itemId: null as string | null,
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
      display_order: 0,
    });
  };

  const resetItemForm = () => {
    setItemForm({
      name: '',
      description: '',
      color: '#3B82F6',
      is_active: true,
      display_order: 0,
    });
  };

  // Tag handlers
  const handleAddTag = async () => {
    try {
      const tagData: CreateTagData = {
        name: tagForm.name,
        description: tagForm.description,
        is_required: tagForm.is_required,
        component_style: tagForm.component_style,
      };
      await createTag(tagData);
      setShowAddTag(false);
      resetTagForm();
      toast.success('Tag created successfully');
    } catch (error) {
      console.error('Error creating tag:', error);
      toast.error('Failed to create tag');
    }
  };

  const handleUpdateTag = async () => {
    if (!editingTag) return;

    try {
      const updateData: UpdateTagData = {
        name: tagForm.name,
        description: tagForm.description,
        is_required: tagForm.is_required,
        component_style: tagForm.component_style,
        is_active: tagForm.is_active,
      };
      await updateTag(editingTag, updateData);
      setShowAddTag(false);
      setEditingTag(null);
      resetTagForm();
      toast.success('Tag updated successfully');
    } catch (error) {
      console.error('Error updating tag:', error);
      toast.error('Failed to update tag');
    }
  };

  const handleDeleteTag = async () => {
    if (!deleteTagDialog.tagId) return;

    try {
      await deleteTag(deleteTagDialog.tagId);
      setDeleteTagDialog({ isOpen: false, tagId: null, tagName: '' });
      setSelectedTag(null);
      toast.success('Tag deleted successfully');
    } catch (error) {
      console.error('Error deleting tag:', error);
      toast.error('Failed to delete tag');
    }
  };

  // Item handlers
  const handleAddItem = async () => {
    if (!selectedTag) return;

    try {
      const itemData: CreateTagItemData = {
        name: itemForm.name,
        description: itemForm.description,
        color: itemForm.color,
        display_order: itemForm.display_order,
      };
      await createTagItem(selectedTag, itemData);
      setShowAddItem(false);
      resetItemForm();
      toast.success('Tag item added successfully');
    } catch (error) {
      console.error('Error adding tag item:', error);
      toast.error('Failed to add tag item');
    }
  };

  const handleUpdateItem = async () => {
    if (!editingItem) return;

    try {
      const updateData: UpdateTagItemData = {
        name: itemForm.name,
        description: itemForm.description,
        color: itemForm.color,
        is_active: itemForm.is_active,
      };
      await updateTagItem(editingItem, updateData);
      setEditingItem(null);
      setShowAddItem(false);
      resetItemForm();
      toast.success('Tag item updated successfully');
    } catch (error) {
      console.error('Error updating tag item:', error);
      toast.error('Failed to update tag item');
    }
  };

  const handleDeleteItem = async () => {
    if (!deleteItemDialog.itemId) return;

    try {
      await deleteTagItem(deleteItemDialog.itemId);
      setDeleteItemDialog({ isOpen: false, itemId: null, itemName: '' });
      toast.success('Tag item deleted successfully');
    } catch (error) {
      console.error('Error deleting tag item:', error);
      toast.error('Failed to delete tag item');
    }
  };

  // Edit handlers
  const handleEditTag = (tagId: string, tag: any) => {
    setTagForm({
      name: tag.name,
      description: tag.description || '',
      is_required: tag.is_required || false,
      component_style: tag.component_style || 'dropdown',
      is_active: tag.is_active,
      display_order: tag.display_order || 0,
    });
    setEditingTag(tagId);
    setShowAddTag(true);
  };

  const handleEditItem = (itemId: string, item: any) => {
    setItemForm({
      name: item.name,
      description: item.description || '',
      color: item.color || '#3B82F6',
      is_active: item.is_active,
      display_order: item.display_order || 0,
    });
    setEditingItem(itemId);
    setShowAddItem(true);
  };

  // Error state
  if (error) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>Error loading tags: {error}</AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-2 bg-neutral-100 dark:bg-neutral-800/50 px-4 py-2 rounded-md border">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Tags Management</h1>
          <p className="text-muted-foreground">
            Manage membership tags and groupings
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Button onClick={() => setShowTemplateModal(true)} variant="outline">
            <Plus className="h-4 w-4 mr-1" />
            Use Template
          </Button>
          <Button onClick={() => setShowAddTag(true)}>
            <TagIcon className="h-4 w-4 mr-1" />
            Add New Tag
          </Button>
        </div>
      </div>

      {/* Main Content */}
      <div className={cn("grid grid-cols-1 lg:grid-cols-3 gap-6", loading ? "opacity-30" : "")}>
        {/* Tags List Panel */}
        <div className="lg:col-span-1">
          <TagsListPanel
            tags={adaptedTagsForList}
            selectedTag={selectedTag}
            editingTag={editingTag}
            onSelectTag={setSelectedTag}
            onAddTag={() => setShowAddTag(true)}
            onAddFromTemplate={() => setShowTemplateModal(true)}
            onEditTag={handleEditTag}
            onDeleteTag={(tagId: string, tagName: string) =>
              setDeleteTagDialog({ isOpen: true, tagId, tagName })
            }
          />
        </div>

        {/* Tag Details Panel */}
        <div className="lg:col-span-2">
          {selectedTag ? (
            <TagDetailsPanel
              selectedTagData={adaptedSelectedTagData}
              selectedTag={selectedTag}
              onEditItem={handleEditItem}
              onDeleteItem={(itemId: string, itemName: string) =>
                setDeleteItemDialog({ isOpen: true, itemId, itemName })
              }
              onAddItem={() => setShowAddItem(true)}
            />
          ) : (
            <Card>
              <CardContent className="flex items-center justify-center h-64">
                <div className="text-center">
                  <TagIcon className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-muted-foreground">
                    Select a tag category
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    Choose a tag from the list to view and manage its
                    items
                  </p>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* Modals */}
      <TagModal
        isOpen={showAddTag}
        onClose={() => {
          setShowAddTag(false);
          setEditingTag(null);
          resetTagForm();
        }}
        onSave={editingTag ? handleUpdateTag : handleAddTag}
        formData={tagForm}
        setFormData={setTagForm}
        isEditing={!!editingTag}
        loading={loading}
      />

      <TagItemModal
        isOpen={showAddItem}
        onClose={() => {
          setShowAddItem(false);
          setEditingItem(null);
          resetItemForm();
        }}
        onSave={editingItem ? handleUpdateItem : handleAddItem}
        formData={itemForm}
        setFormData={setItemForm}
        isEditing={!!editingItem}
        tagName={selectedTagData?.name || ''}
        loading={loading}
      />

      <TagTemplateModal
        isOpen={showTemplateModal}
        onClose={() => setShowTemplateModal(false)}
        existingTags={tags}
      />

      {/* Delete Confirmation Dialogs */}
      <DeleteConfirmationDialog
        isOpen={deleteTagDialog.isOpen}
        onClose={() =>
          setDeleteTagDialog({ isOpen: false, tagId: null, tagName: '' })
        }
        onConfirm={handleDeleteTag}
        title="Delete Tag Category"
        description={`Are you sure you want to delete "${deleteTagDialog.tagName}"? This action cannot be undone and will remove all associated tag items.`}
      />

      <DeleteConfirmationDialog
        isOpen={deleteItemDialog.isOpen}
        onClose={() =>
          setDeleteItemDialog({ isOpen: false, itemId: null, itemName: '' })
        }
        onConfirm={handleDeleteItem}
        title="Delete Tag Item"
        description={`Are you sure you want to delete "${deleteItemDialog.itemName}"? This action cannot be undone.`}
      />
    </div>
  );
}

export { PeopleTags as Tags };
