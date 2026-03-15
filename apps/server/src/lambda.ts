import { handle } from "hono/aws-lambda";

import { createLambdaApp } from "./lambda-app";

export const handler = handle(createLambdaApp());
