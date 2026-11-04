# Portfolio Studio

An independent case-study and portfolio platform by Studio GH.

## Product direction

Portfolio Studio turns unstructured project material into evidence-backed, designed case studies through a guided workflow:

1. **Drop In** — collect source files, links, notes and visual material.
2. **Evidence** — organize facts, outcomes, decisions and assets with source references.
3. **Story Plan** — shape and approve the narrative for a chosen audience.
4. **Design** — choose a presentation layout.
5. **Your Look** — apply the GLERMENRIK visual identity and per-case styling.
6. **Publish** — approve, publish and share the case study.

The Case Study Engine is the core product. The public portfolio is an output of approved work, not the primary workflow.

## Architecture principles

- Independent application; no dependency on Lovable.
- GitHub is the source of truth for code and project history.
- Cloudflare Pages for the web application.
- Cloudflare Workers for server-side operations and integrations.
- Cloudflare D1 for structured records.
- Cloudflare R2 for uploaded source files and generated assets.
- Framer is an optional publishing destination, never the system of record.
- Private ChatGPT plugin integration is a separate layer and must not be required for the app to work.
- No paid APIs or services in the MVP.
- Never claim AI extraction, file parsing, cross-device sync or public publishing works until implemented and verified.

## Visual direction

- Paper: `#fffcf4`
- Ink: `#2c2c2c`
- Accent: `#ff961a`
- Editorial, minimal, contemporary, generous whitespace.
- Avoid generic SaaS dashboards, gradients and heavy dark surfaces.

## MVP scope

The first milestone is a working browser-based application with:
- project dashboard and case-study creation flow;
- persistent local draft storage as an initial fallback;
- source inventory and manual evidence capture;
- editable/reorderable story plan;
- multiple distinct case-study layouts;
- visual style controls;
- draft/approved/published states with honest publishing status;
- sample project clearly marked as demo.

Cloud persistence and Framer publishing are later milestones, implemented behind explicit adapters.

## Development status

Repository initialized. Application scaffold and first interactive workflow are the next implementation milestone.
