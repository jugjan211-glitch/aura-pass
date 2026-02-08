
-- Allow anyone to read shared passwords by token (needed for share link viewing)
CREATE POLICY "Anyone can view shared passwords by token" ON public.shared_passwords
FOR SELECT USING (true);

-- Allow anyone to update view_count
CREATE POLICY "Anyone can update view count" ON public.shared_passwords
FOR UPDATE USING (true) WITH CHECK (true);
