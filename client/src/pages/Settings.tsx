import { useEffect, useMemo, useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import {
  Bell,
  Globe,
  KeyRound,
  Loader2,
  LogOut,
  Monitor,
  Palette,
  Save,
  ShieldCheck,
  Smartphone,
  UserRound,
} from "lucide-react";
import { toast } from "sonner";
import AppShell from "@/components/AppShell";
import ConfirmDialog from "@/components/ConfirmDialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/contexts/AuthContext";
import { requireSupabase } from "@/lib/supabase";
import { friendlyAuthError } from "@/lib/authErrors";
import {
  LANGUAGES,
  readAppearance,
  saveAppearance,
  type ThemeChoice,
} from "@/lib/appearance";
import {
  formatDateTime,
  getEmail,
  getLastSignIn,
  getMetadata,
  passwordStrength,
} from "@/lib/aegis";

const TIMEZONES = [
  "UTC",
  "Asia/Kolkata",
  "Asia/Dubai",
  "Asia/Singapore",
  "Asia/Tokyo",
  "Europe/London",
  "Europe/Berlin",
  "America/New_York",
  "America/Los_Angeles",
  "Australia/Sydney",
];

const profileSchema = z.object({
  fullName: z.string().trim().min(2, "Add your name so we can greet you properly."),
  email: z.string().trim().regex(/^[^\s@]+@[^\s@]+\.[^\s@]+$/, "Enter a valid email address."),
  phone: z.string().trim().max(32, "That phone number is too long."),
  timezone: z.string().min(1),
});
type ProfileValues = z.infer<typeof profileSchema>;

const passwordSchema = z
  .object({
    password: z.string().min(8, "Use at least 8 characters."),
    confirm: z.string(),
  })
  .refine((values) => values.password === values.confirm, {
    path: ["confirm"],
    message: "Those passwords don't match.",
  });
type PasswordValues = z.infer<typeof passwordSchema>;

function describeDevice(): string {
  if (typeof navigator === "undefined") return "This device";
  const ua = navigator.userAgent;
  const browser = /Edg\//.test(ua)
    ? "Edge"
    : /Firefox\//.test(ua)
      ? "Firefox"
      : /Chrome\//.test(ua)
        ? "Chrome"
        : /Safari\//.test(ua)
          ? "Safari"
          : "Browser";
  const platform = /Windows/.test(ua)
    ? "Windows"
    : /Mac OS X/.test(ua)
      ? "macOS"
      : /Android/.test(ua)
        ? "Android"
        : /iPhone|iPad/.test(ua)
          ? "iOS"
          : /Linux/.test(ua)
            ? "Linux"
            : "Unknown OS";
  return `${browser} on ${platform}`;
}

export default function Settings() {
  const { user, refresh } = useAuth();
  const metadata = useMemo(() => getMetadata(user), [user]);
  const initialAppearance = useMemo(() => readAppearance(), []);

  const [savingProfile, setSavingProfile] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);
  const [savingNotifications, setSavingNotifications] = useState(false);
  const [savingAppearance, setSavingAppearance] = useState(false);
  const [twoFactor, setTwoFactor] = useState(Boolean(metadata.two_factor_enabled));
  const [savingTwoFactor, setSavingTwoFactor] = useState(false);
  const [sessionsOpen, setSessionsOpen] = useState(false);
  const [signingOutAll, setSigningOutAll] = useState(false);

  const [notifications, setNotifications] = useState(() => {
    const stored = metadata.notifications as Record<string, unknown> | undefined;
    return {
      email: stored?.email !== false,
      push: stored?.push === true,
      weekly: stored?.weekly !== false,
    };
  });
  const [appearance, setAppearance] = useState(initialAppearance);

  const profileForm = useForm<ProfileValues>({
    resolver: zodResolver(profileSchema),
    defaultValues: { fullName: "", email: "", phone: "", timezone: "UTC" },
  });
  const passwordForm = useForm<PasswordValues>({
    resolver: zodResolver(passwordSchema),
    defaultValues: { password: "", confirm: "" },
  });
  const passwordDraft = passwordForm.watch("password");

  useEffect(() => {
    profileForm.reset({
      fullName: typeof metadata.full_name === "string" ? metadata.full_name : "",
      email: getEmail(user),
      phone: typeof metadata.phone === "string" ? metadata.phone : "",
      timezone: typeof metadata.timezone === "string" && metadata.timezone ? metadata.timezone : "UTC",
    });
  }, [user, metadata, profileForm]);

  useEffect(() => {
    setTwoFactor(Boolean(metadata.two_factor_enabled));
    const stored = metadata.notifications as Record<string, unknown> | undefined;
    setNotifications({
      email: stored?.email !== false,
      push: stored?.push === true,
      weekly: stored?.weekly !== false,
    });
  }, [metadata]);

  const saveProfile = profileForm.handleSubmit(async (values) => {
    setSavingProfile(true);
    try {
      const client = requireSupabase();
      const nextEmail = values.email.trim().toLowerCase();
      const emailChanged = nextEmail !== getEmail(user).toLowerCase();
      const { error } = await client.auth.updateUser({
        ...(emailChanged ? { email: nextEmail } : {}),
        data: {
          full_name: values.fullName.trim(),
          phone: values.phone.trim(),
          timezone: values.timezone,
        },
      });
      if (error) throw error;
      await refresh();
      toast.success(
        emailChanged
          ? "Profile saved. Confirm the new email address from your inbox."
          : "Profile saved."
      );
    } catch (caught) {
      toast.error(friendlyAuthError(caught));
    } finally {
      setSavingProfile(false);
    }
  });

  const savePassword = passwordForm.handleSubmit(async (values) => {
    setSavingPassword(true);
    try {
      const { error } = await requireSupabase().auth.updateUser({ password: values.password });
      if (error) throw error;
      passwordForm.reset({ password: "", confirm: "" });
      toast.success("Password updated.");
    } catch (caught) {
      toast.error(friendlyAuthError(caught));
    } finally {
      setSavingPassword(false);
    }
  });

  const toggleTwoFactor = async (next: boolean) => {
    setSavingTwoFactor(true);
    try {
      const { error } = await requireSupabase().auth.updateUser({
        data: { two_factor_enabled: next },
      });
      if (error) throw error;
      setTwoFactor(next);
      await refresh();
      toast.success(next ? "Two-factor preference saved." : "Two-factor preference turned off.");
    } catch (caught) {
      toast.error(friendlyAuthError(caught));
    } finally {
      setSavingTwoFactor(false);
    }
  };

  const saveNotifications = async () => {
    setSavingNotifications(true);
    try {
      const { error } = await requireSupabase().auth.updateUser({
        data: { notifications },
      });
      if (error) throw error;
      await refresh();
      toast.success("Notification preferences saved.");
    } catch (caught) {
      toast.error(friendlyAuthError(caught));
    } finally {
      setSavingNotifications(false);
    }
  };

  const persistAppearance = () => {
    setSavingAppearance(true);
    try {
      saveAppearance(appearance);
      toast.success("Appearance preferences saved.");
    } catch {
      toast.error("We couldn't save that preference in this browser.");
    } finally {
      setSavingAppearance(false);
    }
  };

  const signOutEverywhere = async () => {
    setSigningOutAll(true);
    try {
      await requireSupabase().auth.signOut({ scope: "global" });
      window.location.href = "/auth";
    } catch (caught) {
      setSigningOutAll(false);
      toast.error(friendlyAuthError(caught));
    }
  };

  const strength = passwordStrength(passwordDraft ?? "");

  return (
    <AppShell current="/settings">
      <div className="app-page-head">
        <div>
          <span className="kicker">
            <ShieldCheck size={13} /> Workspace / Settings
          </span>
          <h1>Settings</h1>
          <p>Manage your profile, account security, notifications, and how the workspace looks.</p>
        </div>
      </div>

      <Tabs defaultValue="profile">
        <TabsList className="w-full max-w-xl">
          <TabsTrigger value="profile">
            <UserRound /> Profile
          </TabsTrigger>
          <TabsTrigger value="security">
            <ShieldCheck /> Security
          </TabsTrigger>
          <TabsTrigger value="notifications">
            <Bell /> Notifications
          </TabsTrigger>
          <TabsTrigger value="appearance">
            <Palette /> Appearance
          </TabsTrigger>
        </TabsList>

        {/* ---------------------------- Profile ---------------------------- */}
        <TabsContent value="profile" className="panel" style={{ marginTop: 14 }}>
          <div className="panel__head">
            <h2 className="panel__title">
              <UserRound size={16} /> Profile
            </h2>
            <span className="kicker">Stored in your account</span>
          </div>
          <div className="panel__body">
            <form onSubmit={saveProfile}>
              <div className="field-row">
                <Label htmlFor="settings-name">Full name</Label>
                <Input id="settings-name" autoComplete="name" {...profileForm.register("fullName")} />
                {profileForm.formState.errors.fullName && (
                  <p className="field-row__hint" style={{ color: "var(--app-critical-text)" }}>
                    {profileForm.formState.errors.fullName.message}
                  </p>
                )}
              </div>

              <div className="field-row">
                <Label htmlFor="settings-email">Email address</Label>
                <Input id="settings-email" type="email" autoComplete="email" {...profileForm.register("email")} />
                {profileForm.formState.errors.email ? (
                  <p className="field-row__hint" style={{ color: "var(--app-critical-text)" }}>
                    {profileForm.formState.errors.email.message}
                  </p>
                ) : (
                  <p className="field-row__hint">
                    Changing this sends a confirmation link to the new address.
                  </p>
                )}
              </div>

              <div className="field-row">
                <Label htmlFor="settings-phone">Phone (optional)</Label>
                <Input
                  id="settings-phone"
                  type="tel"
                  autoComplete="tel"
                  placeholder="+1 555 000 1234"
                  {...profileForm.register("phone")}
                />
                {profileForm.formState.errors.phone && (
                  <p className="field-row__hint" style={{ color: "var(--app-critical-text)" }}>
                    {profileForm.formState.errors.phone.message}
                  </p>
                )}
              </div>

              <div className="field-row">
                <span className="field-row__label">Timezone</span>
                <Select
                  value={profileForm.watch("timezone")}
                  onValueChange={(value) => profileForm.setValue("timezone", value, { shouldDirty: true })}
                >
                  <SelectTrigger className="w-[240px]" aria-label="Timezone">
                    <SelectValue placeholder="Select a timezone" />
                  </SelectTrigger>
                  <SelectContent>
                    {TIMEZONES.map((zone) => (
                      <SelectItem key={zone} value={zone}>
                        {zone}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="field-row__hint">Used for timestamps across reports and the threat feed.</p>
              </div>

              <div className="form-actions">
                <Button type="submit" disabled={savingProfile}>
                  {savingProfile ? <Loader2 className="animate-spin" /> : <Save />}
                  {savingProfile ? "Saving…" : "Save profile"}
                </Button>
              </div>
            </form>
          </div>
        </TabsContent>

        {/* --------------------------- Security --------------------------- */}
        <TabsContent value="security" style={{ marginTop: 14, display: "grid", gap: 13 }}>
          <section className="panel">
            <div className="panel__head">
              <h2 className="panel__title">
                <KeyRound size={16} /> Change password
              </h2>
            </div>
            <div className="panel__body">
              <form onSubmit={savePassword}>
                <div className="field-row">
                  <Label htmlFor="settings-password">New password</Label>
                  <Input
                    id="settings-password"
                    type="password"
                    autoComplete="new-password"
                    {...passwordForm.register("password")}
                  />
                  {passwordForm.formState.errors.password && (
                    <p className="field-row__hint" style={{ color: "var(--app-critical-text)" }}>
                      {passwordForm.formState.errors.password.message}
                    </p>
                  )}
                  <div className="strength" data-level={strength.level}>
                    <div className="strength__bars" aria-hidden="true">
                      <i />
                      <i />
                      <i />
                      <i />
                    </div>
                    <div className="strength__label">
                      <span>Password strength</span>
                      <span>{passwordDraft ? strength.label : "Add a password"}</span>
                    </div>
                  </div>
                </div>

                <div className="field-row">
                  <Label htmlFor="settings-password-confirm">Confirm new password</Label>
                  <Input
                    id="settings-password-confirm"
                    type="password"
                    autoComplete="new-password"
                    {...passwordForm.register("confirm")}
                  />
                  {passwordForm.formState.errors.confirm && (
                    <p className="field-row__hint" style={{ color: "var(--app-critical-text)" }}>
                      {passwordForm.formState.errors.confirm.message}
                    </p>
                  )}
                </div>

                <div className="form-actions">
                  <Button type="submit" disabled={savingPassword}>
                    {savingPassword ? <Loader2 className="animate-spin" /> : <Save />}
                    {savingPassword ? "Updating…" : "Update password"}
                  </Button>
                </div>
              </form>
            </div>
          </section>

          <section className="panel">
            <div className="panel__head">
              <h2 className="panel__title">
                <ShieldCheck size={16} /> Two-factor authentication
              </h2>
            </div>
            <div className="panel__body">
              <div className="toggle-row">
                <span className="toggle-row__copy">
                  <strong>Require a second factor</strong>
                  <span>
                    Records your preference on your account. Enrol an authenticator app to enforce it
                    for new sign-ins.
                  </span>
                </span>
                <Switch
                  checked={twoFactor}
                  disabled={savingTwoFactor}
                  onCheckedChange={(next) => void toggleTwoFactor(next)}
                  aria-label="Two-factor authentication preference"
                />
              </div>
            </div>
          </section>

          <section className="panel">
            <div className="panel__head">
              <h2 className="panel__title">
                <Monitor size={16} /> Active sessions
              </h2>
            </div>
            <div className="panel__body panel__body--flush">
              <div className="activity-item">
                <span className="activity-item__icon activity-item__icon--good">
                  <Smartphone size={14} />
                </span>
                <span className="activity-item__body">
                  <strong>{describeDevice()}</strong>
                  <span>This device — signed in {formatDateTime(getLastSignIn(user))}</span>
                </span>
                <span className="activity-item__time">Current</span>
              </div>
            </div>
            <div className="panel__body" style={{ borderTop: "1px solid var(--app-hairline)" }}>
              <p className="panel__note" style={{ marginTop: 0 }}>
                Signing out everywhere revokes refresh tokens for every device, including this one.
              </p>
              <div className="form-actions">
                <Button variant="destructive" type="button" onClick={() => setSessionsOpen(true)}>
                  <LogOut />
                  Sign out of all devices
                </Button>
              </div>
            </div>
          </section>
        </TabsContent>

        {/* ------------------------ Notifications ------------------------- */}
        <TabsContent value="notifications" className="panel" style={{ marginTop: 14 }}>
          <div className="panel__head">
            <h2 className="panel__title">
              <Bell size={16} /> Notifications
            </h2>
            <span className="kicker">Stored in your account</span>
          </div>
          <div className="panel__body">
            <div className="toggle-row">
              <span className="toggle-row__copy">
                <strong>Email alerts</strong>
                <span>Get an email when a critical or high severity signal is recorded.</span>
              </span>
              <Switch
                checked={notifications.email}
                onCheckedChange={(next) => setNotifications((current) => ({ ...current, email: next }))}
                aria-label="Email alerts"
              />
            </div>
            <div className="toggle-row">
              <span className="toggle-row__copy">
                <strong>Push notifications</strong>
                <span>Browser notifications while the workspace is open.</span>
              </span>
              <Switch
                checked={notifications.push}
                onCheckedChange={(next) => setNotifications((current) => ({ ...current, push: next }))}
                aria-label="Push notifications"
              />
            </div>
            <div className="toggle-row">
              <span className="toggle-row__copy">
                <strong>Weekly security summary</strong>
                <span>A short recap of your score, new reports, and resolved items.</span>
              </span>
              <Switch
                checked={notifications.weekly}
                onCheckedChange={(next) => setNotifications((current) => ({ ...current, weekly: next }))}
                aria-label="Weekly summary"
              />
            </div>

            <div className="form-actions">
              <Button type="button" onClick={() => void saveNotifications()} disabled={savingNotifications}>
                {savingNotifications ? <Loader2 className="animate-spin" /> : <Save />}
                {savingNotifications ? "Saving…" : "Save notifications"}
              </Button>
            </div>
          </div>
        </TabsContent>

        {/* -------------------------- Appearance -------------------------- */}
        <TabsContent value="appearance" className="panel" style={{ marginTop: 14 }}>
          <div className="panel__head">
            <h2 className="panel__title">
              <Palette size={16} /> Appearance
            </h2>
            <span className="kicker">Stored in this browser</span>
          </div>
          <div className="panel__body">
            <div className="field-row">
              <span className="field-row__label">Theme</span>
              <Select
                value={appearance.theme}
                onValueChange={(value) =>
                  setAppearance((current) => ({ ...current, theme: value as ThemeChoice }))
                }
              >
                <SelectTrigger className="w-[220px]" aria-label="Theme">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="light">Light</SelectItem>
                  <SelectItem value="dark">Dark</SelectItem>
                  <SelectItem value="system">Match system</SelectItem>
                </SelectContent>
              </Select>
              <p className="field-row__hint">
                The public marketing site keeps its designed light theme; this affects your workspace.
              </p>
            </div>

            <div className="field-row">
              <span className="field-row__label">Language</span>
              <Select
                value={appearance.language}
                onValueChange={(value) => setAppearance((current) => ({ ...current, language: value }))}
              >
                <SelectTrigger className="w-[220px]" aria-label="Language">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {LANGUAGES.map((language) => (
                    <SelectItem key={language.value} value={language.value}>
                      {language.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="field-row__hint">
                <Globe size={12} /> Sets the document language for accessibility and translation tools.
              </p>
            </div>

            <div className="form-actions">
              <Button type="button" onClick={persistAppearance} disabled={savingAppearance}>
                {savingAppearance ? <Loader2 className="animate-spin" /> : <Save />}
                {savingAppearance ? "Saving…" : "Save appearance"}
              </Button>
            </div>
          </div>
        </TabsContent>
      </Tabs>

      <ConfirmDialog
        open={sessionsOpen}
        onOpenChange={setSessionsOpen}
        title="Sign out of all devices?"
        description="Every active session, including this one, will be signed out immediately. You will need to sign in again."
        confirmLabel="Sign out everywhere"
        destructive
        pending={signingOutAll}
        onConfirm={signOutEverywhere}
      />
    </AppShell>
  );
}
