import { trpcServer } from "@hono/trpc-server";
import { Hono } from "hono";
import { cors } from "hono/cors";
import { logger } from "hono/logger";
import { handle } from "hono/aws-lambda";
import "dotenv/config";
import { createEnv } from "@t3-oss/env-core";
import { z } from "zod";
import { drizzle } from "drizzle-orm/node-postgres";
import { bigint, integer, pgTable, text, timestamp, uniqueIndex } from "drizzle-orm/pg-core";
import { desc, eq } from "drizzle-orm";
import { initTRPC } from "@trpc/server";

//#region src/lambda-env.ts
const lambdaEnv = createEnv({
	server: {
		DATABASE_URL: z.string().min(1),
		CORS_ORIGIN: z.string().min(1),
		NODE_ENV: z.enum([
			"development",
			"production",
			"test"
		]).default("production")
	},
	runtimeEnv: process.env,
	emptyStringAsUndefined: true
});

//#endregion
//#region src/lambda-db.ts
const githubProfiles = pgTable("github_profiles", {
	id: integer("id").generatedAlwaysAsIdentity().primaryKey(),
	githubId: bigint("github_id", { mode: "number" }).notNull(),
	login: text("login").notNull(),
	name: text("name"),
	avatarUrl: text("avatar_url").notNull(),
	htmlUrl: text("html_url").notNull(),
	email: text("email"),
	createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull()
}, (table) => ({ githubIdUniqueIndex: uniqueIndex("github_profiles_github_id_idx").on(table.githubId) }));
const lambdaDb = drizzle(lambdaEnv.DATABASE_URL, { schema: { githubProfiles } });

//#endregion
//#region src/lambda-router.ts
const t = initTRPC.create();
const githubUserSchema = z.object({
	id: z.number(),
	login: z.string(),
	name: z.string().nullable(),
	avatar_url: z.string().url(),
	html_url: z.string().url(),
	email: z.string().nullable()
});
const publicProcedure = t.procedure;
const githubRouter = t.router({
	fetchProfileByToken: publicProcedure.input(z.object({ token: z.string().min(1, "GitHub token is required") })).mutation(async ({ input }) => {
		const response = await fetch("https://api.github.com/user", { headers: {
			Accept: "application/vnd.github+json",
			Authorization: `Bearer ${input.token}`,
			"User-Agent": "hono-github-app",
			"X-GitHub-Api-Version": "2022-11-28"
		} });
		if (!response.ok) {
			const message = response.status === 401 ? "GitHub token is invalid or expired" : `GitHub request failed with status ${response.status}`;
			throw new Error(message);
		}
		return githubUserSchema.parse(await response.json());
	}),
	list: publicProcedure.query(async () => {
		return await lambdaDb.select().from(githubProfiles).orderBy(desc(githubProfiles.createdAt));
	}),
	save: publicProcedure.input(z.object({
		githubId: z.number(),
		login: z.string().min(1),
		name: z.string().nullable(),
		avatarUrl: z.string().url(),
		htmlUrl: z.string().url(),
		email: z.string().nullable()
	})).mutation(async ({ input }) => {
		const [savedProfile] = await lambdaDb.insert(githubProfiles).values(input).onConflictDoUpdate({
			target: githubProfiles.githubId,
			set: {
				login: input.login,
				name: input.name,
				avatarUrl: input.avatarUrl,
				htmlUrl: input.htmlUrl,
				email: input.email
			}
		}).returning();
		return savedProfile;
	}),
	delete: publicProcedure.input(z.object({ id: z.number() })).mutation(async ({ input }) => {
		const [deletedProfile] = await lambdaDb.delete(githubProfiles).where(eq(githubProfiles.id, input.id)).returning();
		return deletedProfile ?? null;
	})
});
const lambdaAppRouter = t.router({
	healthCheck: publicProcedure.query(() => "OK"),
	github: githubRouter
});

//#endregion
//#region src/lambda-app.ts
function createLambdaApp() {
	const app = new Hono();
	app.use(logger());
	app.use("/*", cors({
		origin: lambdaEnv.CORS_ORIGIN,
		allowMethods: [
			"GET",
			"POST",
			"OPTIONS"
		]
	}));
	app.use("/trpc/*", trpcServer({
		router: lambdaAppRouter,
		createContext: () => ({})
	}));
	app.get("/", (c) => {
		return c.json({
			status: "ok",
			service: "hono-github-app"
		});
	});
	return app;
}

//#endregion
//#region src/lambda.ts
const handler = handle(createLambdaApp());

//#endregion
export { handler };