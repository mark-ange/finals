// c:\Users\Lenovo\Downloads\project-finals-CAS\project-finals-CAS\CivicAlert\frontend\packages\ui\src\lib\api.ts
import { supabase } from "./supabaseClient.js";
import type {
  ActivityLog,
  Announcement,
  AnnouncementStatus,
  NotificationChannel,
  NotificationRecord,
  NotificationStatus,
  Profile,
  Role,
  TermsAcceptance,
  Utility,
} from "./types.js";

export { supabase };

function profileFromRow(row: any, terms: any | null): Profile {
  return {
    id: row.id,
    name: row.full_name,
    email: row.email,
    role: row.role as Role,
    utility: (row.utility as Utility) ?? null,
    phoneNumber: row.phone_number,
    address: row.address_line,
    barangay: row.barangay,
    purok: row.purok,
    city: row.city,
    postalCode: row.postal_code,
    smsAlerts: row.sms_alerts,
    profileImage: row.profile_image_url ?? null,
    termsAcceptedAt: terms?.accepted_at ?? null,
  };
}

function termsFromRow(row: any): TermsAcceptance {
  return {
    id: row.id,
    termsVersion: row.terms_version,
    termsTitle: row.terms_title,
    acceptedAt: row.accepted_at,
  };
}

function announcementFromRow(row: any): Announcement {
  return {
    id: row.id,
    reference: row.reference,
    utility: row.utility as Utility,
    title: row.title,
    message: row.message,
    imageUrl: row.image_url ?? null,
    barangays: row.barangays ?? [],
    puroks: row.puroks ?? [],
    status: row.status as AnnouncementStatus,
    recipientCount: row.recipient_count ?? 0,
    createdBy: row.created_by ?? null,
    createdAt: row.created_at,
    publishedAt: row.published_at ?? null,
  };
}

function notificationFromRow(row: any, title: string): NotificationRecord {
  return {
    id: row.id,
    announcementId: row.announcement_id,
    announcementTitle: title || row.announcement_title || "",
    utility: row.utility as Utility,
    channel: row.channel as NotificationChannel,
    recipientName: row.recipient_name ?? null,
    destination: row.destination,
    contentText: row.content_text,
    hasImage: row.has_image ?? false,
    status: row.status as NotificationStatus,
    provider: row.provider ?? "",
    providerRef: row.provider_ref ?? null,
    error: row.error ?? null,
    createdAt: row.created_at,
    sentAt: row.sent_at ?? null,
  };
}

function activityFromRow(row: any): ActivityLog {
  return {
    id: row.id,
    actorName: row.actor_name ?? null,
    actorRole: row.actor_role ?? null,
    action: row.action,
    entityType: row.entity_type,
    entityId: row.entity_id ?? null,
    summary: row.summary,
    utility: (row.utility as Utility) ?? null,
    createdAt: row.created_at,
  };
}

async function fetchProfile(id: string): Promise<Profile | null> {
  const { data, error } = await supabase.from("profiles").select("*").eq("id", id).maybeSingle();
  if (error || !data) return null;
  const { data: terms } = await supabase
    .from("terms_acceptances")
    .select("*")
    .eq("profile_id", id)
    .order("accepted_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  return profileFromRow(data, terms);
}

export async function getSessionProfile(): Promise<Profile | null> {
  const { data } = await supabase.auth.getSession();
  if (!data.session?.user) return null;
  return fetchProfile(data.session.user.id);
}

export async function signIn(email: string, password: string): Promise<Profile> {
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error || !data.user) throw error ?? new Error("Sign in failed");
  const profile = await fetchProfile(data.user.id);
  if (!profile) throw new Error("Profile not found");
  return profile;
}

export async function signUpResident(input: {
  name: string;
  email: string;
  password: string;
  phoneNumber: string;
  address: string;
  barangay: string;
  purok: string;
  city: string;
  postalCode: string;
  smsAlerts: boolean;
  termsVersion: string;
}): Promise<{ needsConfirmation: boolean }> {
  const { data, error } = await supabase.auth.signUp({
    email: input.email,
    password: input.password,
    options: {
      data: {
        full_name: input.name,
        phone_number: input.phoneNumber,
        address_line: input.address,
        barangay: input.barangay,
        purok: input.purok,
        city: input.city,
        postal_code: input.postalCode,
        sms_alerts: input.smsAlerts,
        terms_version: input.termsVersion,
        terms_title: "CivicAlert Resident Terms and Conditions",
        user_agent: typeof navigator !== "undefined" ? navigator.userAgent : "",
      },
    },
  });
  if (error) throw error;
  return { needsConfirmation: !data.session };
}

