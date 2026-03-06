-- ===============================================================
-- MATRICULA NA FILA DE SCANS (ENC_SCAN_JOBS)
-- ===============================================================
-- Executar apos encaminhamentos_drive.sql

ALTER TABLE public.enc_scan_jobs
    ADD COLUMN IF NOT EXISTS aluno_matricula text;
