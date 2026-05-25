-- Migration to add missing columns to service_pricing table
-- This script should be run directly in your Supabase SQL editor

-- Add capacity column if it doesn't exist
ALTER TABLE service_pricing ADD COLUMN IF NOT EXISTS capacity INTEGER DEFAULT 0;

-- Add duration column if it doesn't exist
ALTER TABLE service_pricing ADD COLUMN IF NOT EXISTS duration INTEGER DEFAULT NULL;

-- Add duration_type column if it doesn't exist
ALTER TABLE service_pricing ADD COLUMN IF NOT EXISTS duration_type TEXT DEFAULT NULL;

-- Verify the changes
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_name = 'service_pricing'
AND column_name IN ('capacity', 'duration', 'duration_type');