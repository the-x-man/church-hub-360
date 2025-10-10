import type { MemberTagAssignment } from '@/hooks/useMemberTagAssignments';

export interface TagAssignmentChange {
  tagId: string;
  action: 'add' | 'delete';
  value?: any;
  assignmentId?: string;
  tagItemId?: string;
}

export interface TagAssignmentComparison {
  changes: TagAssignmentChange[];
  hasChanges: boolean;
}

/**
 * Compare current tag assignments with new tag values to determine what changes need to be made
 * @param currentAssignments - Current member tag assignments from the database
 * @param newTagValues - New tag values from the form
 * @returns Object containing the changes that need to be made
 */
export function compareTagAssignments(
  currentAssignments: Record<string, MemberTagAssignment[]>,
  newTagValues: Record<string, any>
): TagAssignmentComparison {
  const changes: TagAssignmentChange[] = [];

  // Get all unique tag IDs from both current and new values
  const allTagIds = new Set([
    ...Object.keys(currentAssignments),
    ...Object.keys(newTagValues)
  ]);

  allTagIds.forEach(tagId => {
    const currentAssignmentsForTag = currentAssignments[tagId] || [];
    const newValue = newTagValues[tagId];

    // Normalize new values to array for consistent comparison
    const newTagItemIds = Array.isArray(newValue) 
      ? newValue.filter(v => v !== null && v !== undefined && v !== '')
      : (newValue !== null && newValue !== undefined && newValue !== '') 
        ? [newValue] 
        : [];

    // Get current tag item IDs for this tag
    const currentTagItemIds = currentAssignmentsForTag.map(assignment => assignment.tag_item_id);

    // Find tag items to delete (in current but not in new)
    currentAssignmentsForTag.forEach(assignment => {
      if (!newTagItemIds.includes(assignment.tag_item_id)) {
        changes.push({
          tagId,
          action: 'delete',
          assignmentId: assignment.id,
          tagItemId: assignment.tag_item_id
        });
      }
    });

    // Find tag items to add (in new but not in current)
    newTagItemIds.forEach(tagItemId => {
      if (!currentTagItemIds.includes(tagItemId)) {
        changes.push({
          tagId,
          action: 'add',
          value: tagItemId,
          tagItemId: tagItemId
        });
      }
    });
  });

  return {
    changes,
    hasChanges: changes.length > 0
  };
}

/**
 * Group tag assignment changes by action type for bulk operations
 * @param changes - Array of tag assignment changes
 * @returns Object with changes grouped by action type
 */
export function groupChangesByAction(changes: TagAssignmentChange[]) {
  return {
    toAdd: changes.filter(change => change.action === 'add'),
    toDelete: changes.filter(change => change.action === 'delete')
  };
}