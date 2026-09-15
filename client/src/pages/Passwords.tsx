import { useEffect, useMemo, useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import {
  CircleAlert,
  Copy,
  Eye,
  EyeOff,
  KeyRound,
  Loader2,
  Pencil,
  Plus,
  RefreshCw,
  Search,
  Trash2,
} from "lucide-react";
import { toast } from "sonner";
import AppShell from "@/components/AppShell";
import ConfirmDialog from "@/components/ConfirmDialog";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useTableData } from "@/hooks/useTableData";
import { requireSupabase } from "@/lib/supabase";
import { decryptSecret, encryptSecret, getVaultKey } from "@/lib/vaultCrypto";
import {
  formatRelative,
  friendlyDataError,
  passwordStrength,
  type VaultRow,
} from "@/lib/aegis";

const STRENGTH_LABEL: Record<string, string> = {
  weak: "Weak",
  fair: "Fair",
  good: "Good",
  strong: "Strong",
};

const vaultSchema = z.object({
  site: z.string().trim().min(1, "Add the site or service name."),
  username: z.string().trim().max(160, "That username is too long."),
  password: z.string().max(200, "That password is too long."),
});

type VaultFormValues = z.infer<typeof vaultSchema>;

function StrengthMeter({ password }: { password: string }) {
  const { level, label } = passwordStrength(password);
  return (
    <div className="strength" data-level={level}>
      <div className="strength__bars" aria-hidden="true">
        <i />
        <i />
        <i />
        <i />
      </div>
      <div className="strength__label">
        <span>Password strength</span>
        <span>{password ? label : "Add a password"}</span>
      </div>
    </div>
  );
}

