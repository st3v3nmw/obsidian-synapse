import { Notice, Plugin, TFile } from 'obsidian';
import { remark } from 'remark';
import strip from 'strip-markdown';

import { syncFlashcards } from "./flashcards";
import { DEFAULT_SETTINGS, SynapsePluginSettings, SynapseSettingTab } from "./settings";
import { SynapseDocument } from "./types";

export default class SynapsePlugin extends Plugin {
	settings: SynapsePluginSettings;

	async onload() {
		await this.loadSettings();

		this.addRibbonIcon('brain-circuit', 'Obsidian Synapse', async (_: MouseEvent) => {
			await this.syncFlashcards();
		});

		this.addCommand({
			id: 'sync-flashcards',
			name: 'Sync Synapse flashcards to Anki',
			callback: async () => {
				await this.syncFlashcards();
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

	async syncFlashcards() {
		new Notice('Syncing Synapse flashcards...');

		syncFlashcards(await this.readFiles(), this.app.vault);
	}

	async readFiles(): Promise<SynapseDocument[]> {
		const files: TFile[] = this.app.vault.getMarkdownFiles()
		let documents: SynapseDocument[] = [];
		for (const file of files) {
			let original = await this.app.vault.read(file)
			if (original.trim().length > 0) {
				const clean = String(
					await remark()
						.use(strip, {
							"keep": ["code", "table", "listItem"]
						})
						.process(original)
				)

				documents.push({
					file,
					original,
					working: file.basename.trim() + "\n" + clean.trim(),
				})
			}
		}

		return documents;
	}
}
