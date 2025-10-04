-- Fix the users table to ensure proper ID generation
-- First, let's check if the table has the right default

-- Enable the uuid-ossp extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Check current table structure
SELECT column_name, data_type, is_nullable, column_default 
FROM information_schema.columns 
WHERE table_name = 'users' AND table_schema = 'public';

-- If the ID column doesn't have a proper default, fix it
-- This will generate a CUID-like ID using uuid_generate_v4()
ALTER TABLE public.users 
ALTER COLUMN id SET DEFAULT 'c' || replace(uuid_generate_v4()::text, '-', '');

-- Alternative: Use a simpler UUID default
-- ALTER TABLE public.users ALTER COLUMN id SET DEFAULT uuid_generate_v4()::text;

-- Ensure the table has proper constraints
ALTER TABLE public.users ALTER COLUMN id SET NOT NULL;
ALTER TABLE public.users ALTER COLUMN email SET NOT NULL;
ALTER TABLE public.users ALTER COLUMN name SET NOT NULL;
ALTER TABLE public.users ALTER COLUMN password SET NOT NULL;

-- Add unique constraint on email if not exists
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'users_email_key' 
        AND table_name = 'users'
    ) THEN
        ALTER TABLE public.users ADD CONSTRAINT users_email_key UNIQUE (email);
    END IF;
END $$;

-- Set default values for other columns
ALTER TABLE public.users ALTER COLUMN role SET DEFAULT 'USER';
ALTER TABLE public.users ALTER COLUMN "createdAt" SET DEFAULT now();
ALTER TABLE public.users ALTER COLUMN "updatedAt" SET DEFAULT now();

-- Show the final table structure
SELECT column_name, data_type, is_nullable, column_default 
FROM information_schema.columns 
WHERE table_name = 'users' AND table_schema = 'public'
ORDER BY ordinal_position;