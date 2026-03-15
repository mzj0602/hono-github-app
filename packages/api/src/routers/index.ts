import { publicProcedure, router } from "../index";
import { githubRouter } from "./github";

export const appRouter = router({
  healthCheck: publicProcedure.query(() => {
    return "OK";
  }),
  github: githubRouter,
});
export type AppRouter = typeof appRouter;
