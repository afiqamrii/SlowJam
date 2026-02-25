-- INSTRUCTIONS: Run this SQL snippet in your Supabase SQL Editor to add the letterify_downloads tracking.
-- 1. Add the new column to track Letterify downloads
ALTER TABLE capsules
ADD COLUMN letterify_downloads INTEGER DEFAULT 0;
-- 2. Create the RPC function to increment the counter
CREATE OR REPLACE FUNCTION increment_letterify_downloads(target_capsule_id UUID) RETURNS void LANGUAGE plpgsql SECURITY DEFINER AS $$ BEGIN
UPDATE capsules
SET letterify_downloads = COALESCE(letterify_downloads, 0) + 1
WHERE id = target_capsule_id;
END;
$$;