import { TfIdf } from 'natural';
import { encodingForModel } from "js-tiktoken";

import { Question, SynapseDocument } from "./types";
import { Vault } from 'obsidian';

async function callAnki(action: string, params: object = {}) {
    const response = await fetch('http://127.0.0.1:8765', {
        method: "POST",
        body: JSON.stringify({ action, version: 6, params })
    });
    return await response.json();
}


export function getQuestions(document: SynapseDocument): Question[] {
    let matches = document.working.matchAll(/\\\[!question\]\n(.+?(?=\^|$))\^?(.+)?/gm);
    let questions: Question[] = [];
    for (const match of matches) {
        questions.push({ content: match[1], id: match[2], parent: document })
    }
    return questions;
}

async function callOpenRouter(question: string, context: string): Promise<string> {
    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
        method: "POST",
        headers: {
            "Authorization": `Bearer `,
            "X-Title": "Obsidian Synapse",
            "Content-Type": "application/json"
        },
        body: JSON.stringify({
            "model": "anthropic/claude-3-sonnet",
            "prompt": (
                `In about 30 words, give a concise answer to the question "${question}" +
                "Base your answer on the following context:\n${context}`
            )
        })
    });

    return (await response.json())["choices"][0]["text"];
}


export async function syncFlashcards(documents: SynapseDocument[], vault: Vault) {
    const encoding = encodingForModel("gpt-4");

    const tfidf = new TfIdf();
    let questions: Question[] = [];
    for (const document of documents) {
        questions.push(...getQuestions(document));
        document.working = document.working.replace(/\\\[!question\]\n.+/gm, "");
        tfidf.addDocument(document.working);
    }

    let createdDecks = new Set();

    for (const qn of questions) {
        const deck = qn.parent.file.path.split("/").slice(0, -1).join("::");
        if (!createdDecks.has(deck)) {
            await callAnki("createDeck", { deck: deck });
        }

        if (qn.id != null || qn.id != undefined) {
            const cards = (
                await callAnki(
                    "notesInfo",
                    {

                        "notes": [Number(qn.id)]
                    }
                )
            )["result"][0]["cards"];

            const cardsInfo = (
                await callAnki(
                    "cardsInfo",
                    {
                        "cards": cards
                    }
                )
            )["result"]

            if (cardsInfo[0]["deckname"] != deck) {
                await callAnki("changeDeck", { cards, deck })
            }
        } else {
            console.log(qn.content)
            let results: [string, number][] = [];
            tfidf.tfidfs(qn.content, (i, measure) => {
                results.push([documents[i].working, measure])
            });
            results.sort((a, b) => b[1] - a[1])

            let context: string = "", length = 0;
            for (const [doc, score] of results) {
                if (score <= 0 || length > 2000) {
                    break
                }

                context += "\n" + doc;
                length += encoding.encode(doc).length;
            }

            console.log(context, length);

            const answer = await callOpenRouter(qn.content, context);
            console.log(answer);

            const response = await callAnki("addNote", {
                note: {
                    deckName: deck, modelName: "Basic", fields: {
                        Front: qn.content, Back: answer
                    }
                }
            });

            qn.parent.original = qn.parent.original.replace(qn.content, `${qn.content} ^${response["result"]}`)
            await vault.modify(qn.parent.file, qn.parent.original);
        }
    }
}
