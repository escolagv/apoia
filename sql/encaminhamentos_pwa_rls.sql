-- ===============================================================
-- RLS PWA + STORAGE (ENC_TEMP) - PRODUCAO
-- Objetivo: permitir upload do PWA via QR sem abrir dados.
-- ===============================================================

-- Funcao para validar dispositivo via QR (ignora RLS da tabela)
CREATE OR REPLACE FUNCTION public.enc_device_qr_ok(p_device_id text)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
    SELECT EXISTS (
        SELECT 1
        FROM public.enc_qr_tokens t
        WHERE t.device_id = p_device_id
          AND t.expires_at > now()
    );
$$;

GRANT EXECUTE ON FUNCTION public.enc_device_qr_ok(text) TO anon, authenticated;

-- ===============================================================
-- ENC_SCAN_JOBS: permitir INSERT anonimo apenas com QR valido
-- ===============================================================

GRANT INSERT ON public.enc_scan_jobs TO anon;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies
        WHERE schemaname = 'public'
          AND tablename = 'enc_scan_jobs'
          AND policyname = 'enc_scan_jobs_pwa_insert'
    ) THEN
        CREATE POLICY enc_scan_jobs_pwa_insert
        ON public.enc_scan_jobs
        FOR INSERT
        TO anon
        WITH CHECK (
            status = 'novo'
            AND storage_path LIKE 'enc_temp/%'
            AND public.enc_device_qr_ok(device_id)
        );
    END IF;
END $$;

-- ===============================================================
-- STORAGE: ENC_TEMP (PWA upload + admin access)
-- ===============================================================

-- PWA pode inserir somente em enc_temp e com device autorizado
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies
        WHERE schemaname = 'storage'
          AND tablename = 'objects'
          AND policyname = 'enc_temp_pwa_insert'
    ) THEN
        CREATE POLICY enc_temp_pwa_insert
        ON storage.objects
        FOR INSERT
        TO anon
        WITH CHECK (
            bucket_id = 'enc_temp'
            AND public.enc_device_qr_ok(split_part(name, '/', 5))
        );
    END IF;
END $$;

-- Admin pode listar/baixar/remover do enc_temp
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies
        WHERE schemaname = 'storage'
          AND tablename = 'objects'
          AND policyname = 'enc_temp_admin_all'
    ) THEN
        CREATE POLICY enc_temp_admin_all
        ON storage.objects
        FOR ALL
        TO authenticated
        USING (bucket_id = 'enc_temp' AND public.is_admin(auth.uid()))
        WITH CHECK (bucket_id = 'enc_temp' AND public.is_admin(auth.uid()));
    END IF;
END $$;
