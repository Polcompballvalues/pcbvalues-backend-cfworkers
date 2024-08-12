import type { ScoreEntry } from "./types";
import type { IRequest, IRequestStrict } from "itty-router";
import type { Env } from "./env";
import { Router, createCors, error } from "itty-router";
import { Scores } from "./score-validator";
import _rawAPIVersions from "./api-versions.json";
import DiscordWBHK from "./discord-webhook";

const API_VERSIONS = _rawAPIVersions as Record<string, number>;

type RouterArgs = [Env, ExecutionContext];

const { preflight, corsify } = createCors({
    origins: ["*"],
    methods: ["GET", "POST"]
});

const router = Router<IRequest, RouterArgs>();

router.all<IRequest, RouterArgs>("*", preflight);

router.get<IRequest, RouterArgs>("/", (req) => {
    return { hello: "world" };
});

router.get<IRequest, RouterArgs>("/api/", () => {
    return error(405, { message: "Missing API version" });
});


router.get<IRequest, RouterArgs>("/api/:version", () => {
    return error(405, { message: "This endpoint only accepts HTTP POST requests" });
});

router.post<IRequest, RouterArgs>("/api/:version", async (req, env) => {

    const ctype = req.headers.get("Content-Type");
    if (!ctype || !ctype.toLowerCase().startsWith("application/json")) {
        return error(406, {
            message: `Invalid Content-Type, expected application/json, got ${ctype}`
        });
    }

    const entry = await req.json<ScoreEntry>() as ScoreEntry;

    const apiKeys = API_VERSIONS[req.params.version];

    if (!apiKeys) {
        return error(404, {
            message: `Invalid API version`
        });
    }

    const scores = new Scores(entry, apiKeys, req.headers.get("User-Agent") ?? "Missing");

    const invalid = scores.validateCoreTypes();
    if (invalid) {
        return error(400, { message: invalid });
    }

    const {
        WEBHOOK_ID: id,
        WEBHOOK_TOKEN: token,
        WEBHOOK_USERNAME: _raw_username,
        WEBHOOK_AVATAR: avatar,
        PROFANITY_FILTER
    } = env;

    const username = _raw_username.replace("%%", req.params.version);

    const filter = new RegExp(PROFANITY_FILTER, "gmui");

    if (!scores.checkProfanity(filter)) {
        return error(400, { message: "Bad username" });
    }

    const webhook = new DiscordWBHK(id, token, { username, avatar });

    const resp = await webhook.post(await scores.generateMarkdown());

    if (resp.status > 299) {
        return error(500, {
            message: `Error submitting to webhook: ${resp.statusText};
            Response: ${await resp.text()}`
        });
    }

    return { success: true };
});

export { router, corsify };