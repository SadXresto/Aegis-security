import { FormEvent, useEffect, useState } from "react";
import { ArrowLeft, ArrowRight, CheckCircle2, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import { friendlyAuthError } from "@/lib/authErrors";

/**
 * /reset-password — the page Supabase's recovery link lands on. The recovery
 * link grants a temporary session (PASSWORD_RECOVERY event); once present the
 * user chooses a new password via updateUser.
 */
export default function ResetPassword() {
  const { refresh } = useAuth();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [ready, setReady] = useState(false);
  const [updated, setUpdated] = useState(false);
  const [pending, setPending] = useState(false);

  useEffect(() => {
    document.title = "Choose a new password | Aegis Secure";
  }, []);

  useEffect(() => {
    let active = true;
    let listener: { subscription: { unsubscribe: () => void } } | null = null;
    let retries = 0;

    const attach = async () => {
      const { supabase } = await import("@/lib/supabase");
      if (!supabase) {
        if (active && retries++ < 5) window.setTimeout(attach, 200);
        return null;
      }
      // A recovery link may still be exchanging the code for a session.
      const { data: listenerRef } = supabase.auth.onAuthStateChange((event) => {
        if (active && event === "PASSWORD_RECOVERY") setReady(true);
      });
      const { data } = await supabase.auth.getSession();
      if (active && data.session) setReady(true);
      return listenerRef;
    };

    attach().then((l) => {
      if (l) listener = l;
    });

    return () => {
      active = false;
      listener?.subscription.unsubscribe();
    };
  }, []);

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (pending) return;
    if (password !== confirm) {
      toast.error("Passwords don't match. Please try again.");
      return;
    }
    setPending(true);
    try {
      const { supabase } = await import("@/lib/supabase");
      if (!supabase) throw new Error("Supabase is not configured");
      const { error: updateError } = await supabase.auth.updateUser({ password });
      if (updateError) throw updateError;
      setUpdated(true);
      toast.success("Your password has been updated.");
      await refresh();
    } catch (caught) {
      toast.error(friendlyAuthError(caught));
    } finally {
      setPending(false);
    }
  };

  return (
    <main className="auth-page">
      <div className="auth-gridline" aria-hidden="true" />
      <div className="auth-wrap">
        <a href="/" className="auth-back"><ArrowLeft size={15} /> Back to Aegis</a>
        <div className="auth-card">
          <div className="auth-card__intro">
            <div className="brand-lockup"><span className="brand-mark" aria-hidden="true"><i /><i /><i /></span><span>Aegis.</span></div>
            <span className="mono">ACCOUNT / NEW PASSWORD</span>
            <h1>Choose a new password.</h1>
            <p>Pick something strong and unique. You'll use it next time you sign in.</p>
          </div>
          <div className="auth-card__body">
            {updated ? (
              <p className="auth-feedback auth-feedback--success" role="status">
                <CheckCircle2 size={15} />
                Your password has been updated. You can now sign in with it.
              </p>
            ) : !ready ? (
              <p className="auth-feedback" role="status">
                Verifying your reset link… If this page stays stuck, request a new link from the{" "}
                <button type="button" onClick={() => { window.location.href = "/forgot-password"; }} className="back-link" style={{ border: 0, background: "transparent", cursor: "pointer" }}>
                  forgot-password page
                </button>.
              </p>
            ) : (
              <form onSubmit={submit} className="auth-form">
                <label htmlFor="new-password">New password</label>
                <input
                  id="new-password"
                  type="password"
                  autoComplete="new-password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  required
                  minLength={6}
                  placeholder="At least 6 characters"
                />
                <label htmlFor="confirm-password">Confirm new password</label>
                <input
                  id="confirm-password"
                  type="password"
                  autoComplete="new-password"
                  value={confirm}
                  onChange={(event) => setConfirm(event.target.value)}
                  required
                  minLength={6}
                  placeholder="Repeat your new password"
                />
                <button className="auth-submit" type="submit" disabled={pending}>
                  {pending ? <Loader2 size={16} className="spin" /> : <ArrowRight size={16} />}
                  {pending ? "Updating…" : "Update password"}
                </button>
              </form>
            )}
            <div className="auth-switches">
              <button type="button" onClick={() => { window.location.href = "/auth"; }}>
                Back to sign in <ArrowRight size={14} />
              </button>
            </div>
          </div>
        </div>
        <p className="auth-footnote">Your account is separate from the public learning content. Never use Aegis to test systems without explicit permission.</p>
      </div>
    </main>
  );
}
