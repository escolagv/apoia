-- ===============================================================
-- QR DO DIA (VALIDACAO PWA)
-- ===============================================================

CREATE TABLE IF NOT EXISTS public.enc_qr_tokens (
    id bigserial PRIMARY KEY,
    token text UNIQUE NOT NULL,
    dia date NOT NULL,
    expires_at timestamptz NOT NULL,
    used_at timestamptz,
    device_id text,
    created_by uuid,
    created_at timestamptz DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.enc_qr_tokens TO authenticated;

ALTER TABLE public.enc_qr_tokens ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies
        WHERE schemaname = 'public'
          AND tablename = 'enc_qr_tokens'
          AND policyname = 'enc_qr_tokens_admin_all'
    ) THEN
        CREATE POLICY enc_qr_tokens_admin_all
        ON public.enc_qr_tokens
        FOR ALL
        TO authenticated
        USING (public.is_admin(auth.uid()))
        WITH CHECK (public.is_admin(auth.uid()));
    END IF;
END $$;
