-- ===============================================================
-- MAIÚSCULAS APENAS EM CADASTROS (ALUNOS/PROFESSORES)
-- ===============================================================

-- 1) Atualizar dados EXISTENTES (somente cadastros)
UPDATE public.alunos
SET
  nome_completo = UPPER(nome_completo),
  nome_responsavel = UPPER(nome_responsavel)
WHERE nome_completo IS NOT NULL OR nome_responsavel IS NOT NULL;

UPDATE public.usuarios
SET
  nome = UPPER(nome)
WHERE nome IS NOT NULL;

UPDATE public.enc_alunos
SET
  nome_completo = UPPER(nome_completo),
  nome_responsavel = UPPER(nome_responsavel)
WHERE nome_completo IS NOT NULL OR nome_responsavel IS NOT NULL;

UPDATE public.enc_professores
SET
  nome = UPPER(nome),
  vinculo = UPPER(vinculo)
WHERE nome IS NOT NULL OR vinculo IS NOT NULL;

UPDATE public.enc_encaminhamentos
SET
  aluno_nome = UPPER(aluno_nome),
  professor_nome = UPPER(professor_nome),
  turma_nome = UPPER(turma_nome),
  registrado_por_nome = UPPER(registrado_por_nome),
  responsavel_nome = UPPER(responsavel_nome)
WHERE true;

-- 2) Funções/Triggers (somente cadastros)
CREATE OR REPLACE FUNCTION public.set_upper_alunos()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.nome_completo := UPPER(NEW.nome_completo);
  NEW.nome_responsavel := UPPER(NEW.nome_responsavel);
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.set_upper_usuarios()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.nome := UPPER(NEW.nome);
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.set_upper_enc_alunos()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.nome_completo := UPPER(NEW.nome_completo);
  NEW.nome_responsavel := UPPER(NEW.nome_responsavel);
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.set_upper_enc_professores()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.nome := UPPER(NEW.nome);
  NEW.vinculo := UPPER(NEW.vinculo);
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.set_upper_enc_encaminhamentos()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.aluno_nome := UPPER(NEW.aluno_nome);
  NEW.professor_nome := UPPER(NEW.professor_nome);
  NEW.turma_nome := UPPER(NEW.turma_nome);
  NEW.registrado_por_nome := UPPER(NEW.registrado_por_nome);
  NEW.responsavel_nome := UPPER(NEW.responsavel_nome);
  RETURN NEW;
END;
$$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'trg_upper_alunos') THEN
    CREATE TRIGGER trg_upper_alunos BEFORE INSERT OR UPDATE ON public.alunos
    FOR EACH ROW EXECUTE FUNCTION public.set_upper_alunos();
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'trg_upper_usuarios') THEN
    CREATE TRIGGER trg_upper_usuarios BEFORE INSERT OR UPDATE ON public.usuarios
    FOR EACH ROW EXECUTE FUNCTION public.set_upper_usuarios();
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'trg_upper_enc_alunos') THEN
    CREATE TRIGGER trg_upper_enc_alunos BEFORE INSERT OR UPDATE ON public.enc_alunos
    FOR EACH ROW EXECUTE FUNCTION public.set_upper_enc_alunos();
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'trg_upper_enc_professores') THEN
    CREATE TRIGGER trg_upper_enc_professores BEFORE INSERT OR UPDATE ON public.enc_professores
    FOR EACH ROW EXECUTE FUNCTION public.set_upper_enc_professores();
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'trg_upper_enc_encaminhamentos') THEN
    CREATE TRIGGER trg_upper_enc_encaminhamentos BEFORE INSERT OR UPDATE ON public.enc_encaminhamentos
    FOR EACH ROW EXECUTE FUNCTION public.set_upper_enc_encaminhamentos();
  END IF;
END $$;
