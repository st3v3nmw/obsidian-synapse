import { App, PluginSettingTab, Setting } from 'obsidian';

import type SynapsePlugin from "./main";

export interface SynapsePluginSettings {
    mySetting: string;
}

export const DEFAULT_SETTINGS: SynapsePluginSettings = {
    mySetting: 'default'
}

export class SynapseSettingTab extends PluginSettingTab {
    plugin: SynapsePlugin;

    constructor(app: App, plugin: SynapsePlugin) {
        super(app, plugin);
        this.plugin = plugin;
    }

    display(): void {
        const { containerEl } = this;

        containerEl.empty();
    }
}
