import { detectTechnologiesWithAI } from "./technologyDetection.ai.service.js";

const result = await detectTechnologiesWithAI({
  repositoryName: "A",
  defaultBranch: "main",

  languages: {
    JavaScript: 7095,
    Java: 1809,
    Python: 709,
    "C++": 494,
  },

  files: [
    {
      path: "dummy-cpp.cpp",
      content: `
#include <iostream>
#include <string>

int main() {
    std::cout << "Hello";
}
`.trim(),
    },
    {
      path: "dummy-java.java",
      content: `
import java.util.Scanner;

public class dummy {
    public static void main(String[] args) {
        Scanner scanner = new Scanner(System.in);
        System.out.println(scanner.nextLine());
    }
}
`.trim(),
    },
    {
      path: "dummy-js.js",
      content: `
class Example {
    async run() {
        const values = [1, 2, 3, 4];
        return values.map(x => x * 2);
    }
}
`.trim(),
    },
    {
      path: "dummy-py.py",
      content: `
def greet(name):
    return f"Hello {name}"

print(greet("Alex"))
`.trim(),
    },
  ],
});

console.log(
  JSON.stringify(result, null, 2)
);
