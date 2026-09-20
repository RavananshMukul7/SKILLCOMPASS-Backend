/*
  Warnings:

  - A unique constraint covering the columns `[githubInstallationId]` on the table `GitHubAccount` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "GitHubAccount" ADD COLUMN     "accessTokenExpiresAt" TIMESTAMP(3),
ADD COLUMN     "avatarUrl" TEXT,
ADD COLUMN     "githubInstallationId" BIGINT,
ADD COLUMN     "refreshTokenEncrypted" TEXT,
ADD COLUMN     "refreshTokenExpiresAt" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "Repository" ADD COLUMN     "lastSyncedAt" TIMESTAMP(3);

-- CreateTable
CREATE TABLE "GitHubOAuthState" (
    "id" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "stateHash" VARCHAR(128) NOT NULL,
    "codeVerifierEncrypted" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "consumedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "GitHubOAuthState_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "GitHubOAuthState_stateHash_key" ON "GitHubOAuthState"("stateHash");

-- CreateIndex
CREATE INDEX "GitHubOAuthState_userId_idx" ON "GitHubOAuthState"("userId");

-- CreateIndex
CREATE INDEX "GitHubOAuthState_expiresAt_idx" ON "GitHubOAuthState"("expiresAt");

-- CreateIndex
CREATE UNIQUE INDEX "GitHubAccount_githubInstallationId_key" ON "GitHubAccount"("githubInstallationId");

-- CreateIndex
CREATE INDEX "GitHubAccount_githubUserId_idx" ON "GitHubAccount"("githubUserId");

-- CreateIndex
CREATE INDEX "Repository_lastSyncedAt_idx" ON "Repository"("lastSyncedAt");

-- AddForeignKey
ALTER TABLE "GitHubOAuthState" ADD CONSTRAINT "GitHubOAuthState_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
