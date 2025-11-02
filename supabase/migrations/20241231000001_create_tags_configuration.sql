-- Create people_configurations table for managing all people-related configurations
CREATE TABLE IF NOT EXISTS public.people_configurations (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    organization_id UUID NOT NULL,
    tags_schema JSONB DEFAULT '{}',
    groups_schema JSONB DEFAULT '{}',
    membership_form_schema JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by UUID REFERENCES auth.users(id),
    last_updated_by UUID REFERENCES auth.users(id),
    
    UNIQUE(organization_id)
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_people_configurations_organization_id ON public.people_configurations(organization_id);
CREATE INDEX IF NOT EXISTS idx_people_configurations_tags_schema ON public.people_configurations USING GIN (tags_schema);
CREATE INDEX IF NOT EXISTS idx_people_configurations_groups_schema ON public.people_configurations USING GIN (groups_schema);
CREATE INDEX IF NOT EXISTS idx_people_configurations_membership_form_schema ON public.people_configurations USING GIN (membership_form_schema);

-- Create updated_at trigger function if it doesn't exist
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at
CREATE TRIGGER update_people_configurations_updated_at 
    BEFORE UPDATE ON public.people_configurations 
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Enable Row Level Security
ALTER TABLE public.people_configurations ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for authenticated users
CREATE POLICY "Allow authenticated users full access to people_configurations" 
    ON public.people_configurations 
    FOR ALL 
    TO authenticated 
    USING (true) 
    WITH CHECK (true);

-- Insert default configuration with comprehensive tags schema
INSERT INTO public.people_configurations (organization_id, tags_schema) VALUES
('00000000-0000-0000-0000-000000000000', '{
  "categories": {
    "membership_categories": {
      "name": "Membership Categories",
      "description": "Primary membership classification for church members",
      "display_order": 1,
      "is_required": true,
      "component_style": "dropdown",
      "is_active": true,
      "items": [
        {
          "id": "regular_member",
          "name": "Regular Member",
          "description": "Full church member with voting rights",
          "color": "#10B981",
          "display_order": 1,
          "is_active": true
        },
        {
          "id": "new_convert",
          "name": "New Convert",
          "description": "Recently converted member undergoing discipleship",
          "color": "#F59E0B",
          "display_order": 2,
          "is_active": true
        },
        {
          "id": "visitor",
          "name": "Visitor",
          "description": "Guest or prospective member",
          "color": "#6B7280",
          "display_order": 3,
          "is_active": true
        },
        {
          "id": "worker_volunteer",
          "name": "Worker/Volunteer",
          "description": "Active volunteer in church activities",
          "color": "#8B5CF6",
          "display_order": 4,
          "is_active": true
        },
        {
          "id": "fulltime_staff",
          "name": "Full-time Staff",
          "description": "Employed church staff member",
          "color": "#EF4444",
          "display_order": 5,
          "is_active": true
        }
      ]
    },
    "membership_status": {
      "name": "Membership Status",
      "description": "Current status of church membership",
      "display_order": 2,
      "is_required": true,
      "component_style": "dropdown",
      "is_active": true,
      "items": [
        {
          "id": "active",
          "name": "Active",
          "description": "Currently active member",
          "color": "#10B981",
          "display_order": 1,
          "is_active": true
        },
        {
          "id": "inactive",
          "name": "Inactive",
          "description": "Temporarily inactive member",
          "color": "#F59E0B",
          "display_order": 2,
          "is_active": true
        },
        {
          "id": "transferred",
          "name": "Transferred",
          "description": "Transferred to another church",
          "color": "#6B7280",
          "display_order": 3,
          "is_active": true
        },
        {
          "id": "excommunicated",
          "name": "Excommunicated",
          "description": "Disciplinary removal from membership",
          "color": "#EF4444",
          "display_order": 4,
          "is_active": true
        },
        {
          "id": "deceased",
          "name": "Deceased",
          "description": "Deceased member",
          "color": "#374151",
          "display_order": 5,
          "is_active": true
        }
      ]
    },
    "leadership_levels": {
      "name": "Leadership Levels",
      "description": "Church leadership hierarchy and positions",
      "display_order": 3,
      "is_required": false,
      "component_style": "dropdown",
      "is_active": true,
      "items": [
        {
          "id": "pastor",
          "name": "Pastor",
          "description": "Senior church leader",
          "color": "#7C3AED",
          "display_order": 1,
          "is_active": true
        },
        {
          "id": "elder",
          "name": "Elder",
          "description": "Church elder with oversight responsibilities",
          "color": "#059669",
          "display_order": 2,
          "is_active": true
        },
        {
          "id": "deacon",
          "name": "Deacon",
          "description": "Ordained servant leader",
          "color": "#DC2626",
          "display_order": 3,
          "is_active": true
        },
        {
          "id": "deaconess",
          "name": "Deaconess",
          "description": "Female ordained servant leader",
          "color": "#DC2626",
          "display_order": 4,
          "is_active": true
        },
        {
          "id": "bishop",
          "name": "Bishop",
          "description": "Senior oversight leader",
          "color": "#7C3AED",
          "display_order": 5,
          "is_active": true
        },
        {
          "id": "overseer",
          "name": "Overseer",
          "description": "Regional or departmental overseer",
          "color": "#059669",
          "display_order": 6,
          "is_active": true
        }
      ]
    },
    "positions": {
      "name": "Positions",
      "description": "Specific roles and responsibilities within the church",
      "display_order": 4,
      "is_required": false,
      "component_style": "multiselect",
      "is_active": true,
      "items": [
        {
          "id": "treasurer",
          "name": "Treasurer",
          "description": "Financial management and oversight",
          "color": "#059669",
          "display_order": 1,
          "is_active": true
        },
        {
          "id": "secretary",
          "name": "Secretary",
          "description": "Administrative and record keeping",
          "color": "#0891B2",
          "display_order": 2,
          "is_active": true
        },
        {
          "id": "prayer_coordinator",
          "name": "Prayer Coordinator",
          "description": "Prayer ministry coordination",
          "color": "#7C3AED",
          "display_order": 3,
          "is_active": true
        },
        {
          "id": "worship_leader",
          "name": "Worship Leader",
          "description": "Worship service leadership",
          "color": "#DC2626",
          "display_order": 4,
          "is_active": true
        },
        {
          "id": "sunday_school_leader",
          "name": "Sunday School Leader",
          "description": "Educational ministry leadership",
          "color": "#F59E0B",
          "display_order": 5,
          "is_active": true
        }
      ]
    },
    "ministries": {
      "name": "Ministries",
      "description": "Church ministry departments and groups",
      "display_order": 5,
      "is_required": false,
      "component_style": "checkbox",
      "is_active": true,
      "items": [
        {
          "id": "youth_ministry",
          "name": "Youth Ministry",
          "description": "Ministry focused on young people",
          "color": "#F59E0B",
          "display_order": 1,
          "is_active": true
        },
        {
          "id": "children_ministry",
          "name": "Children Ministry",
          "description": "Ministry for children and kids",
          "color": "#10B981",
          "display_order": 2,
          "is_active": true
        },
        {
          "id": "evangelism_ministry",
          "name": "Evangelism Ministry",
          "description": "Outreach and soul winning",
          "color": "#EF4444",
          "display_order": 3,
          "is_active": true
        },
        {
          "id": "men_ministry",
          "name": "Men Ministry",
          "description": "Ministry for men in the church",
          "color": "#3B82F6",
          "display_order": 4,
          "is_active": true
        },
        {
          "id": "women_ministry",
          "name": "Women Ministry",
          "description": "Ministry for women in the church",
          "color": "#EC4899",
          "display_order": 5,
          "is_active": true
        },
        {
          "id": "prayer_ministry",
          "name": "Prayer Ministry",
          "description": "Intercession and prayer focus",
          "color": "#7C3AED",
          "display_order": 6,
          "is_active": true
        },
        {
          "id": "hospitality_ushering",
          "name": "Hospitality/Ushering Ministry",
          "description": "Welcome and guest services",
          "color": "#059669",
          "display_order": 7,
          "is_active": true
        },
        {
          "id": "welfare_compassion",
          "name": "Welfare/Compassion Ministry",
          "description": "Care and support for needy",
          "color": "#F97316",
          "display_order": 8,
          "is_active": true
        },
        {
          "id": "outreach_missions",
          "name": "Outreach/Missions",
          "description": "External mission and outreach",
          "color": "#DC2626",
          "display_order": 9,
          "is_active": true
        }
      ]
    },
    "departments": {
      "name": "Departments",
      "description": "Operational departments within the church",
      "display_order": 6,
      "is_required": false,
      "component_style": "checkbox",
      "is_active": true,
      "items": [
        {
          "id": "music_department",
          "name": "Music Department",
          "description": "Choir, instruments, and music ministry",
          "color": "#7C3AED",
          "display_order": 1,
          "is_active": true
        },
        {
          "id": "media_department",
          "name": "Media Department",
          "description": "Audio, video, and technical support",
          "color": "#0891B2",
          "display_order": 2,
          "is_active": true
        },
        {
          "id": "choreography_department",
          "name": "Choreography Department",
          "description": "Dance and movement ministry",
          "color": "#EC4899",
          "display_order": 3,
          "is_active": true
        },
        {
          "id": "drama_department",
          "name": "Drama Department",
          "description": "Theater and dramatic presentations",
          "color": "#F59E0B",
          "display_order": 4,
          "is_active": true
        },
        {
          "id": "security_protocol",
          "name": "Security/Protocol Department",
          "description": "Safety and order maintenance",
          "color": "#374151",
          "display_order": 5,
          "is_active": true
        },
        {
          "id": "decorations_events",
          "name": "Decorations/Events",
          "description": "Event planning and decoration",
          "color": "#10B981",
          "display_order": 6,
          "is_active": true
        },
        {
          "id": "facility_maintenance",
          "name": "Facility & Maintenance",
          "description": "Building and grounds upkeep",
          "color": "#6B7280",
          "display_order": 7,
          "is_active": true
        }
      ]
    },
    "groups": {
      "name": "Groups",
      "description": "Special interest and fellowship groups",
      "display_order": 7,
      "is_required": false,
      "component_style": "checkbox",
      "is_active": true,
      "items": [
        {
          "id": "precious_ladies",
          "name": "Precious Ladies",
          "description": "Women fellowship group",
          "color": "#EC4899",
          "display_order": 1,
          "is_active": true
        },
        {
          "id": "men_of_honour",
          "name": "Men of Honour",
          "description": "Men fellowship group",
          "color": "#3B82F6",
          "display_order": 2,
          "is_active": true
        },
        {
          "id": "teen_class",
          "name": "Teen Class",
          "description": "Teenage fellowship and learning",
          "color": "#F59E0B",
          "display_order": 3,
          "is_active": true
        },
        {
          "id": "young_adults",
          "name": "Young Adults",
          "description": "Young adult fellowship group",
          "color": "#10B981",
          "display_order": 4,
          "is_active": true
        },
        {
          "id": "seniors_fellowship",
          "name": "Seniors Fellowship",
          "description": "Senior members fellowship",
          "color": "#7C3AED",
          "display_order": 5,
          "is_active": true
        }
      ]
    }
  }
}');