// /landing-new — Aceternity UI showcase landing for Aegis Security.
// Dark theme, Inter font, cyan→violet gradient accents. Scoped under .ln-root
// (see styles/landing-new.css) so nothing here can affect the existing pages.
// Counters, meteors, beams and marquee respect prefers-reduced-motion.
import { useEffect, useRef, useState, type ReactNode } from "react";
import {
  Activity,
  ChevronDown,
  Eye,
  LockKeyhole,
  Radar,
  ScanSearch,
  ShieldCheck,
  Sparkles,
  Zap,
} from "lucide-react";

import { AnimatedTooltip } from "@/components/aceternity/animated-tooltip";
import { BackgroundBeams } from "@/components/aceternity/background-beams";
import { CardDescription, CardTitle, HoverEffect } from "@/components/aceternity/card-hover-effect";
import { Grid } from "@/components/aceternity/grid-pattern";
import { InfiniteMovingCards } from "@/components/aceternity/infinite-moving-cards";
import { Meteors } from "@/components/aceternity/meteors";
import { Button as MovingBorderButton } from "@/components/aceternity/moving-border";
import { ParallaxScroll } from "@/components/aceternity/parallax-scroll";
import { Spotlight } from "@/components/aceternity/spotlight";
import { TextGenerateEffect } from "@/components/aceternity/text-generate-effect";

const prefersReducedMotion =
  typeof window !== "undefined" &&
  window.matchMedia("(prefers-reduced-motion: reduce)").matches;

/* ============================ data ============================ */

const FEATURES = [
  {
    title: "Threat Detection",
    description:
      "Continuous scanning surfaces suspicious activity the moment it appears, with plain-language context for every finding.",
    icon: Radar,
  },
  {
    title: "Password Vault",
    description:
      "AES-256-GCM encryption in your browser keeps credentials sealed — the server never sees a plaintext password.",
    icon: LockKeyhole,
  },
  {
    title: "Security Reports",
    description:
      "Readable, exportable reports turn raw signals into a prioritized baseline you can actually act on.",
    icon: ScanSearch,
  },
  {
    title: "Real-Time Monitor",
    description:
      "A live threat feed keeps your workspace honest: severity, source, and the next useful step.",
    icon: Activity,
  },
];

const STEPS = [
  {
    step: "01",
    title: "Run your first scan",
    copy: "Point Aegis at your workspace. The first baseline takes seconds and needs no agent install.",
    icon: ScanSearch,
  },
  {
    step: "02",
    title: "Review the signal",
    copy: "Findings arrive with severity, source, and the why — not a wall of alerts to decode.",
    icon: Radar,
  },
  {
    step: "03",
    title: "Fix and track",
    copy: "Apply one recommendation at a time and watch your security score climb as you go.",
    icon: Zap,
  },
];

const TESTIMONIALS = [
  {
    quote:
      "Aegis found a misconfigured recovery path on day one. The explanation was clear enough to act on immediately.",
    name: "Maya Chen",
    title: "Engineering Lead, Northwind",
  },
  {
    quote:
      "The first security tool my whole team actually logs into. Reports I can hand to a founder without translating.",
    name: "Jonas Verma",
    title: "CTO, Loop Studio",
  },
  {
    quote:
      "Onboarding took minutes. The live threat feed replaced three browser tabs I used to check manually.",
    name: "Priya Raghavan",
    title: "Security Analyst, Fieldset",
  },
  {
    quote:
      "Our password vault moved to Aegis because the encryption story was the only one we could explain to auditors.",
    name: "Daniel Okafor",
    title: "Ops Manager, Brightpath",
  },
  {
    quote:
      "It teaches while it protects. Junior devs now file better security PRs after a month of reading the reports.",
    name: "Elena Sosa",
    title: "Principal Engineer, Vantage",
  },
  {
    quote:
      "Finally a dashboard that shows a score I trust and the next step that moves it. Nothing else, nothing noisy.",
    name: "Tom Aldridge",
    title: "Founder, Kite & Co.",
  },
];

const TEAM = [
  { id: 1, name: "Ava Storm", designation: "Threat Research", image: "" },
  { id: 2, name: "Leo Marsh", designation: "Cryptography", image: "" },
  { id: 3, name: "Rin Vale", designation: "Product Security", image: "" },
  { id: 4, name: "Noor Haddad", designation: "Incident Response", image: "" },
  { id: 5, name: "Kai Osei", designation: "Platform Eng", image: "" },
];

const STATS = [
  { value: 12800, suffix: "+", label: "Threats blocked" },
  { value: 99, suffix: ".9%", label: "Uptime" },
  { value: 4200, suffix: "+", label: "Active shields" },
  { value: 24, suffix: "/7", label: "Monitoring" },
];