export async function signOut(): Promise<void> {
  await supabase.auth.signOut();
}
export async function updateResidentProfile(id: string, patch: Partial<Profile>): Promise<Profile> {
  const update: Record<string, unknown> = {};
  if (patch.name !== undefined) update.full_name = patch.name;
  if (patch.phoneNumber !== undefined) update.phone_number = patch.phoneNumber;
  if (patch.address !== undefined) update.address_line = patch.address;
  if (patch.barangay !== undefined) update.barangay = patch.barangay;
  if (patch.purok !== undefined) update.purok = patch.purok;
  if (patch.city !== undefined) update.city = patch.city;
  if (patch.postalCode !== undefined) update.postal_code = patch.postalCode;
  if (patch.smsAlerts !== undefined) update.sms_alerts = patch.smsAlerts;
  if (patch.profileImage !== undefined) update.profile_image_url = patch.profileImage;
  const { error } = await supabase.from("profiles").update(update).eq("id", id);
  if (error) throw error;
  const profile = await fetchProfile(id);
  if (!profile) throw new Error("Profile not found");
  return profile;
}

export async function getTermsAcceptance(profileId: string): Promise<TermsAcceptance | null> {
  const { data } = await supabase
    .from("terms_acceptances")
    .select("*")
    .eq("profile_id", profileId)
    .order("accepted_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  return data ? termsFromRow(data) : null;
}

export async function listAnnouncements(): Promise<Announcement[]> {
  const { data, error } = await supabase
    .from("announcements")
    .select("*")
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data ?? []).map(announcementFromRow);
}

export async function createAnnouncement(input: {
  utility: Utility;
  title: string;
  message: string;
  imageUrl: string | null;
  barangays: string[];
  puroks: string[];
  status: AnnouncementStatus;
}): Promise<Announcement> {
  const { data, error } = await supabase
    .from("announcements")
    .insert({
      utility: input.utility,
      title: input.title,
      message: input.message,
      image_url: input.imageUrl,
      barangays: input.barangays,
      puroks: input.puroks,
      status: input.status,
      published_at: input.status === "published" || input.status === "updated" ? new Date().toISOString() : null,
    })
    .select("*")
    .single();
  if (error) throw error;
  return announcementFromRow(data);
}

export async function updateAnnouncementStatus(id: string, status: AnnouncementStatus): Promise<void> {
  const patch: Record<string, unknown> = { status };
  if (status === "published" || status === "updated") patch.published_at = new Date().toISOString();
  const { error } = await supabase.from("announcements").update(patch).eq("id", id);
  if (error) throw error;
}

export async function estimateRecipients(barangays: string[], puroks: string[]): Promise<number> {
  const { data, error } = await supabase.rpc("estimate_recipients", {
    p_barangays: barangays,
    p_puroks: puroks,
  });
  if (error) throw error;
  return Number(data ?? 0);
}

export async function listNotificationRecords(): Promise<NotificationRecord[]> {
  const { data, error } = await supabase
    .from("notification_records")
    .select("*, announcements(title)")
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data ?? []).map((row: any) =>
    notificationFromRow(row, row.announcements?.title ?? ""),
  );
}

export async function listActivityLogs(): Promise<ActivityLog[]> {
  const { data, error } = await supabase
    .from("activity_logs")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(200);
  if (error) throw error;
  return (data ?? []).map(activityFromRow);
}

export function subscribeAnnouncements(onChange: () => void): () => void {
  const channel = supabase
    .channel("announcements-changes")
    .on("postgres_changes", { event: "*", schema: "public", table: "announcements" }, () => onChange())
    .subscribe();
  return () => {
    supabase.removeChannel(channel);
  };
}

export function subscribeNotificationRecords(onChange: () => void): () => void {
  const channel = supabase
    .channel("notification-records-changes")
    .on("postgres_changes", { event: "*", schema: "public", table: "notification_records" }, () => onChange())
    .subscribe();
  return () => {
    supabase.removeChannel(channel);
  };
}

export async function uploadAnnouncementImage(file: File): Promise<string> {
  const ext = file.name.split(".").pop() || "png";
  const path = `${crypto.randomUUID()}.${ext}`;
  const { error } = await supabase.storage.from("announcement-images").upload(path, file, {
    cacheControl: "3600",
    upsert: false,
  });
  if (error) throw error;
  const { data } = supabase.storage.from("announcement-images").getPublicUrl(path);
  return data.publicUrl;
}

export function utilityLabel(u: Utility): string {
  return u === "power" ? "CEPALCO" : "Water District";
}

export function buildSmsText(announcement: Announcement): string {
  const targeting = [announcement.barangays.join(", "), announcement.puroks.join(", ")].filter(Boolean).join(" / ");
  return `CivicAlert ${utilityLabel(announcement.utility)}: ${announcement.title}\n${announcement.message}\nTarget: ${targeting}`;
}

export async function changePassword(newPassword: string): Promise<void> {
  const { error } = await supabase.auth.updateUser({ password: newPassword });
  if (error) throw error;
}

