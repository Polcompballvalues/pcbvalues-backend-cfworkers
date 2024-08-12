import type { ScoreEntry } from "./types";
import dateFmtTokens from "./date-format";
import strings from "./strings";

function dedent(strings: TemplateStringsArray, ...args: unknown[]): string {
    const joinedStrings = [];
    for (const [i, x] of args.entries()) {
        joinedStrings.push(strings[i] + String(x));
    }

    joinedStrings.push(strings[strings.length - 1]);

    return joinedStrings.join("").replaceAll(/^\s+&/gm, "");
}

function mdEscape(text: string | number | null | undefined, fallback = "Missing"): string {
    if (!text) {
        return fallback;
    }

    if (typeof text === "number") {
        text = text.toFixed();
    }

    const mdRegex = /([_`\*\[\]\(\)])/g;

    return text.replace(mdRegex, "\\$1");
}


function fmtDate(format: string, dt: Date | null | undefined): string {
    if (!dt) {
        return strings.MISSING_TIME;
    }

    if (isNaN(dt.valueOf()) || dt.getFullYear() < 2023) {
        return strings.BROKEN_TIMESTAMP;
    }

    const tokens = dateFmtTokens(format, dt);

    return [...tokens].join("");
}

export class Scores {
    static FMT = "%d/%m/%Y @ %h:%M"
    entry: ScoreEntry;
    size: number;
    userAgent: string;

    constructor(entry: ScoreEntry, size: number, userAgent: string) {
        this.entry = entry;
        this.size = size;
        this.userAgent = userAgent;
    }

    validateCoreTypes(): string | null {
        const { name, vals } = this.entry;

        if (!name || !vals || !(vals instanceof Array)) {
            return "Missing required field (name and/or vals)";
        }

        if (vals.length !== this.size) {
            return "Invalid score array size";
        }

        for (const elm of vals) {
            if (typeof elm !== "number" || Number.isNaN(elm) || elm < 0 || elm > 100) {
                return `Invalid number in values array: ${elm}`;
            }
        }

        return null;
    }

    checkProfanity(check: RegExp): boolean {
        const match = check.exec(this.entry.name);
        return !match;
    }

    async checkAuth(): Promise<boolean> {
        const providedDigest = this.entry.digest;

        if (!providedDigest) {
            return false;
        }

        const values = this.entry.vals.map(x => x.toFixed(1)).join(",");
        const bytes = (new TextEncoder).encode(values);
        const digest = await crypto.subtle.digest("SHA-512", bytes);
        const digestStr = String.fromCharCode(... new Uint8Array(digest));
        const b64Str = btoa(digestStr);

        return providedDigest === b64Str;
    }

    async generateMarkdown(): Promise<string> {

        let authenticity = strings.MISSING_DIGEST;
        if (this.entry.digest) {
            authenticity = (await this.checkAuth()) ? strings.AUTHENTIC_SCORE : strings.TAMPERED_SCORE;
        }

        let edition = strings.MISSING_EDITION;
        if (this.entry.edition?.trim().toLowerCase() === "s") {
            edition = strings.SHORT_EDITION;
        } else if (this.entry.edition?.trim().toLowerCase() === "f") {
            edition = strings.FULL_EDITION;
        }

        const data = {
            name: this.entry.name,
            stats: this.entry.vals
        };

        return dedent`
            &**User:** ${mdEscape(this.entry.name)}
            &**Time Submitted:** ${fmtDate(Scores.FMT, new Date)} (UTC)
            &**Time Answered:** ${fmtDate(Scores.FMT, new Date(this.entry.time || 0) || null)} (UTC)
            &**Edition:** ${edition}
            &**Authenticity:** ${authenticity}
            &**Takes**: ${mdEscape(this.entry.takes, strings.MISSING_TAKES)}
            &**User Agent:** ${mdEscape(this.userAgent)}
            &**Version:** ${mdEscape(this.entry.version, strings.MISSING_VERSION)}
            &\`\`\`json
            &${JSON.stringify(data, null, 4)}
            &\`\`\``;
    }
}