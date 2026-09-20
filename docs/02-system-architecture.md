# SkillCompass — System Architecture

## 1. Architecture Style
SkillCompass will start as a **modular monolith**.

The deployment is one backend application, but the codebase is separated by business domain. Background workers run separately from the HTTP request path while sharing the same domain modules and database.

This gives us clear boundaries without the operational complexity of microservices.

## 2. High-Level Architecture

```text
                        Client / Frontend
                              |
                            HTTPS
                              |
                       +------+------+
                       |  Express API |
                       +------+------+
                              |
          +-------------------+-------------------+
          |                   |                   |
       Auth/Users          GitHub              Jobs
          |                   |                   |
          |             Repository Sync      Job Ingestion
          |                   |                   |
          |             Analysis Queue        Normalizer
          |                   |                   |
          +-------------------+-------------------+
                              |
                    Skill / Proficiency
                              |
                     Matching / Gaps
                              |
                     Recommendations
                              |
                +-------------+-------------+
                |                           |
          PostgreSQL                     Redis
                |                           |
                |                      BullMQ Queue
                |                           |
                +------------+--------------+
                             |
                         Worker Pool
                             |
                    GitHub / Job Providers
```

## 3. Technology Choices

### Application
- Node.js
- TypeScript
- Express

### Persistence
- PostgreSQL
- Prisma ORM

### Async Processing
- Redis
- BullMQ

### External Integrations
- GitHub OAuth/API
- Approved job data sources

### Testing
- Vitest or Jest for unit/integration tests
- Supertest for HTTP API tests

## 4. Domain Modules

### Auth
Responsible for identity, credentials, tokens/sessions and authorization.

### Users
Responsible for user profile and user preferences.

### GitHub
Responsible for OAuth connection, provider tokens, repository discovery and provider-facing operations.

### Repositories
Responsible for the normalized repository model and repository analysis eligibility/state.

### Skills
Responsible for canonical skill definitions and extracted evidence.

### Proficiency
Responsible for converting evidence into scores and confidence.

### Jobs
Responsible for external job ingestion, normalization and job requirements.

### Recommendations
Responsible for ranking and explaining recommendations.

### Skill Gaps
Responsible for identifying missing/weak skills relative to a target opportunity or role.

## 5. Request Lifecycle

```text
HTTP Request
   -> middleware
   -> authentication
   -> validation
   -> controller
   -> domain service
   -> repository/data access
   -> response mapper
   -> HTTP Response
```

Controllers must remain thin. Business rules belong in services/domain logic, not route handlers.

## 6. Long-Running Analysis Lifecycle

```text
POST /analysis
     |
     +--> create AnalysisJob(status=QUEUED)
     |
     +--> enqueue job
     |
     +--> return 202 + jobId

Worker
  |
  +--> load analysis job
  +--> acquire/refresh provider data
  +--> extract evidence
  +--> calculate proficiency
  +--> persist results
  +--> update status=COMPLETED
```

Failures produce a durable failed state and retry metadata rather than leaving the client guessing.

## 7. Data Ownership Rules
- Each domain owns its tables and business rules.
- Cross-domain access goes through explicit service/repository contracts.
- External provider payloads are never treated as canonical internal models.
- Job data is normalized before matching.
- Skill evidence is stored separately from the final proficiency score.

## 8. API Conventions

Base path: `/api/v1`

Use resource-oriented routes and standard HTTP semantics.

Examples:
- `POST /api/v1/auth/register`
- `POST /api/v1/auth/login`
- `GET /api/v1/me`
- `POST /api/v1/integrations/github/connect`
- `GET /api/v1/repositories`
- `POST /api/v1/analyses`
- `GET /api/v1/analyses/:analysisId`
- `GET /api/v1/skills`
- `GET /api/v1/jobs`
- `GET /api/v1/recommendations`

## 9. Error Contract
All API errors use a predictable shape:

```json
{
  "error": {
    "code": "RESOURCE_NOT_FOUND",
    "message": "Repository not found",
    "requestId": "..."
  }
}
```

Validation failures additionally expose field-level details.

## 10. Authentication Boundary
External provider OAuth credentials/tokens must never be exposed to the frontend after the OAuth exchange. Provider credentials are stored server-side using encrypted/secure handling appropriate to the chosen deployment.

## 11. Analysis Idempotency
The same repository and source version must not create duplicate analysis records simply because a request was retried.

Each ingestion/analysis step should have a stable identity or deduplication key.

## 12. Observability
Every request receives a request ID.
Every asynchronous operation receives a job/analysis ID.
Logs should contain structured fields such as timestamp, requestId, userId where safe, operation name, status and duration.

## 13. Initial Security Controls
- Password hashing using a modern password hashing algorithm.
- Input validation at API boundaries.
- Authentication middleware for protected routes.
- Authorization checks at resource access boundaries.
- Rate limiting on authentication and expensive endpoints.
- Secure HTTP headers.
- Secret values only through environment/secret management.
- No raw provider tokens in logs.

## 14. Evolution Path
If load or team boundaries eventually justify separation, modules with clear contracts can become independent services. We do not pay that cost until there is a concrete reason.
