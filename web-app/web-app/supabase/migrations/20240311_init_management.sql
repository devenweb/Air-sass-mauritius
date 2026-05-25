-- 1. Create FAQs Table
CREATE TABLE IF NOT EXISTS public.faqs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    category TEXT NOT NULL DEFAULT 'General',
    question TEXT NOT NULL,
    answer TEXT NOT NULL,
    order_index INT DEFAULT 0,
    is_published BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS
ALTER TABLE public.faqs ENABLE ROW LEVEL SECURITY;

-- Policies for FAQs
CREATE POLICY "Allow public read-only access to published FAQs"
ON public.faqs FOR SELECT
USING (is_published = true);

-- 2. Create Content Blocks Table (CMS)
CREATE TABLE IF NOT EXISTS public.content_blocks (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    page_slug TEXT NOT NULL,
    section_key TEXT NOT NULL,
    content JSONB NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(page_slug, section_key)
);

-- Enable RLS
ALTER TABLE public.content_blocks ENABLE ROW LEVEL SECURITY;

-- Policies for Content Blocks
CREATE POLICY "Allow public read-only access to content blocks"
ON public.content_blocks FOR SELECT
USING (true);

-- 3. Create Inquiries Table (Contact Form)
CREATE TABLE IF NOT EXISTS public.inquiries (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    email TEXT NOT NULL,
    phone TEXT,
    subject TEXT NOT NULL,
    message TEXT NOT NULL,
    status TEXT DEFAULT 'unread' CHECK (status IN ('unread', 'read')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS
ALTER TABLE public.inquiries ENABLE ROW LEVEL SECURITY;

-- Policies for Inquiries
CREATE POLICY "Allow anyone to insert an inquiry"
ON public.inquiries FOR INSERT
WITH CHECK (true);

-- 4. Ensure Reviews Table has status (if not already)
-- Note: Assuming reviews table exists as per web-app code
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='reviews' AND column_name='status') THEN
        ALTER TABLE public.reviews ADD COLUMN status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected'));
    END IF;
END $$;

-- Update Reviews RLS to only show approved reviews to public
-- (Warning: This might drop existing policies, please adjust if needed)
CREATE POLICY "Only show approved reviews to public"
ON public.reviews FOR SELECT
USING (status = 'approved');

-- 5. Create Subscribers Table (Newsletter)
CREATE TABLE IF NOT EXISTS public.subscribers (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    email TEXT NOT NULL UNIQUE,
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'unsubscribed')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS
ALTER TABLE public.subscribers ENABLE ROW LEVEL SECURITY;

-- Policies for Subscribers
CREATE POLICY "Allow anyone to subscribe"
ON public.subscribers FOR INSERT
WITH CHECK (true);

-- 6. Create Editorial Posts Table (News/Blog)
CREATE TABLE IF NOT EXISTS public.editorial_posts (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    title TEXT NOT NULL,
    slug TEXT NOT NULL UNIQUE,
    excerpt TEXT,
    content TEXT,
    featured_image TEXT,
    author_id UUID REFERENCES auth.users(id),
    status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'archived')),
    tags TEXT[] DEFAULT '{}',
    published_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS
ALTER TABLE public.editorial_posts ENABLE ROW LEVEL SECURITY;

-- Policies for Editorial Posts
CREATE POLICY "Allow public read-only access to published posts"
ON public.editorial_posts FOR SELECT
USING (status = 'published');
