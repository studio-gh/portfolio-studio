# Portfolio Studio

An independent Case Study Engine and portfolio publishing workspace by Studio GH.

## Product thesis

Portfolio Studio turns old case studies and messy project folders into current, evidence-backed professional stories. The engine is the product; the public portfolio is one output of approved work.

**Product promise:** Same project. Better story. Built for today.

## Core workflow

1. **Drop In** — accept an old case study and its source material: PDFs, presentations, documents, spreadsheets, images, screenshots, links and notes. Users do not need to organize everything first.
2. **Read & Analyse** — inspect supported files, extract text and metadata, identify source locations, group related material and surface gaps or contradictions. Unsupported files must be clearly identified, never silently ignored.
3. **Evidence** — turn source material into traceable facts: context, constraints, decisions, contribution, outcomes, metrics and artifacts. Every extracted claim links to its source. Distinguish source fact, user input, inference and unknown.
4. **Story Plan** — propose a narrative centred on important decisions and what changed, not a generic process checklist. The user can edit, reorder, remove and add sections.
5. **Target the Story** — optionally choose a target role, audience or opportunity. Relevance recommendations may reorder emphasis, but must never invent credentials, results or experience.
6. **Approve** — require explicit user approval of the evidence set and story outline before design generation. Preserve the approved version.
7. **Design** — build the approved story using distinct editorial layouts, image treatments and typography.
8. **Your Look** — customize the visual identity per user and per case study.
9. **Publish / Export** — generate an independently shareable case study and later sync to an optional public portfolio or external CMS.

## Narrative principles

Prefer stories that answer:
- What was the situation and why did it matter?
- What was the user's actual role and contribution?
- What important decisions were made, and why?
- What alternatives or trade-offs were considered?
- What changed because of the work?
- What evidence supports the result?
- What did the user learn or carry forward?

Process steps can appear when they explain a meaningful decision. Do not force every case study into a generic Design Thinking sequence.

## Trust and provenance

- Preserve original uploads and source references.
- Never fabricate metrics, outcomes, roles, dates or quotes.
- Separate confirmed facts, user assertions, interpretations and missing information.
- Flag conflicts between sources for user resolution.
- Keep an audit trail of extracted content and user edits.
- Require explicit approval before a story becomes a designed deliverable.
- Keep original, extracted, edited and approved versions distinguishable.

## Visual direction

Approved visual direction: contemporary editorial, minimalist, image-led and spacious. The interface should feel like a creative publishing workspace, not a generic SaaS admin panel.

- Paper: `#fffcf4`
- Ink: `#2c2c2c`
- Accent: `#ff961a`
- Expressive typography with a strong sans-serif hierarchy and restrained serif contrast.
- Generous whitespace, clear grids, large project imagery, layered source previews and precise micro-details.
- Avoid gradients, heavy dark panels, decorative controls without actions and generic AI sparkle motifs.
- User interface should remain light and practical; generated case study outputs may have distinct editorial art directions.

## Architecture principles

- Independent application; no Lovable dependency.
- GitHub is the source of truth for code and project history.
- Cloudflare Pages for the web app.
- Cloudflare Workers for server-side processing and integrations.
- Cloudflare D1 for structured records, provenance and version history.
- Cloudflare R2 for original files and generated assets.
- File parsing and AI analysis must be implemented as explicit, testable services/adapters.
- Framer is an optional publishing destination, never the system of record.
- A private ChatGPT plugin is a separate integration and must not be required for the app to work.
- No paid APIs or services in the MVP. Prefer open-source/local parsing and free infrastructure.
- Do not claim AI extraction, file parsing, cross-device sync or public publishing until implemented and verified.

## MVP milestones

### M0 — Product foundation
- Define project, source asset, evidence claim, story section, approval and version data models.
- Establish clear empty, loading, success, error and unsupported-file states.
- Keep the sample content clearly marked as demo.

### M1 — Drop In and source inventory
- Upload multiple files and links.
- Preserve original binary assets and metadata.
- Show file type, size, processing status and source preview where supported.
- Persist across sessions; local browser storage is a fallback, not cloud sync.

### M2 — Read and Evidence
- Parse a documented initial set of formats (PDF, DOCX, PPTX, XLSX, TXT, images metadata).
- Show extraction status and failures per file.
- Create traceable evidence claims with source file and page/slide/sheet/filename reference.
- Identify duplicates, contradictions and missing information.

### M3 — Story Plan and approval
- Offer editable sections focused on situation, role, decisions, trade-offs, outcomes and reflection.
- Support reorder, add, edit and remove.
- Support optional target role/audience.
- Compare the outline against the evidence and mark unsupported claims.
- Require explicit approve action; save an immutable approved version.

### M4 — Design and export
- Provide distinct editorial layouts (Bento, Studio, Editorial).
- Use approved content only.
- Support typography, color, image crop and hierarchy controls.
- Preview responsive web case study and exportable presentation/PDF.

### M5 — Publish and portfolio
- Generate stable share links.
- Add public portfolio index and case detail pages.
- Optional Framer CMS adapter after the core publishing model is stable.

## Current implementation status

The repository currently contains an early React/Vite scaffold with a dashboard, demo projects, local project metadata, local evidence notes and browser-local file storage. Some controls and navigation have been improved, but the product workflow is not yet a complete Case Study Engine.

Not implemented yet: reliable document parsing, evidence extraction with source citations, conflict detection, target-role adaptation, editable/reorderable narrative approval, generated case-study output, cloud sync, authentication and public case publishing.

The next development step is to stabilize the app shell and define the domain model and workflow states before adding more isolated UI features.
