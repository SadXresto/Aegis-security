// Signal & Shield reminder: learning content should be useful, beginner-friendly, responsibly scoped, and clearly connected to the product.
import { useEffect } from "react";
import { ArrowRight, BookOpen, Code2, FileText, FlaskConical, Globe2, LockKeyhole, Network, Search, ShieldCheck } from "lucide-react";
import LearningShell from "@/components/LearningShell";

const tracks = [
  { icon: BookOpen, label: "LEARN", title: "Cybersecurity fundamentals", copy: "Build a grounded understanding of the ideas behind safer systems, from accounts to applications.", href: "/learn/what-is-cybersecurity" },
  { icon: FlaskConical, label: "PRACTICE", title: "Safe practice paths", copy: "Explore legal labs, CTF-style learning, quizzes, and local exercises designed for permission-based practice.", href: "#practice" },
  { icon: LockKeyhole, label: "TOOLS", title: "Defensive utilities", copy: "Learn what common security tools do, when they help, and how to use them responsibly.", href: "#tools" },
  { icon: Search, label: "GLOSSARY", title: "Security terminology", copy: "Short, human explanations for the words that can make security feel harder than it is.", href: "#glossary" },
  { icon: FileText, label: "JOURNAL", title: "Notes worth keeping", copy: "Original explainers, project updates, and practical learning notes from the Aegis build.", href: "#journal" },
  { icon: ShieldCheck, label: "ABOUT", title: "Our responsible-use philosophy", copy: "Aegis is for education, authorized testing, defensive security, CTFs, and legal labs with permission.", href: "#about" },
];

export default function Learn() {
  useEffect(() => {
    document.title = "Learn Cybersecurity | Aegis Secure";
    document.querySelector('meta[name="description"]')?.setAttribute("content", "Beginner-friendly cybersecurity fundamentals, safe practice paths, defensive tools, terminology, and responsible-use guidance from Aegis Secure.");
    document.querySelector('link[rel="canonical"]')?.setAttribute("href", `${window.location.origin}/learn`);
  }, []);

  return (
    <LearningShell eyebrow="AEGIS LEARNING / START HERE" title="Build better security intuition." intro="Aegis Learning is a growing set of clear explanations, safe practice paths, and useful references for people who want to understand digital security without performing unauthorized tests.">
      <section className="learning-section"><div className="container"><div className="learning-section__heading"><span className="mono">A PRACTICAL MAP</span><h2>Choose a path. Keep the context.</h2><p>Start with the question you have today. Each path is designed to make the next useful step easier to see.</p></div><div className="learning-track-grid">{tracks.map(({ icon: Icon, label, title, copy, href }) => <a className="learning-track" href={href} key={label}><div className="learning-track__top"><span className="learning-icon"><Icon size={19} /></span><span className="mono">{label}</span></div><h3>{title}</h3><p>{copy}</p><span className="learning-track__link">Explore path <ArrowRight size={14} /></span></a>)}</div></div></section>
      <section className="learning-section learning-section--tint" id="practice"><div className="container learning-split"><div><span className="mono">RESPONSIBLE PRACTICE</span><h2>Learn in places you are allowed to learn.</h2><p>Good security education includes good boundaries. Use local labs, intentionally vulnerable practice environments, CTF platforms, and systems where you have explicit permission. Never scan, access, or test another person’s systems without authorization.</p></div><div className="learning-boundaries"><div><Network size={17} /><strong>Authorized testing</strong><span>Only work on systems you own or have written permission to assess.</span></div><div><Code2 size={17} /><strong>Defensive learning</strong><span>Use tools to understand exposure, improve configurations, and protect people.</span></div><div><Globe2 size={17} /><strong>Clear boundaries</strong><span>When in doubt, stop and ask for permission before continuing.</span></div></div></div></section>
      <section className="learning-section" id="about"><div className="container learning-about"><div><span className="mono">ABOUT AEGIS</span><h2>A calmer way into cybersecurity.</h2></div><div><p>Aegis Secure is an early-stage project for people who want a more understandable starting point for cybersecurity learning and defensive security habits.</p><a className="text-link" href="/#get-started">Follow the project <ArrowRight size={15} /></a></div></div></section>
    </LearningShell>
  );
}
