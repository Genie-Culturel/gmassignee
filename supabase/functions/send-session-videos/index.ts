import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

function json(body: Record<string, unknown>, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

function isEmail(value: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }
  if (req.method !== "POST") {
    return json({ ok: false, error: "Méthode non autorisée" }, 405);
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY") ?? "";
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
    const authHeader = req.headers.get("Authorization") ?? "";

    const userClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
    });
    const admin = createClient(supabaseUrl, serviceKey);

    const { data: userData, error: userErr } = await userClient.auth.getUser();
    if (userErr || !userData.user) {
      return json({ ok: false, error: "Non authentifié" }, 401);
    }
    const user = userData.user;
    const isAdmin = (user.app_metadata as { role?: string } | undefined)?.role === "admin";

    const payload = (await req.json().catch(() => ({}))) as {
      session_id?: string;
      client_email?: string;
    };
    const sessionId = String(payload.session_id || "");
    const clientEmail = String(payload.client_email || "").trim();
    if (!sessionId) return json({ ok: false, error: "session_id manquant" }, 400);
    if (!isEmail(clientEmail)) {
      return json({ ok: false, error: "E-mail client invalide" }, 400);
    }

    const { data: session, error: sessionErr } = await admin
      .from("vr_sessions")
      .select("id, gm_id, client_email, videos_download_token, game, group_name")
      .eq("id", sessionId)
      .maybeSingle();
    if (sessionErr) return json({ ok: false, error: sessionErr.message }, 500);
    if (!session) return json({ ok: false, error: "Session introuvable" }, 404);
    if (session.gm_id !== user.id && !isAdmin) {
      return json({ ok: false, error: "Pas ta session" }, 403);
    }

    const { data: media, error: mediaErr } = await admin
      .from("session_media")
      .select("id, path, original_name, expires_at")
      .eq("session_id", sessionId);
    if (mediaErr) return json({ ok: false, error: mediaErr.message }, 500);
    const live = (media || []).filter((row) => new Date(row.expires_at).getTime() > Date.now());
    if (!live.length) {
      return json({ ok: false, error: "Aucun fichier à envoyer pour cette session." }, 400);
    }

    const token = session.videos_download_token || crypto.randomUUID();
    const publicAppUrl = (Deno.env.get("PUBLIC_APP_URL") || "https://genie-culturel.github.io/gmassignee").replace(/\/+$/, "");
    const downloadUrl = `${publicAppUrl}/souvenirs/?token=${encodeURIComponent(token)}`;
    const sentAt = new Date().toISOString();

    const { error: updErr } = await admin
      .from("vr_sessions")
      .update({
        client_email: clientEmail,
        videos_sent_at: sentAt,
        videos_download_token: token,
      })
      .eq("id", sessionId);
    if (updErr) return json({ ok: false, error: updErr.message }, 500);

    await admin.from("session_steps").upsert(
      { session_id: sessionId, step: "videos_sent", completed_at: sentAt },
      { onConflict: "session_id,step" },
    );

    const resendKey = Deno.env.get("RESEND_API_KEY") || "";
    const emailFrom = Deno.env.get("EMAIL_FROM") || "";
    let emailed = false;
    let message: string | undefined;

    if (!resendKey || !emailFrom) {
      message =
        "E-mail automatique non configuré (secrets Resend manquants). Copie le lien ou ouvre un e-mail prérempli.";
    } else {
      const game = session.game || "ta partie VR";
      const subject = "Tes souvenirs VR Center Valais";
      const text =
        `Salut !\n\nMerci d'avoir joué au VR Center Valais (${game}) — on a adoré vous accueillir.\n\nVoici tes vidéos souvenirs (lien valable 14 jours, ensuite elles sont supprimées) :\n${downloadUrl}\n\nÀ très vite sur les casques,\nL'équipe VR Center Valais`;
      const html = `
        <p>Salut !</p>
        <p>Merci d'avoir joué au VR Center Valais (${escapeHtml(game)}) — on a adoré vous accueillir.</p>
        <p>Voici tes vidéos souvenirs (lien valable 14 jours, ensuite elles sont supprimées) :</p>
        <p><a href="${escapeHtml(downloadUrl)}">${escapeHtml(downloadUrl)}</a></p>
        <p>À très vite sur les casques,<br/>L'équipe VR Center Valais</p>
      `;
      try {
        const res = await fetch("https://api.resend.com/emails", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${resendKey}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            from: emailFrom,
            to: [clientEmail],
            subject,
            text,
            html,
          }),
        });
        if (res.ok) {
          emailed = true;
        } else {
          const detail = await res.text();
          message = `Resend n'a pas pu envoyer l'e-mail (${res.status}). Copie le lien ou ouvre un e-mail prérempli.`;
          console.error("resend_error", detail);
        }
      } catch (err) {
        message = "Envoi e-mail impossible. Copie le lien ou ouvre un e-mail prérempli.";
        console.error("resend_throw", err);
      }
    }

    return json({
      ok: true,
      emailed,
      downloadUrl,
      videosSentAt: sentAt,
      message,
    });
  } catch (err) {
    console.error("send-session-videos", err);
    return json({
      ok: false,
      emailed: false,
      downloadUrl: "",
      error: err instanceof Error ? err.message : "Erreur inattendue",
    }, 500);
  }
});

function escapeHtml(value: string): string {
  return value.replace(/[&<>"']/g, (ch) =>
    ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[ch] || ch
  );
}
