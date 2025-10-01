import type { TagsSchema, TagCategory } from '../types/people-configurations';

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
}

/**
 * Validates the entire tags schema for duplicate names and other issues
 */
export function validateTagsSchema(schema: TagsSchema): ValidationResult {
  const errors: string[] = [];
  const categories = schema.categories;

  // Check for duplicate category names
  const categoryNames = Object.values(categories).map((cat: TagCategory) => 
    cat.name.toLowerCase()
  );
  const duplicateCategories = categoryNames.filter(
    (name, index) => categoryNames.indexOf(name) !== index
  );

  if (duplicateCategories.length > 0) {
    errors.push(`Duplicate category names found: ${duplicateCategories.join(', ')}`);
  }

  // Check for duplicate item names within each category and empty items
  for (const [, category] of Object.entries(categories)) {
    const typedCategory = category as TagCategory;
    
    // Check for empty items in required categories
    if (typedCategory.is_required && typedCategory.items.length === 0) {
      errors.push(`Required category "${typedCategory.name}" cannot have empty items`);
    }
    
    const itemNames = typedCategory.items.map(item => item.name.toLowerCase());
    const duplicateItems = itemNames.filter(
      (name, index) => itemNames.indexOf(name) !== index
    );

    if (duplicateItems.length > 0) {
      errors.push(
        `Duplicate item names found in "${typedCategory.name}": ${duplicateItems.join(', ')}`
      );
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

/**
 * Checks if a category name is duplicate (case-insensitive)
 */
export function isDuplicateCategoryName(
  name: string,
  existingCategories: Record<string, TagCategory>,
  excludeKey?: string
): boolean {
  const trimmedName = name.trim().toLowerCase();
  
  return Object.entries(existingCategories).some(([key, category]) => 
    key !== excludeKey && category.name.toLowerCase() === trimmedName
  );
}

/**
 * Checks if an item name is duplicate within a category (case-insensitive)
 */
export function isDuplicateItemName(
  name: string,
  categoryItems: any[],
  excludeId?: string
): boolean {
  const trimmedName = name.trim().toLowerCase();
  
  return categoryItems.some(item => 
    item.id !== excludeId && item.name.toLowerCase() === trimmedName
  );
}

/**
 * Generates a unique category key from a name
 */
export function generateCategoryKey(name: string): string {
  return name
    .toLowerCase()
    .replace(/\s+/g, '_')
    .replace(/[^a-z0-9_]/g, '');
}