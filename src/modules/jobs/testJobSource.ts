import type {
  ExternalJobRecord,
  JobSource,
} from "./jobSource.types.js";

export class TestJobSource implements JobSource {
  name = "SKILLCOMPASS_TEST_SOURCE";

  async fetchJobs(): Promise<ExternalJobRecord[]> {
    return [
      {
        externalJobId: "source-test-001",
        title: "Node.js Developer Intern",
        companyName: "SkillCompass Source Test",
        location: "Remote",
        employmentType: "Internship",
        remote: true,
        url: "http://localhost:3000/test-job/node-developer",
        description:
          "Test job returned by the SkillCompass job source abstraction.",
        skills: [
          {
            skillName: "JavaScript Programming",
            normalizedName: "javascript-programming",
            category: "PROGRAMMING",
            requirementType: "REQUIRED",
            importance: 1.0,
          },
          {
            skillName: "Object-Oriented Programming",
            normalizedName: "object-oriented-programming",
            category: "PROGRAMMING_PARADIGM",
            requirementType: "REQUIRED",
            importance: 0.8,
          },
          {
            skillName: "Asynchronous Programming",
            normalizedName: "asynchronous-programming",
            category: "PROGRAMMING_CONCEPT",
            requirementType: "PREFERRED",
            importance: 0.5,
          },
        ],
      },
    ];
  }
}