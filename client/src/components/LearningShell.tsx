// Signal & Shield reminder: keep learning pages calm, readable, and structurally connected to the Aegis brand.
import { ArrowLeft, ArrowUpRight, BookOpen, ShieldCheck } from "lucide-react";
import { ReactNode } from "react";

export default function LearningShell({ children, eyebrow, title, intro }: { children: ReactNode; eyebrow: string; title: string; intro: string }) {
  return (
    <div className="learning-shell">
      <header className="learning-header">
        <div className="container learning-header__inner">
          <a className="brand" href="/" aria-label="Aegis Secure home"><img src="/manus-storage/aegis-mark_bcb7af3d.png" alt="" aria-hidden="true" /><span className="brand__wordmark"><span className="brand__a">A</span>egis<span className="brand__dot">.</span></span></a>
          <nav className="learning-nav" aria-label="Learning navigation"><a href="/learn">Learn</a><a href="/#how-it-works">How it works</a><a href="/#faq">FAQ</a></nav>
          <a className="button button--lime button--small" href="/#get-started">Get Started <ArrowUpRight size={15} /></a>
        </div>
      </header>
      <main>
        <section className="learning-hero"><div className="container learning-hero__inner"><a className="back-link" href="/"><ArrowLeft size={15} /> Back to Aegis</a><span className="eyebrow eyebrow--lime"><BookOpen size={13} /> {eyebrow}</span><h1>{title}</h1><p>{intro}</p></div></section>
        {children}
      </main>
      <footer className="learning-footer"><div className="container learning-footer__inner"><a className="brand" href="/"><img src="/manus-storage/aegis-mark_bcb7af3d.png" alt="" aria-hidden="true" /><span className="brand__wordmark"><span className="brand__a">A</span>egis<span className="brand__dot">.</span></span></a><span><ShieldCheck size={14} /> Education, authorized testing, and defensive security.</span></div></footer>
    </div>
  );
}
