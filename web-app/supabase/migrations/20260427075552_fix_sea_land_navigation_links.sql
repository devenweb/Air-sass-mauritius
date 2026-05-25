-- Fix navigation links for Sea and Land Activities
UPDATE public.navigations
SET link = '/activities/land'
WHERE label = 'Land' AND (link = '/activities' OR link = '/local-deals');

UPDATE public.navigations
SET link = '/activities/sea'
WHERE label = 'Sea' AND (link = '/cruises' OR link = '/local-deals');
