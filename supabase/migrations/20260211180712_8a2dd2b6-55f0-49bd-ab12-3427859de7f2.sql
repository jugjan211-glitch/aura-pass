
-- Update view_shared_password to validate hex format
CREATE OR REPLACE FUNCTION public.view_shared_password(p_share_token TEXT)
RETURNS TABLE (encrypted_data TEXT)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_record RECORD;
BEGIN
  -- Validate input: must be exactly 64 hex characters
  IF p_share_token IS NULL OR p_share_token !~ '^[a-f0-9]{64}$' THEN
    RAISE EXCEPTION 'Invalid share token';
  END IF;

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

  UPDATE shared_passwords SET view_count = view_count + 1 WHERE id = v_record.id;

  RETURN QUERY SELECT v_record.encrypted_data;
END;
$$;
