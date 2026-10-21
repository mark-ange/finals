// supabase/functions/notify-dispatch/index.ts
import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

type Record = {
  id: string;
  announcement_id: string;
  utility: string;
  channel: string;
  recipient_profile_id: string | null;
  recipient_name: string | null;
  destination: string;
  content_text: string;
  has_image: boolean;
  status: string;
};

serve(async (req) => {
  try {
    const body = await req.json();
    const record = (body?.record ?? body?.data?.record) as Record | undefined;
    if (!record?.id) {
      return new Response(JSON.stringify({ ok: true, skipped: "no record" }), { status: 200 });
    }
    if (record.status !== "queued") {
      return new Response(JSON.stringify({ ok: true, skipped: "not queued" }), { status: 200 });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const admin = createClient(supabaseUrl, serviceKey);

    const { data: ann } = await admin
      .from("announcements")
      .select("image_url")
      .eq("id", record.announcement_id)
      .single();
    const imageUrl: string | null = ann?.image_url ?? null;

    let status = "sent";
    let provider = "";
    let providerRef: string | null = null;
    let error: string | null = null;

    try {
      switch (record.channel) {
        case "sms":
          ({ provider, providerRef } = await sendSms(record.destination, record.content_text));
          break;
        case "email":
          ({ provider, providerRef } = await sendEmail(record.destination, record.content_text, imageUrl));
          break;
        case "facebook":
          ({ provider, providerRef } = await sendFacebook(record.content_text, imageUrl));
          break;
        case "instagram":
          ({ provider, providerRef } = await sendInstagram(record.content_text, imageUrl));
          break;
        default:
          throw new Error(`unknown channel ${record.channel}`);
      }
    } catch (e) {
      status = "failed";
      error = e instanceof Error ? e.message : String(e);
    }

    await admin
      .from("notification_records")
      .update({
        status,
        provider,
        provider_ref: providerRef,
        error,
        sent_at: status === "sent" ? new Date().toISOString() : null,
      })
      .eq("id", record.id);

    await admin.from("activity_logs").insert({
      actor_name: "System",
      actor_role: "system",
      action: status === "sent" ? "notification_sent" : "notification_failed",
      entity_type: "notification",
      entity_id: record.id,
      utility: record.utility,
      summary: `${record.channel} ${status} to ${record.destination}`,
    });

    return new Response(JSON.stringify({ ok: true, status }), { status: 200 });
  } catch (e) {
    return new Response(JSON.stringify({ ok: false, error: String(e) }), { status: 500 });
  }
});

async function sendSms(to: string, text: string): Promise<{ provider: string; providerRef: string | null }> {
  const sid = Deno.env.get("TWILIO_ACCOUNT_SID");
  const token = Deno.env.get("TWILIO_AUTH_TOKEN");
  const from = Deno.env.get("TWILIO_FROM_NUMBER");
  if (!sid || !token || !from) throw new Error("Twilio not configured");
  const url = `https://api.twilio.com/2010-04-01/Accounts/${sid}/Messages.json`;
  const res = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: "Basic " + btoa(`${sid}:${token}`),
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({ To: to, From: from, Body: text }),
  });
  const json = await res.json();
  if (!res.ok) throw new Error(json?.message ?? "Twilio error");
  return { provider: "twilio", providerRef: json?.sid ?? null };
}
async function sendEmail(to: string, text: string, imageUrl: string | null): Promise<{ provider: string; providerRef: string | null }> {
  const apiKey = Deno.env.get("INFOBIP_API_KEY");
  const baseUrl = Deno.env.get("INFOBIP_BASE_URL");
  const from = Deno.env.get("INFOBIP_EMAIL_FROM");
  if (!apiKey || !baseUrl || !from) throw new Error("Infobip not configured");
  const payload: Record<string, unknown> = { from, to: [{ to }], subject: "CivicAlert notification", text };
  if (imageUrl) payload.attachments = [{ name: "announcement.jpg", url: imageUrl }];
  const res = await fetch(`${baseUrl}/email/3/send`, {
    method: "POST",
    headers: { Authorization: `App ${apiKey}`, "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(json?.requestError?.serviceException?.text ?? "Infobip email error");
  return { provider: "infobip", providerRef: json?.messageId ?? null };
}

async function sendFacebook(text: string, imageUrl: string | null): Promise<{ provider: string; providerRef: string | null }> {
  const pageToken = Deno.env.get("META_PAGE_ACCESS_TOKEN");
  const pageId = Deno.env.get("META_FACEBOOK_PAGE_ID");
  if (!pageToken || !pageId) throw new Error("Meta Facebook not configured");
  if (imageUrl) {
    const res = await fetch(`https://graph.facebook.com/v19.0/${pageId}/photos`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ url: imageUrl, caption: text, access_token: pageToken }),
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json?.error?.message ?? "Facebook error");
    return { provider: "meta", providerRef: json?.id ?? null };
  }
  const res = await fetch(`https://graph.facebook.com/v19.0/${pageId}/feed`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ message: text, access_token: pageToken }),
  });
  const json = await res.json();
  if (!res.ok) throw new Error(json?.error?.message ?? "Facebook error");
  return { provider: "meta", providerRef: json?.id ?? null };
}

async function sendInstagram(text: string, imageUrl: string | null): Promise<{ provider: string; providerRef: string | null }> {
  const pageToken = Deno.env.get("META_PAGE_ACCESS_TOKEN");
  const igUserId = Deno.env.get("META_INSTAGRAM_USER_ID");
  if (!pageToken || !igUserId) throw new Error("Meta Instagram not configured");
  if (!imageUrl) throw new Error("Instagram requires an image");
  const createRes = await fetch(`https://graph.facebook.com/v19.0/${igUserId}/media`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ image_url: imageUrl, caption: text, access_token: pageToken }),
  });
  const createJson = await createRes.json();
  if (!createRes.ok) throw new Error(createJson?.error?.message ?? "Instagram create error");
  const publishRes = await fetch(`https://graph.facebook.com/v19.0/${igUserId}/media_publish`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ creation_id: createJson.id, access_token: pageToken }),
  });
  const publishJson = await publishRes.json();
  if (!publishRes.ok) throw new Error(publishJson?.error?.message ?? "Instagram publish error");
  return { provider: "meta", providerRef: publishJson?.id ?? null };
}

