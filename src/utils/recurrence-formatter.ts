/**
 * Utility functions to format RFC 5545 recurrence rules into user-friendly text
 */

const WEEKDAY_NAMES: Record<string, string> = {
  'SU': 'Sunday',
  'MO': 'Monday',
  'TU': 'Tuesday',
  'WE': 'Wednesday',
  'TH': 'Thursday',
  'FR': 'Friday',
  'SA': 'Saturday',
};

const WEEKDAY_SHORT_NAMES: Record<string, string> = {
  'SU': 'Sun',
  'MO': 'Mon',
  'TU': 'Tue',
  'WE': 'Wed',
  'TH': 'Thu',
  'FR': 'Fri',
  'SA': 'Sat',
};

/**
 * Formats an RFC 5545 recurrence rule into user-friendly text
 * @param recurrenceRule - The RFC 5545 recurrence rule string
 * @param useShortFormat - Whether to use abbreviated format for compact display
 * @returns Formatted user-friendly string
 */
export function formatRecurrenceRule(recurrenceRule: string, useShortFormat: boolean = false): string {
  if (!recurrenceRule || recurrenceRule.trim() === '') {
    return 'No recurrence';
  }

  try {
    // Parse the recurrence rule
    const parts = recurrenceRule.split(';');
    const ruleParts: Record<string, string> = {};
    
    parts.forEach(part => {
      const [key, value] = part.split('=');
      if (key && value) {
        ruleParts[key.trim()] = value.trim();
      }
    });

    const freq = ruleParts['FREQ'];
    const interval = parseInt(ruleParts['INTERVAL'] || '1');
    const byDay = ruleParts['BYDAY'];

    if (!freq) {
      return recurrenceRule; // Return original if we can't parse it
    }

    // Format based on frequency
    switch (freq.toUpperCase()) {
      case 'DAILY':
        if (interval === 1) {
          return 'Daily';
        }
        return `Every ${interval} days`;

      case 'WEEKLY':
        let weeklyText = '';
        
        if (interval === 1) {
          weeklyText = 'Weekly';
        } else {
          weeklyText = `Every ${interval} weeks`;
        }

        if (byDay) {
          const days = byDay.split(',');
          const dayNames = useShortFormat ? WEEKDAY_SHORT_NAMES : WEEKDAY_NAMES;
          const formattedDays = days.map(day => dayNames[day.trim()] || day).join(', ');
          
          if (days.length === 1) {
            return useShortFormat 
              ? `${weeklyText} on ${formattedDays}`
              : `${weeklyText} on ${formattedDays}s`;
          } else if (days.length === 7) {
            return `${weeklyText} (all days)`;
          } else {
            return `${weeklyText} on ${formattedDays}`;
          }
        }
        
        return weeklyText;

      case 'MONTHLY':
        if (interval === 1) {
          return 'Monthly';
        }
        return `Every ${interval} months`;

      case 'YEARLY':
        if (interval === 1) {
          return 'Yearly';
        }
        return `Every ${interval} years`;

      default:
        return recurrenceRule; // Return original for unknown frequencies
    }
  } catch (error) {
    // If parsing fails, return the original rule
    return recurrenceRule;
  }
}

/**
 * Gets a compact version of the recurrence rule for badges and small displays
 * @param recurrenceRule - The RFC 5545 recurrence rule string
 * @returns Short formatted string suitable for badges
 */
export function getRecurrenceBadgeText(recurrenceRule: string): string {
  if (!recurrenceRule || recurrenceRule.trim() === '') {
    return '';
  }

  const formatted = formatRecurrenceRule(recurrenceRule, true);
  
  // Further abbreviate for badge display
  return formatted
    .replace('Every ', '')
    .replace(' days', 'd')
    .replace(' weeks', 'w')
    .replace(' months', 'm')
    .replace(' years', 'y')
    .replace('Daily', 'Daily')
    .replace('Weekly', 'Weekly')
    .replace('Monthly', 'Monthly')
    .replace('Yearly', 'Yearly');
}

/**
 * Checks if a recurrence rule represents a common pattern
 * @param recurrenceRule - The RFC 5545 recurrence rule string
 * @returns Object with pattern information
 */
export function analyzeRecurrencePattern(recurrenceRule: string) {
  if (!recurrenceRule) {
    return { isCommon: false, type: 'none' };
  }

  const formatted = formatRecurrenceRule(recurrenceRule);
  
  const commonPatterns = [
    'Daily',
    'Weekly',
    'Monthly', 
    'Yearly',
    /^Weekly on (Sunday|Monday|Tuesday|Wednesday|Thursday|Friday|Saturday)s?$/,
    /^Every \d+ (days|weeks|months|years)$/
  ];

  const isCommon = commonPatterns.some(pattern => {
    if (typeof pattern === 'string') {
      return formatted === pattern;
    }
    return pattern.test(formatted);
  });

  return {
    isCommon,
    type: isCommon ? 'standard' : 'custom',
    formatted
  };
}