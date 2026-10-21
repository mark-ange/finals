import { FormEvent, useEffect, useMemo, useState } from "react";
import { createRoot } from "react-dom/client";
import { uiCopy } from "./prototypeCopy.js";
import { portalSettings as localPortalSettings, type PortalSettings } from "./prototypeSettings.js";
import {
  changePassword,
  createAnnouncement,
  estimateRecipients,
  getSessionProfile,
  getTermsAcceptance,
  listActivityLogs,
  listAnnouncements,
  listNotificationRecords,
  signIn,
  signOut as apiSignOut,
  signUpResident,
  subscribeAnnouncements,
  subscribeNotificationRecords,
  updateAnnouncementStatus,
  updateResidentProfile,
  uploadAnnouncementImage,
  utilityLabel,
} from "./lib/api.js";
import type {
  ActivityLog,
  Announcement,
  AnnouncementStatus,
  NotificationRecord,
  Profile,
} from "./lib/types.js";
import "./styles.css";

const portalSettings = localPortalSettings;

function copy(key: string): string {
  const value = (uiCopy as Record<string, string>)[key];
  if (value === undefined) throw new Error(`Missing frontend copy key: ${key}`);
  return value;
}

function settingsFor(portal: "resident" | "cepalco" | "water"): PortalSettings {
  return portalSettings[portal];
}

function Icon({ name, className = "h-5 w-5" }: { name: string; className?: string }) {
  const paths: Record<string, string> = {
    home: "M3 10 12 3l9 7v10a1 1 0 0 1-1 1h-5v-7H9v7H4a1 1 0 0 1-1-1V10Z",
    water: "M12 3s7 7 7 12a7 7 0 1 1-14 0c0-5 7-12 7-12Z",
    alert: "M12 3 2.9 19a1.4 1.4 0 0 0 1.2 2.1h15.8a1.4 1.4 0 0 0 1.2-2.1L12 3Zm0 6v4.5m0 3h.01",
    calendar: "M3 5h18v16H3zM8 3v4m8-4v4M3 10h18",
    map: "M20 10c0 5-8 12-8 12S4 15 4 10a8 8 0 1 1 16 0Z M12 10h.01",
    people: "M16 20v-1.5a4 4 0 0 0-4-4H7a4 4 0 0 0-4 4V20m7-9a4 4 0 1 0 0-8 4 4 0 0 0 0 8Z",
    search: "M10.8 17.6a6.8 6.8 0 1 0 0-13.6 6.8 6.8 0 0 0 0 13.6ZM16 16l5 5",
    plus: "M12 5v14M5 12h14",
    pulse: "M3 12h4l2.4-7 4.2 14 2.5-7H21",
    shield: "M12 2.8 20 6v5.1c0 5.2-3.4 8.8-8 10.2-4.6-1.4-8-5-8-10.2V6l8-3.2Z",
    messages: "M4 5h16v11H7l-3 3V5Z",
    close: "m6 6 12 12M18 6 6 18",
  };
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true">
      <path d={paths[name] ?? paths.home} />
    </svg>
  );
}

function fmtDate(value: string | null): string {
  if (!value) return "—";
  return new Date(value).toLocaleString();
}

type PortalKey = "resident" | "cepalco" | "water";

