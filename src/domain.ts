export type ProjectStage =
  | "Drop In"
  | "Read & Analyse"
  | "Evidence"
  | "Story Plan"
  | "Target the Story"
  | "Approve"
  | "Design"
  | "Your Look"
  | "Publish";

export type ProjectStatus =
  | "collecting"
  | "analysing"
  | "evidence_review"
  | "story_draft"
  | "awaiting_approval"
  | "approved"
  | "designing"
  | "ready_to_publish"
  | "published";

export type ProvenanceKind =
  | "source_fact"
  | "user_input"
  | "system_interpretation"
  | "unknown";

export type ReviewState = "unreviewed" | "confirmed" | "rejected" | "needs_attention";
export type ProcessingState = "queued" | "processing" | "ready" | "unsupported" | "failed";
export type TemplateName = "Bento" | "Studio" | "Editorial";
export type PublicationState = "private" | "preview" | "published" | "unpublished";

export interface ProjectRecord {
  id: string;
  slug: string;
  title: string;
  category: string;
  description: string;
  role?: string;
  stage: ProjectStage;
  status: ProjectStatus;
  createdAt: string;
  updatedAt: string;
  isDemo: boolean;
}

export interface SourceAssetRecord {
  id: string;
  projectId: string;
  originalName: string;
  mimeType: string;
  size: number;
  checksum?: string;
  storageKey?: string;
  processing: ProcessingState;
  createdAt: string;
}

export interface SourceLocation {
  assetId: string;
  page?: number;
  slide?: number;
  sheet?: string;
  region?: string;
  urlFragment?: string;
  excerpt?: string;
}

export interface EvidenceClaimRecord {
  id: string;
  projectId: string;
  text: string;
  category: "context" | "problem" | "role" | "constraint" | "decision" | "tradeoff" | "execution" | "outcome" | "metric" | "reflection";
  provenance: ProvenanceKind;
  review: ReviewState;
  confidence?: number;
  sources: SourceLocation[];
  createdAt: string;
  updatedAt: string;
}

export interface StorySectionRecord {
  id: string;
  heading: string;
  body: string;
  order: number;
  evidenceIds: string[];
}

export interface StoryVersionRecord {
  id: string;
  projectId: string;
  revision: number;
  targetRole?: string;
  targetAudience?: string;
  status: "draft" | "awaiting_approval" | "approved" | "superseded";
  sections: StorySectionRecord[];
  createdAt: string;
  updatedAt: string;
  approvedAt?: string;
}

export interface PublicationRecord {
  id: string;
  projectId: string;
  storyVersionId: string;
  state: PublicationState;
  slug: string;
  publicUrl?: string;
  publishedAt?: string;
}

export const DEFAULT_STORY_SECTIONS: Omit<StorySectionRecord, "id">[] = [
  { heading: "Context & stakes", body: "", order: 0, evidenceIds: [] },
  { heading: "The challenge", body: "", order: 1, evidenceIds: [] },
  { heading: "My role & constraints", body: "", order: 2, evidenceIds: [] },
  { heading: "Key decisions", body: "", order: 3, evidenceIds: [] },
  { heading: "What changed", body: "", order: 4, evidenceIds: [] },
  { heading: "Outcomes & evidence", body: "", order: 5, evidenceIds: [] },
  { heading: "Reflection", body: "", order: 6, evidenceIds: [] },
];

export function slugify(value: string): string {
  return value
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

export function createProjectRecord(input: {
  title: string;
  category: string;
  description?: string;
  isDemo?: boolean;
}): ProjectRecord {
  const now = new Date().toISOString();
  const id = crypto.randomUUID();
  return {
    id,
    slug: slugify(input.title) || id,
    title: input.title.trim(),
    category: input.category,
    description: input.description?.trim() ?? "",
    stage: "Drop In",
    status: "collecting",
    createdAt: now,
    updatedAt: now,
    isDemo: input.isDemo ?? false,
  };
}

export function canPublish(project: ProjectRecord, approvedVersion?: StoryVersionRecord): boolean {
  return (
    project.status === "ready_to_publish" &&
    approvedVersion?.status === "approved" &&
    Boolean(approvedVersion.approvedAt)
  );
}
