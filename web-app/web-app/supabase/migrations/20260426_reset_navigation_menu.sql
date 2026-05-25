-- Reset Navigation Menu to User Specified Structure with Verified Routes
-- Applied on: 2026-04-26
-- Routes verified against web-app/app/ directory structure

-- 1. Clear existing navigation
TRUNCATE TABLE public.navigations RESTART IDENTITY CASCADE;

-- 2. Insert Home
INSERT INTO public.navigations (id, label, link, display_order, is_active)
VALUES (gen_random_uuid(), 'Home', '/', 1, true);

-- 3. Insert Travel Abroad (Parent)
WITH travel_abroad AS (
    INSERT INTO public.navigations (id, label, link, display_order, is_active)
    VALUES (gen_random_uuid(), 'Travel Abroad', '#', 2, true)
    RETURNING id
)
INSERT INTO public.navigations (label, link, parent_id, display_order, is_active)
SELECT label, link, travel_abroad.id, d_order, true
FROM travel_abroad, (VALUES 
    ('Book a flight', '/flights', 1),
    ('Tailor Made packages', '/tailormade', 2),
    ('Cruise Vacations', '/cruises', 3),
    ('Guided Group Tours', '/guided-group-tours', 4),
    ('Rodrigues', '/rodrigues', 5),
    ('Visa Services', '/visa-services', 6)
) AS sub(label, link, d_order);

-- 4. Insert Hotels (Parent)
WITH hotels AS (
    INSERT INTO public.navigations (id, label, link, display_order, is_active)
    VALUES (gen_random_uuid(), 'Hotels', '/hotels', 3, true)
    RETURNING id
)
INSERT INTO public.navigations (label, link, parent_id, display_order, is_active)
SELECT label, link, hotels.id, d_order, true
FROM hotels, (VALUES 
    ('Rodrigues', '/rodrigue-hotels', 1),
    ('Day Packages', '/day-packages', 2)
) AS sub(label, link, d_order);

-- 5. Insert Flight (Top Level)
INSERT INTO public.navigations (id, label, link, display_order, is_active)
VALUES (gen_random_uuid(), 'Flight', '/flights', 4, true);

-- 6. Insert Local Deals (Parent)
WITH local_deals AS (
    INSERT INTO public.navigations (id, label, link, display_order, is_active)
    VALUES (gen_random_uuid(), 'Local Deals', '/local-deals', 5, true)
    RETURNING id
)
INSERT INTO public.navigations (label, link, parent_id, display_order, is_active)
SELECT label, link, local_deals.id, d_order, true
FROM local_deals, (VALUES 
    ('Land', '/activities', 1),
    ('Sea', '/cruises', 2)
) AS sub(label, link, d_order);

-- 7. Insert About
INSERT INTO public.navigations (id, label, link, display_order, is_active)
VALUES (gen_random_uuid(), 'About', '/about', 6, true);

-- 8. Insert Contact
INSERT INTO public.navigations (id, label, link, display_order, is_active)
VALUES (gen_random_uuid(), 'Contact', '/contact', 7, true);
