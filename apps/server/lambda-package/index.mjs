import { createContext } from "@hono-github-app/api/context";
import { appRouter } from "@hono-github-app/api/routers/index";
import { env } from "@hono-github-app/env/server";
import { trpcServer } from "@hono/trpc-server";
import { Hono } from "hono";
import { cors } from "hono/cors";
import { logger } from "hono/logger";
import { serve } from "@hono/node-server";

//#region src/app.ts
function createApp() {
	const app$1 = new Hono();
	app$1.use(logger());
	app$1.use("/*", cors({
		origin: env.CORS_ORIGIN,
		allowMethods: [
			"GET",
			"POST",
			"OPTIONS"
		]
	}));
	app$1.use("/trpc/*", trpcServer({
		router: appRouter,
		createContext: (_opts, context) => {
			return createContext({ context });
		}
	}));
	app$1.get("/", (c) => {
		return c.json({
			status: "ok",
			service: "hono-github-app"
		});
	});
	return app$1;
}

//#endregion
//#region src/index.ts
const app = createApp();
serve({
	fetch: app.fetch,
	port: 3e3
}, (info) => {
	console.log(`Server is running on http://localhost:${info.port}`);
});

//#endregion
export {  };