function portalForProfile(profile: Profile | null): PortalKey {
  if (!profile) return "resident";
  if (profile.role === "power_admin") return "cepalco";
  if (profile.role === "water_admin") return "water";
  return "resident";
}
function PortalApp({ initialPortal = "resident" }: { initialPortal?: PortalKey }) {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [booting, setBooting] = useState(true);
  const [authMode, setAuthMode] = useState<"login" | "register">("login");
  const [page, setPage] = useState("overview");
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [notifications, setNotifications] = useState<NotificationRecord[]>([]);
  const [logs, setLogs] = useState<ActivityLog[]>([]);
  const [terms, setTerms] = useState<{ termsVersion: string; termsTitle: string; acceptedAt: string } | null>(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const portal: PortalKey = profile ? portalForProfile(profile) : initialPortal;
  const settings = settingsFor(portal);
  const isAdmin = profile?.role === "power_admin" || profile?.role === "water_admin";

  async function refreshAll() {
    try {
      const [a, n, l] = await Promise.all([
        listAnnouncements().catch(() => [] as Announcement[]),
        listNotificationRecords().catch(() => [] as NotificationRecord[]),
        listActivityLogs().catch(() => [] as ActivityLog[]),
      ]);
      setAnnouncements(a);
      setNotifications(n);
      setLogs(l);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    }
  }

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const p = await getSessionProfile();
        if (!mounted) return;
        setProfile(p);
        if (p) {
          const t = await getTermsAcceptance(p.id).catch(() => null);
          setTerms(t ? { termsVersion: t.termsVersion, termsTitle: t.termsTitle, acceptedAt: t.acceptedAt } : null);
        }
      } finally {
        if (mounted) setBooting(false);
      }
    })();
    return () => { mounted = false; };
  }, []);
  useEffect(() => {
    if (!profile) return;
    refreshAll();
    const u1 = subscribeAnnouncements(() => refreshAll());
    const u2 = subscribeNotificationRecords(() => refreshAll());
    return () => { u1(); u2(); };
  }, [profile?.id]);

  async function handleLogin(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setBusy(true);
    const form = new FormData(event.currentTarget);
    try {
      const p = await signIn(String(form.get("email")), String(form.get("password")));
      setProfile(p);
      const t = await getTermsAcceptance(p.id).catch(() => null);
      setTerms(t ? { termsVersion: t.termsVersion, termsTitle: t.termsTitle, acceptedAt: t.acceptedAt } : null);
      setPage("overview");
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setBusy(false);
    }
  }

  async function handleRegister(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setBusy(true);
    const form = new FormData(event.currentTarget);
    try {
      const res = await signUpResident({
        name: String(form.get("name")),
        email: String(form.get("email")),
        password: String(form.get("password")),
        phoneNumber: String(form.get("phoneNumber")),
        address: String(form.get("address")),
        barangay: String(form.get("barangay")),
        purok: String(form.get("purok")),
        city: String(form.get("city") || "Cagayan de Oro City"),
        postalCode: String(form.get("postalCode") || ""),
        smsAlerts: form.get("smsAlerts") === "on",
        termsVersion: "v1.0",
      });
      if (res.needsConfirmation) {
        setError("Check your email to confirm your account, then sign in.");
        setAuthMode("login");
      } else {
        const p = await getSessionProfile();
        setProfile(p);
        if (p) {
          const t = await getTermsAcceptance(p.id).catch(() => null);
          setTerms(t ? { termsVersion: t.termsVersion, termsTitle: t.termsTitle, acceptedAt: t.acceptedAt } : null);
        }
        setPage("overview");
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setBusy(false);
    }
  }

  async function handleSignOut() {
    await apiSignOut();
    setProfile(null);
    setAnnouncements([]);
    setNotifications([]);
    setLogs([]);
  }
  if (booting) {
    return <div className="min-h-screen grid place-items-center text-sm text-slate-500">Loading CivicAlert…</div>;
  }

  if (!profile) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
        <div className="w-full max-w-md bg-white rounded-2xl border border-slate-200 p-6 space-y-4">
          <div className="flex items-center gap-2">
            <span className="h-8 w-8 rounded-full bg-rose-600 text-white grid place-items-center font-bold">C</span>
            <strong className="text-lg">CivicAlert</strong>
          </div>
          <div className="flex gap-2 text-sm">
            <button onClick={() => setAuthMode("login")} className={authMode === "login" ? "font-bold text-rose-600" : "text-slate-500"}>Sign in</button>
            <button onClick={() => setAuthMode("register")} className={authMode === "register" ? "font-bold text-rose-600" : "text-slate-500"}>Register</button>
          </div>
          {error && <p role="alert" className="text-xs text-rose-700">{error}</p>}
          {authMode === "login" ? (
            <form onSubmit={handleLogin} className="space-y-3">
              <label className="block text-xs">Email<input name="email" type="email" required className="mt-1 w-full rounded-md border border-slate-200 px-3 py-2 text-sm" /></label>
              <label className="block text-xs">Password<input name="password" type="password" required className="mt-1 w-full rounded-md border border-slate-200 px-3 py-2 text-sm" /></label>
              <button disabled={busy} className="w-full rounded-md bg-rose-600 text-white py-2 text-sm font-semibold">{busy ? "Signing in…" : "Sign in"}</button>
            </form>
          ) : (
            <form onSubmit={handleRegister} className="space-y-3">
              <label className="block text-xs">Full name<input name="name" required className="mt-1 w-full rounded-md border border-slate-200 px-3 py-2 text-sm" /></label>
              <label className="block text-xs">Email<input name="email" type="email" required className="mt-1 w-full rounded-md border border-slate-200 px-3 py-2 text-sm" /></label>
              <label className="block text-xs">Password<input name="password" type="password" required minLength={6} className="mt-1 w-full rounded-md border border-slate-200 px-3 py-2 text-sm" /></label>
              <label className="block text-xs">Phone number<input name="phoneNumber" required className="mt-1 w-full rounded-md border border-slate-200 px-3 py-2 text-sm" /></label>
              <label className="block text-xs">Address<input name="address" required className="mt-1 w-full rounded-md border border-slate-200 px-3 py-2 text-sm" /></label>
              <div className="grid grid-cols-2 gap-2">
                <label className="block text-xs">Barangay
                  <select name="barangay" required className="mt-1 w-full rounded-md border border-slate-200 px-3 py-2 text-sm">
                    {settingsFor("resident").barangays?.map(b => <option key={b}>{b}</option>)}
                  </select>
                </label>
                <label className="block text-xs">Purok<input name="purok" required className="mt-1 w-full rounded-md border border-slate-200 px-3 py-2 text-sm" placeholder="Purok 1" /></label>
              </div>
              <label className="block text-xs">City<input name="city" defaultValue="Cagayan de Oro City" className="mt-1 w-full rounded-md border border-slate-200 px-3 py-2 text-sm" /></label>
              <label className="block text-xs">Postal code<input name="postalCode" className="mt-1 w-full rounded-md border border-slate-200 px-3 py-2 text-sm" /></label>
              <label className="flex items-center gap-2 text-xs"><input type="checkbox" name="smsAlerts" defaultChecked /> SMS alerts</label>
              <p className="text-[10px] text-slate-500">By registering you accept the CivicAlert Resident Terms and Conditions.</p>
              <button disabled={busy} className="w-full rounded-md bg-rose-600 text-white py-2 text-sm font-semibold">{busy ? "Registering…" : "Register"}</button>
            </form>
          )}
        </div>
      </div>
    );
  }
  const navItems = settings.navigation;

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="bg-white border-b border-slate-200 px-6 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="h-7 w-7 rounded-full bg-rose-600 text-white grid place-items-center font-bold text-sm">C</span>
          <strong>{settings.label}</strong>
          <span className="text-xs text-slate-400 ml-2">{settings.pageHeadingLabel}</span>
        </div>
        <div className="flex items-center gap-3 text-xs">
          <span>{profile.name}</span>
          <span className="rounded-full bg-slate-100 px-2 py-1">{profile.role}</span>
          <button onClick={handleSignOut} className="text-rose-600 font-semibold">Sign out</button>
        </div>
      </header>
      <div className="flex">
        <aside className="w-56 bg-white border-r border-slate-200 min-h-[calc(100vh-52px)] p-3 space-y-1">
          {navItems.map(item => (
            <button key={item.key} onClick={() => setPage(item.key)} className={`w-full text-left px-3 py-2 rounded-md text-sm flex items-center gap-2 ${page === item.key ? "bg-rose-50 text-rose-700 font-semibold" : "text-slate-600 hover:bg-slate-50"}`}>
              <Icon name={item.icon} className="h-4 w-4" /> {item.label}
            </button>
          ))}
          {isAdmin && (
            <>
              <button onClick={() => setPage("publish")} className={`w-full text-left px-3 py-2 rounded-md text-sm flex items-center gap-2 ${page === "publish" ? "bg-rose-50 text-rose-700 font-semibold" : "text-slate-600 hover:bg-slate-50"}`}>
                <Icon name="plus" className="h-4 w-4" /> Publish
              </button>
              <button onClick={() => setPage("notifications")} className={`w-full text-left px-3 py-2 rounded-md text-sm flex items-center gap-2 ${page === "notifications" ? "bg-rose-50 text-rose-700 font-semibold" : "text-slate-600 hover:bg-slate-50"}`}>
                <Icon name="messages" className="h-4 w-4" /> Notifications
              </button>
              <button onClick={() => setPage("logs")} className={`w-full text-left px-3 py-2 rounded-md text-sm flex items-center gap-2 ${page === "logs" ? "bg-rose-50 text-rose-700 font-semibold" : "text-slate-600 hover:bg-slate-50"}`}>
                <Icon name="pulse" className="h-4 w-4" /> Activity logs
              </button>
            </>
          )}
        </aside>
        <main className="flex-1 p-6 space-y-4">
          {error && <p role="alert" className="text-xs text-rose-700">{error}</p>}
          {renderPage()}
        </main>
      </div>
    </div>
  );

  function renderPage() {
    switch (page) {
      case "overview": return <OverviewPage profile={profile!} announcements={announcements} />;
      case "advisories":
      case "incidents": return <AdvisoriesPage announcements={announcements} />;
      case "profile": return <ProfilePage profile={profile!} setProfile={setProfile} terms={terms} />;
      case "publish": return isAdmin ? <PublishPage profile={profile!} onPublished={() => { refreshAll(); setPage("advisories"); }} /> : null;
      case "notifications": return isAdmin ? <NotificationsPage notifications={notifications} /> : null;
      case "logs": return isAdmin ? <LogsPage logs={logs} /> : null;
      default: return <OverviewPage profile={profile!} announcements={announcements} />;
    }
  }
    return null;
}

