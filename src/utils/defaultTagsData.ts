import type { CreateTagRequest, CreateTagItemRequest, ComponentStyle } from '../types/people-configurations';

/**
 * Default tag categories with their items for seeding new organizations
 * This provides a comprehensive set of common church management categories
 */

export interface DefaultTagCategory {
  name: string;
  description?: string;
  is_required: boolean;
  component_style: ComponentStyle;
  display_order: number;
  items: DefaultTagItem[];
}

export interface DefaultTagItem {
  label: string;
  description?: string;
  color: string;
  display_order: number;
}

export const defaultTagCategories: Record<string, DefaultTagCategory> = {
  membership_categories: {
    name: 'Membership Categories',
    description: 'Different types of church membership',
    is_required: true,
    component_style: 'dropdown',
    display_order: 1,
    items: [
      {
        label: 'Regular Member',
        description: 'Full voting member of the church',
        color: '#10B981',
        display_order: 1,
      },
      {
        label: 'Associate Member',
        description: 'Non-voting member or member from another church',
        color: '#3B82F6',
        display_order: 2,
      },
      {
        label: 'Visitor',
        description: 'Regular attendee who is not yet a member',
        color: '#F59E0B',
        display_order: 3,
      },
      {
        label: 'Inactive Member',
        description: 'Member who is currently inactive',
        color: '#6B7280',
        display_order: 4,
      },
    ],
  },
  membership_status: {
    name: 'Membership Status',
    description: 'Current status of church members',
    is_required: true,
    component_style: 'dropdown',
    display_order: 2,
    items: [
      {
        label: 'Active',
        description: 'Currently active member',
        color: '#10B981',
        display_order: 1,
      },
      {
        label: 'Inactive',
        description: 'Temporarily inactive member',
        color: '#F59E0B',
        display_order: 2,
      },
      {
        label: 'Transferred',
        description: 'Transferred to another church',
        color: '#8B5CF6',
        display_order: 3,
      },
      {
        label: 'Deceased',
        description: 'Member who has passed away',
        color: '#6B7280',
        display_order: 4,
      },
    ],
  },
  leadership_levels: {
    name: 'Leadership Levels',
    description: 'Different levels of church leadership',
    is_required: false,
    component_style: 'dropdown',
    display_order: 3,
    items: [
      {
        label: 'Senior Pastor',
        description: 'Lead pastor of the church',
        color: '#8B5CF6',
        display_order: 1,
      },
      {
        label: 'Associate Pastor',
        description: 'Assistant pastor',
        color: '#3B82F6',
        display_order: 2,
      },
      {
        label: 'Elder',
        description: 'Church elder',
        color: '#10B981',
        display_order: 3,
      },
      {
        label: 'Deacon',
        description: 'Church deacon',
        color: '#06B6D4',
        display_order: 4,
      },
      {
        label: 'Ministry Leader',
        description: 'Leader of a specific ministry',
        color: '#F97316',
        display_order: 5,
      },
    ],
  },
  positions: {
    name: 'Positions',
    description: 'Specific roles and positions within the church',
    is_required: false,
    component_style: 'multiselect',
    display_order: 4,
    items: [
      {
        label: 'Worship Leader',
        description: 'Leads worship services',
        color: '#EC4899',
        display_order: 1,
      },
      {
        label: 'Youth Pastor',
        description: 'Pastor for youth ministry',
        color: '#84CC16',
        display_order: 2,
      },
      {
        label: "Children's Director",
        description: 'Director of children ministry',
        color: '#F59E0B',
        display_order: 3,
      },
      {
        label: 'Treasurer',
        description: 'Church treasurer',
        color: '#10B981',
        display_order: 4,
      },
      {
        label: 'Secretary',
        description: 'Church secretary',
        color: '#3B82F6',
        display_order: 5,
      },
      {
        label: 'Board Member',
        description: 'Member of church board',
        color: '#8B5CF6',
        display_order: 6,
      },
    ],
  },
  ministries: {
    name: 'Ministries',
    description: 'Church ministries and service areas',
    is_required: false,
    component_style: 'checkbox',
    display_order: 5,
    items: [
      {
        label: 'Worship Ministry',
        description: 'Music and worship services',
        color: '#EC4899',
        display_order: 1,
      },
      {
        label: 'Youth Ministry',
        description: 'Ministry for teenagers and young adults',
        color: '#84CC16',
        display_order: 2,
      },
      {
        label: "Children's Ministry",
        description: 'Ministry for children',
        color: '#F59E0B',
        display_order: 3,
      },
      {
        label: 'Outreach Ministry',
        description: 'Community outreach and evangelism',
        color: '#10B981',
        display_order: 4,
      },
      {
        label: 'Prayer Ministry',
        description: 'Prayer groups and intercession',
        color: '#8B5CF6',
        display_order: 5,
      },
      {
        label: 'Hospitality Ministry',
        description: 'Welcoming and hosting',
        color: '#F97316',
        display_order: 6,
      },
      {
        label: 'Missions Ministry',
        description: 'Local and international missions',
        color: '#06B6D4',
        display_order: 7,
      },
    ],
  },
  departments: {
    name: 'Departments',
    description: 'Organizational departments within the church',
    is_required: false,
    component_style: 'dropdown',
    display_order: 6,
    items: [
      {
        label: 'Pastoral Care',
        description: 'Pastoral care and counseling',
        color: '#8B5CF6',
        display_order: 1,
      },
      {
        label: 'Administration',
        description: 'Church administration and operations',
        color: '#3B82F6',
        display_order: 2,
      },
      {
        label: 'Facilities',
        description: 'Building and facilities management',
        color: '#6B7280',
        display_order: 3,
      },
      {
        label: 'Communications',
        description: 'Church communications and media',
        color: '#F97316',
        display_order: 4,
      },
      {
        label: 'Finance',
        description: 'Financial management and stewardship',
        color: '#10B981',
        display_order: 5,
      },
    ],
  },
  groups: {
    name: 'Groups',
    description: 'Small groups and fellowship groups',
    is_required: false,
    component_style: 'multiselect',
    display_order: 7,
    items: [
      {
        label: "Men's Group",
        description: 'Fellowship group for men',
        color: '#3B82F6',
        display_order: 1,
      },
      {
        label: "Women's Group",
        description: 'Fellowship group for women',
        color: '#EC4899',
        display_order: 2,
      },
      {
        label: 'Young Adults',
        description: 'Group for young adults (18-35)',
        color: '#84CC16',
        display_order: 3,
      },
      {
        label: 'Seniors Group',
        description: 'Fellowship group for senior members',
        color: '#F59E0B',
        display_order: 4,
      },
      {
        label: 'Bible Study',
        description: 'Weekly Bible study group',
        color: '#8B5CF6',
        display_order: 5,
      },
      {
        label: 'Prayer Group',
        description: 'Regular prayer meeting group',
        color: '#10B981',
        display_order: 6,
      },
    ],
  },
};

