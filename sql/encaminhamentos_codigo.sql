-- ===============================================================
-- CODIGO AUTOMATICO DO ENCAMINHAMENTO (ENC-AAAA-000001)
-- ===============================================================
-- Executar apos o script base de encaminhamentos.

CREATE TABLE IF NOT EXISTS public.enc_codigo_seq (
    ano int PRIMARY KEY,
    last_value int NOT NULL
);

CREATE OR REPLACE FUNCTION public.next_enc_codigo(p_data date)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_ano int;
    next_val int;
BEGIN
    v_ano := COALESCE(EXTRACT(YEAR FROM p_data)::int, EXTRACT(YEAR FROM now())::int);

    INSERT INTO public.enc_codigo_seq (ano, last_value)
    VALUES (v_ano, 1)
    ON CONFLICT (ano) DO UPDATE
        SET last_value = public.enc_codigo_seq.last_value + 1
    RETURNING last_value INTO next_val;

    RETURN 'ENC-' || v_ano::text || '-' || lpad(next_val::text, 6, '0');
END;
$$;

GRANT EXECUTE ON FUNCTION public.next_enc_codigo(date) TO authenticated;

-- Preview sem consumir numero (nao incrementa)
CREATE OR REPLACE FUNCTION public.next_enc_codigo_preview(p_data date)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_ano int;
    last_val int;
    next_val int;
BEGIN
    v_ano := COALESCE(EXTRACT(YEAR FROM p_data)::int, EXTRACT(YEAR FROM now())::int);
    SELECT last_value INTO last_val FROM public.enc_codigo_seq WHERE ano = v_ano;
    IF last_val IS NULL THEN
        next_val := 1;
    ELSE
        next_val := last_val + 1;
    END IF;
    RETURN 'ENC-' || v_ano::text || '-' || lpad(next_val::text, 6, '0');
END;
$$;

GRANT EXECUTE ON FUNCTION public.next_enc_codigo_preview(date) TO authenticated;

CREATE OR REPLACE FUNCTION public.enc_set_codigo()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    IF NEW.codigo IS NULL OR NEW.codigo = '' THEN
        NEW.codigo := public.next_enc_codigo(NEW.data_encaminhamento);
    END IF;
    RETURN NEW;
END;
$$;

GRANT EXECUTE ON FUNCTION public.enc_set_codigo() TO authenticated;

ALTER TABLE public.enc_encaminhamentos
    ADD COLUMN IF NOT EXISTS codigo text;

CREATE UNIQUE INDEX IF NOT EXISTS enc_encaminhamentos_codigo_uidx
    ON public.enc_encaminhamentos (codigo);

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_trigger
        WHERE tgname = 'enc_encaminhamentos_set_codigo'
    ) THEN
        CREATE TRIGGER enc_encaminhamentos_set_codigo
        BEFORE INSERT ON public.enc_encaminhamentos
        FOR EACH ROW
        EXECUTE FUNCTION public.enc_set_codigo();
    END IF;
END $$;

-- Preencher codigo em registros antigos (se houver)
UPDATE public.enc_encaminhamentos
SET codigo = public.next_enc_codigo(data_encaminhamento)
WHERE codigo IS NULL;
