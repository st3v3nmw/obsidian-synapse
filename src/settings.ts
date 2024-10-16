import { App, PluginSettingTab, Setting } from "obsidian";

import type SynapsePlugin from "./main";

export interface SynapsePluginSettings {
    model: string;
    apiKey: string;
    prompt: string;
}

export const DEFAULT_SETTINGS: SynapsePluginSettings = {
    model: "anthropic/claude-3.5-sonnet",
    apiKey: "",
    prompt: `Generate a large set of flashcards STRICTLY from the text after ====.

The flashcards should cover:
- Key terms and definitions
- Core principles
- Important facts
- Cause-and-effect relationships
- Comparisons and contrasts between related concepts
- Historical context and development
- Potential critiques or limitations
- Common misconceptions and their corrections

Each flashcard should:
- Pose a single and specific question
- Be atomic and self-contained, providing enough context to make sense in isolation
- Test deep understanding rather than mere memorization
- Have brief but complete answers

Use the following format for each flashcard: Question?::Answer.

- Use markdown with Mathjax equations and code as required
- The questions and answers MUST be concise (one sentence each)
- Avoid vague questions like what is the main X, what is a common Y, what are some ..., etc
- Existing flashcards are wrapped in %%. Do NOT repeat any existing flashcards

Your response MUST only contain flashcards separated by newlines.

====

`,
};

export class SynapseSettingTab extends PluginSettingTab {
    plugin: SynapsePlugin;

    constructor(app: App, plugin: SynapsePlugin) {
        super(app, plugin);
        this.plugin = plugin;
    }

    display(): void {
        const { containerEl } = this;

        containerEl.empty();

        new Setting(containerEl)
            .setName("Model")
            .setDesc("Name of LLM model to use")
            .addText((text) =>
                text.setValue(this.plugin.settings.model).onChange(async (value) => {
                    this.plugin.settings.model = value;
                    await this.plugin.saveSettings();
                }),
            );

        new Setting(containerEl)
            .setName("API Key")
            .setDesc("API key provided by your LLM provider")
            .addTextArea((text) =>
                text
                    .setPlaceholder("some-api-key")
                    .setValue(this.plugin.settings.apiKey)
                    .onChange(async (value) => {
                        this.plugin.settings.apiKey = value;
                        await this.plugin.saveSettings();
                    }),
            );

        new Setting(containerEl)
            .setName("Prompt")
            .setDesc("The prompt MUST include ${question} and ${context}")
            .addTextArea((text) =>
                text
                    .setPlaceholder(
                        "Give a concise answer to ${question} based on the following context: ${context}",
                    )
                    .setValue(this.plugin.settings.prompt)
                    .onChange(async (value) => {
                        this.plugin.settings.prompt = value;
                        await this.plugin.saveSettings();
                    }),
            );
    }
}
