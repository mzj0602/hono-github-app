import { db } from "@hono-github-app/db";
import { githubProfiles } from "@hono-github-app/db/schema/github-profile";
import { desc, eq } from "drizzle-orm";
import { z } from "zod";

import { router, publicProcedure } from "../index";

const githubUserSchema = z.object({
  id: z.number(),
  login: z.string(),
  name: z.string().nullable(),
  avatar_url: z.string().url(),
  html_url: z.string().url(),
  email: z.string().nullable(),
});

export const githubRouter = router({
  fetchProfileByToken: publicProcedure
    .input(
      z.object({
        token: z.string().min(1, "GitHub token is required"),
      }),
    )
    .mutation(async ({ input }) => {
      const response = await fetch("https://api.github.com/user", {
        headers: {
          Accept: "application/vnd.github+json",
          Authorization: `Bearer ${input.token}`,
          "User-Agent": "hono-github-app",
          "X-GitHub-Api-Version": "2022-11-28",
        },
      });

      if (!response.ok) {
        const message =
          response.status === 401
            ? "GitHub token is invalid or expired"
            : `GitHub request failed with status ${response.status}`;

        throw new Error(message);
      }

      return githubUserSchema.parse(await response.json());
    }),

  list: publicProcedure.query(async () => {
    return await db.select().from(githubProfiles).orderBy(desc(githubProfiles.createdAt));
  }),

  save: publicProcedure
    .input(
      z.object({
        githubId: z.number(),
        login: z.string().min(1),
        name: z.string().nullable(),
        avatarUrl: z.string().url(),
        htmlUrl: z.string().url(),
        email: z.string().nullable(),
      }),
    )
    .mutation(async ({ input }) => {
      const [savedProfile] = await db
        .insert(githubProfiles)
        .values(input)
        .onConflictDoUpdate({
          target: githubProfiles.githubId,
          set: {
            login: input.login,
            name: input.name,
            avatarUrl: input.avatarUrl,
            htmlUrl: input.htmlUrl,
            email: input.email,
          },
        })
        .returning();

      return savedProfile;
    }),

  delete: publicProcedure
    .input(
      z.object({
        id: z.number(),
      }),
    )
    .mutation(async ({ input }) => {
      const [deletedProfile] = await db
        .delete(githubProfiles)
        .where(eq(githubProfiles.id, input.id))
        .returning();

      return deletedProfile ?? null;
    }),
});
