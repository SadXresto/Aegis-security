import { FormEvent, useEffect, useState } from "react";
import { ArrowLeft, ArrowRight, CheckCircle2, Loader2, Mail } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import { friendlyAuthError } from "@/lib/authErrors";

/**
 * /verify-email — tells the user to confirm their address and offers a resend
 * button (Supabase auth.resend type=signup). The email is remembered from the
 * signup form via sessionStorage.
 */
export default function VerifyEmail() {
  const { resendConfirmation } = useAuth();
  const [email, setEmail] = useState("");
  const [resent, setResent] = useState(false);
  const [pending, setPending] = useState(false);

  useEffect(() => {
    document.title = "Verify your email | Aegis Secure";
    try {
      setEmail(sessionStorage.getItem("aegis.pendingEmail") || "");
    } catch {
      /* ignore */
    }
  }, []);

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (pending || !email) {
      if (!email) toast.error("Enter the email address you signed up with first.");
      return;
    }
    setPending(true);
    try {
      await resendConfirmation(email);
      setResent(true);
      toast.success("Confirmation email sent. Check your inbox.");
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
            <span className="mono">ACCOUNT / VERIFY</span>
            <h1>Check your inbox.</h1>
            <p>We sent a confirmation link to your email address. Click it to activate your account, then sign in.</p>
          </div>
          <div className="auth-card__body">
            <div className="auth-assurance"><Mail size={17} /><span>Confirmation link sent{email ? <> to <strong>{email}</strong></> : null}. It may take a minute to arrive — remember to check your spam folder.</span></div>
            {resent && (
              <p className="auth-feedback auth-feedback--success" role="status">
                <CheckCircle2 size={15} />
                A fresh confirmation email is on its way.
              </p>
            )}
            <form onSubmit={submit} className="auth-form">
              <label htmlFor="verify-email">Email address</label>
              <input
                id="verify-email"
                type="email"
                autoComplete="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                required
                placeholder="you@example.com"
              />
              <button className="auth-submit" type="submit" disabled={pending}>
                {pending ? <Loader2 size={16} className="spin" /> : <ArrowRight size={16} />}
                {pending ? "Sending…" : "Resend confirmation email"}
              </button>
            </form>
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