function OverviewPage({ profile, announcements }: { profile: Profile; announcements: Announcement[] }) {
  const mine = announcements.filter(a => a.status === "published" || a.status === "updated")
    .filter(a => (profile.role === "resident" ? (a.barangays.includes(profile.barangay) && a.puroks.includes(profile.purok)) : a.utility === profile.utility));
  return (
    <div className="space-y-4">
      <h1 className="text-xl font-bold">Overview</h1>
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-white border border-slate-200 rounded-xl p-4">
          <p className="text-xs text-slate-500">Visible announcements</p>
          <p className="text-2xl font-bold">{mine.length}</p>
        </div>
        <div className="bg-white border border-slate-200 rounded-xl p-4">
          <p className="text-xs text-slate-500">Your role</p>
          <p className="text-sm font-semibold">{profile.role}</p>
        </div>
        <div className="bg-white border border-slate-200 rounded-xl p-4">
          <p className="text-xs text-slate-500">Target area</p>
          <p className="text-sm font-semibold">{profile.role === "resident" ? `${profile.barangay} / ${profile.purok}` : utilityLabel(profile.utility!)}</p>
        </div>
      </div>
      <div className="bg-white border border-slate-200 rounded-xl p-4 space-y-2">
        <h2 className="font-semibold text-sm">Latest</h2>
        {mine.slice(0, 5).map(a => (
          <div key={a.id} className="border-b border-slate-100 pb-2 last:border-0">
            <p className="text-sm font-semibold">{a.title} <span className="text-[10px] text-slate-400">{a.reference}</span></p>
            <p className="text-xs text-slate-600">{a.message}</p>
            <p className="text-[10px] text-slate-400">{fmtDate(a.publishedAt ?? a.createdAt)}</p>
          </div>
        ))}
        {mine.length === 0 && <p className="text-xs text-slate-500">No announcements for your area yet.</p>}
      </div>
    </div>
  );
}

