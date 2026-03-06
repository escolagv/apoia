-- ===============================================================
-- TABELAS ANUAIS DE ENCAMINHAMENTOS (ENC_ENCAMINHAMENTOS_YYYY)
-- ===============================================================
-- Executar apos o script base e apos encaminhamentos_codigo.sql

CREATE OR REPLACE FUNCTION public.ensure_encaminhamentos_year(p_year int)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    table_name text := format('enc_encaminhamentos_%s', p_year);
    seq_name text := format('%s_id_seq', table_name);
    policy_name text := format('%s_admin_all', table_name);
    trigger_name text := format('%s_set_codigo', table_name);
BEGIN
    EXECUTE format('CREATE TABLE IF NOT EXISTS public.%I (LIKE public.enc_encaminhamentos INCLUDING ALL)', table_name);
    EXECUTE format('ALTER TABLE public.%I ADD COLUMN IF NOT EXISTS codigo text', table_name);

    -- Garantir sequence própria para o id (LIKE pode copiar a default antiga)
    EXECUTE format('CREATE SEQUENCE IF NOT EXISTS public.%I', seq_name);
    EXECUTE format('ALTER TABLE public.%I ALTER COLUMN id SET DEFAULT nextval(''public.%I''::regclass)', table_name, seq_name);

    EXECUTE format('CREATE UNIQUE INDEX IF NOT EXISTS %I ON public.%I (codigo)', table_name || '_codigo_uidx', table_name);

    EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', table_name);
    BEGIN
        EXECUTE format(
            'CREATE POLICY %I ON public.%I FOR ALL TO authenticated USING (public.is_admin(auth.uid())) WITH CHECK (public.is_admin(auth.uid()))',
            policy_name, table_name
        );
    EXCEPTION WHEN duplicate_object THEN
        NULL;
    END;

    EXECUTE format('GRANT SELECT, INSERT, UPDATE, DELETE ON public.%I TO authenticated', table_name);
    EXECUTE format('GRANT USAGE, SELECT ON SEQUENCE public.%I TO authenticated', seq_name);

    BEGIN
        EXECUTE format(
            'CREATE TRIGGER %I BEFORE INSERT ON public.%I FOR EACH ROW EXECUTE FUNCTION public.enc_set_codigo()',
            trigger_name, table_name
        );
    EXCEPTION WHEN duplicate_object THEN
        NULL;
    END;
END;
$$;

GRANT EXECUTE ON FUNCTION public.ensure_encaminhamentos_year(int) TO authenticated;

-- Criar tabela do ano atual (ajuste se precisar criar outros anos)
SELECT public.ensure_encaminhamentos_year(EXTRACT(YEAR FROM now())::int);

-- (Opcional) Migrar registros da tabela base para o ano atual
-- INSERT INTO public.enc_encaminhamentos_2026
-- SELECT * FROM public.enc_encaminhamentos
-- WHERE data_encaminhamento >= '2026-01-01' AND data_encaminhamento < '2027-01-01';
