-- DATA COMPLETENESS & MEDIA NORMALIZATION PASS (V2 - FULL ACTIVITIES & CATEGORIES)
-- Applied on: 2026-04-27
-- Target: categories, services, room_types, service_pricing
-- Rule: Every service must have complete metadata. Categories must have premium images.

-- 1. CATEGORIES NORMALIZATION (Fixing missing images)
INSERT INTO public.categories (name, slug, image_url, description, is_active)
VALUES 
('Boutique Hotels', 'hotels', 'https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&q=80', 'Discover the finest selection of luxury resorts, boutique hotels, and cozy island retreats across Mauritius and Rodrigues.', TRUE),
('Luxury Cruises', 'cruises', 'https://images.unsplash.com/photo-1548574505-5e239809ee19?auto=format&fit=crop&q=80', 'Set sail on the turquoise waters of the Indian Ocean with our curated collection of catamaran cruises and sunset voyages.', TRUE),
('Elite Activities', 'activities', 'https://images.unsplash.com/photo-1533105079780-92b9be482077?auto=format&fit=crop&q=80', 'From mountain hiking to underwater safaris, explore the diverse activities that make Mauritius a playground for adventure.', TRUE),
('Immersive Tours', 'tours', 'https://images.unsplash.com/photo-1527631746610-bca00a040d60?auto=format&fit=crop&q=80', 'Authentic cultural experiences and guided explorations across the island''s most historic and scenic landmarks.', TRUE),
('Seasonal Deals', 'deals', 'https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1?auto=format&fit=crop&q=80', 'Exclusive limited-time offers and curated packages designed to give you the best value for your tropical getaway.', TRUE),
('Day Packages', 'day-packages', 'https://images.unsplash.com/photo-1544124499-58912cbddaad?auto=format&fit=crop&q=80', 'Perfect for residents and short-stay visitors. Enjoy full resort access, lunch, and spa treatments for a single day.', TRUE)
ON CONFLICT (slug) DO UPDATE SET 
    name = EXCLUDED.name,
    image_url = EXCLUDED.image_url,
    description = EXCLUDED.description;

-- 2. ENRICHING SERVICES (Full Activities Seed Data)

-- Casela Nature Park Entry
INSERT INTO public.services (id, name, service_type, base_price, location, region, short_description, description, gallery_images, image_url, rating, highlights, included, amenities, meta_title, meta_description, is_active)
VALUES (
    '6301966a-3f25-4f43-9d48-645923f37f41', 'Casela Nature Park Entry', 'land_activity', 1800, 'Cascavelle', 'West', 
    'Interaction with wildlife and African-inspired safari adventure.', 
    'Experience the ultimate wildlife encounter at Casela Nature Parks, the most popular leisure attraction in Mauritius. Set across 350 hectares of stunning landscape, the park offers a unique opportunity to walk with lions, feed giraffes, and enjoy a scenic safari through African-inspired habitats. Visitors can also enjoy bird watching, quad biking, and a variety of family-friendly activities. Whether you are seeking a thrill on the zip lines or a peaceful moment with nature, Casela provides an unforgettable experience for all ages in the heart of the island''s west coast.',
    ARRAY['https://images.unsplash.com/photo-1549480017-d76466a4b7e8', 'https://images.unsplash.com/photo-1516422217105-0744a772a0bb', 'https://images.unsplash.com/photo-1534188753412-b89c0c2f8a1f'],
    'https://images.unsplash.com/photo-1549480017-d76466a4b7e8', 4.8, 
    '[{"item": "Walk with Lions experience"}, {"item": "Safari through African-style landscapes"}, {"item": "Interaction with giraffes and zebras"}, {"item": "Exciting Zip-line adventures"}]'::jsonb, 
    '[{"item": "Park entrance fee"}, {"item": "Safari bus tour"}, {"item": "Bird Park access"}]'::jsonb, 
    ARRAY['Parking', 'Restaurant', 'Guide', 'Toilets', 'Gift Shop'], 
    'Casela Nature Park Entry | Wildlife & Safari Mauritius', 'Book your entry to Casela Nature Park. Experience walking with lions, safaris, and family adventures in Mauritius.', TRUE
)
ON CONFLICT (id) DO UPDATE SET 
    short_description = EXCLUDED.short_description,
    description = EXCLUDED.description, 
    gallery_images = EXCLUDED.gallery_images,
    rating = EXCLUDED.rating,
    highlights = EXCLUDED.highlights,
    included = EXCLUDED.included,
    amenities = EXCLUDED.amenities,
    meta_title = EXCLUDED.meta_title,
    meta_description = EXCLUDED.meta_description;

