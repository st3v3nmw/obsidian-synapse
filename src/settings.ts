import { App, PluginSettingTab, Setting } from "obsidian";

import type SynapsePlugin from "./main";

export interface SynapsePluginSettings {
    model: string;
    apiKey: string;
    prompt: string;
}

export const DEFAULT_SETTINGS: SynapsePluginSettings = {
    model: "anthropic/claude-3-sonnet",
    apiKey: "",
    prompt: (
        'In about 30 words, give a concise answer to the question "${question}"' +
        'Base your answer on the following context:\n${context}'
    )
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
            .addText(text => text
                .setValue(this.plugin.settings.model)
                .onChange(async (value) => {
                    this.plugin.settings.model = value;
                    await this.plugin.saveSettings();
                }));

        new Setting(containerEl)
            .setName("API Key")
            .setDesc("API key provided by your LLM provider")
            .addTextArea(text => text
                .setPlaceholder("Bearer: ...")
                .setValue(this.plugin.settings.apiKey)
                .onChange(async (value) => {
                    this.plugin.settings.model = value;
                    await this.plugin.saveSettings();
                }));

        new Setting(containerEl)
            .setName("Prompt")
            .setDesc("Give instructions to the LLM")
            .addTextArea(text => text
                .setPlaceholder("Give a concise answer to ${question} based on the following context: ${context}")
                .setValue(this.plugin.settings.prompt)
                .onChange(async (value) => {
                    this.plugin.settings.model = value;
                    await this.plugin.saveSettings();
                }));
    }
}
