# Portfolio Studio — Product Specification

## 1. Product definition

Portfolio Studio is an evidence-backed Case Study Engine that turns old case studies and unstructured project folders into current, target-aware professional stories.

It is not primarily a portfolio CMS, a generic AI writer, or a collection of templates. The engine reconstructs the story; the portfolio and presentation are outputs.

## 2. Primary user problem

Creative professionals have valuable work buried in old portfolios, PDFs, slide decks, documents, spreadsheets, screenshots, research notes and folders. Their experience and standards have evolved, but the material remains scattered or told through outdated narratives.

The product must make it easy to start with imperfect, incomplete material and safely move toward a stronger case study without fabricating facts or losing provenance.

## 3. Core experience

### A. Drop In
- Add the old case study plus any related project files.
- Support multi-file upload, drag-and-drop, URLs and manual notes.
- Do not require pre-organization.
- Preserve originals and show an inventory with type, size and processing state.

### B. Read & Analyse
- Parse supported formats through explicit file-type adapters.
- Display per-file processing status, parsed preview and clear errors.
- Track page, slide, sheet, image or URL origin when possible.
- Group related information while retaining each original source.
- Never imply a file was read if only its filename or metadata was captured.

### C. Evidence
- Capture facts in structured categories: context, problem, role, constraints, decisions, trade-offs, execution, outcomes, metrics and reflection.
- Every extracted claim should link to one or more sources.
- Label content as source fact, user-provided assertion, system interpretation or unknown.
- Flag conflicts, weak evidence and missing information.
- Let the user edit, confirm, reject or add claims.

### D. Story Plan
- Generate a proposed narrative based on the evidence.
- Prioritize decisions, rationale, contribution and change over generic process sequences.
- Default story structure:
  1. Context and stakes
  2. The challenge
  3. The user's role and constraints
  4. Key decisions and trade-offs
  5. What was made or changed
  6. Outcomes and supporting evidence
  7. Reflection and what carries forward
- Sections are editable, reorderable, removable and addable.

### E. Target the Story
- Optional target role, audience, industry or opportunity.
- Recommend emphasis and language changes based on the target.
- Keep the underlying facts unchanged.
- Never invent skills, responsibilities, outcomes or metrics to fit a job description.
- Show what evidence supports each recommended emphasis.

### F. Approve
- Present the evidence set and complete outline for review.
- Provide explicit approve, send back for edits and save draft actions.
- No generated final design or published version before approval.
- Store the approved revision so later edits do not silently overwrite it.

### G. Design and Your Look
- Use approved narrative content only.
- Offer distinct editorial systems: Bento, Studio and Editorial.
- Support typography, color, spacing, image selection/crop and content hierarchy.
- Layout presets must visibly change the output, not merely show a selected state.
- Allow per-case styling while preserving a reusable personal brand kit.

### H. Publish / Export
- Produce a responsive case study page and standalone shareable presentation.
- PDF export is a later output adapter.
- Public publishing requires preview, explicit confirmation and stable versioning.
- External publishing destinations such as Framer are optional adapters, not core storage.

## 4. Key data entities

- Project: id, title, category, description, current stage, timestamps.
- SourceAsset: id, project id, original filename, MIME type, size, storage key, checksum, processing status.
- SourceLocation: asset id, page/slide/sheet/region/url fragment, extracted text range.
- EvidenceClaim: id, project id, claim text, category, provenance type, confidence, status, source locations.
- StoryVersion: id, project id, target context, ordered sections, status, revision number.
- StorySection: id, version id, heading, body, evidence references, order.
- Approval: version id, approved by, approved timestamp, approval notes.
- DesignPreset: id, name, layout tokens and supported content patterns.
- BrandKit: user-level visual tokens and typography.
- Publication: story version id, destination, public URL, status, published timestamp.

## 5. Workflow states

Project: collecting → analysing → evidence_review → story_draft → awaiting_approval → approved → designing → ready_to_publish → published.

Every stage must have a recoverable draft and explicit failure state. Users can revisit earlier stages without losing later versions.

## 6. Trust requirements

- Preserve uploaded originals.
- No fabricated or silently inferred facts.
- Traceable source references for extracted claims.
- Visible unsupported-file and extraction-failure states.
- Distinguish confirmed, user-entered, inferred and unknown.
- Conflict review when sources disagree.
- Explicit human approval before final design.
- Immutable approved snapshots and version history.

## 7. Visual direction

Approved direction: minimalist, contemporary editorial and image-led.
- Paper #fffcf4
- Ink #2c2c2c
- Accent #ff961a
- Expressive typography, clear sans-serif hierarchy and restrained serif contrast.
- Large visual material, layered source previews, editorial grids and generous whitespace.
- Avoid generic SaaS dashboard patterns, gradients, ornamental buttons and heavy dark panels.
- The workspace UI stays clear and functional; the published case study can have its own art direction.

## 8. MVP sequencing

1. Stabilize the app shell and remove inert controls.
2. Define typed domain models and persistent storage contracts.
3. Build Drop In source inventory and durable original-file storage.
4. Add parsing for a limited, documented set of formats.
5. Build traceable Evidence review.
6. Build editable/reorderable Story Plan and explicit approval.
7. Add target-aware narrative guidance.
8. Build responsive design output and export.
9. Add public publishing and external adapters.

## 9. Non-goals for the first milestone

- Fully autonomous portfolio generation.
- Automatic publishing without approval.
- Cross-device cloud sync before auth and backend are implemented.
- Unsupported file types presented as successfully analysed.
- Framer or AI provider dependency for core project functionality.

## 10. Definition of done for a milestone

Each milestone requires:
- Functional UI states for loading, success, empty, failure and unsupported conditions.
- Keyboard and pointer-accessible controls.
- No decorative element presented as an active button.
- Build/typecheck passing.
- A browser-level smoke test of the actual published app.
- A clear statement of what is and is not implemented.