function AdvisoriesPage({ announcements }: { announcements: Announcement[] }) {
  return (
    <div className="space-y-3">
      <h1 className="text-xl font-bold">Announcements</h1>
      {announcements.length === 0 && <p className="text-xs text-slate-500">No announcements yet.</p>}
      {announcements.map(a => (
        <div key={a.id} className="bg-white border border-slate-200 rounded-xl p-4 space-y-1">
          <div className="flex items-center justify-between">
            <p className="font-semibold text-sm">{a.title}</p>
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-100">{a.status}</span>
          </div>
          <p className="text-[10px] text-slate-400">{a.reference} · {utilityLabel(a.utility)} · {a.barangays.join(", ")} / {a.puroks.join(", ")}</p>
          <p className="text-xs text-slate-600">{a.message}</p>
          {a.imageUrl && <img src={a.imageUrl} alt="" className="max-h-40 rounded-md" />}
          <p className="text-[10px] text-slate-400">Recipients: {a.recipientCount} · {fmtDate(a.publishedAt ?? a.createdAt)}</p>
        </div>
      ))}
    </div>
  );
}

function ProfilePage({ profile, setProfile, terms }: { profile: Profile; setProfile: (p: Profile) => void; terms: { termsVersion: string; termsTitle: string; acceptedAt: string } | null }) {
  const [form, setForm] = useState(profile);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState("");
  const [newPassword, setNewPassword] = useState("");
  async function save() {
    setSaving(true);
    setMsg("");
    try {
      const updated = await updateResidentProfile(profile.id, form);
      setProfile(updated);
      setMsg("Saved.");
    } catch (e) {
      setMsg(e instanceof Error ? e.message : String(e));
    } finally {
      setSaving(false);
    }
  }
  async function changePw() {
    if (!newPassword) return;
    try {
      await changePassword(newPassword);
      setNewPassword("");
      setMsg("Password updated.");
    } catch (e) {
      setMsg(e instanceof Error ? e.message : String(e));
    }
  }
  return (
    <div className="space-y-4 max-w-2xl">
      <h1 className="text-xl font-bold">Profile & settings</h1>
      <div className="bg-white border border-slate-200 rounded-xl p-4 space-y-3">
        <label className="block text-xs">Name<input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} className="mt-1 w-full rounded-md border border-slate-200 px-3 py-2 text-sm" /></label>
        <label className="block text-xs">Phone<input value={form.phoneNumber} onChange={e => setForm({ ...form, phoneNumber: e.target.value })} className="mt-1 w-full rounded-md border border-slate-200 px-3 py-2 text-sm" /></label>
        <label className="block text-xs">Address<input value={form.address} onChange={e => setForm({ ...form, address: e.target.value })} className="mt-1 w-full rounded-md border border-slate-200 px-3 py-2 text-sm" /></label>
        <div className="grid grid-cols-2 gap-2">
          <label className="block text-xs">Barangay<input value={form.barangay} onChange={e => setForm({ ...form, barangay: e.target.value })} className="mt-1 w-full rounded-md border border-slate-200 px-3 py-2 text-sm" /></label>
          <label className="block text-xs">Purok<input value={form.purok} onChange={e => setForm({ ...form, purok: e.target.value })} className="mt-1 w-full rounded-md border border-slate-200 px-3 py-2 text-sm" /></label>
        </div>
        <label className="flex items-center gap-2 text-xs"><input type="checkbox" checked={form.smsAlerts} onChange={e => setForm({ ...form, smsAlerts: e.target.checked })} /> SMS alerts</label>
        <button onClick={save} disabled={saving} className="rounded-md bg-rose-600 text-white px-4 py-2 text-sm font-semibold">{saving ? "Saving…" : "Save profile"}</button>
        {msg && <p className="text-xs text-slate-600">{msg}</p>}
      </div>
      <div className="bg-white border border-slate-200 rounded-xl p-4 space-y-2">
        <h2 className="font-semibold text-sm">Change password</h2>
        <input type="password" value={newPassword} onChange={e => setNewPassword(e.target.value)} className="w-full rounded-md border border-slate-200 px-3 py-2 text-sm" placeholder="New password" />
        <button onClick={changePw} className="rounded-md bg-slate-700 text-white px-4 py-2 text-sm font-semibold">Update password</button>
      </div>
      <div className="bg-white border border-slate-200 rounded-xl p-4 space-y-1">
        <h2 className="font-semibold text-sm">Terms & conditions</h2>
        {terms ? (
          <>
            <p className="text-xs">{terms.termsTitle} ({terms.termsVersion})</p>
            <p className="text-xs text-slate-500">Accepted {fmtDate(terms.acceptedAt)}</p>
          </>
        ) : (
          <p className="text-xs text-slate-500">No terms acceptance recorded.</p>
        )}
      </div>
    </div>
  );
}

