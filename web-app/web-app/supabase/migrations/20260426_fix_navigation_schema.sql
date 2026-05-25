-- Fix navigations table schema
-- Applied on: 2026-04-26

-- 1. Add missing columns if they don't exist
DO $$ 
BEGIN 
    -- Add icon column
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='navigations' AND column_name='icon') THEN
        ALTER TABLE public.navigations ADD COLUMN icon TEXT;
    END IF;

    -- Add created_at column
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='navigations' AND column_name='created_at') THEN
        ALTER TABLE public.navigations ADD COLUMN created_at TIMESTAMPTZ DEFAULT NOW();
    END IF;

    -- Add updated_at column
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='navigations' AND column_name='updated_at') THEN
        ALTER TABLE public.navigations ADD COLUMN updated_at TIMESTAMPTZ DEFAULT NOW();
    END IF;
END $$;

-- 2. Ensure id has a default (UUID)
ALTER TABLE public.navigations ALTER COLUMN id SET DEFAULT gen_random_uuid();

-- 3. Ensure display_order has a default
ALTER TABLE public.navigations ALTER COLUMN display_order SET DEFAULT 0;

-- 4. Enable RLS and set policies
ALTER TABLE public.navigations ENABLE ROW LEVEL SECURITY;

-- Management policy for staff
DROP POLICY IF EXISTS "cms_staff_manage_nav" ON public.navigations;
CREATE POLICY "cms_staff_manage_nav" ON public.navigations 
FOR ALL USING (
    EXISTS (
        SELECT 1 FROM public.admins 
        WHERE user_id = auth.uid() 
        AND is_active = true
    )
) 
WITH CHECK (
    EXISTS (
        SELECT 1 FROM public.admins 
        WHERE user_id = auth.uid() 
        AND is_active = true
    )
);

-- Public read policy
DROP POLICY IF EXISTS "cms_public_read_nav" ON public.navigations;
CREATE POLICY "cms_public_read_nav" ON public.navigations 
FOR SELECT USING (
    is_active = true 
    OR 
    EXISTS (
        SELECT 1 FROM public.admins 
        WHERE user_id = auth.uid() 
        AND is_active = true
    )
);
