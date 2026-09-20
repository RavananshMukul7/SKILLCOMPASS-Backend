import axios from "axios";

const ADZUNA_BASE_URL =
  "https://api.adzuna.com/v1/api";

export async function searchJobs({
  query,
  location = "India",
  page = 1,
  resultsPerPage = 20
}) {
  const response = await axios.get(
    `${ADZUNA_BASE_URL}/jobs/in/search/${page}`,
    {
      params: {
        app_id: process.env.ADZUNA_APP_ID,
        app_key: process.env.ADZUNA_APP_KEY,
        results_per_page: resultsPerPage,
        what: query,
        where: location,
        "content-type": "application/json"
      }
    }
  );

  return response.data.results;
}