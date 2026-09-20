export interface SourceFileInput {
  path: string;
  content: string;
}

export interface DetectedTechnology {
  technologyName: string;
  normalizedName: string;
  evidenceType: string;
  evidenceValue: string;
  confidence: number;
}

const normalize = (value: string): string => value.trim().toLowerCase();

const addEvidence = (
  results: DetectedTechnology[],
  technologyName: string,
  evidenceType: string,
  evidenceValue: string,
  confidence: number,
) => {
  const normalizedName = normalize(technologyName);

  const alreadyExists = results.some(
    (item) =>
      item.normalizedName === normalizedName &&
      item.evidenceValue === evidenceValue,
  );

  if (alreadyExists) {
    return;
  }

  results.push({
    technologyName,
    normalizedName,
    evidenceType,
    evidenceValue,
    confidence,
  });
};

export const detectTechnologiesFromSource = (
  file: SourceFileInput,
): DetectedTechnology[] => {
  const results: DetectedTechnology[] = [];

  const content = file.content;
  const path = file.path.toLowerCase();

  /*
   * --------------------------------------------------
   * JAVASCRIPT / TYPESCRIPT
   * --------------------------------------------------
   */

  if (path.endsWith(".js") || path.endsWith(".jsx")) {
    if (/\basync\b|\bawait\b/.test(content)) {
      addEvidence(
        results,
        "Async/Await",
        "CODE_PATTERN",
        `${file.path} contains async/await`,
        0.95,
      );
    }

    if (/\bclass\s+\w+/.test(content)) {
      addEvidence(
        results,
        "JavaScript Classes",
        "CODE_PATTERN",
        `${file.path} contains JavaScript class syntax`,
        0.95,
      );
    }

    if (/\.(map|filter|reduce)\s*\(/.test(content)) {
      addEvidence(
        results,
        "JavaScript Array Methods",
        "CODE_PATTERN",
        `${file.path} uses map/filter/reduce`,
        0.9,
      );
    }

    if (/\bimport\s+|\brequire\s*\(/.test(content)) {
      addEvidence(
        results,
        "JavaScript Modules",
        "CODE_PATTERN",
        `${file.path} contains module imports`,
        0.9,
      );
    }

    /*
     * React detection
     */

    if (
      /\bfrom\s+["']react["']/.test(content) ||
      /\brequire\s*\(\s*["']react["']\s*\)/.test(content) ||
      /\bReact\.(useState|useEffect|useContext|useMemo|useCallback|useRef)\b/.test(
        content,
      ) ||
      /<([A-Z][A-Za-z0-9]*)[\s/>]/.test(content)
    ) {
      addEvidence(
        results,
        "React",
        "CODE_PATTERN",
        `${file.path} contains React usage`,
        0.95,
      );
    }

    /*
     * Node.js detection
     */

    if (
      /\bfrom\s+["']node:[^"']+["']/.test(content) ||
      /\brequire\s*\(\s*["'](?:node:)?[^"']+["']\s*\)/.test(content) ||
      /\bprocess\.(env|argv|exit)\b/.test(content) ||
      /\b__dirname\b|\b__filename\b/.test(content)
    ) {
      addEvidence(
        results,
        "Node.js",
        "CODE_PATTERN",
        `${file.path} contains Node.js runtime APIs`,
        0.9,
      );
    }

    /*
     * Express.js detection
     */

    if (
      /\bfrom\s+["']express["']/.test(content) ||
      /\brequire\s*\(\s*["']express["']\s*\)/.test(content) ||
      /\bexpress\s*\(\s*\)/.test(content) ||
      /\bRouter\s*\(\s*\)/.test(content) ||
      /\.(get|post|put|patch|delete|use)\s*\(/.test(content)
    ) {
      addEvidence(
        results,
        "Express.js",
        "CODE_PATTERN",
        `${file.path} contains Express.js usage`,
        0.9,
      );
    }

    /*
     * Prisma detection
     */

    if (
      /\bfrom\s+["']@prisma\/client["']/.test(content) ||
      /\brequire\s*\(\s*["']@prisma\/client["']\s*\)/.test(content) ||
      /\bPrismaClient\b/.test(content) ||
      /\bprisma\.\w+\.(findMany|findUnique|findFirst|create|update|delete|upsert)\b/.test(
        content,
      )
    ) {
      addEvidence(
        results,
        "Prisma",
        "CODE_PATTERN",
        `${file.path} contains Prisma ORM usage`,
        0.95,
      );
    }

    /*
     * PostgreSQL detection
     */

    if (
      /\bfrom\s+["']pg["']/.test(content) ||
      /\brequire\s*\(\s*["']pg["']\s*\)/.test(content) ||
      /\bpostgres(?:ql)?:\/\//i.test(content)
    ) {
      addEvidence(
        results,
        "PostgreSQL",
        "CODE_PATTERN",
        `${file.path} contains PostgreSQL usage`,
        0.9,
      );
    }

    /*
     * MongoDB detection
     */

    if (
      /\bfrom\s+["']mongodb["']/.test(content) ||
      /\bfrom\s+["']mongoose["']/.test(content) ||
      /\brequire\s*\(\s*["'](?:mongodb|mongoose)["']\s*\)/.test(content)
    ) {
      addEvidence(
        results,
        "MongoDB",
        "CODE_PATTERN",
        `${file.path} contains MongoDB usage`,
        0.9,
      );
    }

    /*
     * REST API detection
     */

    if (
      /\b(express|router)\.(get|post|put|patch|delete)\s*\(/i.test(content) ||
      /\bapp\.(get|post|put|patch|delete)\s*\(/i.test(content)
    ) {
      addEvidence(
        results,
        "REST API",
        "CODE_PATTERN",
        `${file.path} contains HTTP API route definitions`,
        0.85,
      );
    }

    /*
     * GitHub API detection
     */

    if (
      /api\.github\.com/i.test(content) ||
      /\bOctokit\b/.test(content) ||
      /\bgithub\b.*\bapi\b/i.test(content)
    ) {
      addEvidence(
        results,
        "GitHub",
        "CODE_PATTERN",
        `${file.path} contains GitHub API/integration usage`,
        0.9,
      );
    }

    /*
     * TypeScript syntax inside JS-family files
     * is intentionally NOT detected here because
     * TypeScript files are handled separately below.
     */
  }

  /*
   * --------------------------------------------------
   * TYPESCRIPT
   * --------------------------------------------------
   */

  if (path.endsWith(".ts") || path.endsWith(".tsx")) {
    addEvidence(
      results,
      "TypeScript",
      "FILE_EXTENSION",
      `${file.path} is a TypeScript source file`,
      1,
    );

    if (/\binterface\s+\w+/.test(content) || /\btype\s+\w+\s*=/.test(content)) {
      addEvidence(
        results,
        "TypeScript Types",
        "CODE_PATTERN",
        `${file.path} contains TypeScript type definitions`,
        0.95,
      );
    }

    if (
      /\bfrom\s+["']react["']/.test(content) ||
      /\bReact\.(useState|useEffect|useContext|useMemo|useCallback|useRef)\b/.test(
        content,
      ) ||
      /<([A-Z][A-Za-z0-9]*)[\s/>]/.test(content)
    ) {
      addEvidence(
        results,
        "React",
        "CODE_PATTERN",
        `${file.path} contains React usage`,
        0.95,
      );
    }

    if (
      /\bfrom\s+["']node:[^"']+["']/.test(content) ||
      /\brequire\s*\(\s*["'](?:node:)?[^"']+["']\s*\)/.test(content) ||
      /\bprocess\.(env|argv|exit)\b/.test(content) ||
      /\b__dirname\b|\b__filename\b/.test(content)
    ) {
      addEvidence(
        results,
        "Node.js",
        "CODE_PATTERN",
        `${file.path} contains Node.js runtime APIs`,
        0.9,
      );
    }

    if (
      /\bfrom\s+["']express["']/.test(content) ||
      /\brequire\s*\(\s*["']express["']\s*\)/.test(content) ||
      /\bexpress\s*\(\s*\)/.test(content) ||
      /\bRouter\s*\(\s*\)/.test(content)
    ) {
      addEvidence(
        results,
        "Express.js",
        "CODE_PATTERN",
        `${file.path} contains Express.js usage`,
        0.9,
      );
    }

    if (
      /\bfrom\s+["']@prisma\/client["']/.test(content) ||
      /\bPrismaClient\b/.test(content) ||
      /\bprisma\.\w+\.(findMany|findUnique|findFirst|create|update|delete|upsert)\b/.test(
        content,
      )
    ) {
      addEvidence(
        results,
        "Prisma",
        "CODE_PATTERN",
        `${file.path} contains Prisma ORM usage`,
        0.95,
      );
    }

    if (
      /\bfrom\s+["']pg["']/.test(content) ||
      (/\bPool\b/.test(content) && /\bpg\b/.test(content))
    ) {
      addEvidence(
        results,
        "PostgreSQL",
        "CODE_PATTERN",
        `${file.path} contains PostgreSQL client usage`,
        0.9,
      );
    }

    if (
      /\b(express|router)\.(get|post|put|patch|delete)\s*\(/i.test(content) ||
      /\bapp\.(get|post|put|patch|delete)\s*\(/i.test(content)
    ) {
      addEvidence(
        results,
        "REST API",
        "CODE_PATTERN",
        `${file.path} contains HTTP API route definitions`,
        0.85,
      );
    }

    if (/api\.github\.com/i.test(content) || /\bOctokit\b/.test(content)) {
      addEvidence(
        results,
        "GitHub",
        "CODE_PATTERN",
        `${file.path} contains GitHub API/integration usage`,
        0.9,
      );
    }
  }

  /*
   * --------------------------------------------------
   * PYTHON
   * --------------------------------------------------
   */

  if (path.endsWith(".py")) {
    if (/\bdef\s+\w+\s*\(/.test(content)) {
      addEvidence(
        results,
        "Python Functions",
        "CODE_PATTERN",
        `${file.path} contains Python function definitions`,
        0.95,
      );
    }

    if (/\bclass\s+\w+/.test(content)) {
      addEvidence(
        results,
        "Python Classes",
        "CODE_PATTERN",
        `${file.path} contains Python class definitions`,
        0.95,
      );
    }

    if (/\bimport\s+\w+|\bfrom\s+\w+\s+import\b/.test(content)) {
      addEvidence(
        results,
        "Python Modules",
        "CODE_PATTERN",
        `${file.path} contains Python imports`,
        0.9,
      );
    }
  }

  /*
   * --------------------------------------------------
   * JAVA
   * --------------------------------------------------
   */

  if (path.endsWith(".java")) {
    if (/\bimport\s+java\./.test(content)) {
      addEvidence(
        results,
        "Java Standard Library",
        "CODE_PATTERN",
        `${file.path} imports Java standard library packages`,
        0.95,
      );
    }

    if (/\bclass\s+\w+/.test(content)) {
      addEvidence(
        results,
        "Java Classes",
        "CODE_PATTERN",
        `${file.path} contains Java class definitions`,
        0.95,
      );
    }

    if (/\bpublic\s+static\s+void\s+main\s*\(/.test(content)) {
      addEvidence(
        results,
        "Java Entry Point",
        "CODE_PATTERN",
        `${file.path} contains a Java main method`,
        0.95,
      );
    }
  }

  /*
   * --------------------------------------------------
   * C++
   * --------------------------------------------------
   */

  if (path.endsWith(".cpp") || path.endsWith(".cc") || path.endsWith(".cxx")) {
    if (/#include\s*<iostream>/.test(content)) {
      addEvidence(
        results,
        "C++ iostream",
        "CODE_PATTERN",
        `${file.path} includes iostream`,
        0.95,
      );
    }

    if (/#include\s*<string>/.test(content)) {
      addEvidence(
        results,
        "C++ std::string",
        "CODE_PATTERN",
        `${file.path} includes string`,
        0.95,
      );
    }

    if (/\bstd::/.test(content)) {
      addEvidence(
        results,
        "C++ Standard Library",
        "CODE_PATTERN",
        `${file.path} uses the C++ standard library`,
        0.95,
      );
    }

    if (/\bint\s+main\s*\(/.test(content)) {
      addEvidence(
        results,
        "C++ Entry Point",
        "CODE_PATTERN",
        `${file.path} contains a C++ main function`,
        0.95,
      );
    }
  }

  return results;
};
