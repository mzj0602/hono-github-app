import { lambdaEnv } from "./lambda-env";
import { drizzle } from "drizzle-orm/node-postgres";
import type { NodePgDatabase } from "drizzle-orm/node-postgres";
import { bigint, integer, pgTable, text, timestamp, uniqueIndex } from "drizzle-orm/pg-core";
import { Pool } from "pg";

export const githubProfiles = pgTable(
  "github_profiles",
  {
    id: integer("id").generatedAlwaysAsIdentity().primaryKey(),
    githubId: bigint("github_id", { mode: "number" }).notNull(),
    login: text("login").notNull(),
    name: text("name"),
    avatarUrl: text("avatar_url").notNull(),
    htmlUrl: text("html_url").notNull(),
    email: text("email"),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => ({
    githubIdUniqueIndex: uniqueIndex("github_profiles_github_id_idx").on(table.githubId),
  }),
);

const lambdaPool = new Pool({
  connectionString: lambdaEnv.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false,
  },
});

export const lambdaDb: NodePgDatabase<{
  githubProfiles: typeof githubProfiles;
}> = drizzle(lambdaPool, {
  schema: {
    githubProfiles,
  },
});
