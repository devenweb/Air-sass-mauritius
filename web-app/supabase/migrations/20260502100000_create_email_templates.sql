-- Migration: Create email_templates table
-- Description: Supports production-grade transactional email infrastructure.

CREATE TABLE IF NOT EXISTS public.email_templates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT UNIQUE NOT NULL,
    subject TEXT NOT NULL,
    body TEXT NOT NULL,
    description TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.email_templates ENABLE ROW LEVEL SECURITY;

-- Allow public read access (or restricted to service role if preferred, but usually read-only for system)
-- We'll allow authenticated users to read templates for previews if needed, but primarily for the app service role.
CREATE POLICY "Allow public read access for email templates"
ON public.email_templates FOR SELECT
TO public
USING (true);

-- Allow admins to manage templates (if admins table exists)
DO $$
BEGIN
    IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'admins') THEN
        CREATE POLICY "Allow admins to manage email templates"
        ON public.email_templates FOR ALL
        TO authenticated
        USING (EXISTS (SELECT 1 FROM public.admins WHERE email = auth.email()));
    END IF;
END $$;

-- Insert default templates if they don't exist
INSERT INTO public.email_templates (name, subject, body, description)
VALUES 
(
    'booking_confirmation', 
    'Booking Confirmation: {{booking_reference}} - Travel Lounge', 
    '<h1>Booking Confirmed</h1><p>Dear {{customer_name}},</p><p>Your booking for <strong>{{service_name}}</strong> has been received and is being processed.</p><p>Reference: <strong>{{booking_reference}}</strong></p><p>{{label_start}}: {{check_in}}</p><p>Total: {{total_price}}</p><p>Thank you for choosing Travel Lounge.</p>', 
    'Sent to the customer immediately after a booking request is submitted.'
),
(
    'admin_new_booking', 
    'NEW BOOKING: {{booking_reference}} - {{customer_name}}', 
    '<h1>New Booking Received</h1><p>A new booking has been submitted through the portal.</p><p><strong>Reference:</strong> {{booking_reference}}</p><p><strong>Customer:</strong> {{customer_name}} ({{customer_email}})</p><p><strong>Service:</strong> {{service_name}}</p><p><strong>{{label_start}}:</strong> {{check_in}}</p><p><strong>Pax:</strong> {{adults}} Adults, {{children}} Children</p><p><strong>Total:</strong> {{total_price}}</p><p><a href="https://admin.travellounge.mu/bookings">View in Admin Portal</a></p>', 
    'Sent to the staff for every new booking.'
),
(
    'inquiry_received', 
    'Inquiry Received: {{service_name}} - Travel Lounge', 
    '<h1>Thank You</h1><p>Dear {{customer_name}},</p><p>We have received your inquiry regarding <strong>{{service_name}}</strong>.</p><p>Our team will contact you shortly with a personalized quote.</p>', 
    'Sent to the customer after a general inquiry.'
)
ON CONFLICT (name) DO UPDATE SET
    subject = EXCLUDED.subject,
    body = EXCLUDED.body;
