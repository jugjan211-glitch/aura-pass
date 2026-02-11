
-- Create atomic RPC for viewing shared passwords (fixes race condition + removes need for public SELECT/UPDATE)
CREATE OR REPLACE FUNCTION public.view_shared_password(p_share_token TEXT)
RETURNS TABLE (encrypted_data TEXT)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_record RECORD;
BEGIN
  -- Validate input
  IF p_share_token IS NULL OR length(p_share_token) != 64 THEN
    RAISE EXCEPTION 'Invalid share token';
  END IF;

  -- Atomic: select for update, check constraints, increment, return
  SELECT sp.encrypted_data, sp.expires_at, sp.view_count, sp.max_views, sp.id
  INTO v_record
  FROM shared_passwords sp
  WHERE sp.share_token = p_share_token
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Share not found';
  END IF;

  IF v_record.expires_at < NOW() THEN
    RAISE EXCEPTION 'Share expired';
  END IF;

  IF v_record.view_count >= v_record.max_views THEN
    RAISE EXCEPTION 'View limit reached';
  END IF;

  -- Atomically increment
  UPDATE shared_passwords SET view_count = view_count + 1 WHERE id = v_record.id;

  RETURN QUERY SELECT v_record.encrypted_data;
END;
$$;

-- Drop the public SELECT policy (no longer needed - RPC handles it)
DROP POLICY IF EXISTS "Anyone can view shared passwords by token" ON public.shared_passwords;

-- Drop the public UPDATE policy (no longer needed - RPC handles it)
DROP POLICY IF EXISTS "Anyone can increment view count" ON public.shared_passwords;

-- Add length constraint on profiles display_name
ALTER TABLE public.profiles ADD CONSTRAINT profiles_display_name_length CHECK (length(display_name) <= 200);
