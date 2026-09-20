import axios from "axios";

export async function exchangeCodeForToken(code) {
  const params = new URLSearchParams();

  params.append("client_id", process.env.GITHUB_CLIENT_ID);
  params.append("client_secret", process.env.GITHUB_CLIENT_SECRET);
  params.append("code", code);
  params.append("redirect_uri", process.env.GITHUB_CALLBACK_URL);

  console.log("Token exchange callback URL:");
  console.log(process.env.GITHUB_CALLBACK_URL);

  const response = await axios.post(
    "https://github.com/login/oauth/access_token",
    params.toString(),
    {
      headers: {
        Accept: "application/json",
        "Content-Type": "application/x-www-form-urlencoded"
      }
    }
  );

  console.log("GitHub token response:", {
    error: response.data.error,
    error_description: response.data.error_description,
    scope: response.data.scope,
    token_type: response.data.token_type
  });

  return response.data;
}