function PublishPage({ profile, onPublished }: { profile: Profile; onPublished: () => void }) {
  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [barangays, setBarangays] = useState<string[]>([]);
  const [puroks, setPuroks] = useState<string[]>(["Purok 1"]);
  const [status, setStatus] = useState<AnnouncementStatus>("published");
  const [preview, setPreview] = useState(0);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState("");
  const allBarangays = settingsFor("resident").barangays ?? [];
  const utility = profile.utility as "power" | "water";

  useEffect(() => {
    if (barangays.length === 0 || puroks.length === 0) { setPreview(0); return; }
    estimateRecipients(barangays, puroks).then(setPreview).catch(() => setPreview(0));
  }, [barangays, puroks]);

  async function submit(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setMsg("");
    try {
      let finalImage = imageUrl;
      if (imageFile) finalImage = await uploadAnnouncementImage(imageFile);
      await createAnnouncement({
        utility,
        title,
        message,
        imageUrl: finalImage,
        barangays,
        puroks,
        status,
      });
      setTitle(""); setMessage(""); setImageUrl(null); setImageFile(null);
      setBarangays([]); setPuroks(["Purok 1"]);
      onPublished();
    } catch (e) {
      setMsg(e instanceof Error ? e.message : String(e));
    } finally {
      setBusy(false);
    }
  }

  function toggleBarangay(b: string) {
    setBarangays(prev => prev.includes(b) ? prev.filter(x => x !== b) : [...prev, b]);
  }

  return (
    <div className="space-y-4 max-w-3xl">
      <h1 className="text-xl font-bold">Publish announcement</h1>
      <form onSubmit={submit} className="bg-white border border-slate-200 rounded-xl p-4 space-y-3">
        <label className="block text-xs">Title<input value={title} onChange={e => setTitle(e.target.value)} required className="mt-1 w-full rounded-md border border-slate-200 px-3 py-2 text-sm" /></label>
        <label className="block text-xs">Message<textarea value={message} onChange={e => setMessage(e.target.value)} required rows={4} className="mt-1 w-full rounded-md border border-slate-200 px-3 py-2 text-sm" /></label>
        <label className="block text-xs">Image URL (optional)<input value={imageUrl ?? ""} onChange={e => setImageUrl(e.target.value || null)} className="mt-1 w-full rounded-md border border-slate-200 px-3 py-2 text-sm" placeholder="https://..." /></label>
        <label className="block text-xs">Or upload image<input type="file" accept="image/*" onChange={e => setImageFile(e.target.files?.[0] ?? null)} className="mt-1 text-sm" /></label>
        <div>
          <p className="text-xs font-semibold mb-1">Target barangays</p>
          <div className="flex flex-wrap gap-1">
            {allBarangays.map(b => (
              <button type="button" key={b} onClick={() => toggleBarangay(b)} className={`text-xs px-2 py-1 rounded-full border ${barangays.includes(b) ? "bg-rose-600 text-white border-rose-600" : "border-slate-200 text-slate-600"}`}>{b}</button>
            ))}
          </div>
        </div>
        <div>
          <p className="text-xs font-semibold mb-1">Target puroks (comma separated)</p>
          <input value={puroks.join(", ")} onChange={e => setPuroks(e.target.value.split(",").map(x => x.trim()).filter(Boolean))} className="w-full rounded-md border border-slate-200 px-3 py-2 text-sm" placeholder="Purok 1, Purok 2" />
        </div>
        <div className="flex items-center gap-3">
          <label className="text-xs">Status
            <select value={status} onChange={e => setStatus(e.target.value as AnnouncementStatus)} className="ml-2 rounded-md border border-slate-200 px-2 py-1 text-sm">
              <option value="draft">Draft</option>
              <option value="published">Publish now</option>
            </select>
          </label>
          <span className="text-xs text-slate-500">Estimated recipients: <strong>{preview}</strong></span>
        </div>
        {msg && <p className="text-xs text-rose-700">{msg}</p>}
        <button disabled={busy} className="rounded-md bg-rose-600 text-white px-4 py-2 text-sm font-semibold">{busy ? "Publishing…" : "Publish"}</button>
      </form>
    </div>
  );
}

