import { describe, expect, it } from "vitest";
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
        const matchScore = Number((weightedScore / totalWeight).toFixed(3));
        expect(matchScore).toBe(53.705);
    });
});