export default function Passwords() {
  const vault = useTableData<VaultRow>("vault_items", "updated_at");
  const [search, setSearch] = useState("");
  const [vaultKey, setVaultKey] = useState<CryptoKey | null>(null);
  const [keyError, setKeyError] = useState<string | null>(null);
  const [revealed, setRevealed] = useState<Record<string, string | null>>({});
  const [editing, setEditing] = useState<VaultRow | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [pendingDelete, setPendingDelete] = useState<VaultRow | null>(null);
  const [deleting, setDeleting] = useState(false);

  const form = useForm<VaultFormValues>({
    resolver: zodResolver(vaultSchema),
    defaultValues: { site: "", username: "", password: "" },
  });
  const draftPassword = form.watch("password");

  // Unlock (or mint) the per-user vault key once, in the browser.
  useEffect(() => {
    let active = true;
    void (async () => {
      try {
        const client = requireSupabase();
        const { data } = await client.auth.getUser();
        if (!data.user) throw new Error("Your session has expired. Please sign in again.");
        const key = await getVaultKey(client, data.user);
        if (active) setVaultKey(key);
      } catch (caught) {
        if (active) {
          setKeyError(
            caught instanceof Error ? caught.message : "The vault could not be unlocked in this browser."
          );
        }
      }
    })();
    return () => {
      active = false;
    };
  }, []);

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return vault.rows;
    return vault.rows.filter(
      (item) =>
        item.site.toLowerCase().includes(term) ||
        (item.username ?? "").toLowerCase().includes(term)
    );
  }, [vault.rows, search]);

  const openCreate = () => {
    setEditing(null);
    form.reset({ site: "", username: "", password: "" });
    setModalOpen(true);
  };

  const openEdit = (row: VaultRow) => {
    setEditing(row);
    form.reset({ site: row.site, username: row.username ?? "", password: "" });
    setModalOpen(true);
  };

  const toggleReveal = async (row: VaultRow) => {
    if (Object.prototype.hasOwnProperty.call(revealed, row.id)) {
      setRevealed((current) => {
        const next = { ...current };
        delete next[row.id];
        return next;
      });
      return;
    }
    if (!vaultKey) {
      toast.error(keyError ?? "The vault is still unlocking. Try again in a moment.");
      return;
    }
    const plain = await decryptSecret(vaultKey, row.password_encrypted);
    setRevealed((current) => ({ ...current, [row.id]: plain }));
    if (plain === null) {
      toast.error("This entry couldn't be decrypted. It may have been saved on another device.");
    }
  };

  const copyPassword = async (row: VaultRow) => {
    const plain = revealed[row.id] ?? (vaultKey ? await decryptSecret(vaultKey, row.password_encrypted) : null);
    if (!plain) {
      toast.error("Reveal the password first, then copy it.");
      return;
    }
    try {
      await navigator.clipboard.writeText(plain);
      toast.success("Password copied to clipboard.");
    } catch {
      toast.error("This browser blocked clipboard access.");
    }
  };

  const onSubmit = form.handleSubmit(async (values) => {
    if (!vaultKey) {
      toast.error(keyError ?? "The vault is still unlocking. Try again in a moment.");
      return;
    }
    setSaving(true);
    try {
      const client = requireSupabase();
      const { data: auth } = await client.auth.getUser();
      if (!auth.user) throw new Error("Your session has expired. Please sign in again.");

      let passwordEncrypted = editing?.password_encrypted ?? null;
      let strength = editing?.strength ?? "weak";

      if (values.password) {
        passwordEncrypted = await encryptSecret(vaultKey, values.password);
        strength = passwordStrength(values.password).stored;
      }

      if (!passwordEncrypted) {
        form.setError("password", { message: "Add the password you want to store." });
        return;
      }

      const payload = {
        site: values.site.trim(),
        username: values.username.trim() || null,
        password_encrypted: passwordEncrypted,
        strength,
        updated_at: new Date().toISOString(),
      };

      if (editing) {
        const { error } = await client.from("vault_items").update(payload).eq("id", editing.id);
        if (error) throw error;
        setRevealed((current) => {
          const next = { ...current };
          delete next[editing.id];
          return next;
        });
      } else {
        const { error } = await client
          .from("vault_items")
          .insert({ user_id: auth.user.id, ...payload });
        if (error) throw error;
      }

      await vault.refresh();
      setModalOpen(false);
      setEditing(null);
      form.reset({ site: "", username: "", password: "" });
      toast.success(editing ? "Vault entry updated." : "Password saved to your vault.");
    } catch (caught) {
      if (caught instanceof Error && caught.message.startsWith("Your session")) {
        toast.error(caught.message);
      } else {
        toast.error(friendlyDataError(caught, "vault_items"));
      }
    } finally {
      setSaving(false);
    }
  });

  const deleteItem = async () => {
    if (!pendingDelete || deleting) return;
    setDeleting(true);
    try {
      const { error } = await requireSupabase().from("vault_items").delete().eq("id", pendingDelete.id);
      if (error) throw error;
      await vault.refresh();
      setPendingDelete(null);
      toast.success("Vault entry deleted.");
    } catch (caught) {
      toast.error(friendlyDataError(caught, "vault_items"));
    } finally {
      setDeleting(false);
    }
  };

  return (
    <AppShell current="/passwords">
      <div className="app-page-head">
        <div>
          <span className="kicker">
            <KeyRound size={13} /> Workspace / Vault
          </span>
          <h1>Password Vault</h1>
          <p>
            Credentials are encrypted in your browser with AES-256-GCM before they are stored. Only
            the ciphertext reaches the database.
          </p>
        </div>
        <div className="app-page-head__actions">
          <Button variant="outline" type="button" onClick={() => void vault.refresh()} disabled={vault.loading}>
            {vault.loading ? <Loader2 className="animate-spin" /> : <RefreshCw />}
            Refresh
          </Button>
          <Button type="button" onClick={openCreate} disabled={!vaultKey}>
            <Plus />
            Add password
          </Button>
        </div>
      </div>

      {keyError && (
        <div className="panel" style={{ marginBottom: 13 }}>
          <div className="panel__body empty-state empty-state--error" style={{ padding: "24px 22px" }}>
            <CircleAlert size={20} />
            <h3>The vault couldn&apos;t be unlocked</h3>
            <p>{keyError}</p>
          </div>
        </div>
      )}

      <div className="app-toolbar">
        <label className="search-field">
          <Search size={15} aria-hidden="true" />
          <span className="sr-only">Search vault</span>
          <input
            type="search"
            placeholder="Search by site or username"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
          />
        </label>
        <span className="kicker">
          {filtered.length} of {vault.rows.length} entries
        </span>
      </div>

      <section className="panel">
        <div className="panel__head">
          <h2 className="panel__title">
            <KeyRound size={16} /> Stored credentials
          </h2>
          <span className="kicker">AES-256-GCM / v1</span>
        </div>
        <div className="panel__body panel__body--flush">
          {vault.loading ? (
            <div className="empty-state">
              <Loader2 size={20} className="spin" />
              <p>Loading your vault…</p>
            </div>
          ) : vault.error ? (
            <div className="empty-state empty-state--error">
              <CircleAlert size={22} />
              <h3>We couldn&apos;t load your vault</h3>
              <p>{vault.error}</p>
              <button className="button button--outline-dark button--small" type="button" onClick={() => void vault.refresh()}>
                <RefreshCw size={14} /> Try again
              </button>
            </div>
          ) : filtered.length === 0 ? (
            <div className="empty-state">
              <KeyRound size={22} />
              <h3>{vault.rows.length === 0 ? "Your vault is empty" : "No matching entries"}</h3>
              <p>
                {vault.rows.length === 0
                  ? "Add your first password and it will be encrypted before it leaves this browser."
                  : "Try a different search term."}
              </p>
              {vault.rows.length === 0 ? (
                <Button type="button" onClick={openCreate} disabled={!vaultKey}>
                  <Plus /> Add password
                </Button>
              ) : null}
            </div>
          ) : (
            <div className="vault-list">
              {filtered.map((item) => {
                const isRevealed = Object.prototype.hasOwnProperty.call(revealed, item.id);
                return (
                  <div className="vault-item" key={item.id}>
                    <span className="vault-item__site">
                      <strong>{item.site}</strong>
                      <span>{item.username || "No username stored"}</span>
                    </span>
                    <span className="vault-item__password">
                      {isRevealed ? (revealed[item.id] ?? "unavailable") : "••••••••••••"}
                    </span>
                    <span>
                      <span className="sev sev--low">{STRENGTH_LABEL[item.strength] ?? item.strength}</span>
                      <span className="kicker" style={{ display: "block", marginTop: 6 }}>
                        {formatRelative(item.updated_at)}
                      </span>
                    </span>
                    <span className="vault-item__actions">
                      <button
                        className="icon-button"
                        type="button"
                        aria-label={isRevealed ? `Hide password for ${item.site}` : `Reveal password for ${item.site}`}
                        onClick={() => void toggleReveal(item)}
                      >
                        {isRevealed ? <EyeOff size={15} /> : <Eye size={15} />}
                      </button>
                      <button
                        className="icon-button"
                        type="button"
                        aria-label={`Copy password for ${item.site}`}
                        onClick={() => void copyPassword(item)}
                      >
                        <Copy size={15} />
                      </button>
                      <button
                        className="icon-button"
                        type="button"
                        aria-label={`Edit ${item.site}`}
                        onClick={() => openEdit(item)}
                      >
                        <Pencil size={15} />
                      </button>
                      <button
                        className="icon-button icon-button--danger"
                        type="button"
                        aria-label={`Delete ${item.site}`}
                        onClick={() => setPendingDelete(item)}
                      >
                        <Trash2 size={15} />
                      </button>
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </section>

      <Dialog
        open={modalOpen}
        onOpenChange={(open) => {
          if (!saving) {
            setModalOpen(open);
            if (!open) setEditing(null);
          }
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editing ? "Edit vault entry" : "Add a password"}</DialogTitle>
            <DialogDescription>
              {editing
                ? "Leave the password field empty to keep the password that is already stored."
                : "The password is encrypted in this browser before it is saved."}
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={onSubmit} style={{ display: "grid", gap: 15 }}>
            <div className="field">
              <Label htmlFor="vault-site">Site or service</Label>
              <Input id="vault-site" placeholder="example.com" autoComplete="off" {...form.register("site")} />
              {form.formState.errors.site && (
                <p className="field-row__hint" style={{ color: "#a4503a" }}>
                  {form.formState.errors.site.message}
                </p>
              )}
            </div>

            <div className="field">
              <Label htmlFor="vault-username">Username or email</Label>
              <Input id="vault-username" placeholder="you@example.com" autoComplete="off" {...form.register("username")} />
              {form.formState.errors.username && (
                <p className="field-row__hint" style={{ color: "#a4503a" }}>
                  {form.formState.errors.username.message}
                </p>
              )}
            </div>

            <div className="field">
              <Label htmlFor="vault-password">Password</Label>
              <Input
                id="vault-password"
                type="password"
                placeholder={editing ? "Leave blank to keep current" : "Enter the password"}
                autoComplete="new-password"
                {...form.register("password")}
              />
              {form.formState.errors.password && (
                <p className="field-row__hint" style={{ color: "#a4503a" }}>
                  {form.formState.errors.password.message}
                </p>
              )}
              <StrengthMeter password={draftPassword ?? ""} />
            </div>

            <DialogFooter>
              <Button
                variant="outline"
                type="button"
                onClick={() => setModalOpen(false)}
                disabled={saving}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={saving || !vaultKey}>
                {saving ? <Loader2 className="animate-spin" /> : <KeyRound />}
                {saving ? "Saving…" : editing ? "Save changes" : "Save password"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={pendingDelete !== null}
        onOpenChange={(open) => {
          if (!open) setPendingDelete(null);
        }}
        title="Delete this vault entry?"
        description={
          pendingDelete
            ? `“${pendingDelete.site}” will be permanently removed from your vault. This cannot be undone.`
            : ""
        }
        confirmLabel="Delete entry"
        destructive
        pending={deleting}
        onConfirm={deleteItem}
      />
    </AppShell>
  );
}
