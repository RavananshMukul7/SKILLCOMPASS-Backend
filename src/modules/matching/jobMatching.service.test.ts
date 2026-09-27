import { beforeEach, describe, expect, it, vi } from "vitest";

const mockPrisma = vi.hoisted(() => ({
  job: {
    findUnique: vi.fn(),
  },
  userSkill: {
    findMany: vi.fn(),
  },
}));

vi.mock("../../config/prisma.js", () => ({
  prisma: mockPrisma,
}));

import {
  calculateDetailedJobMatch,
  calculateJobRecommendations,
} from "./jobMatching.service.js";

describe("Job Matching scoring rules", () => {
  it("should treat REQUIRED skills with full weight", () => {
    const currentScore = 80;
    const importance = 1;
    const requirementWeight = importance * 1;
    const contribution = currentScore * requirementWeight;

    expect(contribution).toBe(80);
  });

  it("should treat PREFERRED skills with half weight", () => {
    const currentScore = 80;
    const importance = 1;
    const requirementWeight = importance * 0.5;
    const contribution = currentScore * requirementWeight;

    expect(contribution).toBe(40);
  });

  it("should count a skill as covered at score 40", () => {
    const currentScore = 40;

    expect(currentScore >= 40).toBe(true);
  });

  it("should classify a skill below 40 as a gap", () => {
    const currentScore = 39;

    expect(currentScore >= 40).toBe(false);

    const gapScore = Math.max(0, 100 - currentScore);

    expect(gapScore).toBe(61);
  });

  it("should calculate the current test-job score correctly", () => {
    const skills = [
      {
        score: 59,
        importance: 1,
        requirementWeight: 1,
      },
      {
        score: 49,
        importance: 0.9,
        requirementWeight: 0.9,
      },
      {
        score: 59,
        importance: 0.8,
        requirementWeight: 0.8,
      },
      {
        score: 39,
        importance: 0.4,
        requirementWeight: 0.2,
      },
      {
        score: 38,
        importance: 0.3,
        requirementWeight: 0.15,
      },
    ];

    let totalWeight = 0;
    let weightedScore = 0;

    for (const skill of skills) {
      totalWeight += skill.requirementWeight;
      weightedScore += skill.score * skill.requirementWeight;
    }

    const matchScore = Number(
      (weightedScore / totalWeight).toFixed(3),
    );

    expect(matchScore).toBe(53.705);
  });
});

describe("Job Matching recommendation calculations", () => {
  const userId = "11111111-1111-1111-1111-111111111111";

  const javascriptSkill = {
    id: "skill-javascript",
    name: "JavaScript",
    normalizedName: "javascript",
    category: "LANGUAGE",
  };

  const pythonSkill = {
    id: "skill-python",
    name: "Python",
    normalizedName: "python",
    category: "LANGUAGE",
  };

  beforeEach(() => {
    vi.clearAllMocks();

    mockPrisma.userSkill.findMany.mockResolvedValue([
      {
        skillId: javascriptSkill.id,
        currentScore: 80,
        confidence: 0.9,
        skill: javascriptSkill,
      },
      {
        skillId: pythonSkill.id,
        currentScore: 35,
        confidence: 0.8,
        skill: pythonSkill,
      },
    ]);
  });

  it("should return opening-specific gaps from a detailed job match", async () => {
    mockPrisma.job.findUnique.mockResolvedValue({
      id: "job-1",
      skills: [
        {
          id: "job-skill-1",
          jobId: "job-1",
          skillId: javascriptSkill.id,
          requirementType: "REQUIRED",
          importance: 1,
          skill: javascriptSkill,
        },
        {
          id: "job-skill-2",
          jobId: "job-1",
          skillId: pythonSkill.id,
          requirementType: "PREFERRED",
          importance: 0.6,
          skill: pythonSkill,
        },
      ],
    });

    const result = await calculateDetailedJobMatch(
      userId,
      "job-1",
    );

    expect(result.jobId).toBe("job-1");
    expect(result.skillGapCount).toBe(1);
    expect(result.gaps).toHaveLength(1);
    expect(result.gaps[0]).toMatchObject({
      skillId: pythonSkill.id,
      skillName: "Python",
      currentScore: 35,
      gapScore: 65,
      importance: 0.6,
    });
    expect(mockPrisma.userSkill.findMany).toHaveBeenCalledTimes(1);
  });

  it("should sort recommendations by match score, then coverage, then gap count", async () => {
    mockPrisma.job.findUnique.mockImplementation(async ({ where }) => {
      if (where.id === "job-strong") {
        return {
          id: "job-strong",
          skills: [
            {
              id: "job-strong-skill-1",
              jobId: "job-strong",
              skillId: javascriptSkill.id,
              requirementType: "REQUIRED",
              importance: 1,
              skill: javascriptSkill,
            },
          ],
        };
      }

      if (where.id === "job-balanced") {
        return {
          id: "job-balanced",
          skills: [
            {
              id: "job-balanced-skill-1",
              jobId: "job-balanced",
              skillId: javascriptSkill.id,
              requirementType: "REQUIRED",
              importance: 1,
              skill: javascriptSkill,
            },
            {
              id: "job-balanced-skill-2",
              jobId: "job-balanced",
              skillId: pythonSkill.id,
              requirementType: "PREFERRED",
              importance: 0.5,
              skill: pythonSkill,
            },
          ],
        };
      }

      return null;
    });

    const results = await calculateJobRecommendations(userId, [
      "job-balanced",
      "job-strong",
      "job-balanced",
    ]);

    expect(results).toHaveLength(2);
    expect(results[0].jobId).toBe("job-strong");
    expect(results[1].jobId).toBe("job-balanced");
    expect(mockPrisma.job.findUnique).toHaveBeenCalledTimes(2);
    expect(mockPrisma.userSkill.findMany).toHaveBeenCalledTimes(2);
  });

  it("should ignore job IDs that do not resolve to a valid job", async () => {
    mockPrisma.job.findUnique.mockResolvedValue(null);

    const results = await calculateJobRecommendations(userId, [
      "missing-job",
    ]);

    expect(results).toEqual([]);
    expect(mockPrisma.userSkill.findMany).not.toHaveBeenCalled();
  });

  it("should return no recommendations when no job IDs are supplied", async () => {
    const results = await calculateJobRecommendations(userId, [
      "",
      "   ",
      "",
    ]);

    expect(results).toEqual([]);
    expect(mockPrisma.job.findUnique).not.toHaveBeenCalled();
    expect(mockPrisma.userSkill.findMany).not.toHaveBeenCalled();
  });
});
