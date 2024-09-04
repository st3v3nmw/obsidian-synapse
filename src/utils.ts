import { remark } from "remark";
import strip from "strip-markdown";

export async function stripMarkdown(md: string): Promise<string> {
    let clean = String(
        await remark()
            .use(strip, {
                keep: ["code", "table", "listItem"],
            })
            .process(md),
    );

    // remove Obsidian block IDs
    clean = clean.replace(/^\^.+$\n/gm, "");

    // remove Obsidian wiki links with display text
    clean = clean.replace(/\\\[\\\[.+\|(.*)\]\]/gm, "$1");

    // remove included media
    clean = clean.replace(/^!\\\[\\\[.+\]\]\n\n/gm, "");

    // trim extra whitespace
    return clean.trim();
}

// https://stackoverflow.com/a/41015840
export function interpolate(str: string, params: Record<string, unknown>): string {
    const names: string[] = Object.keys(params);
    const vals: unknown[] = Object.values(params);
    return new Function(...names, `return \`${str}\`;`)(...vals);
}
