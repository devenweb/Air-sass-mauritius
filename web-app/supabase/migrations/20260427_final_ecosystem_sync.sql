-- AUTHORITATIVE ECOSYSTEM SYNC & DATA NORMALIZATION
-- Target: navigations, categories, services, service_categories
-- Purpose: Fixing broken links, missing category images, and seeding 8 premier activities.

-- 1. RESET NAVIGATION MENU (Authoritative Links)
TRUNCATE TABLE public.navigations RESTART IDENTITY CASCADE;

-- Root Items
INSERT INTO public.navigations (label, link, display_order, is_active) VALUES 
('Hotels', '/hotels', 1, TRUE),
('Flights', '/flights', 2, TRUE),
('Cruises', '/cruises', 3, TRUE),
('Activities', '/activities', 4, TRUE),
('Tours', '/guided-group-tours', 5, TRUE),
('Day Packages', '/day-packages', 6, TRUE),
('Tailor Made', '/tailormade', 7, TRUE);

-- Sub-items for Hotels (Top Regions)
WITH hotel_parent AS (SELECT id FROM public.navigations WHERE label = 'Hotels' LIMIT 1)
INSERT INTO public.navigations (parent_id, label, link, display_order, is_active)
SELECT id, 'North Coast', '/hotels?region=North', 1, TRUE FROM hotel_parent
UNION ALL
SELECT id, 'East Coast', '/hotels?region=East', 2, TRUE FROM hotel_parent
UNION ALL
SELECT id, 'West Coast', '/hotels?region=West', 3, TRUE FROM hotel_parent
UNION ALL
SELECT id, 'South Coast', '/hotels?region=South', 4, TRUE FROM hotel_parent;

-- Sub-items for Activities
WITH act_parent AS (SELECT id FROM public.navigations WHERE label = 'Activities' LIMIT 1)
INSERT INTO public.navigations (parent_id, label, link, display_order, is_active)
SELECT id, 'Water Activities', '/activities?type=water_activity', 1, TRUE FROM act_parent
UNION ALL
SELECT id, 'Land Activities', '/activities?type=land_activity', 2, TRUE FROM act_parent;

-- Footer / Agency Items
INSERT INTO public.navigations (label, link, display_order, is_active) VALUES 
('Our Story', '/about', 100, TRUE),
('Expert Team', '/about/team', 101, TRUE),
('Privacy Policy', '/privacy-policy', 102, TRUE),
('Terms of Service', '/terms-conditions', 103, TRUE),
('FAQ', '/faq', 104, TRUE);


-- 2. CATEGORIES NORMALIZATION (Premium Images)
INSERT INTO public.categories (name, slug, image_url, description, is_active, show_on_home, display_order)
VALUES 
('Boutique Hotels', 'hotels', 'https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&q=80', 'Discover the finest selection of luxury resorts and boutique retreats.', TRUE, TRUE, 1),
('Luxury Cruises', 'cruises', 'https://images.unsplash.com/photo-1548574505-5e239809ee19?auto=format&fit=crop&q=80', 'Set sail on the turquoise waters with our curated catamaran collection.', TRUE, TRUE, 2),
('Elite Activities', 'activities', 'https://images.unsplash.com/photo-1533105079780-92b9be482077?auto=format&fit=crop&q=80', 'Explore the diverse activities that make Mauritius a playground.', TRUE, TRUE, 3),
('Immersive Tours', 'tours', 'https://images.unsplash.com/photo-1527631746610-bca00a040d60?auto=format&fit=crop&q=80', 'Guided explorations across the island''s most scenic landmarks.', TRUE, TRUE, 4),
('Seasonal Deals', 'deals', 'https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1?auto=format&fit=crop&q=80', 'Exclusive limited-time offers and curated packages.', TRUE, TRUE, 5),
('Day Packages', 'day-packages', 'https://images.unsplash.com/photo-1544124499-58912cbddaad?auto=format&fit=crop&q=80', 'Enjoy full resort access and spa treatments for a single day.', TRUE, TRUE, 6)
ON CONFLICT (slug) DO UPDATE SET 
    name = EXCLUDED.name,
    image_url = EXCLUDED.image_url,
    description = EXCLUDED.description,
    show_on_home = EXCLUDED.show_on_home,
    display_order = EXCLUDED.display_order;


-- 3. SEED 8 PREMIER ISLAND ACTIVITIES
INSERT INTO public.services (id, name, service_type, base_price, location, region, short_description, description, image_url, rating, is_active, highlights, included, amenities)
VALUES 
('6301966a-3f25-4f43-9d48-645923f37f41', 'Casela Nature Park Adventure', 'land_activity', 1800, 'Cascavelle', 'West', 'Walk with lions and safari adventures.', '<p>Experience the ultimate wildlife encounter at Casela Nature Parks. From African Safaris to walking with lions, this is the heart of adventure in Mauritius.</p>', 'https://images.unsplash.com/photo-1549480017-d76466a4b7e8?auto=format&fit=crop&q=80', 4.8, TRUE, '["African Safari", "Walk with Lions", "Ziplining"]', '["Entry Ticket", "Safari Bus", "Guide"]', ARRAY['Safari', 'Wildlife', 'Adventure']),