function NotificationsPage({ notifications }: { notifications: NotificationRecord[] }) {
  return (
    <div className="space-y-3">
      <h1 className="text-xl font-bold">Notification records</h1>
      {notifications.length === 0 && <p className="text-xs text-slate-500">No notification records yet.</p>}
      {notifications.map(n => (
        <div key={n.id} className="bg-white border border-slate-200 rounded-xl p-3 space-y-1">
          <div className="flex items-center justify-between">
            <p className="text-sm font-semibold">{n.announcementTitle}</p>
            <span className={`text-[10px] px-2 py-0.5 rounded-full ${n.status === "sent" ? "bg-emerald-100 text-emerald-700" : n.status === "failed" ? "bg-rose-100 text-rose-700" : "bg-slate-100 text-slate-600"}`}>{n.status}</span>
          </div>
          <p className="text-[10px] text-slate-400">{n.channel} · {n.utility} · {n.recipientName ?? "—"} · {n.destination}</p>
          <p className="text-xs text-slate-600 whitespace-pre-wrap">{n.contentText}</p>
          {n.error && <p className="text-xs text-rose-700">{n.error}</p>}
          <p className="text-[10px] text-slate-400">{fmtDate(n.createdAt)}{n.sentAt ? ` · sent ${fmtDate(n.sentAt)}` : ""}{n.provider ? ` · ${n.provider}` : ""}</p>
        </div>
      ))}
    </div>
  );
}

function LogsPage({ logs }: { logs: ActivityLog[] }) {
  return (
    <div className="space-y-3">
      <h1 className="text-xl font-bold">Activity logs</h1>
      {logs.length === 0 && <p className="text-xs text-slate-500">No activity yet.</p>}
      <div className="bg-white border border-slate-200 rounded-xl divide-y divide-slate-100">
        {logs.map(l => (
          <div key={l.id} className="p-3">
            <p className="text-sm">{l.summary}</p>
            <p className="text-[10px] text-slate-400">{l.action} · {l.entityType} · {l.actorName ?? "system"} · {fmtDate(l.createdAt)}</p>
          </div>
        ))}
      </div>
    </div>
  );
}


export default PortalApp;