/* ============================ helpers ============================ */

function useInView<T extends HTMLElement>(threshold = 0.3) {
  const ref = useRef<T>(null);
  const [inView, setInView] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setInView(true);
          observer.disconnect();
        }
      },
      { threshold }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [threshold]);
  return { ref, inView };
}

function Counter({ target, suffix }: { target: number; suffix: string }) {
  const { ref, inView } = useInView<HTMLDivElement>(0.4);
  const [value, setValue] = useState(0);

  useEffect(() => {
    if (!inView) return;
    if (prefersReducedMotion) {
      setValue(target);
      return;
    }
    const duration = 1600;
    const start = performance.now();
    let frame: number;
    const tick = (now: number) => {
      const progress = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3); // ease-out cubic
      setValue(Math.round(target * eased));
      if (progress < 1) frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [inView, target]);

  return (
    <div ref={ref} className="ln-stat__value">
      <span key={value} className="ln-count ln-grad-text">
        {value.toLocaleString()}
        {suffix}
      </span>
    </div>
  );
}

function StepCard({ step, title, copy, icon: Icon }: (typeof STEPS)[number]) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-6 text-left">
      <div className="flex items-center justify-between">
        <span className="text-xs tracking-[0.2em] text-cyan-300">{step}</span>
        <Icon size={18} className="text-violet-400" />
      </div>
      <h3 className="mt-4 text-lg font-semibold text-white">{title}</h3>
      <p className="mt-2 text-sm leading-relaxed text-slate-400">{copy}</p>
    </div>
  );
}

/* ============================ sections ============================ */

function Hero() {
  return (
    <section className="ln-hero">
      {/* BackgroundBeams behind, Spotlight on top — both absolute. */}
      <BackgroundBeams />
      <Spotlight className="-top-40 left-0 md:-top-20 md:left-60" fill="#22d3ee" />
      <Spotlight className="top-10 left-full hidden h-[80vh] w-[50vw] md:block" fill="#8b5cf6" />

      <div className="ln-container ln-hero__inner">
        <span className="ln-eyebrow">
          <Sparkles size={13} /> Aegis Security
        </span>
        <div className="mt-6">
          <TextGenerateEffect
            words="Your Digital Shield"
            className="text-[clamp(44px,8vw,88px)] font-extrabold leading-[1.02] tracking-[-0.045em]"
            duration={0.6}
          />
        </div>
        <p className="ln-hero__sub">
          Aegis watches your digital assets around the clock — scanning,
          explaining, and blocking threats before they reach your users.{" "}
          <span className="ln-grad-text font-semibold">Security, made legible.</span>
        </p>
        <div className="ln-hero__actions">
          <MovingBorderButton
            borderRadius="1rem"
            duration={2600}
            containerClassName="h-14 w-44"
            className="bg-black/80 text-base font-semibold tracking-wide hover:bg-black"
            borderClassName="bg-[radial-gradient(#22d3ee_40%,transparent_60%)]"
            onClick={() => (window.location.href = "/auth")}
          >
            Get Started
          </MovingBorderButton>
          <a
            href="#ln-features"
            className="rounded-xl border border-white/15 px-8 py-4 text-base font-medium text-slate-300 transition hover:border-white/40 hover:text-white"
          >
            Explore features
          </a>
        </div>
        <div className="mt-16">
          <AnimatedTooltip items={TEAM} />
        </div>
      </div>

      <a className="ln-hero__scroll" href="#ln-features" aria-label="Scroll to features">
        <span>Scroll</span>
        <ChevronDown size={16} className="animate-bounce-slow" />
      </a>
    </section>
  );
}

