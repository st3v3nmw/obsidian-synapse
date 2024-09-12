import { App, PluginSettingTab, Setting } from "obsidian";

import type SynapsePlugin from "./main";

export interface SynapsePluginSettings {
    model: string;
    apiKey: string;
    prompt: string;
    maxContextLength: number;
    ankiConnectEndpoint: string;
}

export const DEFAULT_SETTINGS: SynapsePluginSettings = {
    model: "anthropic/claude-3.5-sonnet",
    apiKey: "",
    prompt:
        'In one short sentence, give a concise answer to the question "${question}". ' +
        "For math equations, use the format: <anki-mathjax>equation</anki-mathjax>. " +
        "Wrap code in italics <i>code</i>. " +
        "DO NOT repeat the instructions or question in your answer. \n" +
        "Base your answer on the following context:\n${context}",
    maxContextLength: 2000,
    ankiConnectEndpoint: "http://127.0.0.1:8765",
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

        new Setting(containerEl)
            .setName("Maximum Context Length")
            .setDesc("Length of (note with flashcards + relevant linked documents)")
            .addSlider((slider) =>
                slider
                    .setLimits(1000, 10_000, 500)
                    .setValue(this.plugin.settings.maxContextLength)
                    .setDynamicTooltip()
                    .onChange(async (value) => {
                        this.plugin.settings.maxContextLength = value;
                        await this.plugin.saveSettings();
                    }),
            );

        new Setting(containerEl)
            .setName("AnkiConnect Endpoint")
            .setDesc("API endpoint provided by AnkiConnect")
            .addText((text) =>
                text
                    .setPlaceholder("http://127.0.0.1:8765")
                    .setValue(this.plugin.settings.ankiConnectEndpoint)
                    .onChange(async (value) => {
                        this.plugin.settings.ankiConnectEndpoint = value;
                        await this.plugin.saveSettings();
                    }),
            );
    }
}
