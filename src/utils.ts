import { remark } from "remark";
import remarkUnlink from "remark-unlink";
import strip from "strip-markdown";

export async function stripMarkdown(md: string): Promise<string> {
    let clean = String(
        await remark()
            .use(strip, {
                keep: ["code", "table", "listItem"],
            })
            .use(remarkUnlink)
            .process(md),
    );

    // remove Obsidian block IDs
    clean = clean.replace(/\^\S+$/gm, "");

    // remove Obsidian wiki links with display text
    clean = clean.replace(/\\\[\\\[[^\|]+\|([^\]]+)\]\]/gm, "$1");

    // remove included media
    clean = clean.replace(/^!\\\[\\\[.+\]\]$/gm, "");

    // trim extra whitespace
    return clean.trim();
}
