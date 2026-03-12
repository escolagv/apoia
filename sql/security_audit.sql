-- ===============================================================
-- AUDITORIA RAPIDA DE SEGURANCA (RLS/GRANTS/POLICIES)
-- Rode para validar antes de endurecer ainda mais.
-- ===============================================================

-- 1) Tabelas sem RLS habilitado
SELECT
    n.nspname AS schema,
    c.relname AS table,
    c.relrowsecurity AS rls_enabled,
    c.relforcerowsecurity AS rls_forced
FROM pg_class c
JOIN pg_namespace n ON n.oid = c.relnamespace
WHERE c.relkind = 'r'
  AND n.nspname = 'public'
  AND c.relrowsecurity = false
ORDER BY c.relname;

-- 2) Tabelas com RLS habilitado mas sem policy
SELECT
    n.nspname AS schema,
    c.relname AS table
FROM pg_class c
JOIN pg_namespace n ON n.oid = c.relnamespace
WHERE c.relkind = 'r'
  AND n.nspname = 'public'
  AND c.relrowsecurity = true
  AND NOT EXISTS (
      SELECT 1
      FROM pg_policies p
      WHERE p.schemaname = n.nspname
        AND p.tablename = c.relname
  )
ORDER BY c.relname;

-- 3) Grants perigosos para PUBLIC/anon
SELECT
    table_schema,
    table_name,
    grantee,
    privilege_type
FROM information_schema.table_privileges
WHERE table_schema = 'public'
  AND grantee IN ('PUBLIC', 'anon')
ORDER BY table_name, grantee, privilege_type;

-- 4) Funcoes SECURITY DEFINER (revisar search_path)
SELECT
    n.nspname AS schema,
    p.proname AS function,
    p.prosecdef AS security_definer
FROM pg_proc p
JOIN pg_namespace n ON n.oid = p.pronamespace
WHERE n.nspname = 'public'
  AND p.prosecdef = true
ORDER BY p.proname;
