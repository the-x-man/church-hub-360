/**
 * Utility functions for formatting tag data from members_summary view
 * Handles the formatting of assigned_tags and tags_with_categories fields
 */

export interface FormattedTag {
  name: string;
  category?: string;
}

export interface TagsByCategory {
  [category: string]: string[];
}

export interface FormattedTagData {
  allTags: string[];
  tagsByCategory: TagsByCategory;
  totalCount: number;
}

/**
 * Parse comma-separated assigned_tags string into an array
 * @param assignedTags - Comma-separated string of tag names
 * @returns Array of tag names
 */
export function parseAssignedTags(assignedTags: string): string[] {
  if (!assignedTags || assignedTags.trim() === '') {
    return [];
  }
  
  return assignedTags
    .split(',')
    .map(tag => tag.trim())
    .filter(tag => tag.length > 0);
}

/**
 * Parse tags_with_categories string into structured data
 * Format from DB: "Category: Tag1 | Category: Tag2 | Category2: Tag3"
 * Expected output: { "Category": ["Tag1", "Tag2"], "Category2": ["Tag3"] }
 * @param tagsWithCategories - Formatted string with categories and tags
 * @returns Object with tags organized by category
 */
export function parseTagsWithCategories(tagsWithCategories: string): TagsByCategory {
  if (!tagsWithCategories || tagsWithCategories.trim() === '') {
    return {};
  }

  const result: TagsByCategory = {};
  
  // Split by pipe separator to get each category:tag pair
  const categoryTagPairs = tagsWithCategories.split('|').map(section => section.trim());
  
  categoryTagPairs.forEach(pair => {
    // Split by colon to separate category from tag
    const colonIndex = pair.indexOf(':');
    if (colonIndex === -1) return;
    
    const category = pair.substring(0, colonIndex).trim();
    const tag = pair.substring(colonIndex + 1).trim();
    
    if (category && tag) {
      // Group tags under the same category
      if (!result[category]) {
        result[category] = [];
      }
      
      // Only add the tag if it's not already in the array
      if (!result[category].includes(tag)) {
        result[category].push(tag);
      }
    }
  });
  
  return result;
}

/**
 * Format tag data for comprehensive display
 * @param assignedTags - Comma-separated string of all tags
 * @param tagsWithCategories - Categorized tags string
 * @param tagCount - Total number of tags
 * @returns Formatted tag data object
 */
export function formatTagData(
  assignedTags: string, 
  tagsWithCategories: string, 
  tagCount: number
): FormattedTagData {
  return {
    allTags: parseAssignedTags(assignedTags),
    tagsByCategory: parseTagsWithCategories(tagsWithCategories),
    totalCount: tagCount || 0
  };
}

/**
 * Get all unique categories from tags_with_categories
 * @param tagsWithCategories - Categorized tags string
 * @returns Array of category names
 */
export function getTagCategories(tagsWithCategories: string): string[] {
  const tagsByCategory = parseTagsWithCategories(tagsWithCategories);
  return Object.keys(tagsByCategory).sort();
}

/**
 * Get tags for a specific category
 * @param tagsWithCategories - Categorized tags string
 * @param category - Category name to filter by
 * @returns Array of tag names in the specified category
 */
export function getTagsByCategory(tagsWithCategories: string, category: string): string[] {
  const tagsByCategory = parseTagsWithCategories(tagsWithCategories);
  return tagsByCategory[category] || [];
}

/**
 * Format tags for display in a compact format
 * @param assignedTags - Comma-separated string of all tags
 * @param maxTags - Maximum number of tags to show before truncating
 * @returns Formatted string for display
 */
export function formatTagsForDisplay(assignedTags: string, maxTags: number = 3): string {
  const tags = parseAssignedTags(assignedTags);
  
  if (tags.length === 0) {
    return 'No tags';
  }
  
  if (tags.length <= maxTags) {
    return tags.join(', ');
  }
  
  const visibleTags = tags.slice(0, maxTags);
  const remainingCount = tags.length - maxTags;
  
  return `${visibleTags.join(', ')} +${remainingCount} more`;
}

