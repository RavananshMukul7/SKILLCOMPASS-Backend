export interface TechnologyDetectionEvidence {
  path: string;
  content?: string;
  evidenceType: string;
  evidenceValue: string;
}

export interface DetectedTechnology {
  technologyName: string;
  normalizedName: string;
  category:
    | "LANGUAGE"
    | "FRAMEWORK"
    | "LIBRARY"
    | "DATABASE"
    | "DEVOPS"
    | "CLOUD"
    | "TOOLING"
    | "CONCEPT"
    | "PLATFORM";

  confidence: number;

  evidence: TechnologyDetectionEvidence[];
}

export interface TechnologyDetectionInput {
  repositoryName: string;
  defaultBranch: string | null;

  languages: Record<string, number>;

  files: Array<{
    path: string;
    content: string;
  }>;
}

export interface TechnologyDetectionResult {
  technologies: DetectedTechnology[];
}