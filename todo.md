# Aegis Secure Improvement Checklist

- [x] Inspect existing page structure, components, design tokens, assets, metadata, and runtime logs. Existing site is a single React landing page with reusable design tokens, working dashboard/FAQ/signup interactions, generated hero assets, and clean recent runtime/network logs. The main gaps are missing crawl files, no shareable learning routes, and hash-only navigation for the broader content structure.
- [x] Identify and fix broken links, dead buttons, missing assets, mobile layout problems, and accessibility issues. Added route-aware navigation and completed desktop/mobile screenshot checks; local routes and crawl files return 200, and no browser console errors were found.
- [x] Add SEO foundations: robots.txt, sitemap.xml, canonical metadata, Open Graph metadata, and structured data only where appropriate. Added crawl files, truthful organization JSON-LD, and route-specific title/description/canonical updates.
- [x] Improve navigation and internal linking without replacing the existing visual identity. Added Learn to the existing navigation and connected footer resources to the learning hub.
- [x] Add a focused learning hub structure for Learn, Practice, Tools, Glossary, Journal, and About. Added a crawlable /learn hub with clearly labeled paths and responsible-practice guidance.
- [x] Add only the highest-value initial learning content or content cards, with safe and beginner-friendly scope. Added the first complete article at /learn/what-is-cybersecurity and left the remaining tracks as focused, honest entry points.
- [x] Add a responsible-use statement covering education, authorized testing, defensive security, CTFs, legal labs, and permission-based research. Included it in the hub and article content.
- [x] Verify desktop/mobile layouts, navigation, buttons, important routes, console output, metadata, and accessibility basics. Type-check passed; key routes, robots.txt, sitemap.xml, and console output were checked.
- [ ] Save a checkpoint and deliver only what was completed, what remains, and the next highest-priority task.

## V2 Deployment Foundation Pass

- [x] Inspect current build configuration, SPA routing, production domain, existing routes, assets, and SEO files. Existing site and learning routes render in the live browser; Vercel-specific SPA fallback was missing.
- [x] Fix only critical deployment issues found in the existing project. Added a minimal `vercel.json` rewrite that preserves crawl files/assets while routing extensionless SPA paths to `index.html`.
- [ ] Build/type-check and verify `/`, `/learn`, article routes, assets, `robots.txt`, and `sitemap.xml` in production.
- [ ] Confirm the live deployment and stop before starting authentication, database, storage, or subscription phases.
