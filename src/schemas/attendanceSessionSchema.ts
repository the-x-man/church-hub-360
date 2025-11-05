import { z } from 'zod';

// Location validation schema
const locationSchema = z.object({
  lat: z.number().min(-90).max(90, 'Latitude must be between -90 and 90'),
  lng: z.number().min(-180).max(180, 'Longitude must be between -180 and 180'),
  radius: z.number().min(1, 'Radius must be at least 1 meter').max(10000, 'Radius cannot exceed 10km').optional(),
}).optional();

// Marking modes validation (updated to align with AttendanceMarkingModes)
const markingModesSchema = z.object({
  manual: z.boolean(),
  email: z.boolean(),
  phone: z.boolean(),
  membership_id: z.boolean(),
}).refine(
  (modes) => Object.values(modes).some(Boolean),
  'At least one marking mode must be enabled'
);

// Base attendance session schema
export const attendanceSessionSchema = z.object({
  name: z.string()
     .min(1, 'Session name is required')
     .max(100, 'Session name must be less than 100 characters')
     .trim()
     .optional(),
  
  occasion_id: z.string()
    .min(1, 'Please select an occasion')
    .uuid('Invalid occasion ID'),
  
  start_time: z.string()
    .min(1, 'Start time is required')
    .refine((val) => {
      const date = new Date(val);
      return !isNaN(date.getTime());
    }, 'Please enter a valid start time'),
  
  end_time: z.string()
    .min(1, 'End time is required')
    .refine((val) => {
      const date = new Date(val);
      return !isNaN(date.getTime());
    }, 'Please enter a valid end time'),
  
  is_open: z.boolean(),
  
  allow_public_marking: z.boolean(),
  
  proximity_required: z.boolean(),
  
  location: locationSchema,
  
  allowed_tags: z.array(z.string().uuid('Invalid tag ID')).optional(),
  
  // Optional scoping to groups and members
  allowed_groups: z.array(z.string().uuid('Invalid group ID')).optional(),
  allowed_members: z.array(z.string().uuid('Invalid member ID')).optional(),
  
  marking_modes: markingModesSchema,
}).refine(
  (data) => {
    const startTime = new Date(data.start_time);
    const endTime = new Date(data.end_time);
    return endTime > startTime;
  },
  {
    message: 'End time must be after start time',
    path: ['end_time'],
  }
).refine(
  (data) => {
    // If proximity is required, location must be provided
    if (data.proximity_required && !data.location) {
      return false;
    }
    return true;
  },
  {
    message: 'Location is required when proximity checking is enabled',
    path: ['location'],
  }
);

// Schema for creating a new session
export const createAttendanceSessionSchema = attendanceSessionSchema;

// Schema for updating an existing session
export const updateAttendanceSessionSchema = attendanceSessionSchema.partial().extend({
  id: z.string().uuid('Invalid session ID'),
});

// Type inference
export type AttendanceSessionFormData = z.infer<typeof attendanceSessionSchema>;
export type CreateAttendanceSessionFormData = z.infer<typeof createAttendanceSessionSchema>;
export type UpdateAttendanceSessionFormData = z.infer<typeof updateAttendanceSessionSchema>;

// Default form values
export const defaultSessionFormValues: Partial<AttendanceSessionFormData> = {
  is_open: false,
  allow_public_marking: false,
  proximity_required: false,
  marking_modes: {
    manual: true,
    email: true,
    phone: true,
    membership_id: true,
  },
};