/**
 * Convert default tag category to CreateTagRequest format
 */
export function createTagRequestFromDefault(
  organizationId: string,
  category: DefaultTagCategory
): CreateTagRequest {
  return {
    organization_id: organizationId,
    name: category.name,
    description: category.description,
    is_required: category.is_required,
    component_style: category.component_style,
    is_active: true,
    display_order: category.display_order,
  };
}

/**
 * Convert default tag item to CreateTagItemRequest format
 */
export function createTagItemRequestFromDefault(
  tagId: string,
  item: DefaultTagItem
): CreateTagItemRequest {
  return {
    tag_id: tagId,
    label: item.label,
    description: item.description,
    color: item.color,
    is_active: true,
    display_order: item.display_order,
  };
}

/**
 * Get all default tag categories
 */
export function getDefaultTagCategories(): Record<string, DefaultTagCategory> {
  return JSON.parse(JSON.stringify(defaultTagCategories)); // Deep clone to avoid mutations
}

/**
 * Get a minimal set of tag categories (just membership essentials)
 */
export function getMinimalTagCategories(): Record<string, DefaultTagCategory> {
  return {
    membership_categories: defaultTagCategories.membership_categories,
    membership_status: defaultTagCategories.membership_status,
  };
}

/**
 * Get category names for easy reference
 */
export function getDefaultCategoryNames(): string[] {
  return Object.keys(defaultTagCategories);
}

/**
 * Get a specific category by key
 */
export function getDefaultCategory(categoryKey: string): DefaultTagCategory | undefined {
  return defaultTagCategories[categoryKey];
}

/**
 * Get all categories sorted by display order
 */
export function getDefaultCategoriesSorted(): Array<{ key: string; category: DefaultTagCategory }> {
  return Object.entries(defaultTagCategories)
    .map(([key, category]) => ({ key, category }))
    .sort((a, b) => a.category.display_order - b.category.display_order);
}