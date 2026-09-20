import {
  detectTechnologiesFromSource,
} from "./technologyDetection.service.js";

import {
  extractSkillsFromTechnologies,
  type SkillTechnologyInput,
} from "./skillExtraction.service.js";

const files = [
  {
    path: "dummy-cpp.cpp",
    content: `#include <iostream>
#include <string>

int main() {
    std::cout << "Hello";
}`,
  },
  {
    path: "dummy-java.java",
    content: `import java.util.Scanner;

public class dummy {
    public static void main(String[] args) {
        Scanner scanner = new Scanner(System.in);
        System.out.println(scanner.nextLine());
    }
}`,
  },
  {
    path: "dummy-js.js",
    content: `class Example {
    async run() {
        const values = [1, 2, 3, 4];
        return values.map(x => x * 2);
    }
}`,
  },
  {
    path: "dummy-py.py",
    content: `def greet(name):
    return f"Hello {name}"

print(greet("Alex"))`,
  },
];

const technologyInputs: SkillTechnologyInput[] = [];

for (const file of files) {
  const technologies =
    detectTechnologiesFromSource(file);

  for (const technology of technologies) {
    technologyInputs.push({
      technologyName: technology.technologyName,
      normalizedName: technology.normalizedName,
      confidence: technology.confidence,
      evidenceType: technology.evidenceType,
      evidenceValue: technology.evidenceValue,
      path: file.path,
    });
  }
}

console.log("DETECTED TECHNOLOGIES:");

console.log(
  JSON.stringify(
    technologyInputs,
    null,
    2
  )
);

const extractedSkills =
  extractSkillsFromTechnologies(
    technologyInputs
  );

console.log("\nEXTRACTED SKILLS:");

console.log(
  JSON.stringify(
    extractedSkills,
    null,
    2
  )
);