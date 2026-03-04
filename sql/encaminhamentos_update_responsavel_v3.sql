-- ===============================================================
-- ATUALIZACAO DO FORMULARIO (RESPONSAVEL NO ENCAMINHAMENTO)
-- ===============================================================
-- Executar apos o script base de encaminhamentos.

ALTER TABLE public.enc_encaminhamentos
    ADD COLUMN IF NOT EXISTS responsavel_nome text;
