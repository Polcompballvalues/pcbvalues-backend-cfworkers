import type { Env } from "./env";
import { json, error } from "itty-router";
import { router, corsify } from "./site-router";

export default {
    fetch: (request: Request, env: Env, ctx: ExecutionContext) =>
        router
            .handle(request, env, ctx)
            .then(json)
            .then(corsify)
            .catch(error),
};
