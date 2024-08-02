import dateFmtTokens from "./date-format";
import type { ScoreEntry } from "./types";

function dedent(strings: TemplateStringsArray, ...args: unknown[]): string {
    const joinedStrings = [];
    for (const [i, x] of args.entries()) {
        joinedStrings.push(strings[i] + String(x));
    }

    joinedStrings.push(strings[strings.length - 1]);

    return joinedStrings.join("").replaceAll(/^\s+&/gm, "");
}

function mdEscape(text: string | null | undefined, fallback = "Missing"): string {
    if (!text) {
        return fallback;
    }

    const mdRegex = /([_`\*\[\]\(\)])/g;

    return text.replace(mdRegex, "\\\\$1");
}

function profanityCheck(text: string): boolean {



    return false;
}

function fmtDate(format: string, dt: Date | null | undefined): string {
    if (!dt) {
        return "Missing time!";
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
        //ADD REGEX PROFANITY CHECK

        return null;
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

        return dedent`
            &**User:** ${mdEscape(this.entry.name)}
            &**Time Submitted:** ${fmtDate(Scores.FMT, new Date)} (UTC)
            &**Time Answered:** ${fmtDate(Scores.FMT, new Date(this.entry.time || 0) || null)} (UTC)
            &**Edition:** ${mdEscape(this.entry.edition)}
            &**Authenticity:** ${(await this.checkAuth()) ? "Valid" : "Tampered/Missing"}
            &**Takes**: ${mdEscape(String(this.entry.takes))}
            &**User Agent:** ${mdEscape(this.userAgent)}
            &**Version:** ${mdEscape(this.entry.version)}
            &\`\`\`json
            &${JSON.stringify(null, null, 4)}
            &\`\`\``;
    }
}