function Features() {
  return (
    <section className="ln-section" id="ln-features">
      <Grid className="ln-grid-bg" size={36} />
      <div className="ln-container relative z-10">
        <div className="text-center">
          <span className="ln-eyebrow">Features</span>
          <h2 className="ln-h2 mt-5">
            One shield for <span className="ln-grad-text">every surface</span>
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-slate-400">
            Four core capabilities, one calm dashboard. Hover a card to see how
            Aegis keeps each surface covered.
          </p>
        </div>
        <HoverEffect
          className="lg:grid-cols-2 xl:grid-cols-4"
          items={FEATURES.map((f) => ({
            title: f.title,
            description: f.description,
            link: "#ln-features",
          }))}
        />
        <div className="-mt-6 grid gap-4 lg:grid-cols-4">
          {FEATURES.map(({ icon: Icon, title }) => (
            <div
              key={title}
              className="flex items-center gap-3 rounded-xl border border-white/[0.06] bg-black/40 px-4 py-3"
            >
              <span className="ln-feature-icon">
                <Icon size={20} />
              </span>
              <span className="text-sm font-medium text-slate-300">{title}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function HowItWorks() {
  return (
    <section className="ln-section">
      <div className="ln-container">
        <div className="text-center">
          <span className="ln-eyebrow">How it works</span>
          <h2 className="ln-h2 mt-5">
            Protected in <span className="ln-grad-text">three steps</span>
          </h2>
        </div>

        <div className="ln-steps mt-14 max-w-4xl mx-auto">
          <span className="ln-steps__line" aria-hidden="true" />
          {STEPS.map(({ step, title, icon: Icon }) => (
            <div className="ln-step" key={step}>
              <span className="ln-step__badge">
                <Icon size={22} />
              </span>
              <span className="ln-step__num">STEP {step}</span>
              <span className="text-sm font-medium text-slate-300">{title}</span>
            </div>
          ))}
        </div>

        <ParallaxScroll
          className="mt-10"
          cards={STEPS.map((s): ReactNode => <StepCard key={s.step} {...s} />)}
        />
      </div>
    </section>
  );
}

function Stats() {
  return (
    <section className="ln-section">
      <div className="absolute inset-0 overflow-hidden" aria-hidden="true">
        <Meteors number={16} />
        <div
          className="absolute inset-0"
          style={{
            background:
              "radial-gradient(ellipse 60% 50% at 50% 50%, rgba(139,92,246,0.10), transparent)",
          }}
        />
      </div>
      <div className="ln-container relative z-10">
        <div className="text-center">
          <span className="ln-eyebrow">By the numbers</span>
          <h2 className="ln-h2 mt-5">Trust, <span className="ln-grad-text">measured</span></h2>
        </div>
        <div className="ln-stats mt-12">
          {STATS.map((stat) => (
            <div className="ln-stat" key={stat.label}>
              <Counter target={stat.value} suffix={stat.suffix} />
              <div className="ln-stat__label">{stat.label}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function Testimonials() {
  return (
    <section className="ln-section">
      <div className="ln-container">
        <div className="text-center">
          <span className="ln-eyebrow">Testimonials</span>
          <h2 className="ln-h2 mt-5">
            Teams that <span className="ln-grad-text">sleep better</span>
          </h2>
        </div>
        <div className="mt-12">
          <InfiniteMovingCards
            items={TESTIMONIALS}
            direction="left"
            speed="slow"
            pauseOnHover
          />
        </div>
      </div>
    </section>
  );
}

function Cta() {
  return (
    <section className="ln-section ln-cta">
      <div
        className="absolute inset-0"
        aria-hidden="true"
        style={{
          background:
            "radial-gradient(ellipse 50% 60% at 50% 100%, rgba(34,211,238,0.12), transparent)",
        }}
      />
      <div className="ln-container relative z-10">
        <h2 className="ln-h2 mx-auto max-w-3xl">
          Raise your shield <span className="ln-grad-text">today.</span>
        </h2>
        <p className="mx-auto mt-4 max-w-lg text-slate-400">
          Create a free workspace, run your first scan in minutes, and see your
          security baseline before your coffee cools.
        </p>
        <div className="mt-10 flex justify-center">
          <MovingBorderButton
            borderRadius="1rem"
            duration={2600}
            containerClassName="h-16 w-52"
            className="bg-black/80 text-lg font-semibold tracking-wide hover:bg-black"
            borderClassName="bg-[radial-gradient(#8b5cf6_40%,transparent_60%)]"
            onClick={() => (window.location.href = "/auth")}
          >
            Get Started
          </MovingBorderButton>
        </div>
      </div>
    </section>
  );
}

function Footer() {
  return (
    <footer className="ln-footer">
      <div className="ln-container ln-footer__inner">
        <span className="flex items-center gap-2 text-white">
          <ShieldCheck size={16} className="text-cyan-300" />
          Aegis Security
        </span>
        <nav className="ln-footer__links" aria-label="Footer">
          <a href="/">Home</a>
          <a href="/learn">Learn</a>
          <a href="/auth">Sign in</a>
        </nav>
        <span>© 2026 Aegis Security</span>
      </div>
    </footer>
  );
}

/* ============================ page ============================ */

export default function LandingNew() {
  useEffect(() => {
    document.title = "Aegis Security — Your Digital Shield";
  }, []);

  return (
    <div className="ln-root">
      <Hero />
      <Features />
      <HowItWorks />
      <Stats />
      <Testimonials />
      <Cta />
      <Footer />
    </div>
  );
}
