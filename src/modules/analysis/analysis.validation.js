import { z } from "zod";
export const analyzeRepositorySchema = z.object({
    params: z.object({
        repositoryId: z.string().uuid(),
    }),
    body: z.object({}),
    query: z.object({}),
});
