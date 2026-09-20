import { z } from "zod";

export const registerSchema = z.object({
  body: z.object({
    email: z
      .string()
      .trim()
      .toLowerCase()
      .email("Invalid email address"),

    password: z
      .string()
      .min(
        8,
        "Password must contain at least 8 characters"
      )
      .max(
        72,
        "Password is too long"
      ),

    displayName: z
      .string()
      .trim()
      .min(2)
      .max(120)
      .optional(),
  }),

  params: z.object({}),

  query: z.object({}),
});

export const loginSchema = z.object({
  body: z.object({
    email: z
      .string()
      .trim()
      .toLowerCase()
      .email("Invalid email address"),

    password: z
      .string()
      .min(
        1,
        "Password is required"
      )
      .max(
        72,
        "Password is too long"
      ),
  }),

  params: z.object({}),

  query: z.object({}),
});

export const sessionIdSchema = z.object({
  body: z.object({}),

  params: z.object({
    sessionId: z.string().uuid(),
  }),

  query: z.object({}),
});