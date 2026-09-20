import type { OpenAPIV3 } from "openapi-types";

const swaggerDocument: OpenAPIV3.Document = {
  openapi: "3.0.3",

  info: {
    title: "SkillCompass API",
    version: "1.0.0",
    description:
      "API documentation for the SkillCompass AI Career Intelligence Platform.",
  },

  servers: [
    {
      url: "http://localhost:3000",
      description: "Local development server",
    },
  ],

  tags: [
    {
      name: "Health",
      description: "API health and availability",
    },
    {
      name: "Authentication",
      description: "User authentication and session management",
    },
    {
      name: "GitHub",
      description: "GitHub OAuth and repository synchronization",
    },
    {
      name: "Analysis",
      description: "Repository analysis and analysis run management",
    },
    {
      name: "Dashboard",
      description: "User dashboard data",
    },
    {
      name: "Matching",
      description: "Job matching and skill gap analysis",
    },
    {
      name: "Jobs",
      description: "Job synchronization and recommendations",
    },
  ],

  components: {
    securitySchemes: {
      sessionCookie: {
        type: "apiKey",
        in: "cookie",
        name: "session",
        description: "HTTP-only SkillCompass session cookie.",
      },
    },

    schemas: {
      ErrorResponse: {
        type: "object",
        properties: {
          success: {
            type: "boolean",
            example: false,
          },
          message: {
            type: "string",
            example: "Authentication required",
          },
        },
        required: ["success", "message"],
      },

      User: {
        type: "object",
        properties: {
          id: {
            type: "string",
            example: "clx123456789",
          },
          email: {
            type: "string",
            format: "email",
            example: "user@example.com",
          },
          displayName: {
            type: "string",
            nullable: true,
            example: "Ravanansh",
          },
        },
        required: ["id", "email", "displayName"],
      },

      AnalysisRun: {
        type: "object",
        properties: {
          id: {
            type: "string",
            example: "run-123",
          },
          repositoryId: {
            type: "string",
            example: "repo-123",
          },
          status: {
            type: "string",
            example: "COMPLETED",
          },
          startedAt: {
            type: "string",
            format: "date-time",
            nullable: true,
          },
          completedAt: {
            type: "string",
            format: "date-time",
            nullable: true,
          },
          errorMessage: {
            type: "string",
            nullable: true,
          },
          createdAt: {
            type: "string",
            format: "date-time",
          },
        },
      },

      Job: {
        type: "object",
        properties: {
          id: {
            type: "string",
            example: "job-123",
          },
          title: {
            type: "string",
            example: "Backend Developer",
          },
          companyName: {
            type: "string",
            example: "Example Technologies",
          },
          location: {
            type: "string",
            nullable: true,
            example: "Remote",
          },
          employmentType: {
            type: "string",
            nullable: true,
            example: "FULL_TIME",
          },
          remote: {
            type: "boolean",
            nullable: true,
            example: true,
          },
          url: {
            type: "string",
            format: "uri",
            nullable: true,
          },
        },
      },

      MatchRequest: {
        type: "object",
        required: ["analysisRunId"],
        properties: {
          analysisRunId: {
            type: "string",
            format: "uuid",
            example: "550e8400-e29b-41d4-a716-446655440000",
          },
        },
      },

      JobMatch: {
        type: "object",
        properties: {
          id: {
            type: "string",
          },
          userId: {
            type: "string",
          },
          jobId: {
            type: "string",
          },
          analysisRunId: {
            type: "string",
          },
          matchScore: {
            type: "number",
            example: 82.5,
          },
          skillCoverage: {
            type: "number",
            example: 85,
          },
          skillGapCount: {
            type: "integer",
            example: 3,
          },
          explanation: {
            type: "string",
            nullable: true,
          },
          algorithmVersion: {
            type: "string",
            example: "weighted-skill-v1",
          },
          createdAt: {
            type: "string",
            format: "date-time",
          },
          updatedAt: {
            type: "string",
            format: "date-time",
          },
          job: {
            $ref: "#/components/schemas/Job",
          },
        },
      },

      SkillGap: {
        type: "object",
        properties: {
          id: {
            type: "string",
          },
          skill: {
            type: "object",
            properties: {
              id: {
                type: "string",
              },
              name: {
                type: "string",
              },
              normalizedName: {
                type: "string",
              },
              category: {
                type: "string",
                nullable: true,
              },
            },
          },
          currentScore: {
            type: "number",
          },
          requiredImportance: {
            type: "number",
          },
          gapScore: {
            type: "number",
          },
          priority: {
            type: "number",
          },
          analysisRunId: {
            type: "string",
          },
        },
      },
    },
  },

  paths: {

    /*
     * ============================================================
     * AUTHENTICATION
     * ============================================================
     */

    "/api/auth/register": {
      get: {
        tags: ["Authentication"],
        summary: "Open registration page",
        responses: {
          "200": {
            description: "Registration page rendered successfully.",
          },
        },
      },

      post: {
        tags: ["Authentication"],
        summary: "Register a new user",
        description:
          "Creates a new SkillCompass account and establishes a session.",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["email", "password"],
                properties: {
                  email: {
                    type: "string",
                    format: "email",
                    example: "user@example.com",
                  },
                  password: {
                    type: "string",
                    format: "password",
                    example: "TestPassword123!",
                  },
                  displayName: {
                    type: "string",
                    example: "Ravanansh",
                  },
                },
              },
            },
          },
        },
        responses: {
          "201": {
            description: "User registered successfully.",
          },
          "400": {
            description: "Validation failed.",
          },
          "409": {
            description: "An account with this email already exists.",
          },
        },
      },
    },

    "/api/auth/login": {
      get: {
        tags: ["Authentication"],
        summary: "Open login page",
        responses: {
          "200": {
            description: "Login page rendered successfully.",
          },
        },
      },

      post: {
        tags: ["Authentication"],
        summary: "Log in",
        description:
          "Authenticates a user and establishes a session using an HTTP-only session cookie.",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["email", "password"],
                properties: {
                  email: {
                    type: "string",
                    format: "email",
                    example: "user@example.com",
                  },
                  password: {
                    type: "string",
                    format: "password",
                    example: "TestPassword123!",
                  },
                },
              },
            },
          },
        },
        responses: {
          "200": {
            description: "Login successful.",
          },
          "400": {
            description: "Validation failed.",
          },
          "401": {
            description: "Invalid email or password.",
          },
        },
      },
    },

    "/api/auth/logout": {
      post: {
        tags: ["Authentication"],
        summary: "Log out",
        description:
          "Revokes the current session and clears the session cookie.",
        security: [
          {
            sessionCookie: [],
          },
        ],
        responses: {
          "200": {
            description: "Logged out successfully.",
          },
        },
      },
    },

    "/api/auth/me": {
      get: {
        tags: ["Authentication"],
        summary: "Get current user",
        description: "Returns the currently authenticated SkillCompass user.",
        security: [
          {
            sessionCookie: [],
          },
        ],
        responses: {
          "200": {
            description: "Authenticated user information.",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    success: {
                      type: "boolean",
                      example: true,
                    },
                    data: {
                      type: "object",
                      properties: {
                        user: {
                          $ref: "#/components/schemas/User",
                        },
                      },
                    },
                  },
                },
              },
            },
          },
          "401": {
            description: "Authentication required.",
          },
        },
      },
    },

    "/api/auth/sessions": {
      get: {
        tags: ["Authentication"],
        summary: "List active sessions",
        description: "Returns the authenticated user's active sessions.",
        security: [
          {
            sessionCookie: [],
          },
        ],
        responses: {
          "200": {
            description: "Active sessions.",
          },
          "401": {
            description: "Authentication required.",
          },
        },
      },
    },

    "/api/auth/sessions/{sessionId}": {
      delete: {
        tags: ["Authentication"],
        summary: "Revoke a session",
        description:
          "Revokes one active session belonging to the authenticated user.",
        security: [
          {
            sessionCookie: [],
          },
        ],
        parameters: [
          {
            name: "sessionId",
            in: "path",
            required: true,
            schema: {
              type: "string",
            },
            description: "ID of the session to revoke.",
          },
        ],
        responses: {
          "204": {
            description: "Session revoked successfully.",
          },
          "400": {
            description: "Invalid session ID.",
          },
          "401": {
            description: "Authentication required.",
          },
          "404": {
            description: "Session not found.",
          },
        },
      },
    },

    "/api/auth/logout-all": {
      post: {
        tags: ["Authentication"],
        summary: "Log out all sessions",
        description:
          "Revokes all active sessions belonging to the authenticated user.",
        security: [
          {
            sessionCookie: [],
          },
        ],
        responses: {
          "200": {
            description: "All sessions revoked successfully.",
          },
          "401": {
            description: "Authentication required.",
          },
        },
      },
    },

    /*
     * ============================================================
     * GITHUB
     * ============================================================
     */

    "/api/github/connect": {
      get: {
        tags: ["GitHub"],
        summary: "Start GitHub OAuth connection",
        description:
          "Starts the GitHub OAuth authorization flow for the authenticated SkillCompass user.",
        security: [
          {
            sessionCookie: [],
          },
        ],
        responses: {
          "302": {
            description: "Redirects the user to GitHub authorization.",
          },
          "401": {
            description: "Authentication required.",
            content: {
              "application/json": {
                schema: {
                  $ref: "#/components/schemas/ErrorResponse",
                },
              },
            },
          },
        },
      },
    },

    "/api/github/callback": {
      get: {
        tags: ["GitHub"],
        summary: "GitHub OAuth callback",
        description: "Handles the callback from GitHub after authorization.",
        parameters: [
          {
            name: "code",
            in: "query",
            required: false,
            schema: {
              type: "string",
            },
          },
          {
            name: "state",
            in: "query",
            required: false,
            schema: {
              type: "string",
            },
          },
          {
            name: "error",
            in: "query",
            required: false,
            schema: {
              type: "string",
            },
          },
          {
            name: "error_description",
            in: "query",
            required: false,
            schema: {
              type: "string",
            },
          },
        ],
        responses: {
          "302": {
            description: "Redirects after completing the GitHub OAuth flow.",
          },
          "400": {
            description: "Invalid or incomplete OAuth callback.",
          },
          "502": {
            description: "Unable to communicate with GitHub.",
          },
        },
      },
    },

    "/api/github/repositories/sync": {
      post: {
        tags: ["GitHub"],
        summary: "Synchronize GitHub repositories",
        description:
          "Fetches the authenticated user's GitHub repositories and synchronizes them with SkillCompass.",
        security: [
          {
            sessionCookie: [],
          },
        ],
        responses: {
          "200": {
            description: "Repositories synchronized successfully.",
          },
          "401": {
            description: "Authentication required.",
          },
          "502": {
            description: "Unable to communicate with GitHub.",
          },
        },
      },
    },

    /*
     * ============================================================
     * ANALYSIS
     * ============================================================
     */

    "/api/analysis/repositories/{repositoryId}/analyze": {
      post: {
        tags: ["Analysis"],
        summary: "Analyze a repository",
        description:
          "Starts an analysis run for a repository owned by the authenticated user.",
        security: [
          {
            sessionCookie: [],
          },
        ],
        parameters: [
          {
            name: "repositoryId",
            in: "path",
            required: true,
            schema: {
              type: "string",
            },
            description: "SkillCompass repository ID.",
          },
        ],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                description:
                  "Request body validated by analyzeRepositorySchema.",
                additionalProperties: true,
              },
            },
          },
        },
        responses: {
          "200": {
            description: "Repository analysis started successfully.",
          },
          "400": {
            description: "Invalid analysis request.",
          },
          "401": {
            description: "Authentication required.",
          },
          "404": {
            description: "Repository not found.",
          },
          "409": {
            description: "An analysis is already running for this repository.",
          },
        },
      },
    },

    "/api/analysis/latest": {
      get: {
        tags: ["Analysis"],
        summary: "Get latest completed analysis",
        security: [
          {
            sessionCookie: [],
          },
        ],
        responses: {
          "200": {
            description: "Latest completed analysis.",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    success: {
                      type: "boolean",
                      example: true,
                    },
                    data: {
                      $ref: "#/components/schemas/AnalysisRun",
                    },
                  },
                },
              },
            },
          },
          "401": {
            description: "Authentication required.",
          },
          "404": {
            description: "No completed analysis found.",
          },
        },
      },
    },

    "/api/analysis/repositories/{repositoryId}/runs": {
      get: {
        tags: ["Analysis"],
        summary: "Get repository analysis runs",
        security: [
          {
            sessionCookie: [],
          },
        ],
        parameters: [
          {
            name: "repositoryId",
            in: "path",
            required: true,
            schema: {
              type: "string",
            },
          },
        ],
        responses: {
          "200": {
            description: "Analysis runs for the repository.",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    success: {
                      type: "boolean",
                      example: true,
                    },
                    data: {
                      type: "object",
                      properties: {
                        repository: {
                          type: "object",
                          properties: {
                            id: {
                              type: "string",
                            },
                            name: {
                              type: "string",
                            },
                            fullName: {
                              type: "string",
                            },
                          },
                        },
                        runs: {
                          type: "array",
                          items: {
                            $ref: "#/components/schemas/AnalysisRun",
                          },
                        },
                      },
                    },
                  },
                },
              },
            },
          },
          "401": {
            description: "Authentication required.",
          },
          "404": {
            description: "Repository not found.",
          },
        },
      },
    },

    "/api/analysis/runs/{analysisRunId}/status": {
      get: {
        tags: ["Analysis"],
        summary: "Get analysis run status",
        security: [
          {
            sessionCookie: [],
          },
        ],
        parameters: [
          {
            name: "analysisRunId",
            in: "path",
            required: true,
            schema: {
              type: "string",
            },
          },
        ],
        responses: {
          "200": {
            description: "Analysis run status.",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    success: {
                      type: "boolean",
                    },
                    data: {
                      $ref: "#/components/schemas/AnalysisRun",
                    },
                  },
                },
              },
            },
          },
          "401": {
            description: "Authentication required.",
          },
          "404": {
            description: "Analysis run not found.",
          },
        },
      },
    },

    "/api/analysis/runs/{analysisRunId}": {
      get: {
        tags: ["Analysis"],
        summary: "Get analysis result",
        security: [
          {
            sessionCookie: [],
          },
        ],
        parameters: [
          {
            name: "analysisRunId",
            in: "path",
            required: true,
            schema: {
              type: "string",
            },
          },
        ],
        responses: {
          "200": {
            description: "Analysis result.",
          },
          "400": {
            description: "Invalid analysis run ID.",
          },
          "401": {
            description: "Authentication required.",
          },
          "404": {
            description: "Analysis run not found.",
          },
        },
      },
    },

    /*
     * ============================================================
     * MATCHING
     * ============================================================
     */

    "/api/matching/jobs/{jobId}/match": {
      post: {
        tags: ["Matching"],
        summary: "Calculate job match",
        description:
          "Calculates how well the authenticated user's skills match a job using a completed analysis run.",
        security: [
          {
            sessionCookie: [],
          },
        ],
        parameters: [
          {
            name: "jobId",
            in: "path",
            required: true,
            schema: {
              type: "string",
            },
          },
        ],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                $ref: "#/components/schemas/MatchRequest",
              },
            },
          },
        },
        responses: {
          "200": {
            description: "Job match calculated successfully.",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    success: {
                      type: "boolean",
                      example: true,
                    },
                    data: {
                      type: "object",
                      properties: {
                        job: {
                          $ref: "#/components/schemas/Job",
                        },
                        analysisRunId: {
                          type: "string",
                        },
                        match: {
                          type: "object",
                        },
                      },
                    },
                  },
                },
              },
            },
          },
          "400": {
            description: "Invalid job ID or request body.",
          },
          "401": {
            description: "Authentication required.",
          },
          "404": {
            description: "Completed analysis run or job not found.",
          },
        },
      },

      get: {
        tags: ["Matching"],
        summary: "Get existing job match",
        security: [
          {
            sessionCookie: [],
          },
        ],
        parameters: [
          {
            name: "jobId",
            in: "path",
            required: true,
            schema: {
              type: "string",
            },
          },
          {
            name: "analysisRunId",
            in: "query",
            required: true,
            schema: {
              type: "string",
            },
          },
        ],
        responses: {
          "200": {
            description: "Existing job match.",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    success: {
                      type: "boolean",
                    },
                    data: {
                      $ref: "#/components/schemas/JobMatch",
                    },
                  },
                },
              },
            },
          },
          "400": {
            description: "Missing analysisRunId query parameter.",
          },
          "401": {
            description: "Authentication required.",
          },
          "404": {
            description: "Job match not found.",
          },
        },
      },
    },

    "/api/matching/jobs/{jobId}/gaps": {
      get: {
        tags: ["Matching"],
        summary: "Get skill gaps for a job",
        security: [
          {
            sessionCookie: [],
          },
        ],
        parameters: [
          {
            name: "jobId",
            in: "path",
            required: true,
            schema: {
              type: "string",
            },
          },
          {
            name: "analysisRunId",
            in: "query",
            required: true,
            schema: {
              type: "string",
            },
          },
        ],
        responses: {
          "200": {
            description: "Skill gaps for the selected job and analysis run.",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    success: {
                      type: "boolean",
                      example: true,
                    },
                    data: {
                      type: "array",
                      items: {
                        $ref: "#/components/schemas/SkillGap",
                      },
                    },
                  },
                },
              },
            },
          },
          "400": {
            description: "Missing analysisRunId query parameter.",
          },
          "401": {
            description: "Authentication required.",
          },
        },
      },
    },

    /*
     * ============================================================
     * JOBS
     * ============================================================
     */

    "/api/jobs/recommended": {
      get: {
        tags: ["Jobs"],
        summary: "Get recommended jobs",
        description:
          "Returns jobs recommended for the authenticated user based on a completed analysis run.",
        security: [
          {
            sessionCookie: [],
          },
        ],
        parameters: [
          {
            name: "analysisRunId",
            in: "query",
            required: true,
            schema: {
              type: "string",
              format: "uuid",
            },
            description: "Completed analysis run used for job recommendations.",
          },
          {
            name: "minScore",
            in: "query",
            required: false,
            schema: {
              type: "number",
              minimum: 0,
              maximum: 100,
              default: 0,
            },
            description: "Minimum job match score.",
          },
          {
            name: "search",
            in: "query",
            required: false,
            schema: {
              type: "string",
            },
            description: "Optional job search text.",
          },
          {
            name: "remote",
            in: "query",
            required: false,
            schema: {
              type: "string",
              enum: ["true", "false"],
            },
            description: "Filter jobs by remote availability.",
          },
          {
            name: "limit",
            in: "query",
            required: false,
            schema: {
              type: "integer",
              minimum: 1,
              maximum: 50,
              default: 20,
            },
            description: "Maximum number of jobs to return.",
          },
        ],
        responses: {
          "200": {
            description: "Recommended jobs returned successfully.",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    success: {
                      type: "boolean",
                      example: true,
                    },
                    data: {
                      type: "array",
                      items: {
                        $ref: "#/components/schemas/Job",
                      },
                    },
                  },
                },
              },
            },
          },
          "400": {
            description: "Invalid query parameters.",
          },
          "401": {
            description: "Authentication required.",
          },
          "404": {
            description: "Completed analysis run not found.",
          },
        },
      },
    },

    "/api/jobs/recommended/generate": {
      post: {
        tags: ["Jobs"],
        summary: "Generate job recommendations",
        description:
          "Calculates and stores job matches for all jobs with skills using a completed analysis run.",
        security: [
          {
            sessionCookie: [],
          },
        ],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                $ref: "#/components/schemas/MatchRequest",
              },
            },
          },
        },
        responses: {
          "200": {
            description: "Job recommendations generated successfully.",
          },
          "400": {
            description: "A valid analysisRunId is required.",
          },
          "401": {
            description: "Authentication required.",
          },
          "404": {
            description: "Completed analysis run not found.",
          },
        },
      },
    },

    "/api/jobs/sources/{sourceName}/sync": {
      post: {
        tags: ["Jobs"],
        summary: "Synchronize a job source",
        description: "Synchronizes jobs from a specific configured job source.",
        security: [
          {
            sessionCookie: [],
          },
        ],
        parameters: [
          {
            name: "sourceName",
            in: "path",
            required: true,
            schema: {
              type: "string",
            },
            description: "Name of the configured job source.",
            example: "adzuna",
          },
        ],
        responses: {
          "200": {
            description: "Job source synchronized successfully.",
          },
          "400": {
            description: "Invalid job source.",
          },
          "401": {
            description: "Authentication required.",
          },
          "500": {
            description: "Job source synchronization failed.",
          },
        },
      },
    },

    "/api/jobs/sources/sync-all": {
      post: {
        tags: ["Jobs"],
        summary: "Synchronize all job sources",
        description: "Synchronizes jobs from all configured job sources.",
        security: [
          {
            sessionCookie: [],
          },
        ],
        responses: {
          "200": {
            description: "All job sources synchronized successfully.",
          },
          "401": {
            description: "Authentication required.",
          },
          "500": {
            description: "Job source synchronization failed.",
          },
        },
      },
    },
    /*
     * ============================================================
     * DASHBOARD
     * ============================================================
     */

    "/api/dashboard/summary": {
      get: {
        tags: ["Dashboard"],
        summary: "Get dashboard summary",
        security: [
          {
            sessionCookie: [],
          },
        ],
        responses: {
          "200": {
            description: "Dashboard summary.",
          },
          "401": {
            description: "Authentication required.",
          },
          "404": {
            description: "User not found.",
          },
        },
      },
    },

    /*
     * ============================================================
     * HEALTH
     * ============================================================
     */

    "/api/health": {
      get: {
        tags: ["Health"],
        summary: "Check API health",
        responses: {
          "200": {
            description: "API and database are healthy.",
          },
          "503": {
            description: "Database unavailable.",
          },
        },
      },
    },

    "/api/health/live": {
      get: {
        tags: ["Health"],
        summary: "Liveness check",
        description:
          "Checks whether the SkillCompass API process is alive. This endpoint does not check database connectivity.",
        responses: {
          200: {
            description: "API process is alive",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    success: {
                      type: "boolean",
                      example: true,
                    },
                    data: {
                      type: "object",
                      properties: {
                        status: {
                          type: "string",
                          example: "ok",
                        },
                        service: {
                          type: "string",
                          example: "SkillCompass API",
                        },
                        timestamp: {
                          type: "string",
                          format: "date-time",
                          example: "2026-09-20T18:44:00.000Z",
                        },
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
    },
  },
};

export default swaggerDocument;
