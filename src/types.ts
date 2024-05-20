import { TFile } from 'obsidian';

export interface SynapseDocument {
	file: TFile;
	original: string;
	working: string;
}

export interface Question {
	content: string;
	id: string | null;
	parent: SynapseDocument;
}
