import { FormEvent, useEffect, useState } from "react";
import { ArrowLeft, ArrowRight, CheckCircle2, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import { friendlyAuthError } from "@/lib/authErrors";

/**
 * /forgot-password — request a password-reset email via Supabase
 * resetPasswordForEmail. Reuses the existing Aegis auth-page design system.
 */
export default function ForgotPassword() {
  const { resetPassword } = useAuth();
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [pending, setPending] = useState(false);

  useEffect(() => {
    document.title = "Reset your password | Aegis Secure";
  }, []);

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (pending) return;
    setPending(true);
    try {
      await resetPassword(email);
      setSent(true);
      toast.success("Reset link sent. Check your inbox.");
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
            <span className="mono">ACCOUNT / RESET</span>
            <h1>Forgot your password?</h1>
            <p>Enter your email and we'll send you a secure link to choose a new password.</p>
          </div>
          <div className="auth-card__body">
            {sent ? (
              <p className="auth-feedback auth-feedback--success" role="status">
                <CheckCircle2 size={15} />
                If an account exists for {email}, a reset link is on its way. It may take a minute to arrive.
              </p>
            ) : (
              <form onSubmit={submit} className="auth-form">
                <label htmlFor="forgot-email">Email address</label>
                <input
                  id="forgot-email"
                  type="email"
                  autoComplete="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  required
                  placeholder="you@example.com"
                />
                <button className="auth-submit" type="submit" disabled={pending}>
                  {pending ? <Loader2 size={16} className="spin" /> : <ArrowRight size={16} />}
                  {pending ? "Sending…" : "Send reset link"}
                </button>
              </form>
            )}
            <div className="auth-switches">
              <button type="button" onClick={() => { window.location.href = "/auth"; }}>
                Back to sign in <ArrowRight size={14} />
              </button>
              {sent && (
                <button type="button" onClick={() => setSent(false)}>
                  Use a different email
                </button>
              )}
            </div>
          </div>
        </div>
        <p className="auth-footnote">Your account is separate from the public learning content. Never use Aegis to test systems without explicit permission.</p>
      </div>
    </main>
  );
}
