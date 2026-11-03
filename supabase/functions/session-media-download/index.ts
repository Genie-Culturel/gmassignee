import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";

/**
 * Client souvenirs download.
 * - `?token=…&format=json` (or Accept: application/json) → JSON for the public page.
 * - otherwise → 302 to the public page (Supabase serves function HTML as text/plain).
 */

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
};

const PUBLIC_APP_URL = (Deno.env.get("PUBLIC_APP_URL") || "https://genie-culturel.github.io/gmassignee").replace(/\/+$/, "");
const SIGNED_URL_SECONDS = 60 * 60;
const uuidRe = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json; charset=utf-8", "Cache-Control": "no-store" },
  });
}

/** ASCII file name for Content-Disposition (non-ASCII gets double-encoded by Storage). */
function safeDownloadName(name: string): string {
  const cleaned = name
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^A-Za-z0-9._-]+/g, "_")
    .replace(/_+/g, "_")
    .replace(/^_|_$/g, "");
  return cleaned || "souvenir";
}

function souvenirsPageUrl(token: string): string {
  return `${PUBLIC_APP_URL}/souvenirs/?token=${encodeURIComponent(token)}`;
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  const url = new URL(req.url);
  const token = (url.searchParams.get("token") || "").trim();
  const wantsJson =
    url.searchParams.get("format") === "json" ||
    (req.headers.get("accept") || "").toLowerCase().includes("application/json");

  if (!wantsJson) {
    return new Response(null, {
      status: 302,
      headers: { ...corsHeaders, Location: souvenirsPageUrl(token), "Cache-Control": "no-store" },
    });
  }

  if (!token || !uuidRe.test(token)) {
    return json({ ok: false, error: "invalid", message: "Ce lien de téléchargement n'est pas valide." }, 400);
  }

  const admin = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
  );

  const { data: session, error } = await admin
    .from("vr_sessions")
    .select("id, game")
    .eq("videos_download_token", token)
    .maybeSingle();
  if (error) return json({ ok: false, error: "server", message: "Erreur serveur, réessaie plus tard." }, 500);
  if (!session) {
    return json({ ok: false, error: "not_found", message: "Ce lien n'existe pas ou n'est plus valable." }, 404);
  }

  const { data: media } = await admin
    .from("session_media")
    .select("path, original_name, expires_at, size")
    .eq("session_id", session.id)
    .gt("expires_at", new Date().toISOString())
    .order("uploaded_at", { ascending: true });

  const rows = media || [];
  if (!rows.length) {
    return json({
      ok: false,
      error: "expired",
      message: "Ces souvenirs ne sont plus disponibles : les vidéos sont supprimées 14 jours après l'envoi.",
    }, 410);
  }

  const files: { name: string; size: number | null; url: string; expires_at: string }[] = [];
  for (const row of rows) {
    const name = row.original_name || row.path.split("/").pop() || "video";
    const signed = await admin.storage
      .from("session-media")
      .createSignedUrl(row.path, SIGNED_URL_SECONDS, { download: safeDownloadName(name) });
    if (signed.data?.signedUrl) {
      files.push({ name, size: row.size ?? null, url: signed.data.signedUrl, expires_at: row.expires_at });
    }
  }
  if (!files.length) {
    return json({ ok: false, error: "server", message: "Fichiers momentanément indisponibles, réessaie plus tard." }, 500);
  }

  const expiresAt = rows.map((row) => row.expires_at).sort()[0];
  return json({ ok: true, game: session.game || null, expires_at: expiresAt, files });
});
