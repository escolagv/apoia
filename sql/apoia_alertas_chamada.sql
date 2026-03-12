-- ===============================================================
-- ALERTAS: CHAMADA NAO REALIZADA (para o sininho)
-- Gera alertas para o dia informado (padrao: ontem)
-- ===============================================================

ALTER TABLE public.alertas
    ADD COLUMN IF NOT EXISTS chave text;

CREATE UNIQUE INDEX IF NOT EXISTS alertas_chave_uniq
    ON public.alertas (chave)
    WHERE chave IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_presencas_turma_data
    ON public.presencas (turma_id, data);

-- Mantem a funcao de dias nao letivos (caso ainda nao exista)
CREATE OR REPLACE FUNCTION public.is_dia_nao_letivo(p_data date, p_turma_id bigint)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
SET row_security = off
AS $$
DECLARE
    v_dow int;
BEGIN
    v_dow := EXTRACT(DOW FROM p_data);
    IF v_dow IN (0, 6) THEN
        RETURN true;
    END IF;

    RETURN EXISTS (
        SELECT 1
        FROM public.eventos e
        WHERE p_data >= e.data
          AND p_data <= COALESCE(e.data_fim, e.data)
          AND (
              e.abrangencia IS NULL
              OR e.abrangencia = 'global'
              OR (e.abrangencia = 'turmas'
                  AND p_turma_id IS NOT NULL
                  AND p_turma_id = ANY (e.turmas_ids))
          )
    );
END;
$$;

CREATE OR REPLACE FUNCTION public.generate_alertas_chamada(p_data date DEFAULT (current_date - 1))
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
SET row_security = off
AS $$
DECLARE
    v_alerta_ativo boolean := false;
    v_count int := 0;
    v_rowcount int := 0;
    v_chave text;
    rec record;
BEGIN
    SELECT COALESCE(alerta_chamada_ativo, false)
    INTO v_alerta_ativo
    FROM public.configuracoes
    ORDER BY id ASC
    LIMIT 1;

    IF v_alerta_ativo IS DISTINCT FROM true THEN
        RETURN 0;
    END IF;

    FOR rec IN
        WITH faltantes AS (
            SELECT
                pt.professor_id,
                u.nome AS professor_nome,
                t.id AS turma_id,
                t.nome_turma
            FROM public.professores_turmas pt
            JOIN public.turmas t ON t.id = pt.turma_id
            JOIN public.usuarios u ON u.user_uid = pt.professor_id
            WHERE u.status = 'ativo'
              AND NOT EXISTS (
                  SELECT 1
                  FROM public.presencas p
                  WHERE p.turma_id = t.id
                    AND p.data = p_data
              )
              AND NOT public.is_dia_nao_letivo(p_data, t.id)
        )
        SELECT
            professor_id,
            professor_nome,
            string_agg(nome_turma, ', ' ORDER BY nome_turma) AS turmas
        FROM faltantes
        GROUP BY professor_id, professor_nome
    LOOP
        v_chave := 'chamada_nao_feita:' || rec.professor_id || ':' || p_data;
        INSERT INTO public.alertas (mensagem, lido, chave)
        SELECT
            'Chamada nao registrada em ' || to_char(p_data, 'DD/MM/YYYY') ||
            ': ' || COALESCE(rec.professor_nome, 'Professor') ||
            ' (Turmas: ' || rec.turmas || ').',
            false,
            v_chave
        WHERE NOT EXISTS (SELECT 1 FROM public.alertas WHERE chave = v_chave);

        GET DIAGNOSTICS v_rowcount = ROW_COUNT;
        v_count := v_count + v_rowcount;
    END LOOP;

    RETURN v_count;
END;
$$;