-- Black River Gorges Hiking
INSERT INTO public.services (id, name, service_type, base_price, location, region, short_description, description, gallery_images, image_url, rating, highlights, included, amenities, duration_hours, meta_title, meta_description, is_active)
VALUES (
    'b4f292c3-d357-4514-9d86-8f197d168161', 'Black River Gorges Hiking', 'activity', 1500, 'Black River', 'South-West', 
    'Explore the lush green heart of Mauritius national park.', 
    'Discover the native flora and fauna of Mauritius in its largest and most spectacular national park. The Black River Gorges protects most of the island''s remaining native forests and is home to endangered species like the Echo Parakeet and Pink Pigeon. Our guided hiking tours take you through verdant forests, past cascading waterfalls, and up to breathtaking viewpoints overlooking the island''s dramatic coastline and rolling hills. This immersive experience is perfect for nature lovers and photographers seeking to capture the raw beauty of the Mauritian interior away from the coastal resorts.',
    ARRAY['https://images.unsplash.com/photo-1441974231531-c6227db76b6e', 'https://images.unsplash.com/photo-1533105079780-92b9be482077', 'https://images.unsplash.com/photo-1544735716-392fe2489ffa'],
    'https://images.unsplash.com/photo-1441974231531-c6227db76b6e', 4.7, 
    '[{"item": "Panoramic viewpoints over the gorges"}, {"item": "Native bird and orchid spotting"}, {"item": "Refreshing waterfall stops"}, {"item": "Guided ecological insights"}]'::jsonb, 
    '[{"item": "Professional nature guide"}, {"item": "Hiking permit"}, {"item": "Water and light snacks"}]'::jsonb, 
    ARRAY['Eco-friendly', 'Guided', 'Photography spots'], 4, 
    'Black River Gorges Hiking | Nature & Waterfalls Mauritius', 'Join a guided hike through the Black River Gorges. Explore native forests, waterfalls, and stunning island views.', TRUE
)
ON CONFLICT (id) DO UPDATE SET 
    short_description = EXCLUDED.short_description,
    description = EXCLUDED.description, 
    gallery_images = EXCLUDED.gallery_images,
    rating = EXCLUDED.rating,
    highlights = EXCLUDED.highlights,
    included = EXCLUDED.included,
    amenities = EXCLUDED.amenities,
    meta_title = EXCLUDED.meta_title,
    meta_description = EXCLUDED.meta_description;

