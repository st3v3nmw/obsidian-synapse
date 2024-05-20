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
