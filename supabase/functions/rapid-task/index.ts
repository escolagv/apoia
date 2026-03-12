import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.42.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } },
    );

    let dateParam: string | null = null;
    const url = new URL(req.url);
    const qsDate = url.searchParams.get("date");
    if (qsDate) dateParam = qsDate;
    if (!dateParam && req.method !== "GET") {
      try {
        const payload = await req.json();
        if (payload?.date) dateParam = payload.date;
      } catch {
        dateParam = null;
      }
    }

    const { data, error } = await supabase.rpc(
      "generate_alertas_chamada",
      dateParam ? { p_data: dateParam } : {},
    );
    if (error) throw new Error(error.message);

    return new Response(
      JSON.stringify({ success: true, generated: data ?? 0 }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      },
    );
  } catch (error) {
    console.error("Erro na Edge Function:", error);
    return new Response(JSON.stringify({ error: (error as Error).message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