-- Dolphin Swim & Crystal Rock
INSERT INTO public.services (id, name, service_type, base_price, location, region, short_description, description, gallery_images, image_url, rating, highlights, included, amenities, duration_hours, meta_title, meta_description, is_active)
VALUES (
    'c2d80131-a3d3-4f53-abfe-fc9b3c4afc8b', 'Dolphin Swim & Crystal Rock', 'water_activity', 3500, 'Tamarin', 'West', 
    'Swim with wild dolphins in their natural habitat.', 
    'Embark on an early morning journey into the turquoise waters of Tamarin Bay to encounter wild Spinner and Bottlenose dolphins. This ethically-minded excursion allows you to observe and swim alongside these magnificent creatures in their natural environment. After the dolphin encounter, we sail to the iconic Crystal Rock, a natural volcanic formation standing in the middle of the lagoon, where you can enjoy world-class snorkeling in crystal-clear waters teeming with tropical fish. A delicious BBQ lunch on the shores of Benitiers Island completes this quintessential Mauritian ocean experience.',
    ARRAY['https://images.unsplash.com/photo-1544551763-46a013bb70d5', 'https://images.unsplash.com/photo-1570168007204-dfb528c6958f', 'https://images.unsplash.com/photo-1551244072-5d12893278ab'],
    'https://images.unsplash.com/photo-1544551763-46a013bb70d5', 4.9, 
    '[{"item": "Swim with wild dolphins"}, {"item": "Snorkeling at Crystal Rock"}, {"item": "BBQ Lunch on Benitiers Island"}, {"item": "Expert marine guide"}]'::jsonb, 
    '[{"item": "Boat trip & equipment"}, {"item": "Gourmet BBQ lunch"}, {"item": "Soft drinks & beer"}]'::jsonb, 
    ARRAY['Snorkeling Gear', 'Lunch included', 'Open Bar'], 6, 
    'Dolphin Swim & Crystal Rock | Ocean Adventure Mauritius', 'Book a swim with wild dolphins in Tamarin. Visit Crystal Rock and enjoy a BBQ on Benitiers Island.', TRUE
)
ON CONFLICT (id) DO UPDATE SET 
    short_description = EXCLUDED.short_description,
    description = EXCLUDED.description, 
    gallery_images = EXCLUDED.gallery_images,
    rating = EXCLUDED.rating,
    highlights = EXCLUDED.highlights,
    included = EXCLUDED.included,
    amenities = EXCLUDED.amenities,
    meta_title = EXCLUDED.meta_title,
    meta_description = EXCLUDED.meta_description;

-- Ile aux Cerfs Catamaran Cruise
INSERT INTO public.services (id, name, service_type, base_price, location, region, short_description, description, gallery_images, image_url, rating, highlights, included, amenities, duration_hours, meta_title, meta_description, is_active)
VALUES (
    'd2d80131-a3d3-4f53-abfe-fc9b3c4afc8c', 'Ile aux Cerfs Catamaran Cruise', 'cruise', 2800, 'Trou d''Eau Douce', 'East', 
    'A day of luxury sailing to the iconic island paradise.', 
    'Set sail on a spacious catamaran from the historic village of Trou d''Eau Douce for a day of pure relaxation and exploration. We cruise through the crystal-clear lagoons of the East, stopping at the stunning GRSE waterfalls before heading to the world-famous Ile aux Cerfs island. Enjoy a day of sunbathing on white sandy beaches, swimming in turquoise waters, and indulging in a traditional Mauritian BBQ lunch prepared on board by our friendly crew. This cruise offers the perfect blend of adventure and leisure, making it a highlight for any traveler visiting the island.',
    ARRAY['https://images.unsplash.com/photo-1507525428034-b723cf961d3e', 'https://images.unsplash.com/photo-1544551763-8dd44758c2dd', 'https://images.unsplash.com/photo-1516939884455-1445c8652f83'],
    'https://images.unsplash.com/photo-1507525428034-b723cf961d3e', 4.8, 
    '[{"item": "Visit GRSE Waterfalls"}, {"item": "Full day on Ile aux Cerfs"}, {"item": "Onboard BBQ & Open Bar"}, {"item": "Snorkeling in East lagoon"}]'::jsonb, 
    '[{"item": "Full day cruise"}, {"item": "BBQ Lunch"}, {"item": "All drinks included"}]'::jsonb, 
    ARRAY['Catamaran', 'Restroom', 'Snorkeling Gear'], 7, 
    'Ile aux Cerfs Catamaran Cruise | East Coast Paradise Mauritius', 'Join our luxury catamaran cruise to Ile aux Cerfs. Waterfalls, snorkeling, and BBQ lunch included.', TRUE
)
ON CONFLICT (id) DO UPDATE SET 
    short_description = EXCLUDED.short_description,
    description = EXCLUDED.description, 
    gallery_images = EXCLUDED.gallery_images,
    rating = EXCLUDED.rating,
    highlights = EXCLUDED.highlights,
    included = EXCLUDED.included,
    amenities = EXCLUDED.amenities,
    meta_title = EXCLUDED.meta_title,
    meta_description = EXCLUDED.meta_description;

