import type { ExternalJobRecord, JobSource } from "./jobSource.types.js";

import { Agent, fetch as undiciFetch } from "undici";

interface AdzunaResponse {
  results?: Array<{
    id: string | number;
    title?: string;
    description?: string;
    redirect_url?: string;
    created?: string;

    company?: {
      display_name?: string;
    };

    location?: {
      display_name?: string;
    };

    contract_type?: string;
    contract_time?: string;
  }>;
}

/**
 * Force the Adzuna connection to use IPv4.
 *
 * The current environment allows connectivity to Adzuna
 * over IPv4, while Node/Undici was timing out while trying
 * the available IPv4/IPv6 addresses.
 */
const ipv4Agent = new Agent({
  connect: {
    family: 4,
  },
});

export class AdzunaJobSource implements JobSource {
  name = "ADZUNA";

  async fetchJobs(): Promise<ExternalJobRecord[]> {
    const appId = process.env.ADZUNA_APP_ID;

    const appKey = process.env.ADZUNA_APP_KEY;

    const country = process.env.ADZUNA_COUNTRY;

    const query = process.env.ADZUNA_QUERY ?? "software developer";

    const resultsPerPage = Number(process.env.ADZUNA_RESULTS_PER_PAGE ?? "20");

    if (!appId) {
      throw new Error("Missing ADZUNA_APP_ID");
    }

    if (!appKey) {
      throw new Error("Missing ADZUNA_APP_KEY");
    }

    if (!country) {
      throw new Error("Missing ADZUNA_COUNTRY");
    }

    if (
      !Number.isInteger(resultsPerPage) ||
      resultsPerPage < 1 ||
      resultsPerPage > 50
    ) {
      throw new Error(
        "ADZUNA_RESULTS_PER_PAGE must be an integer between 1 and 50",
      );
    }

    const url = new URL(
      `https://api.adzuna.com/v1/api/jobs/${country}/search/1`,
    );

    url.searchParams.set("app_id", appId);

    url.searchParams.set("app_key", appKey);

    url.searchParams.set("what", query);

    url.searchParams.set("results_per_page", String(resultsPerPage));

    url.searchParams.set("content-type", "application/json");

    console.log(`Fetching jobs from Adzuna: ${url.origin}${url.pathname}`);

    let response;

    try {
      response = await undiciFetch(url, {
        dispatcher: ipv4Agent,
        headers: {
          Accept: "application/json",
        },
        signal: AbortSignal.timeout(15000),
      });
    } catch (error) {
      console.error("Adzuna network request failed:", error);

      throw new Error("Unable to connect to the Adzuna API");
    }

    if (!response.ok) {
      const body = await response.text();

      throw new Error(
        `Adzuna API request failed: ${response.status} ${response.statusText} - ${body}`,
      );
    }

    const data = (await response.json()) as AdzunaResponse;

    return (data.results ?? [])
      .filter(
        (job) =>
          job.id !== undefined &&
          Boolean(job.title) &&
          Boolean(job.redirect_url),
      )
      .map((job) => ({
        externalJobId: String(job.id),

        title: job.title!.trim(),

        companyName: job.company?.display_name?.trim() ?? "Unknown Company",

        location: job.location?.display_name?.trim() ?? null,

        employmentType:
          [job.contract_time, job.contract_type].filter(Boolean).join(" / ") ||
          null,

        remote: false,

        url: job.redirect_url!,

        description: job.description ?? null,

        postedAt: job.created ? new Date(job.created) : null,

        // Skills are intentionally omitted.
        // jobSourceRunner will use the
        // Skill Extraction Engine automatically.
      }));
  }
}
