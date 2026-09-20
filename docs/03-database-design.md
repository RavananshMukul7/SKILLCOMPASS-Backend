# SkillCompass — Database Design

## 1. Design Goals

The database must support:

- user authentication and account management
- GitHub account connection
- imported GitHub repositories
- immutable-ish raw evidence from repositories
- repeatable analysis runs
- normalized skills
- proficiency assessments derived from evidence
- jobs and normalized job requirements
- user-to-job matching results
- skill gaps
- background-job state tracking

The key design rule is:

> Raw/source data should be separated from derived/analytical data so that analysis can be rerun without destroying the original evidence.

---

## 2. Core Entities

### 2.1 User

Represents the SkillCompass account.

Important fields:

- id
- email
- passwordHash
- displayName
- createdAt
- updatedAt

Rules:

- email is unique
- passwordHash is never returned by API responses

---

### 2.2 Session / Refresh Token

Represents an authenticated session.

We store a hash of the refresh token rather than the raw token.

Fields:

- id
- userId
- tokenHash
- expiresAt
- revokedAt
- createdAt
- lastUsedAt

Relationship:

```text
User 1 ──────── N Sessions
```

---

### 2.3 GitHubAccount

Represents a GitHub identity connected to a SkillCompass user.

Fields:

- id
- userId
- githubUserId
- username
- accessTokenEncrypted
- connectedAt
- updatedAt

Rules:

- one SkillCompass user may connect one GitHub account in the MVP
- githubUserId is unique

Relationship:

```text
User 1 ──────── 1 GitHubAccount
```

---

### 2.4 Repository

Represents a repository imported from GitHub.

Fields:

- id
- githubAccountId
- githubRepoId
- name
- fullName
- ownerLogin
- defaultBranch
- isPrivate
- htmlUrl
- description
- stars
- forks
- archived
- pushedAt
- createdAt
- updatedAt

Rules:

- githubRepoId is globally unique
- repository ownership comes from the connected GitHub account

Relationship:

```text
GitHubAccount 1 ──────── N Repositories
```

---

## 3. Repository Evidence Layer

This is one of the most important parts of the architecture.

We do NOT immediately convert repository information into a proficiency score.

First we preserve evidence.

### 3.1 RepositorySnapshot

Represents the state of a repository captured during an analysis run.

Fields:

- id
- repositoryId
- analysisRunId
- commitSha
- capturedAt

This lets us answer:

> Which exact version of the repository produced this analysis?

Relationship:

```text
Repository 1 ──────── N RepositorySnapshots
AnalysisRun 1 ─────── N RepositorySnapshots
```

---

### 3.2 RepositoryLanguage

Stores detected language statistics from a repository snapshot.

Fields:

- id
- snapshotId
- language
- bytes
- percentage

A repository can contain many languages.

---

### 3.3 TechnologyEvidence

Stores evidence that a particular technology appears in a repository.

Examples:

- React
- Express
- MongoDB
- PostgreSQL
- Docker
- Redis

Fields:

- id
- snapshotId
- technologyName
- normalizedName
- evidenceType
- evidenceValue
- confidence

Example evidence types:

```text
package
import
config
file_extension
framework_usage
api_usage
```

The evidence layer should remain explainable.

---

## 4. Analysis Layer

### 4.1 AnalysisRun

Represents one complete attempt to analyze a user's repositories.

Fields:

- id
- userId
- status
- startedAt
- completedAt
- errorMessage
- createdAt

Statuses:

```text
QUEUED
RUNNING
COMPLETED
FAILED
CANCELLED
```

Relationship:

```text
User 1 ──────── N AnalysisRuns
```

A user may rerun analysis multiple times.

---

## 5. Skills Layer

### 5.1 Skill

Canonical skill catalog.

Examples:

```text
JavaScript
TypeScript
React
Node.js
Express
PostgreSQL
Docker
Kubernetes
AWS
```

Fields:

- id
- name
- normalizedName
- category
- description

Rules:

- normalizedName is unique

---

### 5.2 UserSkill

Connects a user to a skill based on analyzed evidence.

This is derived data.

Fields:

- id
- userId
- skillId
- currentScore
- confidence
- firstDetectedAt
- lastEvaluatedAt
- sourceAnalysisRunId

Relationship:

```text
User N ──────── N Skill
       through UserSkill
```

---

### 5.3 SkillEvidence

Connects a user's skill assessment to concrete evidence.

Examples:

- used React in a repository
- implemented JWT authentication
- used Redis caching
- Dockerized a service

Fields:

- id
- userSkillId
- technologyEvidenceId
- weight
- reasoning

This creates an explainable path:

```text
Repository
   ↓
Technology Evidence
   ↓
Skill Evidence
   ↓
User Skill
   ↓
Proficiency Score
```

---

## 6. Proficiency Layer

### 6.1 ProficiencyAssessment

Represents one evaluation of a user's skill.

Fields:

- id
- userSkillId
- analysisRunId
- score
- level
- confidence
- methodologyVersion
- createdAt

Suggested level enum:

```text
BEGINNER
INTERMEDIATE
ADVANCED
EXPERT
```

We store the methodology version because the scoring algorithm will evolve.

Example:

```text
methodologyVersion = "v1"
```

A future algorithm can use `v2` without making historical assessments meaningless.

---

## 7. Job Layer

### 7.1 Job

Represents a job opportunity collected from an external source.

Fields:

