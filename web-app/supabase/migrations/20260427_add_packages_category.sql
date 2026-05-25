-- Add 'Packages' category with show_on_home = TRUE
-- This ensures it appears in the 6-category grid on the homepage
INSERT INTO public.categories (name, slug, icon, image_url, display_order, is_active, show_on_home, description) VALUES
('Packages', 'packages', 'Package', 'https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1?auto=format&fit=crop&q=80', 11, true, true, 'Comprehensive travel bundles including hotels, transfers, and curated experiences at a fixed value.')
ON CONFLICT (slug) DO UPDATE SET 
    name = EXCLUDED.name,
    icon = EXCLUDED.icon,
    image_url = EXCLUDED.image_url,
    display_order = EXCLUDED.display_order,
    is_active = EXCLUDED.is_active,
    show_on_home = EXCLUDED.show_on_home,
    description = EXCLUDED.description;

-- Add 'Packages' to navigation
-- First, shift existing ones to make room if needed
UPDATE public.navigations SET display_order = display_order + 1 WHERE display_order >= 4;

INSERT INTO public.navigations (id, label, link, display_order, is_active)
VALUES (gen_random_uuid(), 'Packages', '/packages', 4, true)
ON CONFLICT (label, link) DO UPDATE SET 
    display_order = EXCLUDED.display_order,
    is_active = EXCLUDED.is_active;

-- Disable 'Seasonal Deals' from Home to maintain a 6-item grid
UPDATE public.categories SET show_on_home = FALSE WHERE slug = 'deals';
