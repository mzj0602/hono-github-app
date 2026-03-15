import { Button } from "@hono-github-app/ui/components/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@hono-github-app/ui/components/card";
import { Input } from "@hono-github-app/ui/components/input";
import { useMutation, useQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { Loader2, Trash2 } from "lucide-react";
import { useState, type FormEvent } from "react";
import { toast } from "sonner";

import { trpc } from "@/utils/trpc";

type GitHubPreview = {
  id: number;
  login: string;
  name: string | null;
  avatar_url: string;
  html_url: string;
  email: string | null;
};

export const Route = createFileRoute("/github")({
  component: GitHubRoute,
});

function GitHubRoute() {
  const [token, setToken] = useState("");
  const [previewProfile, setPreviewProfile] = useState<GitHubPreview | null>(null);

  const profiles = useQuery(trpc.github.list.queryOptions());

  const fetchProfileMutation = useMutation(
    trpc.github.fetchProfileByToken.mutationOptions({
      onSuccess: (profile) => {
        setPreviewProfile(profile);
      },
      onError: (error) => {
        setPreviewProfile(null);
        toast.error(error.message || "Failed to fetch GitHub profile");
      },
    }),
  );

  const saveProfileMutation = useMutation(
    trpc.github.save.mutationOptions({
      onSuccess: async () => {
        await profiles.refetch();
        toast.success("GitHub profile saved");
      },
      onError: (error) => {
        toast.error(error.message || "Failed to save GitHub profile");
      },
    }),
  );

  const deleteProfileMutation = useMutation(
    trpc.github.delete.mutationOptions({
      onSuccess: async () => {
        await profiles.refetch();
        toast.success("Saved profile deleted");
      },
      onError: (error) => {
        toast.error(error.message || "Failed to delete GitHub profile");
      },
    }),
  );

  const handleFetchProfile = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!token.trim()) {
      return;
    }

    fetchProfileMutation.mutate({ token });
  };

  const handleSaveProfile = () => {
    if (!previewProfile) {
      return;
    }

    saveProfileMutation.mutate({
      githubId: previewProfile.id,
      login: previewProfile.login,
      name: previewProfile.name,
      avatarUrl: previewProfile.avatar_url,
      htmlUrl: previewProfile.html_url,
      email: previewProfile.email,
    });
  };

  const handleDeleteProfile = (id: number) => {
    deleteProfileMutation.mutate({ id });
  };

  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-6 px-4 py-10">
      <Card>
        <CardHeader>
          <CardTitle>GitHub Account Lookup</CardTitle>
          <CardDescription>
            Paste a personal access token, fetch your GitHub profile, then save the fields you want
            to keep in PostgreSQL.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <form onSubmit={handleFetchProfile} className="flex flex-col gap-3 md:flex-row">
            <Input
              type="password"
              value={token}
              onChange={(event) => setToken(event.target.value)}
              placeholder="ghp_xxx or github_pat_xxx"
              disabled={fetchProfileMutation.isPending}
            />
            <Button type="submit" disabled={fetchProfileMutation.isPending || !token.trim()}>
              {fetchProfileMutation.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                "Fetch Profile"
              )}
            </Button>
          </form>

          {previewProfile ? (
            <div className="rounded-lg border p-4">
              <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <div className="flex items-center gap-4">
                  <img
                    src={previewProfile.avatar_url}
                    alt={previewProfile.login}
                    className="h-16 w-16 rounded-full border object-cover"
                  />
                  <div>
                    <p className="text-lg font-semibold">
                      {previewProfile.name || previewProfile.login}
                    </p>
                    <p className="text-sm text-muted-foreground">@{previewProfile.login}</p>
                    <a
                      href={previewProfile.html_url}
                      target="_blank"
                      rel="noreferrer"
                      className="text-sm text-blue-600 underline-offset-4 hover:underline"
                    >
                      {previewProfile.html_url}
                    </a>
                    <p className="text-sm text-muted-foreground">
                      {previewProfile.email || "No public email"}
                    </p>
                  </div>
                </div>
                <Button
                  type="button"
                  onClick={handleSaveProfile}
                  disabled={saveProfileMutation.isPending}
                >
                  {saveProfileMutation.isPending ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    "Save to Database"
                  )}
                </Button>
              </div>
            </div>
          ) : (
            <div className="rounded-lg border border-dashed p-4 text-sm text-muted-foreground">
              Fetched GitHub account details will appear here.
            </div>
          )}
          {fetchProfileMutation.isError ? (
            <p className="text-sm text-destructive">
              {fetchProfileMutation.error.message || "Unable to fetch GitHub profile with this token."}
            </p>
          ) : null}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Saved Profiles</CardTitle>
          <CardDescription>Records stored through Drizzle in the local PostgreSQL database.</CardDescription>
        </CardHeader>
        <CardContent>
          {profiles.isLoading ? (
            <div className="flex justify-center py-6">
              <Loader2 className="h-6 w-6 animate-spin" />
            </div>
          ) : profiles.data?.length ? (
            <div className="grid gap-3">
              {profiles.data.map((profile) => (
                <div
                  key={profile.id}
                  className="flex flex-col gap-4 rounded-lg border p-4 md:flex-row md:items-center md:justify-between"
                >
                  <div className="flex items-center gap-4">
                    <img
                      src={profile.avatarUrl}
                      alt={profile.login}
                      className="h-12 w-12 rounded-full border object-cover"
                    />
                    <div>
                      <p className="font-medium">{profile.name || profile.login}</p>
                      <p className="text-sm text-muted-foreground">@{profile.login}</p>
                      <a
                        href={profile.htmlUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="text-sm text-blue-600 underline-offset-4 hover:underline"
                      >
                        View on GitHub
                      </a>
                    </div>
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => handleDeleteProfile(profile.id)}
                    disabled={deleteProfileMutation.isPending}
                    aria-label={`Delete ${profile.login}`}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          ) : (
            <p className="py-6 text-center text-sm text-muted-foreground">
              No profiles saved yet. Fetch one above and store it in PostgreSQL.
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
