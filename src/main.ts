import { encodingForModel } from "js-tiktoken";
import { TfIdf } from "natural";
import { Notice, Plugin, TFile } from "obsidian";

import { createAnkiDeck, createNewNoteOnAnki, updateExistingNoteOnAnki } from "./anki";
import { callOpenRouter } from "./llms";
import { DEFAULT_SETTINGS, SynapsePluginSettings, SynapseSettingTab } from "./settings";
import { Question } from "./types";
import { stripMarkdown } from "./utils";

export default class SynapsePlugin extends Plugin {
    settings: SynapsePluginSettings;

    async onload() {
        await this.loadSettings();

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
            id: "synapse-regenerate-flashcards",
            name: "Regenerate flashcards & sync",
            callback: async () => {
                const openFile: TFile | null = this.app.workspace.getActiveFile();
                if (openFile && openFile.extension === "md") {
                    this.syncFlashcards(openFile, true);
                }
            },
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

    async syncFlashcards(file: TFile, regenerate: boolean = false) {
        // find the questions
        let originalContent = await this.app.vault.read(file);
        const topic = file.basename.trim();
        let workingCopy = topic + "\n" + (await stripMarkdown(originalContent));
        const questions: Question[] = getQuestions(topic, workingCopy);

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

        // create deck if required
        const deck = file.path.split("/").slice(0, -1).join("::");
        await createAnkiDeck(this.settings.ankiConnectEndpoint, deck);

        // create new flashcards or update existing ones
        for (const qn of questions) {
            if (qn.id != null && !regenerate) {
                // update an existing note on Anki
                await updateExistingNoteOnAnki(this.settings.ankiConnectEndpoint, qn, deck);
                continue;
            }

            // generate the context
            let results: [string, number][] = [];
            tfidf.tfidfs(qn.content, (i, measure) => {
                results.push([relatedDocuments[i], measure]);
            });
            results.sort((a, b) => b[1] - a[1]);

            let context = workingCopy.repeat(1);
            let contextLength = initialContextLength;
            for (const [doc, score] of results) {
                if (score <= 0 || contextLength > this.settings.maxContextLength) {
                    break;
                }

                context += "\n\n" + doc;
                contextLength += encoding.encode(doc).length;
            }

            // get the answer
            const answer = await callOpenRouter(
                this.settings.apiKey,
                this.settings.model,
                this.settings.prompt,
                qn.content,
                context,
            );

            if (answer.length == 0) {
                // TODO: handle errors
                console.log(`An error occurred while generating an answer to ${qn.content}`);
                continue;
            }

            if (qn.id) {
                // update the note on Anki
                await updateExistingNoteOnAnki(this.settings.ankiConnectEndpoint, qn, deck, answer);
            } else {
                // create the note (& flashcards) on Anki
                const response = await createNewNoteOnAnki(
                    this.settings.ankiConnectEndpoint,
                    qn,
                    answer,
                    deck,
                );

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

function getQuestions(topic: string, document: string): Question[] {
    let matches = document.matchAll(/\\\[!question\](.+?(?=\^|$))\^?(.+)?/gm);
    let questions: Question[] = [];
    for (const match of matches) {
        const id = match[2] ? match[2].trim() : match[2];
        questions.push({ topic, content: match[1].trim(), id });
    }
    return questions;
}
