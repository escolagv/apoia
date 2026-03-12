-- ===============================================================
-- TESTE SIMULADO: ALERTAS DE CHAMADA NAO REALIZADA
-- Ajuste a data abaixo para um dia letivo sem chamadas.
-- ===============================================================

-- 1) Garanta que o alerta esteja ativo
UPDATE public.configuracoes
SET alerta_chamada_ativo = true
WHERE id = (SELECT id FROM public.configuracoes ORDER BY id ASC LIMIT 1);

-- 2) Defina a data do teste (DIA LETIVO)
-- Exemplo: 2026-03-11
SELECT public.generate_alertas_chamada('2026-03-11'::date) AS alertas_gerados;

-- 3) Verifique o que entrou no sininho (alertas)
SELECT id, mensagem, created_at
FROM public.alertas
WHERE chave LIKE 'chamada_nao_feita:%'
ORDER BY created_at DESC
LIMIT 50;

-- 4) (Opcional) Limpeza do teste
-- DELETE FROM public.alertas WHERE chave LIKE 'chamada_nao_feita:%';
