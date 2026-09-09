// Consultation-form endpoint. Receives the enquiry, forwards the particulars
// to the chambers clerk by SMS, and — only when the "reply" field looks like
// a phone number — sends the client a short acknowledgement.
//
// Never routes to the Senior Advocate; Section 16 of the Advocates Act bars
// him from accepting instructions directly from a client. See
// docs/PLACEHOLDERS.md and docs/advocate-decision-memo.md.
import type { APIRoute } from "astro";
import chambers from "../../data/chambers.json";

export const prerender = false;

const FAST2SMS_URL = "https://www.fast2sms.com/dev/bulkV2";

// Fast2SMS "quick" route sends plain text without a pre-registered DLT
// template. TRAI rules require DLT-registered sender/template for business
// SMS traffic in India at any real volume — this route is a starting point
// for low-volume use, not a substitute for DLT registration before launch.
const SMS_ROUTE = "q";

const MAX_REQUESTS_PER_WINDOW = 5;
const WINDOW_MS = 10 * 60 * 1000;
const hits = new Map<string, { count: number; resetAt: number }>();

function rateLimited(ip: string): boolean {
  const now = Date.now();
  const entry = hits.get(ip);
  if (!entry || now > entry.resetAt) {
    hits.set(ip, { count: 1, resetAt: now + WINDOW_MS });
    return false;
  }
  entry.count += 1;
  return entry.count > MAX_REQUESTS_PER_WINDOW;
}

function extractPhone(raw: string): string | null {
  const digits = raw.replace(/\D/g, "");
  // A 10-digit Indian mobile number, optionally with a 91 country code.
  const match = digits.match(/^(?:91)?([6-9]\d{9})$/);
  return match ? match[1] : null;
}

function truncate(value: string, max: number): string {
  return value.length > max ? `${value.slice(0, max - 1)}…` : value;
}

async function sendSms(apiKey: string, numbers: string[], message: string): Promise<void> {
  if (!numbers.length) return;
  const res = await fetch(FAST2SMS_URL, {
    method: "POST",
    headers: {
      authorization: apiKey,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      route: SMS_ROUTE,
      message,
      language: "english",
      flash: 0,
      numbers: numbers.join(","),
    }),
  });
  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(`Fast2SMS request failed (${res.status}): ${body}`);
  }
  const data = await res.json().catch(() => null);
  if (data && data.return === false) {
    throw new Error(`Fast2SMS rejected the request: ${JSON.stringify(data)}`);
  }
}

export const POST: APIRoute = async ({ request, clientAddress }) => {
  const ip = clientAddress ?? "unknown";
  if (rateLimited(ip)) {
    return new Response(JSON.stringify({ ok: false, error: "Too many requests. Please try again later." }), {
      status: 429,
      headers: { "Content-Type": "application/json" },
    });
  }

  let form: FormData;
  try {
    form = await request.formData();
  } catch {
    return new Response(JSON.stringify({ ok: false, error: "Malformed submission." }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  // Honeypot: a real visitor never fills this in.
  if (String(form.get("company") ?? "").trim()) {
    return new Response(JSON.stringify({ ok: true }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  }

  const name = String(form.get("name") ?? "").trim();
  const reply = String(form.get("reply") ?? "").trim();
  const capacity = String(form.get("capacity") ?? "").trim();
  const area = String(form.get("area") ?? "").trim();
  const note = String(form.get("note") ?? "").trim();

  if (!name || !reply || !capacity || !area) {
    return new Response(JSON.stringify({ ok: false, error: "Missing required fields." }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }
  if (note.length > 1200) {
    return new Response(JSON.stringify({ ok: false, error: "Note is too long." }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  // process.env ONLY — never import.meta.env. Vite statically substitutes
  // import.meta.env at build time, which would bake the secret into the
  // deployed function bundle. process.env is read at runtime instead.
  // Local dev reads it from .env; on Netlify set it in
  // Site configuration -> Environment variables.
  const apiKey = process.env.FAST2SMS_API_KEY;
  if (!apiKey) {
    console.error("FAST2SMS_API_KEY is not configured.");
    return new Response(
      JSON.stringify({ ok: false, error: "Messaging is not configured on the server yet." }),
      { status: 503, headers: { "Content-Type": "application/json" } }
    );
  }

  const clerkNumber =
    process.env.CLERK_SMS_NUMBER ?? extractPhone(chambers.chambers.clerk.phone) ?? "";
  if (!clerkNumber) {
    console.error("No clerk SMS number configured (CLERK_SMS_NUMBER / chambers.clerk.phone).");
    return new Response(
      JSON.stringify({ ok: false, error: "Messaging is not configured on the server yet." }),
      { status: 503, headers: { "Content-Type": "application/json" } }
    );
  }

  const clerkMessage = truncate(
    `New enquiry via chambers site — ${name} (${capacity}). Subject: ${area}. Contact: ${reply}.` +
      (note ? ` Note: ${note}` : ""),
    900
  );

  const clientPhone = extractPhone(reply);
  const clientMessage = truncate(
    `Chambers of ${chambers.chambers.name.replace(/^Chambers of /, "")}: your enquiry regarding ${area} has been received and forwarded to the chambers clerk. You will be contacted shortly.`,
    300
  );

  try {
    await sendSms(apiKey, [clerkNumber], clerkMessage);
    if (clientPhone) {
      await sendSms(apiKey, [clientPhone], clientMessage);
    }
  } catch (err) {
    console.error("Failed to send consultation SMS:", err);
    return new Response(
      JSON.stringify({ ok: false, error: "Could not send the notification. Please call the clerk directly." }),
      { status: 502, headers: { "Content-Type": "application/json" } }
    );
  }

  return new Response(
    JSON.stringify({ ok: true, clientNotified: Boolean(clientPhone) }),
    { status: 200, headers: { "Content-Type": "application/json" } }
  );
};
