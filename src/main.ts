import { Editor, MarkdownView, Plugin } from "obsidian";

import { callOpenRouter } from "./llms";
import { DEFAULT_SETTINGS, SynapsePluginSettings, SynapseSettingTab } from "./settings";
import { stripMarkdown } from "./utils";

export default class SynapsePlugin extends Plugin {
    settings: SynapsePluginSettings;

    async onload() {
        await this.loadSettings();

        this.addCommand({
            id: "synapse-generate-flashcards",
            name: "Generate flashcards",
            editorCallback: (editor: Editor, view: MarkdownView) => {
                this.generateFlashcards(editor, view);
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

    async generateFlashcards(editor: Editor, view: MarkdownView) {
        const isSelection = editor.somethingSelected();

        const originalText = (isSelection ? editor.getSelection() : editor.getValue());
        let text = await stripMarkdown(originalText);
        const title = view.file?.basename.trim().toUpperCase();
        text = `${title}\n\n${text}`

        const flashcards = await callOpenRouter(
            this.settings.apiKey,
            this.settings.model,
            this.settings.prompt,
            text,
        );

        if (isSelection) {
            editor.replaceSelection(`${originalText.trimEnd()}\n\n%%\n${flashcards}\n%%\n`);
        } else {
            editor.replaceRange(`%%\n${flashcards}\n%%\n`, editor.getCursor());
        }
    }
}
