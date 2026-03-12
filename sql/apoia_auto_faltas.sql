-- ===============================================================
-- APOIA: ENCAMINHAMENTO AUTOMATICO POR FALTAS
-- Regras:
-- 1) 5 faltas consecutivas no ano letivo
-- 2) 7 faltas intercaladas em 30 dias (mes)
-- Justificadas nao entram
-- Dias nao letivos do calendario nao contam
-- Gera somente 1 vez por aluno (auto_faltas = true)
-- ===============================================================

ALTER TABLE public.apoia_encaminhamentos
    ADD COLUMN IF NOT EXISTS auto_faltas boolean DEFAULT false;

ALTER TABLE public.apoia_encaminhamentos
    ADD COLUMN IF NOT EXISTS auto_regra text;

ALTER TABLE public.alertas
    ADD COLUMN IF NOT EXISTS chave text;

CREATE UNIQUE INDEX IF NOT EXISTS apoia_enc_auto_faltas_uniq
    ON public.apoia_encaminhamentos (aluno_id)
    WHERE auto_faltas = true;

CREATE UNIQUE INDEX IF NOT EXISTS alertas_chave_uniq
    ON public.alertas (chave)
    WHERE chave IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_presencas_aluno_data
    ON public.presencas (aluno_id, data);

-- Considera finais de semana e eventos do calendario (globais ou da turma)
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

CREATE OR REPLACE FUNCTION public.apoia_auto_faltas_trigger()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
SET row_security = off
AS $$
DECLARE
    v_ano_letivo int;
    v_consecutivas int := 0;
    v_intercaladas int := 0;
    v_regra text := NULL;
    v_obs text := NULL;
    v_alerta_ativo boolean := false;
    v_aluno_nome text := NULL;
    v_chave text := NULL;
BEGIN
    IF NEW.aluno_id IS NULL OR NEW.data IS NULL THEN
        RETURN NEW;
    END IF;

    IF NEW.status IS DISTINCT FROM 'falta' THEN
        RETURN NEW;
    END IF;

    IF NEW.justificativa = 'Falta justificada' THEN
        RETURN NEW;
    END IF;

    IF public.is_dia_nao_letivo(NEW.data, NEW.turma_id) THEN
        RETURN NEW;
    END IF;

    IF TG_OP = 'UPDATE' THEN
        IF (OLD.status IS NOT DISTINCT FROM NEW.status)
           AND (COALESCE(OLD.justificativa, '') = COALESCE(NEW.justificativa, '')) THEN
            RETURN NEW;
        END IF;
    END IF;

    IF EXISTS (
        SELECT 1
        FROM public.apoia_encaminhamentos ae
        WHERE ae.aluno_id = NEW.aluno_id
          AND ae.auto_faltas = true
    ) THEN
        RETURN NEW;
    END IF;

    SELECT t.ano_letivo
    INTO v_ano_letivo
    FROM public.turmas t
    WHERE t.id = NEW.turma_id;

    -- Faltas consecutivas (considera dias nao letivos fora da contagem)
    WITH base AS (
        SELECT
            p.data,
            CASE
                WHEN p.status = 'falta'
                 AND (p.justificativa IS NULL OR p.justificativa <> 'Falta justificada')
                 AND NOT public.is_dia_nao_letivo(p.data, p.turma_id)
                THEN 1 ELSE 0
            END AS falta_injust
        FROM public.presencas p
        JOIN public.turmas t ON t.id = p.turma_id
        WHERE p.aluno_id = NEW.aluno_id
          AND (v_ano_letivo IS NULL OR t.ano_letivo = v_ano_letivo)
          AND p.data <= NEW.data
    ),
    seq AS (
        SELECT
            data,
            falta_injust,
            SUM(CASE WHEN falta_injust = 0 THEN 1 ELSE 0 END) OVER (ORDER BY data) AS grp
        FROM base
    ),
    streaks AS (
        SELECT grp, COUNT(*) AS streak
        FROM seq
        WHERE falta_injust = 1
        GROUP BY grp
    )
    SELECT COALESCE(MAX(streak), 0) INTO v_consecutivas FROM streaks;

    IF v_consecutivas >= 5 THEN
        v_regra := 'faltas_consecutivas_5';
        v_obs := 'Regra automática: 5 faltas consecutivas no ano letivo.';
    ELSE
        -- Faltas intercaladas em 30 dias
        SELECT COUNT(*)
        INTO v_intercaladas
        FROM public.presencas p
        JOIN public.turmas t ON t.id = p.turma_id
        WHERE p.aluno_id = NEW.aluno_id
          AND p.status = 'falta'
          AND (p.justificativa IS NULL OR p.justificativa <> 'Falta justificada')
          AND NOT public.is_dia_nao_letivo(p.data, p.turma_id)
          AND p.data >= (NEW.data - INTERVAL '30 days')
          AND p.data <= NEW.data
          AND (v_ano_letivo IS NULL OR t.ano_letivo = v_ano_letivo);

        IF v_intercaladas >= 7 THEN
            v_regra := 'faltas_intercaladas_7_30d';
            v_obs := 'Regra automática: 7 faltas intercaladas em 30 dias.';
        END IF;
    END IF;

    IF v_regra IS NULL THEN
        RETURN NEW;
    END IF;

    BEGIN
        INSERT INTO public.apoia_encaminhamentos (
            aluno_id,
            data_encaminhamento,
            motivo,
            status,
            observacoes,
            auto_faltas,
            auto_regra
        ) VALUES (
            NEW.aluno_id,
            NEW.data,
            'Faltas',
            'Em andamento',
            v_obs,
            true,
            v_regra
        );
    EXCEPTION WHEN unique_violation THEN
        RETURN NEW;
    END;

    SELECT COALESCE(alerta_faltas_ativo, false)
    INTO v_alerta_ativo
    FROM public.configuracoes
    ORDER BY id ASC
    LIMIT 1;

    IF v_alerta_ativo THEN
        SELECT a.nome_completo INTO v_aluno_nome
        FROM public.alunos a
        WHERE a.id = NEW.aluno_id;

        v_chave := 'auto_faltas:' || NEW.aluno_id;
        INSERT INTO public.alertas (mensagem, lido, chave)
        SELECT
            'Aluno ' || COALESCE(v_aluno_nome, 'ID ' || NEW.aluno_id) ||
            ' entrou em acompanhamento por faltas (' ||
            CASE v_regra
                WHEN 'faltas_consecutivas_5' THEN '5 consecutivas'
                WHEN 'faltas_intercaladas_7_30d' THEN '7 em 30 dias'
                ELSE v_regra
            END || ').',
            false,
            v_chave
        WHERE NOT EXISTS (SELECT 1 FROM public.alertas WHERE chave = v_chave);
    END IF;

    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS presencas_auto_faltas ON public.presencas;
CREATE TRIGGER presencas_auto_faltas
AFTER INSERT OR UPDATE OF status, justificativa ON public.presencas
FOR EACH ROW EXECUTE FUNCTION public.apoia_auto_faltas_trigger();
