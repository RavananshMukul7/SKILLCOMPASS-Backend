import { Worker } from "bullmq";
import { redisConnection } from "../config/redis.js";
import { prisma } from "../config/prisma.js";
import { calculateProficiencies, } from "../modules/analysis/proficiency.service.js";
import { persistProficiencies, } from "../modules/analysis/proficiencyPersistence.service.js";
import { getGitHubRepository, getGitHubRepositoryTree, getGitHubFileContent, getGitHubRepositoryLanguages, } from "../modules/github/githubRepository.service.js";
import { detectTechnologiesFromSource, } from "../modules/analysis/technologyDetection.service.js";
import { extractSkillsFromTechnologies, } from "../modules/analysis/skillExtraction.service.js";
import { persistExtractedSkills, } from "../modules/analysis/skillPersistence.service.js";
const processAnalysis = async (job) => {
    const { analysisRunId, repositoryId, userId, } = job.data;
    console.log("Starting repository analysis:", {
        analysisRunId,
        repositoryId,
        userId,
    });
    await prisma.analysisRun.update({
        where: {
            id: analysisRunId,
        },
        data: {
            status: "RUNNING",
            startedAt: new Date(),
        },
    });
    try {
        const repository = await prisma.repository.findFirst({
            where: {
                id: repositoryId,
                githubAccount: {
                    userId,
                },
            },
            select: {
                id: true,
                name: true,
                fullName: true,
                ownerLogin: true,
            },
        });
        if (!repository) {
            throw new Error("Repository no longer exists or is not owned by the user");
        }
        console.log("Analyzing repository:", repository.fullName);
        const githubAccount = await prisma.gitHubAccount.findUnique({
            where: {
                userId,
            },
            select: {
                githubInstallationId: true,
            },
        });
        if (!githubAccount?.githubInstallationId) {
            throw new Error("GitHub installation is not available");
        }
        const githubRepository = await getGitHubRepository(githubAccount.githubInstallationId, repository.ownerLogin, repository.name);
        console.log("GitHub repository fetched:", {
            id: githubRepository.id,
            fullName: githubRepository.full_name,
            defaultBranch: githubRepository.default_branch,
        });
        const repositoryTree = await getGitHubRepositoryTree(githubAccount.githubInstallationId, repository.ownerLogin, repository.name, githubRepository.default_branch ??
            "main");
        console.log("GitHub repository tree fetched:", {
            commitSha: repositoryTree.sha,
            fileCount: repositoryTree.tree.filter((item) => item.type === "blob").length,
            truncated: repositoryTree.truncated,
        });
        const sourceFiles = repositoryTree.tree.filter((item) => item.type === "blob" &&
            (item.path.endsWith(".ts") ||
                item.path.endsWith(".tsx") ||
                item.path.endsWith(".js") ||
                item.path.endsWith(".jsx") ||
                item.path.endsWith(".py") ||
                item.path.endsWith(".cpp") ||
                item.path.endsWith(".cc") ||
                item.path.endsWith(".c") ||
                item.path.endsWith(".java") ||
                item.path.endsWith(".go")));
        console.log("Repository files:", sourceFiles.map((file) => file.path));
        const detectedTechnologies = [];
        const skillTechnologyInputs = [];
        /*
         * --------------------------------------------------
         * SOURCE FILE TECHNOLOGY DETECTION
         * --------------------------------------------------
         */
        for (const sourceFile of sourceFiles) {
            const fileContent = await getGitHubFileContent(githubAccount.githubInstallationId, repository.ownerLogin, repository.name, sourceFile.path);
            console.log("GitHub source file fetched:", {
                path: fileContent.path,
                size: fileContent.size,
                preview: fileContent.content.slice(0, 120),
            });
            const fileTechnologies = detectTechnologiesFromSource({
                path: fileContent.path,
                content: fileContent.content,
            });
            detectedTechnologies.push(...fileTechnologies);
            for (const technology of fileTechnologies) {
                skillTechnologyInputs.push({
                    technologyName: technology.technologyName,
                    normalizedName: technology.normalizedName,
                    confidence: technology.confidence,
                    evidenceType: technology.evidenceType,
                    evidenceValue: technology.evidenceValue,
                    path: fileContent.path,
                });
            }
            console.log("Technologies detected in file:", {
                path: fileContent.path,
                technologies: fileTechnologies.map((item) => item.technologyName),
            });
        }
        /*
         * --------------------------------------------------
         * CREATE REPOSITORY SNAPSHOT
         * --------------------------------------------------
         */
        const snapshot = await prisma.repositorySnapshot.create({
            data: {
                repositoryId: repository.id,
                analysisRunId,
                commitSha: repositoryTree.sha,
            },
        });
        console.log("Repository snapshot created:", {
            snapshotId: snapshot.id,
            commitSha: snapshot.commitSha,
        });
        /*
         * --------------------------------------------------
         * STORE CODE-LEVEL TECHNOLOGY EVIDENCE
         * --------------------------------------------------
         */
        if (detectedTechnologies.length > 0) {
            await prisma.technologyEvidence.createMany({
                data: detectedTechnologies.map((technology) => ({
                    snapshotId: snapshot.id,
                    technologyName: technology.technologyName,
                    normalizedName: technology.normalizedName,
                    evidenceType: technology.evidenceType,
                    evidenceValue: technology.evidenceValue,
                    confidence: technology.confidence,
                })),
            });
        }
        console.log("Code-level technology evidence stored:", {
            count: detectedTechnologies.length,
        });
        /*
         * --------------------------------------------------
         * GITHUB LANGUAGE DETECTION
         * --------------------------------------------------
         */
        const languages = await getGitHubRepositoryLanguages(githubAccount.githubInstallationId, repository.ownerLogin, repository.name);
        /*
         * Feed GitHub language detection into
         * the skill extraction pipeline.
         *
         * Example:
         *
         * JavaScript
         *     ↓
         * JavaScript Programming
         */
        for (const [language, bytes,] of Object.entries(languages)) {
            skillTechnologyInputs.push({
                technologyName: language,
                normalizedName: language.trim().toLowerCase(),
                confidence: 1,
                evidenceType: "GITHUB_LANGUAGE",
                evidenceValue: `${bytes} bytes detected by GitHub`,
                path: "[GitHub Language Detection]",
            });
        }
        const totalBytes = Object.values(languages).reduce((sum, bytes) => sum + bytes, 0);
        if (totalBytes > 0) {
            await prisma.repositoryLanguage.createMany({
                data: Object.entries(languages).map(([language, bytes]) => ({
                    snapshotId: snapshot.id,
                    language,
                    bytes: BigInt(bytes),
                    percentage: (bytes /
                        totalBytes) *
                        100,
                })),
            });
        }
        console.log("Repository languages stored:", languages);
        /*
         * --------------------------------------------------
         * STORE GITHUB LANGUAGE EVIDENCE
         * --------------------------------------------------
         */
        const normalizeTechnologyName = (name) => name.trim().toLowerCase();
        await prisma.technologyEvidence.createMany({
            data: Object.entries(languages).map(([language, bytes]) => ({
                snapshotId: snapshot.id,
                technologyName: language,
                normalizedName: normalizeTechnologyName(language),
                evidenceType: "GITHUB_LANGUAGE",
                evidenceValue: `${bytes} bytes detected by GitHub`,
                confidence: 1,
            })),
        });
        console.log("GitHub language evidence stored:", Object.keys(languages));
        /*
         * --------------------------------------------------
         * SKILL EXTRACTION
         * --------------------------------------------------
         */
        const extractedSkills = extractSkillsFromTechnologies(skillTechnologyInputs);
        console.log("Skills extracted:", extractedSkills.map((skill) => ({
            skillName: skill.skillName,
            confidence: skill.confidence,
            evidenceCount: skill.evidence.length,
        })));
        /*
         * --------------------------------------------------
         * LOAD TECHNOLOGY EVIDENCE
         * --------------------------------------------------
         *
         * SkillEvidence needs real database
         * TechnologyEvidence IDs.
         */
        const storedTechnologyEvidence = await prisma.technologyEvidence.findMany({
            where: {
                snapshotId: snapshot.id,
            },
            select: {
                id: true,
                normalizedName: true,
            },
        });
        const technologyEvidenceByName = new Map();
        for (const evidence of storedTechnologyEvidence) {
            technologyEvidenceByName.set(evidence.normalizedName, evidence);
        }
        /*
         * --------------------------------------------------
         * PERSIST SKILLS
         * --------------------------------------------------
         */
        const persistedSkills = await persistExtractedSkills({
            userId,
            analysisRunId,
            skills: extractedSkills,
            technologyEvidenceByName,
        });
        console.log("Skills persisted:", persistedSkills);
        /*
         * --------------------------------------------------
         * CALCULATE PROFICIENCIES
         * --------------------------------------------------
         */
        const proficiencies = calculateProficiencies(extractedSkills);
        console.log("Proficiencies calculated:", proficiencies.map((proficiency) => ({
            skillName: proficiency.skillName,
            score: proficiency.score,
            level: proficiency.level,
            confidence: proficiency.confidence,
        })));
        /*
         * --------------------------------------------------
         * PERSIST PROFICIENCIES
         * --------------------------------------------------
         */
        const persistedProficiencies = await persistProficiencies({
            analysisRunId,
            persistedSkills,
            proficiencies,
        });
        console.log("Proficiency assessments persisted:", persistedProficiencies);
        /*
         * --------------------------------------------------
         * COMPLETE ANALYSIS
         * --------------------------------------------------
         */
        await prisma.analysisRun.update({
            where: {
                id: analysisRunId,
            },
            data: {
                status: "COMPLETED",
                completedAt: new Date(),
            },
        });
        console.log("Repository analysis completed:", analysisRunId);
        return {
            analysisRunId,
            repositoryId,
            status: "COMPLETED",
            skillCount: persistedSkills.length,
        };
    }
    catch (error) {
        const errorMessage = error instanceof Error
            ? error.message
            : "Unknown analysis error";
        await prisma.analysisRun.update({
            where: {
                id: analysisRunId,
            },
            data: {
                status: "FAILED",
                errorMessage,
                completedAt: new Date(),
            },
        });
        console.error("Repository analysis failed:", {
            analysisRunId,
            error: errorMessage,
        });
        throw error;
    }
};
export const analysisWorker = new Worker("repository-analysis", processAnalysis, {
    connection: redisConnection,
    concurrency: 2,
});
analysisWorker.on("completed", (job) => {
    console.log(`Analysis job completed: ${job.id}`);
});
analysisWorker.on("failed", (job, error) => {
    console.error(`Analysis job failed: ${job?.id}`, error);
});
analysisWorker.on("error", (error) => {
    console.error("Analysis worker error:", error);
});
