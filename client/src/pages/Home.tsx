// Signal & Shield reminder: use editorial asymmetry, honest sample labels, restrained signal accents, and calm product language.
import { FormEvent, useState } from "react";
import {
  Activity,
  ArrowRight,
  ArrowUpRight,
  BadgeCheck,
  BookOpen,
  Check,
  ChevronDown,
  CircleAlert,
  CircleCheckBig,
  Code2,
  Eye,
  FileText,
  Gauge,
  GraduationCap,
  Lightbulb,
  LockKeyhole,
  Menu,
  PanelTop,
  Radar,
  ScanSearch,
  Search,
  Shield,
  ShieldCheck,
  Sparkles,
  UserRound,
  Waypoints,
  X,
  Zap,
} from "lucide-react";
import { toast } from "sonner";

type DashboardTab = "overview" | "findings" | "guidance";

const navItems = [
  { label: "Product", href: "#product" },
  { label: "Learn", href: "/learn" },
  { label: "Features", href: "#features" },
  { label: "How it works", href: "#how-it-works" },
  { label: "Pricing", href: "#pricing" },
  { label: "FAQ", href: "#faq" },
];

const features = [
  {
    icon: ScanSearch,
    eyebrow: "01 / Understand",
    title: "Security insights",
    copy: "Turn technical findings into plain-language context you can actually use.",
  },
  {
    icon: Gauge,
    eyebrow: "02 / Prioritize",
    title: "Risk overview",
    copy: "See what needs attention first, without sorting through a wall of alerts.",
  },
  {
    icon: Lightbulb,
    eyebrow: "03 / Improve",
    title: "Guided recommendations",
    copy: "Get practical next steps that meet you where your systems are today.",
  },
  {
    icon: Activity,
    eyebrow: "04 / Monitor",
    title: "Security monitoring",
    copy: "Keep an eye on important indicators as your setup changes over time.",
  },
  {
    icon: FileText,
    eyebrow: "05 / Share",
    title: "Readable reports",
    copy: "Create a clear record of what you checked, what you found, and what changed.",
  },
  {
    icon: GraduationCap,
    eyebrow: "06 / Learn",
    title: "Learning mode",
    copy: "Build security intuition as you work through each issue and recommendation.",
  },
  {
    icon: Code2,
    eyebrow: "07 / Build",
    title: "Developer friendly",
    copy: "Explore useful security context without leaving your technical workflow behind.",
  },
  {
    icon: LockKeyhole,
    eyebrow: "08 / Respect",
    title: "Privacy first",
    copy: "Clear product boundaries and transparent handling of the information you share.",
  },
];

const faqs = [
  {
    question: "Who is Aegis for?",
    answer:
      "Aegis is designed for curious individuals, students, developers, and small teams that want a clearer starting point for improving their digital security.",
  },
  {
    question: "What does the product actually do?",
    answer:
      "It organizes selected security information, explains why a finding matters, and suggests practical next steps. The product is meant to improve understanding and habits, not replace expert judgment.",
  },
  {
    question: "Is it suitable for beginners?",
    answer:
      "Yes. Learning mode and plain-language explanations are core parts of the experience, while deeper context remains available for technical users.",
  },
  {
    question: "Is my data private?",
    answer:
      "Privacy is a product principle, not a claim of absolute protection. The launch version will document what is collected, why it is needed, how long it is kept, and how to remove it.",
  },
  {
    question: "Can developers use Aegis?",
    answer:
      "Yes. Developer-friendly views are designed to add useful context around technical findings without forcing a second, disconnected workflow.",
  },
  {
    question: "Does Aegis replace professional security testing?",
    answer:
      "No. Aegis is an educational and prioritization layer. It does not replace a qualified security assessment, penetration test, incident response plan, or legal advice.",
  },
  {
    question: "How will pricing work?",
    answer:
      "The pricing cards on this page are editable launch placeholders. Final limits and prices will be published before paid plans are offered.",
  },
  {
    question: "How do I get started?",
    answer:
      "Choose Get Started, share an email for the launch list, and we will use that signal to shape early access. No payment is required on this page.",
  },
];

