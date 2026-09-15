import { useEffect, useState } from "react";
import {
  BadgeCheck,
  CalendarDays,
  Check,
  CircleAlert,
  KeyRound,
  Loader2,
  Mail,
  Pencil,
  ShieldCheck,
  Trash2,
  UserRound,
  X,
} from "lucide-react";
import { toast } from "sonner";
import AppShell from "@/components/AppShell";
import ConfirmDialog from "@/components/ConfirmDialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/contexts/AuthContext";
import { requireSupabase } from "@/lib/supabase";
import { friendlyAuthError } from "@/lib/authErrors";
import {
  formatDate,
  getDisplayName,
  getEmail,
  getInitials,
  getMetadata,
  isEmailVerified,
} from "@/lib/aegis";

type ProfileRow = { role?: string; full_name?: string | null; created_at?: string | null };

export default function Account() {
  const { user, refresh, signOut } = useAuth();
  const metadata = getMetadata(user);
  const email = getEmail(user);
  const displayName = getDisplayName(user);

  const [role, setRole] = useState<string>(
    typeof metadata.role === "string" ? metadata.role : "user"
  );
  const [memberSince, setMemberSince] = useState<string | null>(
    typeof metadata.created_at === "string" ? metadata.created_at : null
  );

  const [editing, setEditing] = useState(false);
  const [draftName, setDraftName] = useState("");
  const [savingName, setSavingName] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [sendingVerification, setSendingVerification] = useState(false);

  const verified = isEmailVerified(user);
  const initialName = typeof metadata.full_name === "string" ? metadata.full_name : "";

  useEffect(() => {
    setDraftName(initialName);
  }, [initialName]);

  // Read the profile row (RLS limits this to the signed-in user).
  useEffect(() => {
    let active = true;
    void (async () => {
      try {
        const client = requireSupabase();
        const { data: auth } = await client.auth.getUser();
        if (!auth.user) return;
        const { data } = await client
          .from("users")
          .select("role, full_name, created_at")
          .eq("id", auth.user.id)
          .maybeSingle();
        const row = data as ProfileRow | null;
        if (!active || !row) return;
        if (typeof row.role === "string") setRole(row.role);
        if (row.created_at) setMemberSince(row.created_at);
        if (typeof row.full_name === "string" && row.full_name && !initialName) {
          setDraftName(row.full_name);
        }
      } catch {
        /* The profile row is optional — auth metadata is the fallback. */
      }
    })();
    return () => {
      active = false;
    };
  }, [initialName]);

  const saveName = async () => {
    const next = draftName.trim();
    if (next.length < 2) {
      toast.error("Please use at least 2 characters for your name.");
      return;
    }
    setSavingName(true);
    try {
      const { error } = await requireSupabase().auth.updateUser({ data: { full_name: next } });
      if (error) throw error;
      await refresh();
      setEditing(false);
      toast.success("Name updated.");
    } catch (caught) {
      toast.error(friendlyAuthError(caught));
    } finally {
      setSavingName(false);
    }
  };

  const resendVerification = async () => {
    const target = email;
    if (!target) {
      toast.error("We need an email address to resend the confirmation.");
      return;
    }
    setSendingVerification(true);
    try {
      const { error } = await requireSupabase().auth.resend({ type: "signup", email: target });
      if (error) throw error;
      toast.success("Confirmation email sent. Check your inbox.");
    } catch (caught) {
      toast.error(friendlyAuthError(caught));
    } finally {
      setSendingVerification(false);
    }
  };

  const deleteAccount = async () => {
    if (deleting) return;
    setDeleting(true);
    try {
      const client = requireSupabase();
      const { error } = await client.rpc("delete_own_account");
      if (error) throw error;
      try {
        await signOut();
      } catch {
        /* the account is already gone — just leave the session behind */
      }
      toast.success("Your account has been deleted.");
      window.location.href = "/";
    } catch (caught) {
      setDeleting(false);
      setDeleteOpen(false);
      toast.error(friendlyAuthError(caught));
    }
  };

  return (
    <AppShell current="/account">
      <div className="app-page-head">
        <div>
          <span className="kicker">
            <UserRound size={13} /> Workspace / Account
          </span>
          <h1>Your Aegis account.</h1>
          <p>Identity, role, and the controls that affect access to your workspace.</p>
        </div>
      </div>

      <div className="panel-grid panel-grid--main">
        <section className="panel">
          <div className="panel__head">
            <h2 className="panel__title">
              <UserRound size={16} /> Profile
            </h2>
            <span className="badge-note">
              <ShieldCheck size={12} /> {role}
            </span>
          </div>
          <div className="panel__body">
            <div style={{ display: "flex", alignItems: "center", gap: 18, flexWrap: "wrap" }}>
              <span className="avatar-badge" aria-hidden="true">
                {getInitials(user) || "—"}
              </span>
              <div style={{ display: "grid", gap: 6 }}>
                <strong style={{ fontFamily: "var(--display)", fontSize: 20, letterSpacing: "-.04em" }}>
                  {displayName}
                </strong>
                <span className="kicker">
                  <Mail size={12} /> {email || "No email on file"}
                </span>
                {verified ? (
                  <span className="badge-note">
                    <BadgeCheck size={12} /> Email verified
                  </span>
                ) : (
                  <span className="badge-note badge-note--warn">
                    <CircleAlert size={12} /> Email not verified
                  </span>
                )}
              </div>
            </div>

            <div style={{ marginTop: 20 }}>
              <div className="field-row">
                <Label htmlFor="account-name">Full name</Label>
                {editing ? (
                  <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                    <Input
                      id="account-name"
                      value={draftName}
                      onChange={(event) => setDraftName(event.target.value)}
                      autoComplete="name"
                      style={{ maxWidth: 320 }}
                    />
                    <Button type="button" onClick={() => void saveName()} disabled={savingName}>
                      {savingName ? <Loader2 className="animate-spin" /> : <Check />}
                      Save
                    </Button>
                    <Button
                      variant="outline"
                      type="button"
                      onClick={() => {
                        setEditing(false);
                        setDraftName(initialName);
                      }}
                      disabled={savingName}
                    >
                      <X />
                      Cancel
                    </Button>
                  </div>
                ) : (
                  <div style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
                    <strong style={{ fontSize: 14 }}>{initialName || "Not set"}</strong>
                    <Button variant="outline" size="sm" type="button" onClick={() => setEditing(true)}>
                      <Pencil />
                      Edit
                    </Button>
                  </div>
                )}
                <p className="field-row__hint">
                  Your name appears in the workspace sidebar and on reports you export.
                </p>
              </div>

              <div className="field-row">
                <span className="field-row__label">Email address</span>
                <strong style={{ fontSize: 14 }}>{email || "—"}</strong>
                {!verified && (
                  <>
                    <p className="field-row__hint">
                      Confirm your address to unlock account recovery and security alerts.
                    </p>
                    <div>
                      <Button
                        variant="outline"
                        size="sm"
                        type="button"
                        onClick={() => void resendVerification()}
                        disabled={sendingVerification}
                      >
                        {sendingVerification ? <Loader2 className="animate-spin" /> : <Mail />}
                        Resend confirmation
                      </Button>
                    </div>
                  </>
                )}
              </div>

              <div className="field-row">
                <span className="field-row__label">Role</span>
                <span className="badge-note">
                  <ShieldCheck size={12} /> {role}
                </span>
              </div>

              <div className="field-row">
                <span className="field-row__label">Member since</span>
                <span className="kicker">
                  <CalendarDays size={12} /> {memberSince ? formatDate(memberSince) : "—"}
                </span>
              </div>
            </div>
          </div>
        </section>

        <section className="panel danger-zone">
          <div className="panel__head">
            <h2 className="panel__title">
              <Trash2 size={16} /> Danger zone
            </h2>
            <span className="kicker">Irreversible</span>
          </div>
          <div className="panel__body">
            <p className="panel__note" style={{ marginTop: 0 }}>
              Deleting your account removes your profile, reports, threat history, and encrypted vault
              entries. This cannot be undone.
            </p>
            <div className="form-actions">
              <Button variant="destructive" type="button" onClick={() => setDeleteOpen(true)}>
                <Trash2 />
                Delete account
              </Button>
            </div>
            <p className="panel__note">
              <KeyRound size={12} /> Prefer to keep your data? Sign out instead from the sidebar.
            </p>
          </div>
        </section>
      </div>

      <ConfirmDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        title="Delete your account?"
        description="This permanently removes your Aegis account and everything stored with it. This action cannot be undone."
        confirmLabel="Delete my account"
        destructive
        pending={deleting}
        onConfirm={deleteAccount}
      />
    </AppShell>
  );
}