- id
- source
- externalJobId
- title
- companyName
- location
- employmentType
- remote
- url
- description
- postedAt
- expiresAt
- createdAt
- updatedAt

Uniqueness:

```text
(source, externalJobId)
```

This prevents duplicate jobs when the same source is synchronized repeatedly.

---

### 7.2 JobSkill

Represents a skill required or preferred by a job.

Fields:

- id
- jobId
- skillId
- requirementType
- importance

Example requirement types:

```text
REQUIRED
PREFERRED
```

Relationship:

```text
Job N ──────── N Skill
     through JobSkill
```

---

## 8. Matching Layer

### 8.1 JobMatch

Stores the result of matching a user against a job.

Fields:

- id
- userId
- jobId
- matchScore
- skillCoverage
- skillGapCount
- explanation
- algorithmVersion
- createdAt
- updatedAt

Uniqueness:

```text
(userId, jobId, algorithmVersion)
```

This avoids generating duplicate results for the same algorithm version.

---

## 9. Skill Gap Layer

### 9.1 SkillGap

Represents a skill that the user lacks or is below the desired level for a particular target.

Fields:

- id
- userId
- skillId
- jobId nullable
- currentScore
- requiredImportance
- gapScore
- priority
- analysisRunId
- createdAt

A skill gap can be:

- job-specific
- general/personalized

Relationship:

```text
User 1 ──────── N SkillGaps
Skill 1 ─────── N SkillGaps
Job 1 ───────── N SkillGaps (optional)
```

---

## 10. Background Job Layer

The application should not store BullMQ's entire internal state in PostgreSQL.

BullMQ + Redis owns queue execution state.

PostgreSQL stores business-level processing state where we need durable application history.

### 10.1 ProcessingJob

Fields:

- id
- userId nullable
- analysisRunId nullable
- type
- status
- attempts
- startedAt
- completedAt
- errorMessage
- createdAt

Types may include:

```text
GITHUB_SYNC
REPOSITORY_ANALYSIS
PROFICIENCY_ANALYSIS
JOB_SYNC
MATCHING
SKILL_GAP_ANALYSIS
```

---

## 11. Relationship Overview

```text
                         ┌───────────────┐
                         │     User      │
                         └───────┬───────┘
                                 │
              ┌──────────────────┼──────────────────┐
              │                  │                  │
              ▼                  ▼                  ▼
          Sessions        GitHubAccount        AnalysisRuns
                                 │                  │
                                 ▼                  ▼
                           Repositories      RepositorySnapshots
                                                    │
                              ┌─────────────────────┼────────────────┐
                              │                     │                │
                              ▼                     ▼                ▼
                       RepositoryLanguage   TechnologyEvidence   ...
                                                        │
                                                        ▼
                                                  SkillEvidence
                                                        │
                                                        ▼
                                                     UserSkill
                                                        │
                                                        ▼
                                             ProficiencyAssessment

          Skill ◄────────────── UserSkill ──────────────► User
            ▲
            │
         JobSkill
            │
            ▼
           Job
            │
            ▼
         JobMatch ◄──────────── User

          Skill ◄──────────── SkillGap ──────────────── User
```

---

## 12. Delete / Update Policy

### User deletion

Deleting a user should cascade through user-owned derived data.

However, external job records should NOT be deleted merely because a user is deleted.

### Repository deletion

A repository that disappears from GitHub should generally be marked unavailable/archived rather than immediately hard-deleted.

Historical analysis evidence should remain available for auditability.

### Job deletion

Jobs are external records. They should be expired/archived rather than aggressively deleted.

---

## 13. Index Strategy

Initial indexes:

```text
User.email
GitHubAccount.githubUserId
Repository.githubRepoId
Repository.githubAccountId
AnalysisRun.userId + createdAt
RepositorySnapshot.repositoryId + capturedAt
TechnologyEvidence.snapshotId + normalizedName
Skill.normalizedName
UserSkill.userId + skillId
ProficiencyAssessment.userSkillId + createdAt
Job.source + externalJobId
JobSkill.jobId + skillId
JobMatch.userId + matchScore
SkillGap.userId + priority
ProcessingJob.status + createdAt
```

Indexes should be created only for real query patterns; we should not index every column automatically.

---

## 14. Data Ownership Rules

### Source data

Examples:

- GitHub repository metadata
- repository snapshot
- language statistics
- raw technology evidence
- external job information

These should be treated as source/evidence records.

### Derived data

Examples:

- UserSkill
- SkillEvidence
- ProficiencyAssessment
- JobMatch
- SkillGap

These can be regenerated from source data and versioned algorithms.

This separation allows SkillCompass to improve its algorithms without requiring users to reconnect GitHub.

---

## 15. Important MVP Simplifications

We intentionally do NOT model everything yet.

Deferred:

- organizations/teams
- multiple GitHub accounts per user
- learning course catalogs
- recruiter CRM
- recruiter messaging
- social accounts other than GitHub
- event sourcing
- microservice-specific databases

We can add these later without compromising the core model.

---

## 16. Next Implementation Step

Convert this design into `prisma/schema.prisma`.

Before creating the schema, confirm the following architectural rules remain unchanged:

1. PostgreSQL is the source of truth for persistent business data.
2. Redis is used for caching and BullMQ queues.
3. Raw repository evidence is separated from derived skill/proficiency data.
4. Analysis is repeatable and versioned.
5. Jobs and matching are asynchronous where processing may be expensive.
6. The MVP is a modular monolith.