const planFeatures = {
  free: ["1 personal workspace", "Guided security basics", "Sample reports"],
  pro: ["Multiple workspaces", "Advanced findings context", "Exportable reports", "Developer views"],
  business: ["Small-team workspace", "Shared recommendations", "Priority onboarding", "Custom review cadence"],
};

function Logo({ compact = false }: { compact?: boolean }) {
  return (
    <a className={`brand ${compact ? "brand--compact" : ""}`} href="#top" aria-label="Aegis Security home">
      <img src="/manus-storage/aegis-mark_bcb7af3d.png" alt="" aria-hidden="true" />
      {!compact && <span className="brand__wordmark"><span className="brand__a">A</span>egis<span className="brand__dot">.</span></span>}
    </a>
  );
}

function SectionLabel({ number, children }: { number: string; children: string }) {
  return (
    <div className="section-label">
      <span className="section-label__line" aria-hidden="true" />
      <span>{number}</span>
      <span>{children}</span>
    </div>
  );
}

function DashboardPreview() {
  const [tab, setTab] = useState<DashboardTab>("overview");
  const [isScanning, setIsScanning] = useState(false);

  const runScan = () => {
    setIsScanning(true);
    window.setTimeout(() => {
      setIsScanning(false);
      toast.success("Sample scan complete", { description: "No account or device data was connected." });
    }, 850);
  };

  return (
    <div className="dashboard-wrap" aria-label="Sample Aegis dashboard preview">
      <div className="dashboard-glow" aria-hidden="true" />
      <div className="dashboard-window">
        <div className="dashboard-topbar">
          <div className="window-controls" aria-hidden="true">
            <span />
            <span />
            <span />
          </div>
          <span className="mono dashboard-topbar__path">aegis / workspace / sample</span>
          <span className="sample-tag">SAMPLE DATA</span>
        </div>
        <div className="dashboard-body">
          <aside className="dashboard-sidebar">
            <div className="dashboard-sidebar__brand"><ShieldCheck size={16} /><span>Aegis</span></div>
            <div className="dashboard-sidebar__workspace"><span className="workspace-dot" /> Personal workspace <ChevronDown size={13} /></div>
            <div className="dashboard-sidebar__nav">
              <span className="is-active"><PanelTop size={15} /> Overview</span>
              <span><Radar size={15} /> Signals</span>
              <span><BookOpen size={15} /> Learn</span>
            </div>
            <div className="dashboard-sidebar__foot"><span><UserRound size={14} /> Sample user</span><span className="mono">v0.9.4</span></div>
          </aside>
          <div className="dashboard-main">
            <div className="dashboard-heading">
              <div>
                <span className="eyebrow eyebrow--lime">SECURITY OVERVIEW</span>
                <h3>Good morning, Alex<span className="heading-period">.</span></h3>
                <p>Here is the clearest view of your current signals.</p>
              </div>
              <button className="dashboard-scan" type="button" onClick={runScan} disabled={isScanning}>
                <ScanSearch size={14} /> {isScanning ? "Scanning..." : "Run sample scan"}
              </button>
            </div>
            <div className="dashboard-tabs" role="tablist" aria-label="Dashboard preview tabs">
              {(["overview", "findings", "guidance"] as DashboardTab[]).map((item) => (
                <button key={item} type="button" role="tab" aria-selected={tab === item} className={tab === item ? "is-selected" : ""} onClick={() => setTab(item)}>
                  {item === "overview" ? "Overview" : item === "findings" ? "Findings" : "Guidance"}
                </button>
              ))}
            </div>
            {tab === "overview" && (
              <div className="dashboard-content dashboard-content--overview">
                <div className="score-card">
                  <div className="score-ring"><span>72</span><small>/100</small></div>
                  <div><span className="mono card-kicker">CURRENT SIGNAL</span><strong>Building a baseline</strong><p>3 areas have a clear next step.</p></div>
                </div>
                <div className="metric-strip">
                  <div><span className="mono">CHECKED</span><strong>12</strong><small>indicators</small></div>
                  <div><span className="mono">WATCH</span><strong className="metric-warn">03</strong><small>needs context</small></div>
                  <div><span className="mono">READY</span><strong className="metric-good">07</strong><small>in good shape</small></div>
                </div>
                <div className="dashboard-lower-grid">
                  <div className="mini-card activity-card">
                    <div className="mini-card__title"><span>Activity overview</span><ArrowUpRight size={14} /></div>
                    <div className="activity-chart" aria-label="Sample activity chart"><i /><i /><i /><i /><i /><i /><i /><i /><i /><i /><i /><i /></div>
                    <div className="chart-caption"><span className="mono">LAST 30 DAYS</span><strong>+18% clarity</strong></div>
                  </div>
                  <div className="mini-card findings-card">
                    <div className="mini-card__title"><span>Recent findings</span><ArrowUpRight size={14} /></div>
                    <div className="finding-row"><span className="finding-icon finding-icon--warn"><CircleAlert size={13} /></span><div><strong>Account recovery</strong><small>Worth reviewing</small></div><span className="mono">2d</span></div>
                    <div className="finding-row"><span className="finding-icon finding-icon--good"><CircleCheckBig size={13} /></span><div><strong>Device updates</strong><small>Looks consistent</small></div><span className="mono">4d</span></div>
                    <div className="finding-row"><span className="finding-icon"><Eye size={13} /></span><div><strong>Sharing settings</strong><small>Learn more</small></div><span className="mono">6d</span></div>
                  </div>
                </div>
              </div>
            )}
            {tab === "findings" && (
              <div className="dashboard-content dashboard-content--tabbed">
                <div className="tabbed-intro"><span className="mono card-kicker">3 ITEMS TO REVIEW</span><h4>Context before urgency.</h4><p>These sample findings are organized by what will help you make the next good decision.</p></div>
                {[
                  ["Account recovery", "Review your recovery options and backup contact details.", "Medium"],
                  ["Browser permissions", "Check which websites can access sensitive browser capabilities.", "Low"],
                  ["Shared workspace", "Confirm access still matches the people who need it.", "Low"],
                ].map(([title, copy, level]) => <div className="finding-detail" key={title}><span className="finding-icon finding-icon--warn"><CircleAlert size={13} /></span><div><strong>{title}</strong><p>{copy}</p></div><span className="risk-pill">{level}</span></div>)}
              </div>
            )}
            {tab === "guidance" && (
              <div className="dashboard-content dashboard-content--tabbed">
                <div className="tabbed-intro"><span className="mono card-kicker">RECOMMENDED NEXT</span><h4>Start with one small change.</h4><p>Clear guidance should leave you with less uncertainty, not another backlog.</p></div>
                <div className="guidance-card"><span className="guidance-number">01</span><div><strong>Review account recovery</strong><p>Confirm there is more than one way back into your important accounts.</p><button type="button" onClick={() => toast("Guidance preview", { description: "This sample lesson would open in the product." })}>Open sample guidance <ArrowRight size={14} /></button></div></div>
                <div className="guidance-card guidance-card--muted"><span className="guidance-number">02</span><div><strong>Check update habits</strong><p>Learn which updates matter most and how to make them routine.</p></div></div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function PricingCard({ name, description, label, features, featured }: { name: string; description: string; label: string; features: string[]; featured?: boolean }) {
  return (
    <article className={`pricing-card ${featured ? "pricing-card--featured" : ""}`}>
      {featured && <div className="pricing-card__flag">Most flexible</div>}
      <div className="pricing-card__top"><span className="mono pricing-card__label">{label}</span><span className="pricing-card__status mono">LAUNCH PLACEHOLDER</span><h3>{name}</h3><p>{description}</p></div>
      <div className="pricing-card__price"><strong>TBD</strong><span>launch pricing</span></div>
      <ul>{features.map((feature) => <li key={feature}><Check size={15} /> {feature}</li>)}</ul>
      <a className={`button ${featured ? "button--lime" : "button--outline-dark"}`} href="#get-started">Join the launch list <ArrowUpRight size={15} /></a>
    </article>
  );
}

export default function Home() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [openFaq, setOpenFaq] = useState<number | null>(0);
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!email.trim()) return;
    setSubmitted(true);
    toast.success("You are on the list", { description: "We will share the next Aegis update here." });
  };

  const closeMobile = () => setMobileOpen(false);

  return (
    <div className="site-shell" id="top">
      <header className="site-header">
        <div className="container header-inner">
          <Logo />
          <nav className="desktop-nav" aria-label="Primary navigation">
            {navItems.map((item) => <a key={item.href} href={item.href}>{item.label}</a>)}
          </nav>
          <a className="button button--lime button--small header-cta" href="#get-started">Get Started <ArrowUpRight size={15} /></a>
          <button className="mobile-menu-button" type="button" aria-label={mobileOpen ? "Close navigation" : "Open navigation"} aria-expanded={mobileOpen} onClick={() => setMobileOpen((current) => !current)}>
            {mobileOpen ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>
        {mobileOpen && <nav className="mobile-nav" aria-label="Mobile navigation">{navItems.map((item) => <a key={item.href} href={item.href} onClick={closeMobile}>{item.label}<ArrowUpRight size={15} /></a>)}<a className="button button--lime" href="#get-started" onClick={closeMobile}>Get Started <ArrowUpRight size={15} /></a></nav>}
      </header>

      <main>
        <section className="hero-section">
          <div className="hero-visual" aria-hidden="true"><img src="/manus-storage/aegis-hero_c04cda96.png" alt="" /></div>
          <div className="hero-grid container">
            <div className="hero-copy">
              <div className="eyebrow eyebrow--lime"><span className="eyebrow__pulse" /> DIGITAL SECURITY, MADE LEGIBLE</div>
              <h1>See the signals.<br /><em>Know what to do next.</em></h1>
              <p className="hero-lede">Aegis helps people, developers, and small teams understand their digital security — without the jargon, panic, or guesswork.</p>
              <div className="hero-actions"><a className="button button--lime" href="#get-started">Get Started <ArrowUpRight size={17} /></a><a className="button button--ghost" href="#features">Explore Features <ArrowRight size={17} /></a></div>
              <div className="hero-notes"><span><CircleCheckBig size={14} /> Beginner-friendly by design</span><span><CircleCheckBig size={14} /> Honest about its limits</span></div>
            </div>
            <div className="hero-product"><DashboardPreview /></div>
          </div>
          <div className="hero-footnote container"><span className="mono">01 / A CLEARER STARTING POINT</span><span className="hero-footnote__line" /><span>Built for better security decisions.</span></div>
        </section>

        <section className="logo-band" aria-label="Aegis product principles">
          <div className="container logo-band__inner"><span className="mono">THE AEGIS APPROACH</span><div className="logo-band__principles"><span><Shield size={15} /> Practical by default</span><span><Waypoints size={15} /> Transparent by design</span><span><Sparkles size={15} /> Useful for humans</span><span><BadgeCheck size={15} /> No inflated claims</span></div></div>
        </section>

        <section className="section section--problem" id="product">
          <div className="container problem-grid">
            <div className="problem-intro"><SectionLabel number="02" children="THE PROBLEM" /><h2>Security should not be a <em>second language.</em></h2><p>Most people do not need more alerts. They need a clearer way to understand what matters, what can wait, and what to do next.</p></div>
            <div className="problem-list"><div className="problem-item"><span className="problem-index">A</span><div><h3>Information without context</h3><p>Technical terms make everyday security decisions feel harder than they need to be.</p></div></div><div className="problem-item"><span className="problem-index">B</span><div><h3>Advice without a starting point</h3><p>Small teams often discover a long list of “shoulds” with no practical order of operations.</p></div></div><div className="problem-item"><span className="problem-index">C</span><div><h3>Problems found too late</h3><p>Without a regular habit, a small gap can stay invisible until it becomes an expensive distraction.</p></div></div></div>
          </div>
        </section>

        <section className="section section--solution">
          <div className="container solution-grid"><div className="solution-stamp"><div className="stamp-ring"><ShieldCheck size={33} /><span className="mono">AEGIS / 001</span></div><span className="mono">FROM SIGNAL TO ACTION</span></div><div className="solution-copy"><SectionLabel number="03" children="THE AEGIS SHIFT" /><h2>Less noise.<br /><em>More useful clarity.</em></h2><p>Aegis turns selected security information into a calm, prioritized view. You see the signal, learn why it matters, and get a next step that respects your time and experience.</p><a className="text-link" href="#how-it-works">See how it works <ArrowUpRight size={16} /></a></div><div className="solution-rail"><span className="mono">SAMPLE / PRODUCT PRINCIPLE</span><strong>Explain first.<br />Act second.</strong><span className="solution-rail__dot" /></div></div>
        </section>

        <section className="section section--features" id="features">
          <div className="container"><div className="section-heading section-heading--split"><div><SectionLabel number="04" children="WHAT YOU CAN DO" /><h2>Security tools that<br /><em>meet you halfway.</em></h2></div><p>Designed to make good security habits more visible, more teachable, and easier to keep.</p></div><div className="features-grid">{features.map(({ icon: Icon, eyebrow, title, copy }) => <article className="feature-card" key={title}><div className="feature-card__top"><span className="feature-icon"><Icon size={20} /></span><span className="mono">{eyebrow}</span></div><span className="feature-card__status mono">SAMPLE MODULE / READY</span><h3>{title}</h3><p>{copy}</p><ArrowUpRight className="feature-card__arrow" size={17} /></article>)}</div></div>
        </section>

        <section className="section section--how" id="how-it-works">
          <div className="container"><div className="section-heading section-heading--center"><SectionLabel number="05" children="HOW IT WORKS" /><h2>Three steps to a <em>clearer baseline.</em></h2><p>Start small. Build understanding. Keep going when the next step is obvious.</p></div><div className="steps-grid"><article className="step-card"><div className="step-card__number">01</div><span className="step-card__status mono">INPUT / SAMPLE</span><div className="step-card__icon"><PanelTop size={23} /></div><h3>Connect</h3><p>Choose the workspace, account, or signal you want to understand better.</p><span className="step-card__trace" /></article><article className="step-card step-card--active"><div className="step-card__number">02</div><span className="step-card__status mono">ACTIVE / ANALYSIS</span><div className="step-card__icon"><Radar size={23} /></div><h3>Analyze</h3><p>Aegis organizes what it sees and explains the context behind each finding.</p><span className="step-card__trace" /></article><article className="step-card"><div className="step-card__number">03</div><span className="step-card__status mono">OUTPUT / SAMPLE</span><div className="step-card__icon"><Zap size={23} /></div><h3>Improve</h3><p>Follow one recommendation, then return to see how your baseline changes.</p><span className="step-card__trace" /></article></div></div>
        </section>

        <section className="section section--benefits">
          <div className="container benefits-grid"><div className="benefits-copy"><SectionLabel number="06" children="WHY IT MATTERS" /><h2>Make security a habit<br /><em>you can keep.</em></h2><p>The goal is not to turn you into a security professional overnight. It is to help you make better decisions more often.</p><a className="text-link text-link--dark" href="#get-started">Start with the basics <ArrowUpRight size={16} /></a></div><div className="benefit-list"><div><span className="mono">01</span><strong>Save time</strong><p>Find the first useful action instead of hunting for it.</p></div><div><span className="mono">02</span><strong>Reduce uncertainty</strong><p>Understand risk in language you can share with others.</p></div><div><span className="mono">03</span><strong>Learn while doing</strong><p>Build security intuition that compounds over time.</p></div><div><span className="mono">04</span><strong>Make progress visible</strong><p>See the difference small, consistent changes make.</p></div></div></div>
        </section>

        <section className="section section--trust">
          <div className="container trust-grid"><div className="trust-statement"><SectionLabel number="07" children="TRUST, WITHOUT THE THEATER" /><h2>Useful enough to return to.<br /><em>Honest enough to trust.</em></h2><p>We are building Aegis around transparent product boundaries, responsible disclosure, and security documentation that explains the “why” — not just the “what.”</p></div><div className="trust-principles"><div className="trust-principle"><LockKeyhole size={19} /><div><strong>Privacy-focused design</strong><p>We will document data handling in plain language as the product evolves.</p></div></div><div className="trust-principle"><FileText size={19} /><div><strong>Transparent security practice</strong><p>Clear scope, visible limitations, and no promises the product cannot keep.</p></div></div><div className="trust-principle"><BookOpen size={19} /><div><strong>Learning as a feature</strong><p>Security guidance should help you understand, not just comply.</p></div></div><div className="trust-placeholder"><span className="mono">TRUST INDICATOR / PLACEHOLDER</span><p>Customer and certification details will be added only when verified.</p></div></div></div>
        </section>

        <section className="section section--pricing" id="pricing">
          <div className="container"><div className="section-heading section-heading--split"><div><SectionLabel number="08" children="PRICING, IN PLAIN VIEW" /><h2>Start free.<br /><em>Choose when to grow.</em></h2></div><p>Launch pricing is still being shaped with early users. These plan cards are editable placeholders — no payment is collected here.</p></div><div className="pricing-grid"><PricingCard name="Free" label="FOR LEARNING" description="A friendly place to build your security baseline." features={planFeatures.free} /><PricingCard name="Pro" label="FOR BUILDERS" description="More context for advanced users and developers." features={planFeatures.pro} featured /><PricingCard name="Business" label="FOR SMALL TEAMS" description="A shared starting point for people who work together." features={planFeatures.business} /></div><p className="pricing-note"><span className="mono">NOTE</span> Final prices, limits, and paid-plan availability will be published before launch.</p></div>
        </section>

        <section className="section section--faq" id="faq">
          <div className="container faq-grid"><div className="faq-intro"><SectionLabel number="09" children="QUESTIONS, ANSWERED" /><h2>Good questions are part of <em>good security.</em></h2><p>Still unsure where Aegis fits? Start here, or send a note through the launch list.</p><a className="text-link" href="#get-started">Ask a question <ArrowUpRight size={16} /></a></div><div className="faq-list">{faqs.map((faq, index) => <div className={`faq-item ${openFaq === index ? "is-open" : ""}`} key={faq.question}><button type="button" aria-expanded={openFaq === index} onClick={() => setOpenFaq(openFaq === index ? null : index)}><span>{faq.question}</span><span className="faq-toggle">{openFaq === index ? <X size={16} /> : <ChevronDown size={17} />}</span></button><div className="faq-answer"><p>{faq.answer}</p></div></div>)}</div></div>
        </section>

        <section className="section section--cta" id="get-started">
          <div className="cta-grid container"><div className="cta-mark"><span className="cta-crosshair" /><span className="cta-crosshair cta-crosshair--two" /><div className="cta-mark__circle"><ShieldCheck size={31} /></div></div><div className="cta-copy"><SectionLabel number="10" children="YOUR NEXT GOOD DECISION" /><h2>Start understanding<br /><em>your security today.</em></h2><p>Join the early list for product updates, practical security notes, and an invitation to try Aegis when the first workspace opens.</p>{submitted ? <div className="submitted-state"><CircleCheckBig size={18} /><div><strong>You are on the list.</strong><span>We will use this email only for Aegis launch updates.</span></div></div> : <form className="signup-form" onSubmit={handleSubmit}><label className="sr-only" htmlFor="launch-email">Email address</label><input id="launch-email" type="email" placeholder="you@yourdomain.com" value={email} onChange={(event) => setEmail(event.target.value)} required /><button className="button button--lime" type="submit">Get Started <ArrowUpRight size={16} /></button></form>}<span className="form-note"><LockKeyhole size={13} /> No spam. No payment details. Just useful updates.</span></div></div>
        </section>
      </main>

      <footer className="site-footer"><div className="container footer-top"><div className="footer-brand"><Logo /><p>A clearer starting point for safer systems.</p><span className="mono">© 2026 Aegis Security / SAMPLE BRAND</span></div><div className="footer-links"><div><span className="mono">PRODUCT</span><a href="#features">Features</a><a href="#pricing">Pricing</a><a href="#product">Security</a><a href="#faq">Documentation</a></div><div><span className="mono">COMPANY</span><a href="#top">About</a><a href="#get-started">Contact</a><a href="#get-started">Careers</a></div><div><span className="mono">RESOURCES</span><a href="/learn#journal">Journal</a><a href="/learn">Guides</a><a href="#faq">FAQ</a></div><div><span className="mono">LEGAL</span><a href="#top">Privacy policy</a><a href="#top">Terms</a><a href="#top">Cookie policy</a></div></div></div><div className="container footer-bottom"><span>Built for better digital habits.</span><div><a href="#top">LinkedIn placeholder</a><a href="#top">GitHub placeholder</a><a href="#top">Status placeholder</a></div></div></footer>
    </div>
  );
}