-- Chamarel Seven Coloured Earth
INSERT INTO public.services (id, name, service_type, base_price, location, region, short_description, description, gallery_images, image_url, rating, highlights, included, amenities, duration_hours, meta_title, meta_description, is_active)
VALUES (
    'e2d80131-a3d3-4f53-abfe-fc9b3c4afc8d', 'Chamarel Seven Coloured Earth', 'tour', 1200, 'Chamarel', 'South-West', 
    'Witness the geological marvel of vibrant sand dunes.', 
    'Discover one of the most iconic natural wonders of Mauritius at the Seven Coloured Earth in Chamarel. This unique geological formation features sand dunes of seven distinct colors—red, brown, violet, green, blue, purple, and yellow—that never mix, even after heavy rain. The tour also includes a visit to the majestic Chamarel Waterfall, the highest single-drop waterfall in Mauritius, and the nearby Ebony Forest. Learn about the volcanic history of the island and enjoy breathtaking views over the south-west coast from the various panoramic viewpoints within the park. A truly spiritual and visual feast.',
    ARRAY['https://images.unsplash.com/photo-1590523277543-a94d2e4eb00b', 'https://images.unsplash.com/photo-1589552820164-f4b7c37dd3af', 'https://images.unsplash.com/photo-1533105079780-92b9be482077'],
    'https://images.unsplash.com/photo-1590523277543-a94d2e4eb00b', 4.7, 
    '[{"item": "Unique 7-coloured sand dunes"}, {"item": "Chamarel Waterfall viewpoint"}, {"item": "Giant Tortoise park"}, {"item": "Coffee plantation visit"}]'::jsonb, 
    '[{"item": "Park entry fee"}, {"item": "Access to all viewpoints"}, {"item": "Tortoise park access"}]'::jsonb, 
    ARRAY['Parking', 'Cafe', 'Gift Shop', 'Toilets'], 3, 
    'Chamarel Seven Coloured Earth | Natural Wonder Mauritius', 'Visit the world-famous Seven Coloured Earth in Chamarel. See the waterfall and giant tortoises.', TRUE
)
ON CONFLICT (id) DO UPDATE SET 
    short_description = EXCLUDED.short_description,
    description = EXCLUDED.description, 
    gallery_images = EXCLUDED.gallery_images,
    rating = EXCLUDED.rating,
    highlights = EXCLUDED.highlights,
    included = EXCLUDED.included,
    amenities = EXCLUDED.amenities,
    meta_title = EXCLUDED.meta_title,
    meta_description = EXCLUDED.meta_description;