('b4f292c3-d357-4514-9d86-8f197d168161', 'Black River Gorges Private Hike', 'activity', 1500, 'Black River', 'South-West', 'Lush green heart of Mauritius.', '<p>Explore the largest national park in Mauritius. Discover hidden waterfalls, endemic birds, and breathtaking viewpoints with our expert guides.</p>', 'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?auto=format&fit=crop&q=80', 4.7, TRUE, '["Waterfall Views", "Endemic Species", "Expert Guide"]', '["Guided Tour", "Water", "Snacks"]', ARRAY['Hiking', 'Nature', 'Photography']),

('a1fdbe71-8d9f-4087-8821-512176afa629', 'Swimming with Wild Dolphins', 'sea_activity', 2500, 'Tamarin', 'West', 'Unforgettable ocean encounter.', '<p>Join us for an early morning boat trip to meet the wild spinner and bottlenose dolphins in their natural habitat along the West coast.</p>', 'https://images.unsplash.com/photo-1570481662006-a3a1374699e8?auto=format&fit=crop&q=80', 4.9, TRUE, '["Wild Dolphin Encounter", "Snorkeling Equipment", "Crystal Rock Visit"]', '["Boat Transfer", "Breakfast", "Snorkel Gear"]', ARRAY['Snorkeling', 'Boat Trip', 'Dolphins']),

('c2fdbe71-8d9f-4087-8821-512176afa630', 'Ile aux Cerfs Catamaran Cruise', 'cruise', 3200, 'Trou d''Eau Douce', 'East', 'Full day of sun, sea, and BBQ.', '<p>Sail across the turquoise lagoon of the East coast. Enjoy snorkeling at GRSE waterfalls and a delicious BBQ lunch on the private island of Ile aux Cerfs.</p>', 'https://images.unsplash.com/photo-1548574505-5e239809ee19?auto=format&fit=crop&q=80', 4.8, TRUE, '["BBQ Lunch on Beach", "GRSE Waterfall Visit", "Open Bar"]', '["Lunch", "Drinks", "Snorkel Gear"]', ARRAY['Catamaran', 'Beach', 'BBQ']),

('d3fdbe71-8d9f-4087-8821-512176afa631', 'Seven Coloured Earth & Chamarel', 'tour', 1200, 'Chamarel', 'South-West', 'Natural wonder and scenic falls.', '<p>Visit the world-famous Seven Coloured Earth and the majestic Chamarel Waterfall. A must-see geological phenomenon in the lush South-West.</p>', 'https://images.unsplash.com/photo-1501785888041-af3ef285b470?auto=format&fit=crop&q=80', 4.6, TRUE, '["7 Coloured Earth", "Chamarel Waterfall", "Ebony Forest"]', '["Entry Fees", "Site Guide"]', ARRAY['Sightseeing', 'Geology', 'Nature']),

('e4fdbe71-8d9f-4087-8821-512176afa632', 'Port Louis Street Food Tour', 'activity', 1400, 'Port Louis', 'North-West', 'A culinary journey through the capital.', '<p>Taste the diverse flavors of Mauritius. From Dholl Puri to Gateau Piment, explore the hidden gems of the Port Louis Central Market.</p>', 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&q=80', 4.7, TRUE, '["Central Market Visit", "Authentic Street Food", "Historical Landmarks"]', '["All Food Tastings", "Local Guide"]', ARRAY['Food', 'Culture', 'History']),

('f5fdbe71-8d9f-4087-8821-512176afa633', 'Pamplemousses Botanical Garden', 'activity', 800, 'Pamplemousses', 'North', 'Historic gardens and giant lilies.', '<p>Stroll through one of the oldest botanical gardens in the Southern Hemisphere, famous for its giant Victoria amazonica water lilies.</p>', 'https://images.unsplash.com/photo-1585320806297-9794b3e4eeae?auto=format&fit=crop&q=80', 4.5, TRUE, '["Giant Water Lilies", "Spice Garden", "Talipot Palms"]', '["Entry Ticket", "Optional Guide"]', ARRAY['Gardening', 'History', 'Nature']),

('06fdbe71-8d9f-4087-8821-512176afa634', 'Grand Bassin & Sacred Temple', 'tour', 1600, 'Ganga Talao', 'South', 'Spiritual heart of Mauritius.', '<p>Visit the sacred crater lake of Grand Bassin, home to the majestic Shiva statue and peaceful Hindu temples surrounded by mountain mist.</p>', 'https://images.unsplash.com/photo-1544735716-392fe2489ffa?auto=format&fit=crop&q=80', 4.8, TRUE, '["Mangal Mahadev Statue", "Sacred Crater Lake", "Temple Visit"]', '["Guided Tour", "Transport"]', ARRAY['Culture', 'Spirituality', 'Scenery'])
ON CONFLICT (id) DO UPDATE SET 
    name = EXCLUDED.name,
    base_price = EXCLUDED.base_price,
    description = EXCLUDED.description,
    image_url = EXCLUDED.image_url,
    is_active = TRUE;

-- 4. LINK SERVICES TO ACTIVITIES CATEGORY
WITH act_cat AS (SELECT id FROM public.categories WHERE slug = 'activities' LIMIT 1)
INSERT INTO public.service_categories (service_id, category_id)
SELECT s.id, c.id FROM public.services s, act_cat c
WHERE s.service_type IN ('activity', 'land_activity', 'sea_activity')
ON CONFLICT DO NOTHING;
