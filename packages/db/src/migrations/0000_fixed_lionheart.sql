CREATE TABLE "github_profiles" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "github_profiles_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"github_id" integer NOT NULL,
	"login" text NOT NULL,
	"name" text,
	"avatar_url" text NOT NULL,
	"html_url" text NOT NULL,
	"email" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX "github_profiles_github_id_idx" ON "github_profiles" USING btree ("github_id");