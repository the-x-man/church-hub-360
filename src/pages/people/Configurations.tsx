import { useState } from 'react';
import { AlertCircle, Loader2 } from 'lucide-react';
import { Alert, AlertDescription } from '../../components/ui/alert';
import { toast } from 'sonner';
import { useOrganization } from '../../contexts/OrganizationContext';
import { useLocalTagsSchema } from '../../hooks/useLocalTagsSchema';
import {
  ConfigurationsHeader,
  TagsListPanel,
  TagDetailsPanel,
  FixedUpdateButton,
} from '../../components/people/configurations';
import { TagModal } from '../../components/people/TagModal';
import { TagItemModal } from '../../components/people/TagItemModal';
import { TagTemplateModal } from '../../components/people/TagTemplateModal';
import { DeleteConfirmationDialog } from '../../components/shared/DeleteConfirmationDialog';

import type {
  TagCategory,
  TagItem,
  TagCategoryFormData,
  TagItemFormData,
} from '../../types/people-configurations';

export function PeopleConfigurations() {
  const { currentOrganization } = useOrganization();

  const {
    localSchema,
    hasUnsavedChanges,
    changes,
    isLoading,
    error,
    isUpdating,
    addCategory,
    addMultipleCategories,
    updateCategory,
    deleteCategory,
    addItem,
    updateItem,
    deleteItem,
    syncChangesToServer,
    resetLocalChanges,
  } = useLocalTagsSchema();

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

  const [showTemplateModal, setShowTemplateModal] = useState(false);

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

    addCategory(tagForm);
    resetTagForm();
    setShowAddTag(false);
  };

  const handleUpdateTag = async (tagKey: string) => {
    if (!tagForm.name.trim()) return;

    updateCategory(tagKey, tagForm);
    setEditingTag(null);
    resetTagForm();
  };

  const handleDeleteTag = (tagKey: string) => {
    const tag = localSchema?.categories[tagKey];
    setDeleteTagDialog({
      isOpen: true,
      tagId: tagKey,
      tagName: tag?.name || tagKey,
    });
  };

  const confirmDeleteTag = async () => {
    if (!deleteTagDialog.tagId) return;

    deleteCategory(deleteTagDialog.tagId);
    if (selectedTag === deleteTagDialog.tagId) {
      setSelectedTag(null);
    }
    setDeleteTagDialog({ isOpen: false, tagId: null, tagName: '' });
  };

  // Handle item operations
  const handleCreateItem = async () => {
    if (!selectedTag || !itemForm.name.trim()) return;

    addItem(selectedTag, itemForm);
    resetItemForm();
    setShowAddItem(false);
  };

  const handleUpdateItem = async (itemId: string) => {
    if (!selectedTag) return;

    updateItem(selectedTag, itemId, itemForm);
    setEditingItem(null);
    resetItemForm();
  };

  const handleDeleteItem = (itemId: string) => {
    if (!selectedTag) return;

    const item = localSchema?.categories[selectedTag]?.items.find(
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

    deleteItem(selectedTag, deleteItemDialog.itemId);
    setDeleteItemDialog({ isOpen: false, itemId: null, itemName: '' });
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

  // Handle template operations
  const handleAddTemplates = (selectedTemplates: Record<string, TagCategory>) => {
    // Add all templates in a single state update to prevent race conditions
    addMultipleCategories(selectedTemplates);
    
    const templateCount = Object.keys(selectedTemplates).length;
    toast.success(`Added ${templateCount} template${templateCount !== 1 ? 's' : ''}`);
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

  // Handle sync to server
  const handleSyncToServer = async () => {
    try {
      await syncChangesToServer();
      toast.success('Changes saved successfully');
    } catch (err: any) {
      console.error('Failed to sync changes:', err);
      
      // Handle validation errors specifically
      if (err.name === 'ValidationError') {
        toast.error(`Validation Error: ${err.message.replace('Validation failed: ', '')}`);
      } else {
        toast.error('Failed to save changes. Please try again.');
      }
    }
  };

  // Handle reset changes
  const handleResetChanges = () => {
    resetLocalChanges();
    toast.info('Changes discarded');
  };

  if (isLoading) {
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

  const tags = localSchema?.categories || {};
  const selectedTagData = selectedTag ? tags[selectedTag] : null;

  return (
    <div className="space-y-6 pb-8">
      {/* Header */}
      <ConfigurationsHeader
        hasUnsavedChanges={hasUnsavedChanges}
        changes={changes}
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Tags List */}
        <div className="lg:col-span-1">
          <TagsListPanel
            tags={tags}
            selectedTag={selectedTag}
            editingTag={editingTag}
            onSelectTag={setSelectedTag}
            onAddTag={() => setShowAddTag(true)}
            onAddFromTemplate={() => setShowTemplateModal(true)}
            onEditTag={startEditingTag}
            onDeleteTag={handleDeleteTag}
          />
        </div>

        {/* Tag Details and Items */}
        <div className="lg:col-span-2">
          <TagDetailsPanel
            selectedTag={selectedTag}
            selectedTagData={selectedTagData}
            onAddItem={() => setShowAddItem(true)}
            onEditItem={startEditingItem}
            onDeleteItem={handleDeleteItem}
          />
        </div>
      </div>

      {/* Fixed Update Button */}
      <FixedUpdateButton
        hasUnsavedChanges={hasUnsavedChanges}
        changes={changes}
        isUpdating={isUpdating}
        onUpdate={handleSyncToServer}
        onReset={handleResetChanges}
      />

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
        loading={isUpdating}
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
        loading={isUpdating}
      />

      {/* Tag Template Modal */}
      <TagTemplateModal
        isOpen={showTemplateModal}
        onClose={() => setShowTemplateModal(false)}
        onAddTemplates={handleAddTemplates}
        existingTags={tags}
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
        isLoading={isUpdating}
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
        isLoading={isUpdating}
      />
    </div>
  );
}
