-- ===============================================================
-- ORIGEM E INDEPENDENCIA DO CADASTRO (ENC_ALUNOS / ENC_PROFESSORES)
-- ===============================================================
-- Executar apos o script base.

-- Garantir extensao para UUID (se necessario)
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Sequencia para alunos manuais (evita conflito com IDs do APOIA)
CREATE SEQUENCE IF NOT EXISTS public.enc_alunos_manual_id_seq;
SELECT setval(
    'public.enc_alunos_manual_id_seq',
    GREATEST((SELECT COALESCE(MAX(id), 0) FROM public.enc_alunos) + 1, 1000000),
    false
);

ALTER TABLE public.enc_alunos
    ALTER COLUMN id SET DEFAULT nextval('public.enc_alunos_manual_id_seq'::regclass);

ALTER TABLE public.enc_professores
    ALTER COLUMN user_uid SET DEFAULT gen_random_uuid();

ALTER TABLE public.enc_alunos
    ADD COLUMN IF NOT EXISTS origem text DEFAULT 'apoia';

ALTER TABLE public.enc_professores
    ADD COLUMN IF NOT EXISTS origem text DEFAULT 'apoia';

UPDATE public.enc_alunos SET origem = 'apoia' WHERE origem IS NULL;
UPDATE public.enc_professores SET origem = 'apoia' WHERE origem IS NULL;

-- ===============================================================
-- ATUALIZAR FUNCAO DE SYNC PARA NAO SOBRESCREVER REGISTROS MANUAIS
-- ===============================================================
CREATE OR REPLACE FUNCTION public.sync_enc_cache()
RETURNS void
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public
AS $$
BEGIN
    -- Inserir alunos novos do APOIA
    INSERT INTO public.enc_alunos (id, nome_completo, matricula, turma_id, nome_responsavel, telefone, status, origem)
    SELECT a.id, a.nome_completo, a.matricula, a.turma_id, a.nome_responsavel, a.telefone, a.status, 'apoia'
    FROM public.alunos a
    WHERE NOT EXISTS (SELECT 1 FROM public.enc_alunos e WHERE e.id = a.id);

    -- Atualizar alunos existentes SOMENTE se origem = 'apoia'
    UPDATE public.enc_alunos e
    SET nome_completo = a.nome_completo,
        matricula = a.matricula,
        turma_id = a.turma_id,
        nome_responsavel = a.nome_responsavel,
        telefone = a.telefone,
        status = a.status,
        copied_at = now()
    FROM public.alunos a
    WHERE a.id = e.id
      AND e.origem = 'apoia'
      AND (
        e.nome_completo IS DISTINCT FROM a.nome_completo OR
        e.matricula IS DISTINCT FROM a.matricula OR
        e.turma_id IS DISTINCT FROM a.turma_id OR
        e.nome_responsavel IS DISTINCT FROM a.nome_responsavel OR
        e.telefone IS DISTINCT FROM a.telefone OR
        e.status IS DISTINCT FROM a.status
      );

    -- Inserir professores novos do APOIA
    INSERT INTO public.enc_professores (user_uid, nome, email, telefone, status, vinculo, origem)
    SELECT u.user_uid, u.nome, u.email, u.telefone, u.status, u.vinculo, 'apoia'
    FROM public.usuarios u
    WHERE u.papel = 'professor'
      AND NOT EXISTS (SELECT 1 FROM public.enc_professores e WHERE e.user_uid = u.user_uid);

    -- Atualizar professores existentes SOMENTE se origem = 'apoia'
    UPDATE public.enc_professores e
    SET nome = u.nome,
        email = u.email,
        telefone = u.telefone,
        status = u.status,
        vinculo = u.vinculo,
        copied_at = now()
    FROM public.usuarios u
    WHERE u.user_uid = e.user_uid
      AND u.papel = 'professor'
      AND e.origem = 'apoia'
      AND (
        e.nome IS DISTINCT FROM u.nome OR
        e.email IS DISTINCT FROM u.email OR
        e.telefone IS DISTINCT FROM u.telefone OR
        e.status IS DISTINCT FROM u.status OR
        e.vinculo IS DISTINCT FROM u.vinculo
      );

    -- Inativar somente registros do APOIA que nao existem mais la
    UPDATE public.enc_alunos e
    SET status = 'inativo'
    WHERE e.origem = 'apoia'
      AND NOT EXISTS (SELECT 1 FROM public.alunos a WHERE a.id = e.id);

    UPDATE public.enc_professores e
    SET status = 'inativo'
    WHERE e.origem = 'apoia'
      AND NOT EXISTS (
        SELECT 1 FROM public.usuarios u
        WHERE u.user_uid = e.user_uid AND u.papel = 'professor'
      );

    -- Inativar apenas registros do APOIA marcados como inativos
    UPDATE public.enc_alunos e
    SET status = 'inativo'
    FROM public.alunos a
    WHERE a.id = e.id AND a.status = 'inativo' AND e.status <> 'inativo' AND e.origem = 'apoia';

    UPDATE public.enc_professores e
    SET status = 'inativo'
    FROM public.usuarios u
    WHERE u.user_uid = e.user_uid AND u.papel = 'professor' AND u.status = 'inativo' AND e.status <> 'inativo' AND e.origem = 'apoia';
END;
$$;

GRANT EXECUTE ON FUNCTION public.sync_enc_cache() TO authenticated;
