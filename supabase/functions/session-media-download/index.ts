import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
};

function html(body: string, status = 200) {
  return new Response(`<!doctype html>
<html lang="fr">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>Souvenirs VR Center Valais</title>
  <style>
    body { font-family: system-ui, sans-serif; margin: 0; background: #0f172a; color: #e2e8f0; }
    main { max-width: 40rem; margin: 0 auto; padding: 1.5rem; }
    h1 { font-size: 1.4rem; }
    a.btn { display: block; background: #38bdf8; color: #0f172a; text-decoration: none; font-weight: 700; padding: 0.9rem 1rem; border-radius: 0.75rem; margin: 0.5rem 0; text-align: center; }
    p.meta { color: #94a3b8; font-size: 0.9rem; }
    li { margin: 0.35rem 0; }
  </style>
</head>
<body><main>${body}</main></body>
</html>`, {
    status,
    headers: { ...corsHeaders, "Content-Type": "text/html; charset=utf-8" },
  });
}

function escapeHtml(value: string): string {
  return value.replace(/[&<>"']/g, (ch) =>
    ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[ch] || ch
  );
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  const url = new URL(req.url);
  const token = (url.searchParams.get("token") || "").trim();
  const uuidRe = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  if (!token || !uuidRe.test(token)) {
    return html(
      `<h1>Lien introuvable</h1><p>Ce lien de téléchargement n'est pas valide (ou c'est une simulation en mode démo).</p>`,
      400,
    );
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
  const admin = createClient(supabaseUrl, serviceKey);

  const { data: session, error } = await admin
    .from("vr_sessions")
    .select("id, game, group_name")
    .eq("videos_download_token", token)
    .maybeSingle();
  if (error || !session) {
    return html(
      `<h1>Lien expiré</h1><p>Ces souvenirs ne sont plus disponibles. Les vidéos sont supprimées 14 jours après l'envoi.</p>`,
      404,
    );
  }

  const { data: media } = await admin
    .from("session_media")
    .select("path, original_name, expires_at, size")
    .eq("session_id", session.id)
    .gt("expires_at", new Date().toISOString())
    .order("uploaded_at", { ascending: true });

  const files = media || [];
  if (!files.length) {
    return html(
      `<h1>Souvenirs expirés</h1><p>Les vidéos de cette partie ont été supprimées (conservation 14 jours).</p>`,
      404,
    );
  }

  const links: { name: string; url: string }[] = [];
  for (const file of files) {
    const signed = await admin.storage
      .from("session-media")
      .createSignedUrl(file.path, 60 * 60);
    if (signed.data?.signedUrl) {
      links.push({
        name: file.original_name || file.path.split("/").pop() || "vidéo",
        url: signed.data.signedUrl,
      });
    }
  }

  const items = links
    .map(
      (link) =>
        `<p><a class="btn" href="${escapeHtml(link.url)}" download>${escapeHtml(link.name)}</a></p>`,
    )
    .join("");

  return html(`
    <h1>Tes souvenirs VR Center Valais</h1>
    <p>Merci d'avoir joué${session.game ? ` à ${escapeHtml(session.game)}` : ""} ! Télécharge tes vidéos ci-dessous — le lien reste valable 14 jours.</p>
    ${items}
    <p class="meta">VR Center Valais · les fichiers sont ensuite supprimés.</p>
  `);
});
