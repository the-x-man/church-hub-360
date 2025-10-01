import type { TagsSchema } from '../types/people-configurations';

/**
 * Default tags schema with predefined categories and items
 * This can be used to seed new organizations with common church management categories
 */
export const defaultTagsSchema: TagsSchema = {
  categories: {
    membership_categories: {
      name: 'Membership Categories',
      description: 'Different types of church membership',
      display_order: 1,
      is_required: true,
      component_style: 'dropdown',
      is_active: true,
      items: [
        {
          id: 'regular_member',
          name: 'Regular Member',
          description: 'Full voting member of the church',
          color: '#10B981',
          display_order: 1,
          is_active: true,
        },
        {
          id: 'associate_member',
          name: 'Associate Member',
          description: 'Non-voting member or member from another church',
          color: '#3B82F6',
          display_order: 2,
          is_active: true,
        },
        {
          id: 'visitor',
          name: 'Visitor',
          description: 'Regular attendee who is not yet a member',
          color: '#F59E0B',
          display_order: 3,
          is_active: true,
        },
        {
          id: 'inactive_member',
          name: 'Inactive Member',
          description: 'Member who is currently inactive',
          color: '#6B7280',
          display_order: 4,
          is_active: true,
        },
      ],
    },
    membership_status: {
      name: 'Membership Status',
      description: 'Current status of church members',
      display_order: 2,
      is_required: true,
      component_style: 'dropdown',
      is_active: true,
      items: [
        {
          id: 'active',
          name: 'Active',
          description: 'Currently active member',
          color: '#10B981',
          display_order: 1,
          is_active: true,
        },
        {
          id: 'inactive',
          name: 'Inactive',
          description: 'Temporarily inactive member',
          color: '#F59E0B',
          display_order: 2,
          is_active: true,
        },
        {
          id: 'transferred',
          name: 'Transferred',
          description: 'Transferred to another church',
          color: '#8B5CF6',
          display_order: 3,
          is_active: true,
        },
        {
          id: 'deceased',
          name: 'Deceased',
          description: 'Member who has passed away',
          color: '#6B7280',
          display_order: 4,
          is_active: true,
        },
      ],
    },
    leadership_levels: {
      name: 'Leadership Levels',
      description: 'Different levels of church leadership',
      display_order: 3,
      is_required: false,
      component_style: 'dropdown',
      is_active: true,
      items: [
        {
          id: 'senior_pastor',
          name: 'Senior Pastor',
          description: 'Lead pastor of the church',
          color: '#8B5CF6',
          display_order: 1,
          is_active: true,
        },
        {
          id: 'associate_pastor',
          name: 'Associate Pastor',
          description: 'Assistant pastor',
          color: '#3B82F6',
          display_order: 2,
          is_active: true,
        },
        {
          id: 'elder',
          name: 'Elder',
          description: 'Church elder',
          color: '#10B981',
          display_order: 3,
          is_active: true,
        },
        {
          id: 'deacon',
          name: 'Deacon',
          description: 'Church deacon',
          color: '#06B6D4',
          display_order: 4,
          is_active: true,
        },
        {
          id: 'ministry_leader',
          name: 'Ministry Leader',
          description: 'Leader of a specific ministry',
          color: '#F97316',
          display_order: 5,
          is_active: true,
        },
      ],
    },
    positions: {
      name: 'Positions',
      description: 'Specific roles and positions within the church',
      display_order: 4,
      is_required: false,
      component_style: 'multiselect',
      is_active: true,
      items: [
        {
          id: 'worship_leader',
          name: 'Worship Leader',
          description: 'Leads worship services',
          color: '#EC4899',
          display_order: 1,
          is_active: true,
        },
        {
          id: 'youth_pastor',
          name: 'Youth Pastor',
          description: 'Pastor for youth ministry',
          color: '#84CC16',
          display_order: 2,
          is_active: true,
        },
        {
          id: 'childrens_director',
          name: "Children's Director",
          description: 'Director of children ministry',
          color: '#F59E0B',
          display_order: 3,
          is_active: true,
        },
        {
          id: 'treasurer',
          name: 'Treasurer',
          description: 'Church treasurer',
          color: '#10B981',
          display_order: 4,
          is_active: true,
        },
        {
          id: 'secretary',
          name: 'Secretary',
          description: 'Church secretary',
          color: '#3B82F6',
          display_order: 5,
          is_active: true,
        },
        {
          id: 'board_member',
          name: 'Board Member',
          description: 'Member of church board',
          color: '#8B5CF6',
          display_order: 6,
          is_active: true,
        },
      ],
    },
    ministries: {
      name: 'Ministries',
      description: 'Church ministries and service areas',
      display_order: 5,
      is_required: false,
      component_style: 'checkbox',
      is_active: true,
      items: [
        {
          id: 'worship_ministry',
          name: 'Worship Ministry',
          description: 'Music and worship services',
          color: '#EC4899',
          display_order: 1,
          is_active: true,
        },
        {
          id: 'youth_ministry',
          name: 'Youth Ministry',
          description: 'Ministry for teenagers and young adults',
          color: '#84CC16',
          display_order: 2,
          is_active: true,
        },
        {
          id: 'childrens_ministry',
          name: "Children's Ministry",
          description: 'Ministry for children',
          color: '#F59E0B',
          display_order: 3,
          is_active: true,
        },
        {
          id: 'outreach_ministry',
          name: 'Outreach Ministry',
          description: 'Community outreach and evangelism',
          color: '#10B981',
          display_order: 4,
          is_active: true,
        },
        {
          id: 'prayer_ministry',
          name: 'Prayer Ministry',
          description: 'Prayer groups and intercession',
          color: '#8B5CF6',
          display_order: 5,
          is_active: true,
        },
        {
          id: 'hospitality_ministry',
          name: 'Hospitality Ministry',
          description: 'Welcoming and hosting',
          color: '#F97316',
          display_order: 6,
          is_active: true,
        },
        {
          id: 'missions_ministry',
          name: 'Missions Ministry',
          description: 'Local and international missions',
          color: '#06B6D4',
          display_order: 7,
          is_active: true,
        },
      ],
    },
    departments: {
      name: 'Departments',
      description: 'Organizational departments within the church',
      display_order: 6,
      is_required: false,
      component_style: 'dropdown',
      is_active: true,
      items: [
        {
          id: 'pastoral_care',
          name: 'Pastoral Care',
          description: 'Pastoral care and counseling',
          color: '#8B5CF6',
          display_order: 1,
          is_active: true,
        },
        {
          id: 'administration',
          name: 'Administration',
          description: 'Church administration and operations',
          color: '#3B82F6',
          display_order: 2,
          is_active: true,
        },
        {
          id: 'facilities',
          name: 'Facilities',
          description: 'Building and facilities management',
          color: '#6B7280',
          display_order: 3,
          is_active: true,
        },
        {
          id: 'communications',
          name: 'Communications',
          description: 'Church communications and media',
          color: '#F97316',
          display_order: 4,
          is_active: true,
        },
        {
          id: 'finance',
          name: 'Finance',
          description: 'Financial management and stewardship',
          color: '#10B981',
          display_order: 5,
          is_active: true,
        },
      ],
    },
    groups: {
      name: 'Groups',
      description: 'Small groups and fellowship groups',
      display_order: 7,
      is_required: false,
      component_style: 'multiselect',
      is_active: true,
      items: [
        {
          id: 'mens_group',
          name: "Men's Group",
          description: 'Fellowship group for men',
          color: '#3B82F6',
          display_order: 1,
          is_active: true,
        },
        {
          id: 'womens_group',
          name: "Women's Group",
          description: 'Fellowship group for women',
          color: '#EC4899',
          display_order: 2,
          is_active: true,
        },
        {
          id: 'young_adults',
          name: 'Young Adults',
          description: 'Group for young adults (18-35)',
          color: '#84CC16',
          display_order: 3,
          is_active: true,
        },
        {
          id: 'seniors_group',
          name: 'Seniors Group',
          description: 'Fellowship group for senior members',
          color: '#F59E0B',
          display_order: 4,
          is_active: true,
        },
        {
          id: 'bible_study',
          name: 'Bible Study',
          description: 'Weekly Bible study group',
          color: '#8B5CF6',
          display_order: 5,
          is_active: true,
        },
        {
          id: 'prayer_group',
          name: 'Prayer Group',
          description: 'Regular prayer meeting group',
          color: '#10B981',
          display_order: 6,
          is_active: true,
        },
      ],
    },
  },
};

/**
 * Function to get default tags schema for seeding
 * Can be customized based on organization preferences
 */
export function getDefaultTagsSchema(): TagsSchema {
  return JSON.parse(JSON.stringify(defaultTagsSchema)); // Deep clone to avoid mutations
}

/**
 * Function to create a minimal tags schema with just basic categories
 * Useful for organizations that want to start simple
 */
export function getMinimalTagsSchema(): TagsSchema {
  return {
    categories: {
      membership_categories: defaultTagsSchema.categories.membership_categories,
      membership_status: defaultTagsSchema.categories.membership_status,
    },
  };
}

/**
 * Function to get category names for easy reference
 */
export function getDefaultCategoryNames(): string[] {
  return Object.keys(defaultTagsSchema.categories);
}

/**
 * Function to get a specific category by key
 */
export function getDefaultCategory(categoryKey: string) {
  return defaultTagsSchema.categories[categoryKey];
}