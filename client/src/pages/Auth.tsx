import { FormEvent, useEffect, useState } from "react";
import { ArrowLeft, ArrowRight, CheckCircle2, Loader2, ShieldCheck } from "lucide-react";
import { supabase } from "@/lib/supabase";

export default function Auth() {
  const [mode, setMode] = useState<"signin" | "signup" | "reset" | "update">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);
  const [recoveryReady, setRecoveryReady] = useState(false);

  useEffect(() => {
    document.title = mode === "update" ? "Choose a new password | Aegis Secure" : "Sign in | Aegis Secure";
    if (!supabase) return;
    const { data: listener } = supabase.auth.onAuthStateChange((event) => {
      if (event === "PASSWORD_RECOVERY") {
        setRecoveryReady(true);
        setMode("update");
      }
    });
    return () => listener.subscription.unsubscribe();
  }, [mode]);

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");
    setMessage("");
    setPending(true);
    try {
      if (!supabase) throw new Error("Authentication is not configured yet.");
      if (mode === "update") {
        if (!recoveryReady) throw new Error("This reset link is no longer active. Request a new one.");
        const { error: updateError } = await supabase.auth.updateUser({ password });
        if (updateError) throw updateError;
        setMessage("Your password has been updated. You can now sign in again.");
        setPassword("");
        setRecoveryReady(false);
        setMode("signin");
      } else if (mode === "reset") {
        const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, {
          redirectTo: `${window.location.origin}/auth`,
        });
        if (resetError) throw resetError;
        setMessage("If an account exists for that email, a reset link is on its way.");
      } else if (mode === "signup") {
        const { error: signUpError } = await supabase.auth.signUp({ email, password });
        if (signUpError) throw signUpError;
        setMessage("Check your inbox to confirm your email, then return here to sign in.");
      } else {
        const { error: signInError } = await supabase.auth.signInWithPassword({ email, password });
        if (signInError) throw signInError;
        window.location.href = "/account";
      }
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Something went wrong. Please try again.");
    } finally {
      setPending(false);
    }
  };

  const title = mode === "signup" ? "Create your account." : mode === "reset" ? "Reset your password." : mode === "update" ? "Choose a new password." : "Welcome back.";
  const action = mode === "signup" ? "Create account" : mode === "reset" ? "Send reset link" : mode === "update" ? "Update password" : "Sign in";

  return (
    <main className="auth-page">
      <div className="auth-gridline" aria-hidden="true" />
      <div className="auth-wrap">
        <a href="/" className="auth-back"><ArrowLeft size={15} /> Back to Aegis</a>
        <div className="auth-card">
          <div className="auth-card__intro">
            <div className="brand-lockup"><span className="brand-mark" aria-hidden="true"><i /><i /><i /></span><span>Aegis.</span></div>
            <span className="mono">ACCOUNT / {mode.toUpperCase()}</span>
            <h1>{title}</h1>
            <p>Keep your learning progress and future workspaces in one calm, private place.</p>
          </div>
          <div className="auth-card__body">
            <div className="auth-assurance"><ShieldCheck size={17} /><span>Built for education, authorized testing, and defensive security.</span></div>
            <form onSubmit={submit} className="auth-form">
              {mode !== "update" && <><label htmlFor="auth-email">Email address</label><input id="auth-email" type="email" autoComplete="email" value={email} onChange={(event) => setEmail(event.target.value)} required placeholder="you@example.com" /></>}
              {mode !== "reset" && <><label htmlFor="auth-password">{mode === "update" ? "New password" : "Password"}</label><input id="auth-password" type="password" autoComplete={mode === "signup" ? "new-password" : "current-password"} value={password} onChange={(event) => setPassword(event.target.value)} required minLength={6} placeholder="At least 6 characters" /></>}
              {error && <p className="auth-feedback auth-feedback--error" role="alert">{error}</p>}
              {message && <p className="auth-feedback auth-feedback--success" role="status"><CheckCircle2 size={15} />{message}</p>}
              <button className="auth-submit" type="submit" disabled={pending}>{pending ? <Loader2 size={16} className="spin" /> : <ArrowRight size={16} />}{pending ? "Working…" : action}</button>
            </form>
            <div className="auth-switches">
              {mode === "signin" && <><button type="button" onClick={() => setMode("reset")}>Forgot password?</button><button type="button" onClick={() => setMode("signup")}>Create an account <ArrowRight size={14} /></button></>}
              {mode === "signup" && <button type="button" onClick={() => setMode("signin")}>Already have an account? Sign in <ArrowRight size={14} /></button>}
              {(mode === "reset" || mode === "update") && <button type="button" onClick={() => { setRecoveryReady(false); setMode("signin"); }}>Back to sign in <ArrowRight size={14} /></button>}
            </div>
          </div>
        </div>
        <p className="auth-footnote">Your account is separate from the public learning content. Never use Aegis to test systems without explicit permission.</p>
      </div>
    </main>
  );
}