-- Port Louis Street Food Tour
INSERT INTO public.services (id, name, service_type, base_price, location, region, short_description, description, gallery_images, image_url, rating, highlights, included, amenities, duration_hours, meta_title, meta_description, is_active)
VALUES (
    'f2d80131-a3d3-4f53-abfe-fc9b3c4afc8e', 'Port Louis Street Food Tour', 'tour', 2200, 'Port Louis', 'North', 
    'A culinary journey through the heart of the capital.', 
    'Dive into the vibrant culinary landscape of Mauritius with a guided food tour through the bustling streets of Port Louis. Led by a local expert, you will explore the historic Central Market, Chinatown, and hidden alleyways to taste authentic Mauritian delicacies like Dholl Puri, Gateaux Piments, and Alouda. Learn about the diverse cultural influences—Indian, Chinese, French, and African—that have shaped the island''s unique flavor profile. This tour is not just about eating; it''s a deep dive into the history, traditions, and daily life of the Mauritian people in their vibrant capital city.',
    ARRAY['https://images.unsplash.com/photo-1563492065599-3520f775eeed', 'https://images.unsplash.com/photo-1504674900247-0877df9cc836', 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd'],
    'https://images.unsplash.com/photo-1563492065599-3520f775eeed', 4.9, 
    '[{"item": "Taste 10+ local delicacies"}, {"item": "Central Market exploration"}, {"item": "Chinatown cultural walk"}, {"item": "Local history commentary"}]'::jsonb, 
    '[{"item": "All food tastings"}, {"item": "Expert local guide"}, {"item": "Bottled water"}]'::jsonb, 
    ARRAY['Walking Tour', 'Food included', 'Expert Guide'], 4, 
    'Port Louis Street Food Tour | Culinary Culture Mauritius', 'Discover the best street food in Port Louis. A guided walking tour through the capital''s hidden gems.', TRUE
)
ON CONFLICT (id) DO UPDATE SET 
    short_description = EXCLUDED.short_description,
    description = EXCLUDED.description, 
    gallery_images = EXCLUDED.gallery_images,
    rating = EXCLUDED.rating,
    highlights = EXCLUDED.highlights,
    included = EXCLUDED.included,
    amenities = EXCLUDED.amenities,
    meta_title = EXCLUDED.meta_title,
    meta_description = EXCLUDED.meta_description;

-- Pamplemousses Botanical Garden
INSERT INTO public.services (id, name, service_type, base_price, location, region, short_description, description, gallery_images, image_url, rating, highlights, included, amenities, duration_hours, meta_title, meta_description, is_active)
VALUES (
    'a2d80131-a3d3-4f53-abfe-fc9b3c4afc8a', 'Pamplemousses Botanical Garden', 'tour', 800, 'Pamplemousses', 'North', 
    'Explore one of the oldest botanical gardens in the Southern Hemisphere.', 
    'Step into a world of botanical wonder at the Sir Seewoosagur Ramgoolam Botanical Garden, world-renowned for its collection of indigenous and exotic plants. Established over 300 years ago, the garden is most famous for its giant Victoria Amazonica water lilies, whose massive leaves can grow up to three meters in diameter. Wander through avenues of majestic palms, discover rare spices, and see the historic Mon Plaisir Chateau. Our guided tours provide fascinating insights into the garden''s history and the medicinal properties of its many tropical plants, making it a peaceful and educational escape in the North.',
    ARRAY['https://images.unsplash.com/photo-1441974231531-c6227db76b6e', 'https://images.unsplash.com/photo-1533105079780-92b9be482077', 'https://images.unsplash.com/photo-1544735716-392fe2489ffa'],
    'https://images.unsplash.com/photo-1441974231531-c6227db76b6e', 4.6, 
    '[{"item": "Giant Amazonica Water Lilies"}, {"item": "85 varieties of palms"}, {"item": "Rare spice garden"}, {"item": "Historic Mon Plaisir Chateau"}]'::jsonb, 
    '[{"item": "Garden entrance fee"}, {"item": "Professional guide"}, {"item": "Access to all areas"}]'::jsonb, 
    ARRAY['Guided', 'Photography spots', 'Historical Site'], 2, 
    'Pamplemousses Botanical Garden | Historic Nature Mauritius', 'Visit the world-famous SSR Botanical Garden. See giant water lilies and rare tropical flora.', TRUE
)
ON CONFLICT (id) DO UPDATE SET 
    short_description = EXCLUDED.short_description,
    description = EXCLUDED.description, 
    gallery_images = EXCLUDED.gallery_images,
    rating = EXCLUDED.rating,
    highlights = EXCLUDED.highlights,
    included = EXCLUDED.included,
    amenities = EXCLUDED.amenities,
    meta_title = EXCLUDED.meta_title,
    meta_description = EXCLUDED.meta_description;


-- 3. ENSURING ROOM TYPES (Data Completeness for Hotels)

-- Clean existing to prevent duplicates during pass
DELETE FROM public.room_types WHERE service_id IN ('b1fdbe71-8d9f-4087-8821-512176afa629', '5b795371-785e-4b14-95eb-0d92bb2be7d7');

-- Shangri-La Rooms
INSERT INTO public.room_types (service_id, name, weekday_price, weekend_price, max_occupancy, max_adults, image_url, images, meal_plan, description)
VALUES 
('b1fdbe71-8d9f-4087-8821-512176afa629', 'Deluxe Ocean View Room', 48000, 52000, 3, 2, 'https://images.unsplash.com/photo-1584132967334-10e028bd69f7', ARRAY['https://images.unsplash.com/photo-1584132967334-10e028bd69f7', 'https://images.unsplash.com/photo-1540541338287-41700207dee6'], 'Bed & Breakfast', 'Spacious room with a private balcony and stunning views of the turquoise Indian Ocean.'),
('b1fdbe71-8d9f-4087-8821-512176afa629', 'Junior Suite Hibiscus Ocean View', 65000, 70000, 3, 2, 'https://images.unsplash.com/photo-1571011263841-38372648580b', ARRAY['https://images.unsplash.com/photo-1571011263841-38372648580b', 'https://images.unsplash.com/photo-1540541338287-41700207dee6'], 'Bed & Breakfast', 'Elegant suite featuring direct beach access and a separate lounge area for ultimate relaxation.');

-- LUX* Grand Baie Rooms
INSERT INTO public.room_types (service_id, name, weekday_price, weekend_price, max_occupancy, max_adults, image_url, images, meal_plan, description)
VALUES 
('5b795371-785e-4b14-95eb-0d92bb2be7d7', 'LUX* Junior Suite', 25000, 28000, 2, 2, 'https://images.unsplash.com/photo-1542314831-068cd1dbfeeb', ARRAY['https://images.unsplash.com/photo-1542314831-068cd1dbfeeb', 'https://images.unsplash.com/photo-1566073771259-6a8506099945'], 'Bed & Breakfast', 'A masterfully designed suite with a furnished terrace and high-tech amenities for the modern traveler.'),
('5b795371-785e-4b14-95eb-0d92bb2be7d7', 'LUX* Pool Villa', 85000, 95000, 4, 4, 'https://images.unsplash.com/photo-1571896349842-33c89424de2d', ARRAY['https://images.unsplash.com/photo-1571896349842-33c89424de2d', 'https://images.unsplash.com/photo-1566073771259-6a8506099945'], 'Bed & Breakfast', 'An expansive villa with a private heated pool, outdoor dining, and dedicated butler service.');


-- 4. ENSURING SERVICE PRICING (Data Completeness for Activities)

-- Clean existing to prevent duplicates during pass
DELETE FROM public.service_pricing WHERE service_id IN (
    '6301966a-3f25-4f43-9d48-645923f37f41', 
    'b4f292c3-d357-4514-9d86-8f197d168161', 
    'c2d80131-a3d3-4f53-abfe-fc9b3c4afc8b',
    'd2d80131-a3d3-4f53-abfe-fc9b3c4afc8c',
    'e2d80131-a3d3-4f53-abfe-fc9b3c4afd8d',
    'f2d80131-a3d3-4f53-abfe-fc9b3c4afc8e',
    'a2d80131-a3d3-4f53-abfe-fc9b3c4afc8a'
);

-- Pricing for Activities
INSERT INTO public.service_pricing (service_id, label, date_from, date_to, price, price_child, price_teen, price_infant)
VALUES 
('6301966a-3f25-4f43-9d48-645923f37f41', 'Standard Entry', '2026-01-01', '2026-12-31', 1800, 950, 1400, 0),
('b4f292c3-d357-4514-9d86-8f197d168161', 'Guided Hike', '2026-01-01', '2026-12-31', 1500, 800, 1200, 0),
('c2d80131-a3d3-4f53-abfe-fc9b3c4afc8b', 'Standard Excursion', '2026-01-01', '2026-12-31', 3500, 1800, 2500, 0),
('d2d80131-a3d3-4f53-abfe-fc9b3c4afc8c', 'Full Day Cruise', '2026-01-01', '2026-12-31', 2800, 1400, 2000, 0),
('e2d80131-a3d3-4f53-abfe-fc9b3c4afc8d', 'Standard Entry', '2026-01-01', '2026-12-31', 1200, 600, 900, 0),
('f2d80131-a3d3-4f53-abfe-fc9b3c4afc8e', 'Standard Tour', '2026-01-01', '2026-12-31', 2200, 1100, 1500, 0),
('a2d80131-a3d3-4f53-abfe-fc9b3c4afc8a', 'Standard Entry', '2026-01-01', '2026-12-31', 800, 400, 600, 0);