/**
 * Format tags by category for display
 * @param tagsWithCategories - Categorized tags string
 * @param maxCategoriesShown - Maximum categories to show
 * @returns Formatted string showing categories and their tags
 */
export function formatCategorizedTagsForDisplay(
  tagsWithCategories: string, 
  maxCategoriesShown: number = 2
): string {
  const tagsByCategory = parseTagsWithCategories(tagsWithCategories);
  const categories = Object.keys(tagsByCategory);
  
  if (categories.length === 0) {
    return 'No tags';
  }
  
  const visibleCategories = categories.slice(0, maxCategoriesShown);
  const result = visibleCategories.map(category => {
    const tags = tagsByCategory[category];
    const tagDisplay = tags.length > 2 
      ? `${tags.slice(0, 2).join(', ')} +${tags.length - 2} more`
      : tags.join(', ');
    return `${category}: ${tagDisplay}`;
  });
  
  if (categories.length > maxCategoriesShown) {
    const remainingCategories = categories.length - maxCategoriesShown;
    result.push(`+${remainingCategories} more categories`);
  }
  
  return result.join(' | ');
}

/**
 * Check if a member has a specific tag
 * @param assignedTags - Comma-separated string of all tags
 * @param tagName - Name of the tag to check for
 * @returns Boolean indicating if the tag is assigned
 */
export function hasTag(assignedTags: string, tagName: string): boolean {
  const tags = parseAssignedTags(assignedTags);
  return tags.some(tag => tag.toLowerCase() === tagName.toLowerCase());
}

/**
 * Check if a member has any tags in a specific category
 * @param tagsWithCategories - Categorized tags string
 * @param category - Category name to check
 * @returns Boolean indicating if the member has tags in this category
 */
export function hasTagsInCategory(tagsWithCategories: string, category: string): boolean {
  const tags = getTagsByCategory(tagsWithCategories, category);
  return tags.length > 0;
}

/**
 * Filter members by tag presence (for use in filtering functions)
 * @param assignedTags - Comma-separated string of all tags
 * @param filterTags - Array of tag names to filter by
 * @param matchAll - If true, member must have ALL tags; if false, member must have ANY tag
 * @returns Boolean indicating if member matches the filter
 */
export function matchesTagFilter(
  assignedTags: string, 
  filterTags: string[], 
  matchAll: boolean = false
): boolean {
  if (filterTags.length === 0) {
    return true; // No filter means all match
  }
  
  const memberTags = parseAssignedTags(assignedTags).map(tag => tag.toLowerCase());
  const filterTagsLower = filterTags.map(tag => tag.toLowerCase());
  
  if (matchAll) {
    return filterTagsLower.every(filterTag => memberTags.includes(filterTag));
  } else {
    return filterTagsLower.some(filterTag => memberTags.includes(filterTag));
  }
}

/**
 * Get tag statistics from an array of members
 * @param members - Array of members with tag data
 * @returns Object with tag usage statistics
 */
export function getTagStatistics(members: Array<{ assigned_tags: string; tags_with_categories: string; tag_count: number }>) {
  const tagCounts: { [tagName: string]: number } = {};
  const categoryCounts: { [category: string]: number } = {};
  let totalTagAssignments = 0;
  
  members.forEach(member => {
    const tags = parseAssignedTags(member.assigned_tags);
    const tagsByCategory = parseTagsWithCategories(member.tags_with_categories);
    
    totalTagAssignments += member.tag_count;
    
    // Count individual tags
    tags.forEach(tag => {
      tagCounts[tag] = (tagCounts[tag] || 0) + 1;
    });
    
    // Count categories
    Object.keys(tagsByCategory).forEach(category => {
      categoryCounts[category] = (categoryCounts[category] || 0) + 1;
    });
  });
  
  return {
    tagCounts,
    categoryCounts,
    totalTagAssignments,
    totalMembers: members.length,
    averageTagsPerMember: members.length > 0 ? totalTagAssignments / members.length : 0
  };
}