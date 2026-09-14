import { useEffect, useState } from "react";
import { ArrowLeft, ArrowRight, Loader2, LogOut, ShieldCheck } from "lucide-react";
import type { User } from "@supabase/supabase-js";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/contexts/AuthContext";

export default function Account() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const { signOut: contextSignOut } = useAuth();

  useEffect(() => {
    if (!supabase) {
      setError("Authentication is not configured yet.");
      setLoading(false);
      return;
    }
    let active = true;
    supabase.auth.getUser().then(({ data, error: userError }) => {
      if (!active) return;
      if (userError) setError(userError.message);
      setUser(data.user);
      setLoading(false);
    });
    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      if (active) setUser(session?.user ?? null);
    });
    return () => { active = false; listener.subscription.unsubscribe(); };
  }, []);

  if (loading) {
    return <main className="auth-page auth-page--center"><Loader2 size={24} className="spin" /><span>Checking your session…</span></main>;
  }

  if (!user) {
    return <main className="auth-page auth-page--center"><div className="account-empty"><ShieldCheck size={24} /><h1>Sign in to continue.</h1><p>{error || "Your account area is private and only available after sign-in."}</p><a className="auth-submit" href="/auth">Go to sign in <ArrowRight size={16} /></a><a className="back-link" href="/">Back to the homepage</a></div></main>;
  }

  const signOut = async () => {
    await supabase?.auth.signOut();
    await contextSignOut();
    window.location.href = "/";
  };

  return (
    <main className="auth-page">
      <div className="auth-gridline" aria-hidden="true" />
      <div className="account-wrap">
        <header className="account-header"><a href="/" className="auth-back"><ArrowLeft size={15} /> Back to Aegis</a><button className="account-signout" type="button" onClick={signOut}><LogOut size={15} /> Sign out</button></header>
        <section className="account-hero"><span className="mono">PRIVATE WORKSPACE / 001</span><h1>Your Aegis account.</h1><p>Authentication is live. Your learning progress and project workspace features can be added here without changing the public site.</p></section>
        <section className="account-grid"><div className="account-panel"><span className="mono">ACCOUNT</span><h2>{user.email}</h2><p>Signed in with email/password. Session persistence is handled by Supabase Auth.</p></div><div className="account-panel account-panel--muted"><span className="mono">NEXT MODULE</span><h2>Learning progress</h2><p>Ready for the next phase: storing completed lessons against your account.</p><a href="/learn">Continue learning <ArrowRight size={15} /></a></div></section>
      </div>
    </main>
  );
}
