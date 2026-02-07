
-- Table for storing TOTP 2FA secrets
CREATE TABLE public.totp_secrets (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL UNIQUE,
  secret text NOT NULL,
  is_enabled boolean NOT NULL DEFAULT false,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.totp_secrets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own TOTP" ON public.totp_secrets FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create own TOTP" ON public.totp_secrets FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own TOTP" ON public.totp_secrets FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own TOTP" ON public.totp_secrets FOR DELETE USING (auth.uid() = user_id);

CREATE TRIGGER update_totp_secrets_updated_at BEFORE UPDATE ON public.totp_secrets
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Table for password sharing
CREATE TABLE public.shared_passwords (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  password_id uuid NOT NULL,
  shared_by uuid NOT NULL,
  share_token text NOT NULL UNIQUE,
  encrypted_data text NOT NULL,
  expires_at timestamp with time zone NOT NULL,
  max_views integer NOT NULL DEFAULT 1,
  view_count integer NOT NULL DEFAULT 0,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.shared_passwords ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can create own shares" ON public.shared_passwords FOR INSERT WITH CHECK (auth.uid() = shared_by);
CREATE POLICY "Users can view own shares" ON public.shared_passwords FOR SELECT USING (auth.uid() = shared_by);
CREATE POLICY "Users can delete own shares" ON public.shared_passwords FOR DELETE USING (auth.uid() = shared_by);
