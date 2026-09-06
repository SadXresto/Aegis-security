# Aegis Secure Improvement Checklist

- [x] Inspect existing page structure, components, design tokens, assets, metadata, and runtime logs. Existing site is a single React landing page with reusable design tokens, working dashboard/FAQ/signup interactions, generated hero assets, and clean recent runtime/network logs. The main gaps are missing crawl files, no shareable learning routes, and hash-only navigation for the broader content structure.
- [x] Identify and fix broken links, dead buttons, missing assets, mobile layout problems, and accessibility issues. Added route-aware navigation and completed desktop/mobile screenshot checks; local routes and crawl files return 200, and no browser console errors were found.
- [x] Add SEO foundations: robots.txt, sitemap.xml, canonical metadata, Open Graph metadata, and structured data only where appropriate. Added crawl files, truthful organization JSON-LD, and route-specific title/description/canonical updates.
- [x] Improve navigation and internal linking without replacing the existing visual identity. Added Learn to the existing navigation and connected footer resources to the learning hub.
- [x] Add a focused learning hub structure for Learn, Practice, Tools, Glossary, Journal, and About. Added a crawlable /learn hub with clearly labeled paths and responsible-practice guidance.
- [x] Add only the highest-value initial learning content or content cards, with safe and beginner-friendly scope. Added the first complete article at /learn/what-is-cybersecurity and left the remaining tracks as focused, honest entry points.
- [x] Add a responsible-use statement covering education, authorized testing, defensive security, CTFs, legal labs, and permission-based research. Included it in the hub and article content.
- [x] Verify desktop/mobile layouts, navigation, buttons, important routes, console output, metadata, and accessibility basics. Type-check passed; key routes, robots.txt, sitemap.xml, and console output were checked.
- [x] Save a checkpoint and deliver only what was completed, what remains, and the next highest-priority task. Superseded by the current authentication checkpoint and report.

## V2 Deployment Foundation Pass

- [x] Inspect current build configuration, SPA routing, production domain, existing routes, assets, and SEO files. Existing site and learning routes render in the live browser; Vercel-specific SPA fallback was missing.
- [x] Fix only critical deployment issues found in the existing project. Added a minimal `vercel.json` rewrite that preserves crawl files/assets while routing extensionless SPA paths to `index.html`.
- [x] Build/type-check and verify `/`, `/learn`, article routes, assets, `robots.txt`, and `sitemap.xml` in production. The current published deployment returns HTTP 200 for all public, auth, account, crawl-file, and referenced brand/hero asset routes.
- [x] Confirm the live deployment and stop before starting authentication, database, storage, or subscription phases. The deployment foundation was confirmed before the authentication phase began.

## Authentication Phase

- [x] Inspect current project instructions and connector configuration for backend/auth availability. Enabled the existing Supabase API connector and confirmed the project already had working browser-safe Supabase credentials.
- [x] Enable the existing full-stack backend/auth scaffold only if required and safe. Upgraded the existing project to the managed full-stack scaffold and restored the pre-existing Aegis public routes after resolving template conflicts.
- [x] Implement email/password auth with persistent sessions, logout, reset flow, protected account surface, and clear loading/error states. Added `/auth`, `/account`, Supabase client setup, sign-up/sign-in/reset flows, session restoration, sign-out, and a discoverable homepage sign-in link.
- [x] Preserve the public homepage, learning routes, SEO files, and existing design system. Restored the stable homepage and kept `/learn`, the article route, crawl files, and existing Signal & Shield styling intact.
- [x] Build/type-check, verify auth states, and publish only after critical flows pass. Supabase credential tests, existing auth tests, type-check, production build, desktop screenshots, and mobile screenshots all passed.

## Auth Verification Follow-up

- [x] Implement the post-recovery password update screen after Supabase emits a recovery session. The auth page now handles `PASSWORD_RECOVERY` and calls `updateUser` with the new password.
- [x] Apply the automated-only auth validation boundary. No real credentials were used; Supabase configuration, source wiring, protected-route fallback, recovery implementation, tests, build, and production route responses passed. Sign-up, sign-in, refresh persistence, logout, and password recovery remain explicitly pending for manual testing.
- [x] Save a new checkpoint/deployment after the auth verification passes and confirm the updated live routes. Checkpoint `37c363fb` is published, and `/`, `/learn`, article, `/auth`, `/account`, `robots.txt`, and `sitemap.xml` all return HTTP 200.

## Automated Validation and Publish Boundary

- [x] Audit Supabase client usage, auth state handling, protected account route behavior, recovery flow, and secret exposure. No service-role secret is present in source or build output; `/account` checks the authenticated Supabase user; recovery handling includes `PASSWORD_RECOVERY` and `updateUser`.
- [x] Validate Supabase configuration, Auth API reachability, project schema/RLS posture where safely queryable, route coverage, tests, and production build without creating users. Auth settings returned HTTP 200; Supabase config and existing auth tests passed; type-check/build passed; no application Supabase tables or RLS definitions exist yet, so there are no private app policies to verify.
- [x] Publish the validated checkpoint and verify public/auth route responses in production. Published as checkpoint `37c363fb`; production route verification passed.
- [x] Leave sign-up, sign-in, session persistence, logout, and password recovery live-flow testing explicitly pending for manual verification with a disposable account. No real account or credentials were requested or used.

- [x] Move the Sign in control into a compact bordered box immediately to the left of the green Get Started button in the desktop header, while preserving mobile navigation and existing styles. Verified visually at desktop width and passed type-check.
