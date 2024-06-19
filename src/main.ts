import { pipeline, cos_sim } from '@xenova/transformers';
import { ChromaClient, Collection } from "chromadb";
import { encodingForModel } from "js-tiktoken";
import { TfIdf } from "natural";
import { Notice, Plugin, TFile } from "obsidian";

//

import { createAnkiDeck, createNewNoteOnAnki, updateExistingNoteOnAnki } from "./anki";
import { callOpenRouter } from "./llms";
import { DEFAULT_SETTINGS, SynapsePluginSettings, SynapseSettingTab } from "./settings";
import { Question } from "./types";
import { stripMarkdown } from "./utils";

export default class SynapsePlugin extends Plugin {
    settings: SynapsePluginSettings;
    chromaCollection: Collection;

    async onload() {
        await this.loadSettings();

        const client = new ChromaClient({
            path: "http://localhost:8989"
        });
        this.chromaCollection = await client.getOrCreateCollection({
            name: "obsidian-synapse",
            metadata: { "hnsw:space": "cosine" }
        });

        this.addRibbonIcon(
            "brain-circuit",
            "Sync Synapse flashcards to Anki",
            async (_: MouseEvent) => {
                const openFile: TFile | null = this.app.workspace.getActiveFile();
                if (openFile && openFile.extension === "md") {
                    this.syncFlashcards(openFile);
                }
            },
        );

        this.addCommand({
            id: "synapse-sync-flashcards",
            name: "Sync flashcards to Anki",
            callback: async () => {
                const openFile: TFile | null = this.app.workspace.getActiveFile();
                if (openFile && openFile.extension === "md") {
                    this.syncFlashcards(openFile);
                }
            },
        });

        this.addCommand({
            id: "synapse-index-collection",
            name: "Index the entire vault",
            callback: async () => {
                const extractor = await pipeline('feature-extraction', 'Xenova/jina-embeddings-v2-small-en',
                    { quantized: false } // Comment out this line to use the quantized version
                );

                let documents: string[] = [];
                let ids: string[] = [];
                for (const file of this.app.vault.getFiles()) {
                    documents.push(await this.readCleanFile(file));
                    ids.push(file.basename.trim())
                }

                const embeddings = await extractor(
                    documents,
                    { pooling: 'mean' }
                );

                console.log(embeddings)

                await this.chromaCollection.upsert({ documents, ids });

                new Notice("Done indexing the vault :).");
            }
        });

        this.addSettingTab(new SynapseSettingTab(this.app, this));
    }

    async loadSettings() {
        this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
    }

    async saveSettings() {
        await this.saveData(this.settings);
    }

    async readCleanFile(file: TFile): Promise<string> {
        const linkedContent = await this.app.vault.cachedRead(file);
        let clean = await stripMarkdown(linkedContent);
        clean = clean.replace(/\\\[!question\].+\n\n/gm, "");
        return clean;
    }

    async getRelatedDocuments(file: TFile): Promise<string[]> {
        let related: string[] = [];
        const links = this.app.metadataCache.resolvedLinks[file.path];
        for (const link of Object.keys(links)) {
            const linkedFile = this.app.vault.getFileByPath(link);
            if (linkedFile) {
                const clean = await this.readCleanFile(linkedFile);
                if (clean.length > 0) {
                    related.push(linkedFile.basename.trim() + "\n" + clean);
                }
            }
        }
        return related;
    }

    async syncFlashcards(file: TFile) {
        // find the questions
        let originalContent = await this.app.vault.read(file);
        let workingCopy = file.basename.trim() + "\n" + (await stripMarkdown(originalContent));
        const questions: Question[] = getQuestions(workingCopy);

        // build the TfIdf object
        const tfidf = new TfIdf();
        const relatedDocuments = await this.getRelatedDocuments(file);
        for (const document of relatedDocuments) {
            tfidf.addDocument(document);
        }

        // initial context
        workingCopy = workingCopy.replace(/\\\[!question\].+\n\n/gm, "");
        const encoding = encodingForModel("gpt-4");
        const initialContextLength = encoding.encode(workingCopy).length;

        // create new flashcards or update existing ones
        for (const qn of questions) {
            const deck = file.path.split("/").slice(0, -1).join("::");
            await createAnkiDeck(deck);

            if (qn.id) {
                // update an existing note on Anki
                await updateExistingNoteOnAnki(qn, deck);
            } else {
                // generate the context
                let results: [string, number][] = [];
                tfidf.tfidfs(qn.content, (i, measure) => {
                    results.push([relatedDocuments[i], measure]);
                });
                results.sort((a, b) => b[1] - a[1]);

                let context = workingCopy.repeat(1);
                let contextLength = initialContextLength;
                for (const [doc, score] of results) {
                    if (score <= 0 || contextLength > 2000) {
                        break;
                    }

                    context += "\n\n" + doc;
                    contextLength += encoding.encode(doc).length;
                }

                // get the answer
                const answer = await callOpenRouter(qn.content, context);

                // create the note (& flashcards) on Anki
                const response = await createNewNoteOnAnki(qn, answer, deck);

                // Update the file
                originalContent = originalContent.replace(
                    qn.content,
                    `${qn.content} ^${response["result"]}`,
                );
                await this.app.vault.modify(file, originalContent);
            }
        }

        new Notice("Done syncing flashcards.");
    }
}

function getQuestions(document: string): Question[] {
    let matches = document.matchAll(/\\\[!question\](.+?(?=\^|$))\^?(.+)?/gm);
    let questions: Question[] = [];
    for (const match of matches) {
        const id = match[2] ? match[2].trim() : match[2];
        questions.push({ content: match[1].trim(), id });
    }
    return questions;
}
