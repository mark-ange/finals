// c:\Users\Lenovo\Downloads\project-finals-CAS\project-finals-CAS\CivicAlert\frontend\packages\ui\src\lib\types.ts
export type Utility = "power" | "water";
export type Role = "resident" | "power_admin" | "water_admin";
export type AnnouncementStatus = "draft" | "published" | "updated" | "archived";
export type NotificationChannel = "sms" | "email" | "facebook" | "instagram";
export type NotificationStatus = "queued" | "sent" | "failed";

export type Profile = {
  id: string;
  name: string;
  email: string;
  role: Role;
  utility: Utility | null;
  phoneNumber: string;
  address: string;
  barangay: string;
  purok: string;
  city: string;
  postalCode: string;
  smsAlerts: boolean;
  profileImage: string | null;
  termsAcceptedAt: string | null;
};

export type Announcement = {
  id: string;
  reference: string;
  utility: Utility;
  title: string;
  message: string;
  imageUrl: string | null;
  barangays: string[];
  puroks: string[];
  status: AnnouncementStatus;
  recipientCount: number;
  createdBy: string | null;
  createdAt: string;
  publishedAt: string | null;
};

export type NotificationRecord = {
  id: string;
  announcementId: string;
  announcementTitle: string;
  utility: Utility;
  channel: NotificationChannel;
  recipientName: string | null;
  destination: string;
  contentText: string;
  hasImage: boolean;
  status: NotificationStatus;
  provider: string;
  providerRef: string | null;
  error: string | null;
  createdAt: string;
  sentAt: string | null;
};

export type ActivityLog = {
  id: number;
  actorName: string | null;
  actorRole: string | null;
  action: string;
  entityType: string;
  entityId: string | null;
  summary: string;
  utility: Utility | null;
  createdAt: string;
};

export type TermsAcceptance = {
  id: number;
  termsVersion: string;
  termsTitle: string;
  acceptedAt: string;
};

export type Actor = Profile;
