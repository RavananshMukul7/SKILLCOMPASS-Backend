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
 * Number of jobs SkillCompass keeps from each full Adzuna sync.
 *
 * The source is requested in pages and only the latest TARGET_JOB_COUNT
 * records are returned to the job-sync pipeline.
 */
const TARGET_JOB_COUNT = 1000;

/**
 * Force the Adzuna connection to use IPv4.
 *
 * The current environment allows connectivity to Adzuna over IPv4,
 * while Node/Undici was timing out while trying the available
 * IPv4/IPv6 addresses.
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

    /**
     * Adzuna allows up to 50 results per search page in the configuration
     * used by this integration.
     *
     * Keeping this configurable is useful for development/testing, while
     * the total sync target remains 1,000 jobs.
     */
    const resultsPerPage = Number(
      process.env.ADZUNA_RESULTS_PER_PAGE ?? "50",
    );

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

    const maxPages = Math.ceil(TARGET_JOB_COUNT / resultsPerPage);
    const jobsByExternalId = new Map<string, ExternalJobRecord>();

    for (let page = 1; page <= maxPages; page += 1) {
      const url = new URL(
        `https://api.adzuna.com/v1/api/jobs/${country}/search/${page}`,
      );

      url.searchParams.set("app_id", appId);
      url.searchParams.set("app_key", appKey);
      url.searchParams.set("what", query);
      url.searchParams.set("results_per_page", String(resultsPerPage));

      /**
       * Request newest jobs first.
       */
      url.searchParams.set("sort_by", "date");
      url.searchParams.set("content-type", "application/json");

      console.log(
        `Fetching Adzuna jobs page ${page}/${maxPages}: ` +
          `${url.origin}${url.pathname}`,
      );

      let response: Awaited<ReturnType<typeof undiciFetch>>;

      try {
        response = await undiciFetch(url, {
          dispatcher: ipv4Agent,
          headers: {
            Accept: "application/json",
          },
          signal: AbortSignal.timeout(15000),
        });
      } catch (error) {
        console.error(
          `Adzuna network request failed on page ${page}:`,
          error,
        );

        throw new Error("Unable to connect to the Adzuna API");
      }

      if (!response.ok) {
        const body = await response.text();

        throw new Error(
          `Adzuna API request failed on page ${page}: ` +
            `${response.status} ${response.statusText} - ${body}`,
        );
      }

      const data = (await response.json()) as AdzunaResponse;

      const pageJobs = (data.results ?? [])
        .filter(
          (job) =>
            job.id !== undefined &&
            Boolean(job.title) &&
            Boolean(job.redirect_url),
        )
        .map(
          (job): ExternalJobRecord => ({
            externalJobId: String(job.id),
            title: job.title!.trim(),
            companyName:
              job.company?.display_name?.trim() ?? "Unknown Company",
            location: job.location?.display_name?.trim() ?? null,
            employmentType:
              [job.contract_time, job.contract_type]
                .filter(Boolean)
                .join(" / ") || null,
            remote: false,
            url: job.redirect_url!,
            description: job.description ?? null,
            postedAt: job.created ? new Date(job.created) : null,

            /**
             * Skills are intentionally omitted here.
             *
             * jobSourceRunner combines source data with the Skill
             * Extraction Engine before passing the job to ingestion.
             */
          }),
        );

      if (pageJobs.length === 0) {
        console.log(
          `Adzuna returned no jobs on page ${page}. ` +
            `Stopping pagination.`,
        );
        break;
      }

      for (const job of pageJobs) {
        if (jobsByExternalId.size >= TARGET_JOB_COUNT) {
          break;
        }

        jobsByExternalId.set(job.externalJobId, job);
      }

      console.log(
        `Adzuna page ${page}: fetched ${pageJobs.length}, ` +
          `total unique jobs collected: ${jobsByExternalId.size}/${TARGET_JOB_COUNT}`,
      );

      if (jobsByExternalId.size >= TARGET_JOB_COUNT) {
        break;
      }

      /**
       * If the API gives us fewer results than requested, there may be
       * no more useful pages to consume.
       */
      if (pageJobs.length < resultsPerPage) {
        console.log(
          `Adzuna returned fewer than ${resultsPerPage} jobs on page ${page}. ` +
            `Stopping pagination.`,
        );
        break;
      }
    }

    const jobs = Array.from(jobsByExternalId.values()).slice(
      0,
      TARGET_JOB_COUNT,
    );

    /**
     * Keep the final returned collection explicitly ordered by newest
     * posting date. This also protects the ordering if the upstream
     * response contains equal or slightly inconsistent page ordering.
     */
    jobs.sort((first, second) => {
      const firstTime = first.postedAt?.getTime() ?? 0;
      const secondTime = second.postedAt?.getTime() ?? 0;

      return secondTime - firstTime;
    });

    console.log(
      `Adzuna sync collection complete: ${jobs.length}/${TARGET_JOB_COUNT} jobs prepared.`,
    );

    return jobs.slice(0, TARGET_JOB_COUNT);
  }
}
