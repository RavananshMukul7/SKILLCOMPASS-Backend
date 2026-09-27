/*
  Preserve existing repositories and analysis data while making
  repositories owned by the SkillCompass user instead of being
  exclusively owned by the GitHub connection.
*/

-- 1. Add the new ownership column as nullable first.
ALTER TABLE "Repository"
ADD COLUMN "userId" UUID;

-- 2. Backfill existing repositories from their current GitHub account owner.
UPDATE "Repository" AS r
SET "userId" = g."userId"
FROM "GitHubAccount" AS g
WHERE r."githubAccountId" = g."id";

-- 3. Every existing repository must now have an owner.
ALTER TABLE "Repository"
ALTER COLUMN "userId" SET NOT NULL;

-- 4. GitHub connection can now be removed without deleting repositories.
ALTER TABLE "Repository"
ALTER COLUMN "githubAccountId" DROP NOT NULL;

-- 5. Remove the old global GitHub repository uniqueness constraint.
ALTER TABLE "Repository"
DROP CONSTRAINT IF EXISTS "Repository_githubRepoId_key";

-- 6. Repository IDs are unique per SkillCompass user.
ALTER TABLE "Repository"
ADD CONSTRAINT "Repository_userId_githubRepoId_key"
UNIQUE ("userId", "githubRepoId");

-- 7. Preserve repositories when the GitHub account is disconnected.
ALTER TABLE "Repository"
DROP CONSTRAINT IF EXISTS "Repository_githubAccountId_fkey";

ALTER TABLE "Repository"
ADD CONSTRAINT "Repository_githubAccountId_fkey"
FOREIGN KEY ("githubAccountId")
REFERENCES "GitHubAccount"("id")
ON DELETE SET NULL
ON UPDATE CASCADE;

-- 8. Every repository belongs to a SkillCompass user.
ALTER TABLE "Repository"
ADD CONSTRAINT "Repository_userId_fkey"
FOREIGN KEY ("userId")
REFERENCES "User"("id")
ON DELETE CASCADE
ON UPDATE CASCADE;

-- 9. Index repository ownership.
CREATE INDEX IF NOT EXISTS "Repository_userId_idx"
ON "Repository"("userId");