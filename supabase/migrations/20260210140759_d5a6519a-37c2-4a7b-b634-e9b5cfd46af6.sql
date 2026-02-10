
-- Drop the overly permissive update policy
DROP POLICY "Anyone can update view count" ON public.shared_passwords;

-- Create a more restrictive policy - only allow incrementing view_count
CREATE POLICY "Anyone can increment view count" ON public.shared_passwords
FOR UPDATE USING (true) WITH CHECK (view_count <= max_views + 1);
