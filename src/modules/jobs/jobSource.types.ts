export interface ExternalJobRecord {
  externalJobId: string;
  title: string;
  companyName: string;
  location?: string | null;
  employmentType?: string | null;
  remote?: boolean;
  url: string;
  description?: string | null;
  postedAt?: Date | null;
  expiresAt?: Date | null;

  skills?: {
    skillName: string;
    normalizedName: string;
    category: string;
    requirementType: "REQUIRED" | "PREFERRED";
    importance: number;
  }[];
}

export interface JobSource {
  name: string;

  fetchJobs(): Promise<ExternalJobRecord[]>;
}