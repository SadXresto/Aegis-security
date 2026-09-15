// Aegis workspace shell — reuses the existing Signal & Shield design tokens.
import { ReactNode, useState } from "react";
import {
  BookOpen,
  ChevronDown,
  KeyRound,
  LayoutDashboard,
  Loader2,
  LogOut,
  Radar,
  Settings,
  ShieldCheck,
  UserRound,
} from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import { friendlyAuthError } from "@/lib/authErrors";
import { getDisplayName, getEmail, getInitials } from "@/lib/aegis";

const PRIMARY_NAV = [
  { path: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { path: "/reports", label: "Reports", icon: BookOpen },
  { path: "/threats", label: "Threats", icon: Radar },
  { path: "/passwords", label: "Passwords", icon: KeyRound },
  { path: "/settings", label: "Settings", icon: Settings },
];

const SECONDARY_NAV = [{ path: "/account", label: "Account", icon: UserRound }];

export default function AppShell({
  current,
  children,
}: {
  current: string;
  children: ReactNode;
}) {
  const { user, signOut } = useAuth();
  const [signingOut, setSigningOut] = useState(false);

  const active =
    PRIMARY_NAV.find((item) => item.path === current) ??
    SECONDARY_NAV.find((item) => item.path === current);
  const sectionLabel = active?.label ?? "Workspace";
  const displayName = getDisplayName(user);
  const email = getEmail(user);

  const handleSignOut = async () => {
    if (signingOut) return;
    setSigningOut(true);
    try {
      await signOut();
      window.location.href = "/";
    } catch (caught) {
      setSigningOut(false);
      toast.error(friendlyAuthError(caught));
    }
  };

  return (
    <div className="app-shell">
      <aside className="app-sidebar">
        <a className="app-sidebar__brand" href="/" aria-label="Aegis Security home">
          <img src="/manus-storage/aegis-mark_bcb7af3d.png" alt="" aria-hidden="true" />
          <span className="brand__wordmark">
            <span className="brand__a">A</span>egis<span className="brand__dot">.</span>
          </span>
        </a>

        <div className="app-sidebar__workspace">
          <span className="workspace-dot" />
          Personal workspace
          <ChevronDown size={13} />
        </div>

        <nav className="app-nav" aria-label="Workspace navigation">
          {PRIMARY_NAV.map((item) => {
            const isActive = item.path === current;
            return (
              <a key={item.path} href={item.path} className={isActive ? "is-active" : ""} aria-current={isActive ? "page" : undefined}>
                <item.icon size={16} />
                <span>{item.label}</span>
              </a>
            );
          })}
          <span className="app-nav__label">Your account</span>
          {SECONDARY_NAV.map((item) => {
            const isActive = item.path === current;
            return (
              <a key={item.path} href={item.path} className={isActive ? "is-active" : ""} aria-current={isActive ? "page" : undefined}>
                <item.icon size={16} />
                <span>{item.label}</span>
              </a>
            );
          })}
        </nav>

        <div className="app-sidebar__foot">
          <div className="app-user">
            <span className="app-user__avatar" aria-hidden="true">
              {getInitials(user) || "—"}
            </span>
            <span className="app-user__meta">
              <strong>{displayName}</strong>
              <span>{email || "Signed in"}</span>
            </span>
          </div>
          <button className="app-signout" type="button" onClick={handleSignOut} disabled={signingOut}>
            {signingOut ? <Loader2 size={14} className="spin" /> : <LogOut size={14} />}
            {signingOut ? "Signing out…" : "Sign out"}
          </button>
        </div>
      </aside>

      <div className="app-main">
        <header className="app-topbar">
          <span className="app-topbar__path">
            <i aria-hidden="true" />
            aegis / {sectionLabel}
          </span>
          <div className="app-topbar__actions">
            <a className="button button--outline-dark button--small" href="/learn">
              Learning library
            </a>
            <a className="button button--outline-dark button--small" href="/">
              <ShieldCheck size={15} /> Public site
            </a>
          </div>
        </header>
        <main className="app-content">{children}</main>
      </div>
    </div>
  );
}
