-- ===============================================================
-- HARDENING (seguranca + estabilidade sem perder desempenho)
-- Execute em horario de baixo uso. INDEX pode bloquear escrita.
-- ===============================================================

-- 1) Forcar RLS nas tabelas criticas (nao quebra se politicas existem)
ALTER TABLE public.usuarios FORCE ROW LEVEL SECURITY;
ALTER TABLE public.alunos FORCE ROW LEVEL SECURITY;
ALTER TABLE public.turmas FORCE ROW LEVEL SECURITY;
ALTER TABLE public.professores_turmas FORCE ROW LEVEL SECURITY;
ALTER TABLE public.presencas FORCE ROW LEVEL SECURITY;
ALTER TABLE public.eventos FORCE ROW LEVEL SECURITY;
ALTER TABLE public.configuracoes FORCE ROW LEVEL SECURITY;
ALTER TABLE public.apoia_encaminhamentos FORCE ROW LEVEL SECURITY;
ALTER TABLE public.alertas FORCE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs FORCE ROW LEVEL SECURITY;

-- 2) Indices para acelerar filtros de RLS e joins
-- Use CONCURRENTLY se rodar manualmente fora de transacao.
CREATE INDEX IF NOT EXISTS idx_professores_turmas_professor_turma
    ON public.professores_turmas (professor_id, turma_id);

CREATE INDEX IF NOT EXISTS idx_alunos_turma_id
    ON public.alunos (turma_id);

CREATE INDEX IF NOT EXISTS idx_presencas_turma_id
    ON public.presencas (turma_id);

CREATE INDEX IF NOT EXISTS idx_presencas_registrado_por_uid
    ON public.presencas (registrado_por_uid);
