import { serve } from "https://deno.land/std@0.192.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

function getEnv(name: string) {
  const v = Deno.env.get(name);
  if (!v) throw new Error(`Missing env var: ${name}`);
  return v;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: corsHeaders });
  }

  try {
    const supabaseUrl = getEnv("SUPABASE_URL");
    const serviceRoleKey = getEnv("SUPABASE_SERVICE_ROLE_KEY");

    const adminClient = createClient(supabaseUrl, serviceRoleKey, {
      auth: { persistSession: false },
    });

    const payload = await req.json();
    const token = payload?.token;
    const deviceId = payload?.device_id || null;

    if (!token) {
      return new Response(JSON.stringify({ error: "Missing token." }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { data: row, error } = await adminClient
      .from("enc_qr_tokens")
      .select("*")
      .eq("token", token)
      .maybeSingle();

    if (error || !row) {
      return new Response(JSON.stringify({ error: "Token inválido." }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const now = new Date();
    if (new Date(row.expires_at) < now) {
      return new Response(JSON.stringify({ error: "Token expirado." }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (row.device_id && row.device_id !== deviceId) {
      return new Response(JSON.stringify({ error: "Token já usado em outro dispositivo." }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (!row.used_at || row.device_id !== deviceId) {
      await adminClient
        .from("enc_qr_tokens")
        .update({ used_at: new Date().toISOString(), device_id: deviceId })
        .eq("id", row.id);
    }

    return new Response(
      JSON.stringify({ success: true, expires_at: row.expires_at }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    return new Response(JSON.stringify({ error: err?.message || "Unexpected error." }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
