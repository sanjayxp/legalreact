import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
const WEBHOOK_SECRET = Deno.env.get("WEBHOOK_SECRET");
const FROM_ADDRESS = Deno.env.get("WELCOME_EMAIL_FROM") || "LegalConnects <onboarding@resend.dev>";
const SITE_URL = Deno.env.get("SITE_URL") || "https://www.legalconnects.in";
const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
const SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

function esc(s: string) {
  return String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

function renderEmail(role: string, fullName: string) {
  const name = esc(fullName || "there");
  if (role === "advocate") {
    return {
      subject: "Welcome to LegalConnects — let's get your profile live",
      html: `
        <div style="font-family:Arial,sans-serif;max-width:520px;margin:0 auto;color:#1a1a2e">
          <h2 style="color:#1E6DEB">Welcome, ${name} 👋</h2>
          <p>Thanks for joining LegalConnects as an advocate. Once your Bar Council details are verified, your profile goes live in our public directory and clients can find and book you directly.</p>
          <p><strong>Next step:</strong> finish your profile so verification can start.</p>
          <p style="margin:28px 0">
            <a href="${SITE_URL}/dashboard/advocate/profile" style="background:#1E6DEB;color:#fff;padding:12px 20px;border-radius:8px;text-decoration:none;font-weight:bold">Complete your profile</a>
          </p>
          <p style="color:#666;font-size:13px">If you didn't create this account, you can ignore this email.</p>
        </div>`,
    };
  }
  return {
    subject: "Welcome to LegalConnects",
    html: `
      <div style="font-family:Arial,sans-serif;max-width:520px;margin:0 auto;color:#1a1a2e">
        <h2 style="color:#1E6DEB">Welcome, ${name} 👋</h2>
        <p>Your LegalConnects account is ready. You can ask a free legal question or browse Bar Council-verified advocates by practice area and city.</p>
        <p style="margin:28px 0">
          <a href="${SITE_URL}/advocates" style="background:#1E6DEB;color:#fff;padding:12px 20px;border-radius:8px;text-decoration:none;font-weight:bold">Find an advocate</a>
        </p>
        <p style="color:#666;font-size:13px">If you didn't create this account, you can ignore this email.</p>
      </div>`,
  };
}

function renderAdminAlert(role: string, fullName: string, email: string, phone: string) {
  const isAdvocate = role === "advocate";
  return {
    subject: `New ${isAdvocate ? "advocate" : "client"} signup — ${fullName || email}`,
    html: `
      <div style="font-family:Arial,sans-serif;max-width:520px;margin:0 auto;color:#1a1a2e">
        <h2 style="color:#1E6DEB">New ${isAdvocate ? "advocate" : "client"} signed up</h2>
        <table style="font-size:14px;border-collapse:collapse">
          <tr><td style="padding:4px 12px 4px 0;color:#666">Name</td><td><strong>${esc(fullName || "—")}</strong></td></tr>
          <tr><td style="padding:4px 12px 4px 0;color:#666">Email</td><td>${esc(email)}</td></tr>
          <tr><td style="padding:4px 12px 4px 0;color:#666">Phone</td><td>${esc(phone || "—")}</td></tr>
          <tr><td style="padding:4px 12px 4px 0;color:#666">Role</td><td>${esc(role)}</td></tr>
          <tr><td style="padding:4px 12px 4px 0;color:#666">Signed up</td><td>${new Date().toLocaleString("en-IN", { timeZone: "Asia/Kolkata" })} IST</td></tr>
        </table>
        ${isAdvocate ? `<p style="margin-top:18px">They still need to submit a profile and Bar Council details before you can verify them.</p>` : ""}
        <p style="margin:28px 0">
          <a href="${SITE_URL}/admin/people?tab=${isAdvocate ? "advocates" : "clients"}" style="background:#1E6DEB;color:#fff;padding:12px 20px;border-radius:8px;text-decoration:none;font-weight:bold">Open in admin</a>
        </p>
      </div>`,
  };
}

async function sendMail(to: string[], subject: string, html: string) {
  const resp = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${RESEND_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ from: FROM_ADDRESS, to, subject, html }),
  });
  if (!resp.ok) return { ok: false, detail: await resp.text() };
  return { ok: true };
}

// Whoever currently holds the admin role gets the alert, so this needs no
// configuring and keeps up on its own when admins change.
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

Deno.serve(async (req: Request) => {
  if (req.method !== "POST") {
    return new Response("Method not allowed", { status: 405 });
  }

  if (WEBHOOK_SECRET && req.headers.get("x-webhook-secret") !== WEBHOOK_SECRET) {
    return new Response(JSON.stringify({ error: "unauthorized" }), { status: 401 });
  }

  let payload: { email?: string; full_name?: string; role?: string; phone?: string };
  try {
    payload = await req.json();
  } catch {
    return new Response(JSON.stringify({ error: "invalid json" }), { status: 400 });
  }

  const { email, full_name, role, phone } = payload;
  if (!email) {
    return new Response(JSON.stringify({ error: "email required" }), { status: 400 });
  }

  if (!RESEND_API_KEY) {
    console.error("RESEND_API_KEY not configured; skipping mail for", email);
    return new Response(JSON.stringify({ skipped: true, reason: "no RESEND_API_KEY set" }), { status: 200 });
  }

  const effectiveRole = role || "client";

  // The two mails are independent on purpose. A welcome mail to an address
  // that doesn't accept it must not swallow the admin's signup alert — that
  // is exactly how a signup went unnoticed before.
  const alert = renderAdminAlert(effectiveRole, full_name || "", email, phone || "");
  const admins = await adminEmails();
  const adminResult = admins.length
    ? await sendMail(admins, alert.subject, alert.html)
    : { ok: false, detail: "no admin email on file" };

  const welcome = renderEmail(effectiveRole, full_name || "");
  const welcomeResult = await sendMail([email], welcome.subject, welcome.html);

  if (!adminResult.ok) console.error("admin alert failed", adminResult.detail);
  if (!welcomeResult.ok) console.error("welcome email failed", welcomeResult.detail);

  // Always 200: a signup must never be held up by mail delivery. The body is
  // what lands in net._http_response, so failures stay diagnosable there.
  return new Response(
    JSON.stringify({
      admin_alert: adminResult.ok ? "sent" : `failed: ${adminResult.detail}`,
      welcome_email: welcomeResult.ok ? "sent" : `failed: ${welcomeResult.detail}`,
    }),
    { status: 200, headers: { "Content-Type": "application/json" } },
  );
});
