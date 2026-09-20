# SkillCompass — Product Requirements

## 1. Product
SkillCompass is an AI-assisted career intelligence platform that analyzes a user's coding/project evidence, estimates skills and proficiency, compares that profile with market job requirements, and identifies suitable opportunities and skill gaps.

## 2. MVP Goal
The MVP must reliably answer four questions:
1. What technical skills does the user demonstrate?
2. How strong is the evidence for each skill?
3. Which available jobs are a reasonable match?
4. Which skills are missing or weak for those target jobs?

## 3. Target Users
- Students and early-career software developers
- Developers preparing for internships or entry-level roles
- Users who want evidence-based guidance instead of generic job recommendations

## 4. MVP User Journey
1. Create an account.
2. Connect GitHub.
3. Select/authorize repositories that may be analyzed.
4. Start an analysis.
5. SkillCompass imports permitted repository metadata and code evidence.
6. The analysis pipeline extracts technologies and skill evidence.
7. The proficiency engine computes skill scores with confidence.
8. The user views a skill profile.
9. SkillCompass ingests/normalizes job opportunities.
10. The matching engine compares user skills with job requirements.
11. The user sees matched jobs and skill gaps.

## 5. Functional Requirements

### FR-1 Authentication
The system shall support user registration, login, logout, authenticated sessions/tokens, and protected API routes.

### FR-2 GitHub Connection
The system shall allow a user to authorize GitHub access using OAuth and store only the minimum information required for the product.

### FR-3 Repository Selection
The user shall be able to control which repositories are eligible for analysis.

### FR-4 Repository Ingestion
The system shall fetch permitted repository metadata and analysis inputs from GitHub and persist normalized repository records.

### FR-5 Skill Extraction
The system shall detect technologies and produce skill evidence from repository/project signals.

### FR-6 Proficiency Estimation
The system shall estimate proficiency per skill using measurable evidence and produce a score plus confidence rather than a score alone.

### FR-7 Job Ingestion
The system shall ingest jobs from approved sources and normalize their titles, descriptions, skills, seniority and other matching attributes.

### FR-8 Job Matching
The system shall calculate a compatibility score between a user skill profile and a normalized job requirement profile.

### FR-9 Skill Gap Detection
The system shall identify missing, weak or insufficiently evidenced skills relevant to a target role/job.

### FR-10 Recommendations
The system shall return ranked opportunities and explain major matching factors and gaps.

### FR-11 Analysis Status
Long-running analysis shall be asynchronous and expose status/progress/error state to the client.

## 6. Non-Functional Requirements
- Security: least-privilege access, secure secrets, input validation, protected credentials/tokens.
- Reliability: retriable background jobs and idempotent processing where appropriate.
- Performance: API requests must not synchronously perform large repository analysis.
- Maintainability: modular domain boundaries with explicit contracts.
- Observability: structured logs, request IDs, job IDs, and actionable errors.
- Data quality: raw external data should be normalized before matching.
- Privacy: do not persist unnecessary repository contents or OAuth data.
- Testability: business logic should be independently unit-testable.

## 7. Out of Scope for MVP
- Automated recruiter messaging
- Fully autonomous recruiter discovery
- Social-media scraping
- Resume auto-generation
- Microservice decomposition
- General-purpose AI chatbot

## 8. Success Criteria
The MVP is successful when an authenticated user can connect GitHub, run an analysis, obtain an explainable skill profile, receive relevant job matches, and see actionable skill gaps without manual backend intervention.

## 9. Design Principles
1. Evidence before inference.
2. Deterministic processing where possible; AI only where it adds measurable value.
3. Async work for expensive operations.
4. Idempotent external-data ingestion.
5. Explicit domain boundaries.
6. Explainable recommendations.
