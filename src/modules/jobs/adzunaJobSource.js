export class AdzunaJobSource {
    name = "ADZUNA";
    async fetchJobs() {
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
        if (!Number.isInteger(resultsPerPage) ||
            resultsPerPage < 1 ||
            resultsPerPage > 50) {
            throw new Error("ADZUNA_RESULTS_PER_PAGE must be an integer between 1 and 50");
        }
        const url = new URL(`https://api.adzuna.com/v1/api/jobs/${country}/search/1`);
        url.searchParams.set("app_id", appId);
        url.searchParams.set("app_key", appKey);
        url.searchParams.set("what", query);
        url.searchParams.set("results_per_page", String(resultsPerPage));
        url.searchParams.set("content-type", "application/json");
        const response = await fetch(url, {
            headers: {
                Accept: "application/json",
            },
        });
        if (!response.ok) {
            const body = await response.text();
            throw new Error(`Adzuna API request failed: ${response.status} ${response.statusText} - ${body}`);
        }
        const data = (await response.json());
        return (data.results ?? [])
            .filter((job) => job.id !== undefined &&
            job.title &&
            job.redirect_url)
            .map((job) => ({
            externalJobId: String(job.id),
            title: job.title.trim(),
            companyName: job.company?.display_name?.trim() ??
                "Unknown Company",
            location: job.location?.display_name?.trim() ?? null,
            employmentType: [
                job.contract_time,
                job.contract_type,
            ]
                .filter(Boolean)
                .join(" / ") || null,
            remote: false,
            url: job.redirect_url,
            description: job.description ?? null,
            postedAt: job.created
                ? new Date(job.created)
                : null,
            // Skills are intentionally omitted.
            // jobSourceRunner will use the
            // Skill Extraction Engine automatically.
        }));
    }
}
