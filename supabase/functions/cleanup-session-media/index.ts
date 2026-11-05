import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-cron-secret",
  "Access-Control-Allow-Methods": "POST, GET, OPTIONS",
};

function json(body: Record<string, unknown>, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

function authorized(req: Request): boolean {
  const cron = Deno.env.get("CRON_SECRET") || "";
  if (!cron) return false;
  const header = req.headers.get("x-cron-secret") || "";
  const bearer = (req.headers.get("Authorization") || "").replace(/^Bearer\s+/i, "");
  const query = new URL(req.url).searchParams.get("secret") || "";
  return header === cron || bearer === cron || query === cron;
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (!authorized(req)) {
    return json({ ok: false, error: "Non autorisé" }, 401);
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
  const admin = createClient(supabaseUrl, serviceKey);

  const { data: expired, error } = await admin
    .from("gh_session_media")
    .select("id, path")
    .lt("expires_at", new Date().toISOString());
  if (error) return json({ ok: false, error: error.message }, 500);

  const paths = (expired || []).map((row) => row.path).filter(Boolean);
  if (paths.length) {
    const { error: storageErr } = await admin.storage.from("session-media").remove(paths);
    if (storageErr) console.error("storage_remove", storageErr);
  }

  const { data: rpcCount, error: rpcErr } = await admin.rpc("cleanup_expired_session_media");
  if (rpcErr) {
    const ids = (expired || []).map((row) => row.id);
    if (ids.length) {
      await admin.from("gh_session_media").delete().in("id", ids);
    }
    return json({
      ok: true,
      removed: ids.length,
      rpc: rpcErr.message,
    });
  }

  return json({ ok: true, removed: rpcCount ?? paths.length });
});
