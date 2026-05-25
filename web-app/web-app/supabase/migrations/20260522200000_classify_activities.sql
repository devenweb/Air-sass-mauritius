-- Migration: Classify Activities & Excursions
-- Date: 2026-05-22
-- Purpose: Reclassify tours to activities and set activity types.

-- 1. Update service_type to 'activity' and activity_type to 'Land' or 'Sea' for target local excursions/activities
UPDATE public.services 
SET service_type = 'activity', activity_type = 'Land'
WHERE id IN (
    'fd6a1906-2de8-4c4e-a6ac-6dcd0ba4c312', -- Seven Coloured Earth & Chamarel
    '119eab3f-1fe4-48d8-83d0-820ca794d8f8', -- Tea Route
    '410af1f2-52e5-4631-94ee-23ce745c5f7e', -- Tea Route Experience
    '5671ce8b-97ad-43fe-b632-4a9d598c638c', -- Rum & Sugar Trail
    '61f0fa0c-dfb7-404a-a984-d9ce8b9dbf31', -- Tea Path Discovery
    '6215147b-8a1a-4264-8f0c-c91f7752f362', -- Northern Highlights
    '9bf8a9dd-b528-421f-9ec4-24259fa3bf86', -- South Island Adventure
    'f7287120-808d-4061-99e2-1d761dc30e4f', -- Grand North Tour
    '3e68afbc-9c95-401c-a5b1-fb1768106709', -- Port Louis Heritage Walk
    '0c50696e-58d1-4577-aa77-d7bfd52775e7', -- Chamarel Discovery
    'ff1dc10a-2d84-48e5-a2d2-e72408be0608', -- Chamarel Ziplining
    '3f7095b1-eed0-4dcc-a512-9974f9f6911a', -- Black River Gorges Private Hike
    'da8a211e-e2aa-4d70-8637-49778931a41e', -- Black River Gorges Hiking
    '803657ab-96d8-4d83-a6f1-df067d85a6e3', -- Skydiving over the Coast
    'bb1a3668-24da-4b19-99fb-3f7fca0569ce', -- Casela Nature Park Entry
    'ecb95da9-22b8-48c0-9ad8-e0e19479f864', -- Trou d'Argent Magic
    '43ead3a7-6eab-47c8-86ed-bbabf0eeac7f', -- Chamarel Wonders
    '569ca86f-a592-4936-ac2f-49540c201fb5'  -- Residence Le Gentil (From Backup: May 16)
);

UPDATE public.services 
SET service_type = 'activity', activity_type = 'Sea'
WHERE id IN (
    '666774cd-5138-4ff2-9114-6a79a5a6396c', -- East Coast Island Hopping
    '04acaaeb-38e6-4359-9689-4cbe8562d383', -- Catamaran Sunset
    '0db7fe31-1e46-44f2-96ea-3562cda37622', -- Blue Safari Submarine
    '227abc76-f2ca-4d18-acfa-563d134e4d6f', -- Underwater Walk
    '9524b682-ee67-40f6-8457-e516b315ab16', -- Deep Sea Fishing
    'f9d706ea-d02e-41b1-b1fd-92e46da4559b', -- Scuba Diving - Coin de Mire
    '092a66b2-ff7b-4bc5-93cc-1cb8a58301f0', -- Île des Deux Cocos (Saturday Offer)
    '42554d32-cd72-489e-8ccb-50a1ff3e0cec', -- Île des Deux Cocos (Saturday Offer) (From Backup: May 18)
    '75c95246-d1b0-4a1a-aa06-279fb9dc09e3', -- Full-Day Catamaran Trip to Gabriel Island
    '126034b6-ce3d-4d45-b4b6-5221e01e4d21', -- Full-Day Catamaran Trip to Gabriel Island (From Backup: May 18)
    '66dd0494-622f-4390-9a0c-378728046008', -- Water Activities at Belle Mare Beach
    'd01bd0f7-11c6-4265-b170-496b211554af'  -- Water Activities at Belle Mare Beach (From Backup: May 18)
);

-- 2. Link all services with type = 'activity' to the 'Activities' category (ID: '3303bb90-b905-4c85-a163-84743c54da1c')
-- We delete existing links for these services to Activities first if they exist (to avoid constraint conflicts if no UNIQUE index, or handle with ON CONFLICT)
-- Since we want it to be safe across various DB setups, we can use a double check or subquery:
INSERT INTO public.service_categories (service_id, category_id)
SELECT s.id, '3303bb90-b905-4c85-a163-84743c54da1c'
FROM public.services s
WHERE s.service_type = 'activity'
  AND NOT EXISTS (
      SELECT 1 FROM public.service_categories sc 
      WHERE sc.service_id = s.id 
        AND sc.category_id = '3303bb90-b905-4c85-a163-84743c54da1c'
  );
