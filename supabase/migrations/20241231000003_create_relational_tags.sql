-- Create relational tags structure to replace JSON-based tags in people_configurations
-- This migration creates the new relational tables for tags management

-- Create tags table for tag categories (e.g., "Departments", "Ministries", etc.)
CREATE TABLE IF NOT EXISTS public.tags (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT,
    display_order INTEGER DEFAULT 0,
    is_required BOOLEAN DEFAULT false,
    component_style VARCHAR(20) DEFAULT 'dropdown' CHECK (component_style IN ('dropdown', 'multiselect', 'checkbox', 'radio', 'list', 'badge')),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by UUID REFERENCES auth.users(id),
    last_updated_by UUID REFERENCES auth.users(id),
    
    -- Ensure unique tag names per organization
    UNIQUE(organization_id, name)
);

-- Create tag_items table for individual tag values (e.g., "Media Department", "Youth Ministry", etc.)
CREATE TABLE IF NOT EXISTS public.tag_items (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    tag_id UUID NOT NULL REFERENCES public.tags(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT,
    color VARCHAR(7) DEFAULT '#6B7280', -- Hex color code
    display_order INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by UUID REFERENCES auth.users(id),
    last_updated_by UUID REFERENCES auth.users(id),
    
    -- Ensure unique tag item names per tag
    UNIQUE(tag_id, name)
);

-- Create member_tag_items table for many-to-many relationship between members and tag items
CREATE TABLE IF NOT EXISTS public.member_tag_items (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    member_id UUID NOT NULL REFERENCES public.members(id) ON DELETE CASCADE,
    tag_item_id UUID NOT NULL REFERENCES public.tag_items(id) ON DELETE CASCADE,
    assigned_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    assigned_by UUID REFERENCES auth.users(id),
    
    -- Ensure unique assignment per member and tag item
    UNIQUE(member_id, tag_item_id)
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_tags_organization_id ON public.tags(organization_id);
CREATE INDEX IF NOT EXISTS idx_tags_name ON public.tags(name);
CREATE INDEX IF NOT EXISTS idx_tags_component_style ON public.tags(component_style);
CREATE INDEX IF NOT EXISTS idx_tags_is_active ON public.tags(is_active);
CREATE INDEX IF NOT EXISTS idx_tags_display_order ON public.tags(display_order);

CREATE INDEX IF NOT EXISTS idx_tag_items_tag_id ON public.tag_items(tag_id);
CREATE INDEX IF NOT EXISTS idx_tag_items_name ON public.tag_items(name);
CREATE INDEX IF NOT EXISTS idx_tag_items_is_active ON public.tag_items(is_active);
CREATE INDEX IF NOT EXISTS idx_tag_items_display_order ON public.tag_items(display_order);

CREATE INDEX IF NOT EXISTS idx_member_tag_items_member_id ON public.member_tag_items(member_id);
CREATE INDEX IF NOT EXISTS idx_member_tag_items_tag_item_id ON public.member_tag_items(tag_item_id);
CREATE INDEX IF NOT EXISTS idx_member_tag_items_assigned_at ON public.member_tag_items(assigned_at);

-- Create triggers for updated_at columns
CREATE TRIGGER update_tags_updated_at 
    BEFORE UPDATE ON public.tags 
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_tag_items_updated_at 
    BEFORE UPDATE ON public.tag_items 
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Enable Row Level Security
ALTER TABLE public.tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tag_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.member_tag_items ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for authenticated users
CREATE POLICY "Allow authenticated users full access to tags" 
    ON public.tags 
    FOR ALL 
    TO authenticated 
    USING (true) 
    WITH CHECK (true);

CREATE POLICY "Allow authenticated users full access to tag_items" 
    ON public.tag_items 
    FOR ALL 
    TO authenticated 
    USING (true) 
    WITH CHECK (true);

CREATE POLICY "Allow authenticated users full access to member_tag_items" 
    ON public.member_tag_items 
    FOR ALL 
    TO authenticated 
    USING (true) 
    WITH CHECK (true);

-- Insert default tags for a sample organization (can be removed in production)
-- This provides a starting point similar to the JSON schema defaults
INSERT INTO public.tags (organization_id, name, description, display_order, is_required, component_style, is_active) VALUES
('6bede681-52b5-4616-969b-02d303d84f53', 'Membership Categories', 'Different categories of church membership', 1, true, 'dropdown', true),
('6bede681-52b5-4616-969b-02d303d84f53', 'Membership Status', 'Current status of member in the church', 2, true, 'dropdown', true),
('6bede681-52b5-4616-969b-02d303d84f53', 'Leadership Levels', 'Different levels of leadership responsibility', 3, false, 'dropdown', true),
('6bede681-52b5-4616-969b-02d303d84f53', 'Positions', 'Specific positions or roles within the church', 4, false, 'multiselect', true),
('6bede681-52b5-4616-969b-02d303d84f53', 'Ministries', 'Ministry areas and departments', 5, false, 'checkbox', true),
('6bede681-52b5-4616-969b-02d303d84f53', 'Departments', 'Organizational departments', 6, false, 'checkbox', true),
('6bede681-52b5-4616-969b-02d303d84f53', 'Groups', 'Small groups and fellowship groups', 7, false, 'multiselect', true);

-- Insert default tag items for membership categories
INSERT INTO public.tag_items (tag_id, name, description, color, display_order, is_active) 
SELECT 
    t.id,
    item.name,
    item.description,
    item.color,
    item.display_order,
    item.is_active
FROM public.tags t,
(VALUES 
    ('Regular Member', 'Full voting member of the church', '#10B981', 1, true),
    ('Associate Member', 'Non-voting member with limited privileges', '#F59E0B', 2, true),
    ('Visitor', 'Regular attendee who is not yet a member', '#6B7280', 3, true),
    ('Honorary Member', 'Special recognition member status', '#8B5CF6', 4, true)
) AS item(name, description, color, display_order, is_active)
WHERE t.name = 'Membership Categories' AND t.organization_id = '6bede681-52b5-4616-969b-02d303d84f53';

-- Insert default tag items for membership status
INSERT INTO public.tag_items (tag_id, name, description, color, display_order, is_active) 
SELECT 
    t.id,
    item.name,
    item.description,
    item.color,
    item.display_order,
    item.is_active
FROM public.tags t,
(VALUES 
    ('Active', 'Currently active member', '#10B981', 1, true),
    ('Inactive', 'Temporarily inactive member', '#F59E0B', 2, true),
    ('Transferred', 'Transferred to another church', '#6B7280', 3, true),
    ('Deceased', 'Member who has passed away', '#EF4444', 4, true)
) AS item(name, description, color, display_order, is_active)
WHERE t.name = 'Membership Status' AND t.organization_id = '6bede681-52b5-4616-969b-02d303d84f53';

-- Insert default tag items for leadership levels
INSERT INTO public.tag_items (tag_id, name, description, color, display_order, is_active) 
SELECT 
    t.id,
    item.name,
    item.description,
    item.color,
    item.display_order,
    item.is_active
FROM public.tags t,
(VALUES 
    ('Senior Pastor', 'Lead pastor of the church', '#8B5CF6', 1, true),
    ('Associate Pastor', 'Assistant pastor role', '#6366F1', 2, true),
    ('Elder', 'Church elder with governance responsibilities', '#10B981', 3, true),
    ('Deacon', 'Servant leader role', '#F59E0B', 4, true),
    ('Ministry Leader', 'Leader of a specific ministry', '#EF4444', 5, true),
    ('Team Leader', 'Leader of a ministry team', '#06B6D4', 6, true)
) AS item(name, description, color, display_order, is_active)
WHERE t.name = 'Leadership Levels' AND t.organization_id = '6bede681-52b5-4616-969b-02d303d84f53';

-- Insert default tag items for positions
INSERT INTO public.tag_items (tag_id, name, description, color, display_order, is_active) 
SELECT 
    t.id,
    item.name,
    item.description,
    item.color,
    item.display_order,
    item.is_active
FROM public.tags t,
(VALUES 
    ('Worship Leader', 'Leads worship services', '#8B5CF6', 1, true),
    ('Youth Pastor', 'Pastor for youth ministry', '#6366F1', 2, true),
    ('Children''s Director', 'Oversees children''s ministry', '#10B981', 3, true),
    ('Music Director', 'Directs church music programs', '#F59E0B', 4, true),
    ('Administrative Assistant', 'Provides administrative support', '#EF4444', 5, true),
    ('Treasurer', 'Manages church finances', '#06B6D4', 6, true),
    ('Secretary', 'Records meetings and communications', '#84CC16', 7, true)
) AS item(name, description, color, display_order, is_active)
WHERE t.name = 'Positions' AND t.organization_id = '6bede681-52b5-4616-969b-02d303d84f53';

-- Insert default tag items for ministries
INSERT INTO public.tag_items (tag_id, name, description, color, display_order, is_active) 
SELECT 
    t.id,
    item.name,
    item.description,
    item.color,
    item.display_order,
    item.is_active
FROM public.tags t,
(VALUES 
    ('Worship Ministry', 'Music and worship services', '#8B5CF6', 1, true),
    ('Youth Ministry', 'Programs for teenagers', '#6366F1', 2, true),
    ('Children''s Ministry', 'Programs for children', '#10B981', 3, true),
    ('Outreach Ministry', 'Community outreach and evangelism', '#F59E0B', 4, true),
    ('Prayer Ministry', 'Prayer groups and intercession', '#EF4444', 5, true),
    ('Discipleship Ministry', 'Teaching and mentoring', '#06B6D4', 6, true),
    ('Missions Ministry', 'Local and international missions', '#84CC16', 7, true),
    ('Hospitality Ministry', 'Welcoming and hosting', '#F97316', 8, true)
) AS item(name, description, color, display_order, is_active)
WHERE t.name = 'Ministries' AND t.organization_id = '6bede681-52b5-4616-969b-02d303d84f53';

-- Insert default tag items for departments
INSERT INTO public.tag_items (tag_id, name, description, color, display_order, is_active) 
SELECT 
    t.id,
    item.name,
    item.description,
    item.color,
    item.display_order,
    item.is_active
FROM public.tags t,
(VALUES 
    ('Administration', 'Administrative and office functions', '#6B7280', 1, true),
    ('Finance', 'Financial management and accounting', '#10B981', 2, true),
    ('Facilities', 'Building and grounds maintenance', '#F59E0B', 3, true),
    ('Media', 'Audio, video, and technical support', '#8B5CF6', 4, true),
    ('Communications', 'Marketing and communications', '#06B6D4', 5, true),
    ('Education', 'Teaching and educational programs', '#EF4444', 6, true)
) AS item(name, description, color, display_order, is_active)
WHERE t.name = 'Departments' AND t.organization_id = '6bede681-52b5-4616-969b-02d303d84f53';

-- Insert default tag items for groups
INSERT INTO public.tag_items (tag_id, name, description, color, display_order, is_active) 
SELECT 
    t.id,
    item.name,
    item.description,
    item.color,
    item.display_order,
    item.is_active
FROM public.tags t,
(VALUES 
    ('Men''s Fellowship', 'Fellowship group for men', '#3B82F6', 1, true),
    ('Women''s Fellowship', 'Fellowship group for women', '#EC4899', 2, true),
    ('Young Adults', 'Group for young adults (18-35)', '#10B981', 3, true),
    ('Seniors', 'Group for senior members', '#F59E0B', 4, true),
    ('Bible Study Group', 'Weekly Bible study meetings', '#8B5CF6', 5, true),
    ('Prayer Group', 'Regular prayer meetings', '#EF4444', 6, true),
    ('Small Group Alpha', 'Alpha course small group', '#06B6D4', 7, true),
    ('Small Group Beta', 'Beta course small group', '#84CC16', 8, true)
) AS item(name, description, color, display_order, is_active)
WHERE t.name = 'Groups' AND t.organization_id = '6bede681-52b5-4616-969b-02d303d84f53';

-- Add helpful comments
COMMENT ON TABLE public.tags IS 'Tag categories for organizing church members (e.g., Departments, Ministries, etc.)';
COMMENT ON TABLE public.tag_items IS 'Individual tag values within each tag category (e.g., Media Department, Youth Ministry, etc.)';
COMMENT ON TABLE public.member_tag_items IS 'Many-to-many relationship between members and their assigned tag items';

COMMENT ON COLUMN public.tags.component_style IS 'UI component style for rendering: dropdown, multiselect, checkbox, radio, list, badge';
COMMENT ON COLUMN public.tag_items.color IS 'Hex color code for visual identification of the tag item';
COMMENT ON COLUMN public.member_tag_items.assigned_at IS 'Timestamp when the tag was assigned to the member';