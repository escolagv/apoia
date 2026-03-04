-- ===============================================================
-- ATUALIZACAO DA FUNCAO DE SYNC (ATUALIZAR TURMAS/ANO LETIVO)
-- ===============================================================

CREATE OR REPLACE FUNCTION public.sync_enc_cache()
RETURNS void
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public
AS $$
BEGIN
    -- Inserir alunos novos
    INSERT INTO public.enc_alunos (id, nome_completo, matricula, turma_id, nome_responsavel, telefone, status)
    SELECT a.id, a.nome_completo, a.matricula, a.turma_id, a.nome_responsavel, a.telefone, a.status
    FROM public.alunos a
    WHERE NOT EXISTS (SELECT 1 FROM public.enc_alunos e WHERE e.id = a.id);

    -- Atualizar alunos existentes (mudança de turma/ano letivo e dados)
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
      AND (
        e.nome_completo IS DISTINCT FROM a.nome_completo OR
        e.matricula IS DISTINCT FROM a.matricula OR
        e.turma_id IS DISTINCT FROM a.turma_id OR
        e.nome_responsavel IS DISTINCT FROM a.nome_responsavel OR
        e.telefone IS DISTINCT FROM a.telefone OR
        e.status IS DISTINCT FROM a.status
      );

    -- Inserir professores novos
    INSERT INTO public.enc_professores (user_uid, nome, email, telefone, status, vinculo)
    SELECT u.user_uid, u.nome, u.email, u.telefone, u.status, u.vinculo
    FROM public.usuarios u
    WHERE u.papel = 'professor'
      AND NOT EXISTS (SELECT 1 FROM public.enc_professores e WHERE e.user_uid = u.user_uid);

    -- Atualizar professores existentes
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
      AND (
        e.nome IS DISTINCT FROM u.nome OR
        e.email IS DISTINCT FROM u.email OR
        e.telefone IS DISTINCT FROM u.telefone OR
        e.status IS DISTINCT FROM u.status OR
        e.vinculo IS DISTINCT FROM u.vinculo
      );

    -- Inativar alunos que nao existem mais no APOIA
    UPDATE public.enc_alunos e
    SET status = 'inativo'
    WHERE NOT EXISTS (SELECT 1 FROM public.alunos a WHERE a.id = e.id);

    -- Inativar professores que nao existem mais no APOIA
    UPDATE public.enc_professores e
    SET status = 'inativo'
    WHERE NOT EXISTS (
        SELECT 1 FROM public.usuarios u
        WHERE u.user_uid = e.user_uid AND u.papel = 'professor'
    );

    -- Inativar alunos e professores marcados como inativos no APOIA
    UPDATE public.enc_alunos e
    SET status = 'inativo'
    FROM public.alunos a
    WHERE a.id = e.id AND a.status = 'inativo' AND e.status <> 'inativo';

    UPDATE public.enc_professores e
    SET status = 'inativo'
    FROM public.usuarios u
    WHERE u.user_uid = e.user_uid AND u.papel = 'professor' AND u.status = 'inativo' AND e.status <> 'inativo';
END;
$$;

GRANT EXECUTE ON FUNCTION public.sync_enc_cache() TO authenticated;
