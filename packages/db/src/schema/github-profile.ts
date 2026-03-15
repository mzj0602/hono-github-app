import { bigint, integer, pgTable, text, timestamp, uniqueIndex } from "drizzle-orm/pg-core";

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
