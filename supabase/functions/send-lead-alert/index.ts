import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
const WEBHOOK_SECRET = Deno.env.get("WEBHOOK_SECRET");
const FROM_ADDRESS = Deno.env.get("WELCOME_EMAIL_FROM") || "LegalConnects <onboarding@resend.dev>";
const SITE_URL = Deno.env.get("SITE_URL") || "https://www.legalconnects.in";
const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
const SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

function esc(s: unknown) {
  return String(s ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

// Whoever currently holds the admin role, so this needs no configuring and
// keeps up on its own when admins change.
async function adminEmails(): Promise<string[]> {
  if (!SUPABASE_URL || !SERVICE_ROLE_KEY) return [];
  try {
    const resp = await fetch(
      `${SUPABASE_URL}/rest/v1/profiles?role=eq.admin&email=not.is.null&select=email`,
      { headers: { apikey: SERVICE_ROLE_KEY, Authorization: `Bearer ${SERVICE_ROLE_KEY}` } },
    );
    if (!resp.ok) return [];
    const rows = await resp.json();
    return (rows as { email: string }[]).map((r) => r.email).filter(Boolean);
  } catch {
    return [];
  }
}

const SOURCE_LABEL: Record<string, string> = {
  post_case: "Posted matter",
  booking: "Consultation booking",
  track_case: "Case tracker",
};

Deno.serve(async (req: Request) => {
  if (req.method !== "POST") return new Response("Method not allowed", { status: 405 });

  if (WEBHOOK_SECRET && req.headers.get("x-webhook-secret") !== WEBHOOK_SECRET) {
    return new Response(JSON.stringify({ error: "unauthorized" }), { status: 401 });
  }

  let p: Record<string, unknown>;
  try {
    p = await req.json();
  } catch {
    return new Response(JSON.stringify({ error: "invalid json" }), { status: 400 });
  }

  if (!RESEND_API_KEY) {
    console.error("RESEND_API_KEY not configured; skipping lead alert");
    return new Response(JSON.stringify({ skipped: true, reason: "no RESEND_API_KEY" }), { status: 200 });
  }

  const admins = await adminEmails();
  if (!admins.length) {
    console.error("no admin email on file; nothing to notify");
    return new Response(JSON.stringify({ skipped: true, reason: "no admin email" }), { status: 200 });
  }

  const sourceLabel = SOURCE_LABEL[String(p.source)] || String(p.source || "Enquiry");
  const name = String(p.client_name || "Someone");

  // Whatever the client answered for their matter type, shown as given.
  let detailRows = "";
  if (p.details && typeof p.details === "object") {
    detailRows = Object.entries(p.details as Record<string, unknown>)
      .filter(([, v]) => v !== null && v !== undefined && String(v).trim() !== "")
      .map(([k, v]) => `<tr><td style="padding:3px 12px 3px 0;color:#666">${esc(k)}</td><td>${esc(v)}</td></tr>`)
      .join("");
  }

  const html = `
    <div style="font-family:Arial,sans-serif;max-width:560px;margin:0 auto;color:#1a1a2e">
      <h2 style="color:#1E6DEB;margin-bottom:4px">New ${esc(sourceLabel.toLowerCase())}</h2>
      <p style="margin-top:0;color:#666;font-size:13px">${esc(p.matter_type || "No type given")}</p>

      <table style="font-size:14px;border-collapse:collapse;margin-top:12px">
        <tr><td style="padding:3px 12px 3px 0;color:#666">Name</td><td><strong>${esc(name)}</strong></td></tr>
        <tr><td style="padding:3px 12px 3px 0;color:#666">Phone</td><td>${esc(p.phone || "—")}</td></tr>
        <tr><td style="padding:3px 12px 3px 0;color:#666">Email</td><td>${esc(p.email || "—")}</td></tr>
        <tr><td style="padding:3px 12px 3px 0;color:#666">City</td><td>${esc(p.city || "—")}</td></tr>
        <tr><td style="padding:3px 12px 3px 0;color:#666">Budget</td><td>${esc(p.budget || "—")}</td></tr>
      </table>

      ${detailRows ? `<h3 style="font-size:14px;margin:18px 0 6px">What they told us</h3><table style="font-size:14px;border-collapse:collapse">${detailRows}</table>` : ""}

      <h3 style="font-size:14px;margin:18px 0 6px">In full</h3>
      <p style="font-size:14px;white-space:pre-wrap;margin-top:0">${esc(p.matter || "—")}</p>

      <p style="margin:26px 0">
        <a href="${SITE_URL}/admin/leads" style="background:#1E6DEB;color:#fff;padding:12px 20px;border-radius:8px;text-decoration:none;font-weight:bold">Open in admin</a>
      </p>
      <p style="color:#888;font-size:12px">Unassigned matters are also on every verified advocate's Open matters board.</p>
    </div>`;

  const resp = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { Authorization: `Bearer ${RESEND_API_KEY}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      from: FROM_ADDRESS,
      to: admins,
      subject: `New ${sourceLabel.toLowerCase()} — ${name}${p.city ? `, ${p.city}` : ""}`,
      html,
    }),
  });

  if (!resp.ok) {
    const detail = await resp.text();
    console.error("lead alert send failed", resp.status, detail.slice(0, 300));
    return new Response(JSON.stringify({ sent: false, detail: detail.slice(0, 300) }), { status: 200 });
  }

  return new Response(JSON.stringify({ sent: true, to: admins.length }), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
});
