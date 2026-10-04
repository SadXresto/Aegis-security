import { FormEvent, useState } from "react";
import { ArrowRight, CheckCircle2, Loader2, ShieldCheck } from "lucide-react";
import { toast } from "sonner";
import AppShell from "@/components/AppShell";
import { useAuth } from "@/contexts/AuthContext";
import { requireSupabase } from "@/lib/supabase";

const SERVICES = [
  { slug: "website-security-assessment", title: "Website Security Assessment", price: "₹4,999+", copy: "A focused review of your public website and visible attack surface.", scope: "Headers, TLS, exposed services, common misconfigurations, and visible attack surface.", deliverables: "Prioritized findings, risk context, and practical remediation guidance." },
  { slug: "web-application-security-assessment", title: "Web Application Security Assessment", price: "₹7,999+", copy: "A structured assessment of an authorized web application.", scope: "Authentication, authorization, input handling, sessions, and common application risks.", deliverables: "Executive summary, technical findings, evidence, and remediation plan." },
  { slug: "vulnerability-assessment", title: "Vulnerability Assessment", price: "₹5,999+", copy: "Identify and prioritize vulnerabilities across an authorized environment.", scope: "Authenticated or unauthenticated assessment based on agreed scope and access.", deliverables: "Risk-ranked vulnerability report with remediation priorities." },
  { slug: "security-hardening", title: "Security Hardening", price: "₹4,999+", copy: "Reduce avoidable exposure across approved infrastructure or applications.", scope: "Configuration review and hardening recommendations for the agreed target.", deliverables: "Hardening checklist, change plan, and validation notes." },
  { slug: "security-review", title: "Security Review", price: "₹3,999+", copy: "An expert review of a product, architecture, or security control.", scope: "Targeted review of the agreed code, architecture, process, or control.", deliverables: "Review notes, material risks, and actionable next steps." },
  { slug: "retesting", title: "Retesting", price: "₹2,999+", copy: "Validate fixes after an earlier authorized assessment.", scope: "Retest of agreed findings and affected components only.", deliverables: "Retest result with remaining-risk notes." },
  { slug: "security-consultation", title: "Security Consultation", price: "₹1,999+", copy: "Practical guidance for a specific cybersecurity decision.", scope: "One focused consultation covering the agreed question or decision.", deliverables: "Written recommendations and a clear action plan." },
  { slug: "custom-security-work", title: "Custom Security Work", price: "Request a quote", copy: "A scoped engagement for a security need outside the standard packages.", scope: "Defined together after reviewing your requirements and authorization.", deliverables: "Agreed scope, timeline, deliverables, and price before work begins." },
];

export default function Services() {
  const { user } = useAuth();
  const [selected, setSelected] = useState<(typeof SERVICES)[number] | null>(null);
  const [requirements, setRequirements] = useState("");
  const [budget, setBudget] = useState("");
  const [deadline, setDeadline] = useState("");
  const [pending, setPending] = useState(false);
  const request = async (event: FormEvent) => {
    event.preventDefault();
    if (!selected || pending) return;
    setPending(true);
    try {
      const client = requireSupabase();
      const { data: auth } = await client.auth.getUser();
      if (!auth.user) throw new Error("Please sign in before requesting a service.");
      const { data: service } = await client.from("services").select("id").eq("slug", selected.slug).maybeSingle();
      const { error } = await client.from("projects").insert({
        client_id: auth.user.id,
        service_id: service?.id ?? null,
        title: selected.title,
        requirements: requirements.trim(),
        budget: budget ? Number(budget) : null,
        deadline: deadline || null,
        status: "REQUESTED",
      });
      if (error) throw error;
      toast.success("Request submitted", { description: "Your project workspace will appear in My Projects." });
      setSelected(null); setRequirements(""); setBudget(""); setDeadline("");
    } catch (error) { toast.error(error instanceof Error ? error.message : "We couldn't submit that request."); }
    finally { setPending(false); }
  };
  return <AppShell current="/services">
    <div className="app-page-head"><div><span className="kicker"><ShieldCheck size={13} /> Aegis / Services</span><h1>Security work, clearly scoped.</h1><p>Choose a starting point for an authorized engagement. Pricing is indicative and can change with scope.</p></div></div>
    <section className="panel-grid panel-grid--3">
      {SERVICES.map((service) => <article className="panel" key={service.slug}><div className="panel__body"><span className="kicker">{service.price}</span><h2 className="panel__title" style={{ marginTop: 10 }}>{service.title}</h2><p className="panel__note">{service.copy}</p><div className="field-row" style={{ marginTop: 14 }}><span className="field-row__label">Scope</span><p className="field-row__hint">{service.scope}</p></div><div className="field-row"><span className="field-row__label">Deliverables</span><p className="field-row__hint">{service.deliverables}</p></div><button className="button button--lime button--small" type="button" onClick={() => setSelected(service)}>Request this service <ArrowRight size={14} /></button></div></article>)}
    </section>
    {selected && <div className="modal-backdrop" role="presentation"><div className="panel" role="dialog" aria-modal="true" aria-labelledby="request-title" style={{ maxWidth: 620, width: "calc(100% - 32px)", margin: "10vh auto" }}><div className="panel__head"><div><span className="kicker">New project request</span><h2 id="request-title" className="panel__title" style={{ marginTop: 6 }}>{selected.title}</h2></div><button className="button button--outline-dark button--small" type="button" onClick={() => setSelected(null)}>Close</button></div><form className="panel__body" onSubmit={request}><div className="field"><label htmlFor="requirements">Requirements</label><textarea id="requirements" required minLength={20} value={requirements} onChange={(e) => setRequirements(e.target.value)} placeholder="Tell us what you want assessed, including the authorized scope." rows={5} /></div><div className="panel-grid panel-grid--2" style={{ marginTop: 14 }}><div className="field"><label htmlFor="budget">Budget (optional)</label><input id="budget" inputMode="decimal" value={budget} onChange={(e) => setBudget(e.target.value)} placeholder="e.g. 12000" /></div><div className="field"><label htmlFor="deadline">Target deadline (optional)</label><input id="deadline" type="date" value={deadline} onChange={(e) => setDeadline(e.target.value)} /></div></div><p className="panel__note"><CheckCircle2 size={14} style={{ verticalAlign: "-2px", marginRight: 5 }} /> No testing begins until scope and authorization are agreed.</p><div className="form-actions"><button className="button button--lime" type="submit" disabled={pending}>{pending ? <Loader2 className="spin" size={15} /> : <ArrowRight size={15} />} {pending ? "Submitting…" : "Submit request"}</button><button className="button button--outline-dark" type="button" onClick={() => setSelected(null)}>Cancel</button></div></form></div></div>}
  </AppShell>;
}
