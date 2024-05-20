import { Question } from "./types";

async function callAnki(action: string, params: object = {}): Promise<any> {
    const response = await fetch("http://127.0.0.1:8765", {
        method: "POST",
        body: JSON.stringify({ action, version: 6, params }),
    });
    return await response.json();
}

export async function createAnkiDeck(deck: string): Promise<any> {
    return await callAnki("createDeck", { deck });
}

export async function createNewNoteOnAnki(
    qn: Question,
    answer: string,
    deck: string,
): Promise<any> {
    return await callAnki("addNote", {
        note: {
            deckName: deck,
            modelName: "Basic",
            fields: {
                Front: qn.content,
                Back: answer,
            },
        },
    });
}

export async function updateExistingNoteOnAnki(
    qn: Question,
    deck: string,
    regenerate: boolean = false,
): Promise<void> {
    const cards = (
        await callAnki("notesInfo", {
            notes: [Number(qn.id)],
        })
    )["result"][0]["cards"];

    const cardsInfo = (
        await callAnki("cardsInfo", {
            cards: cards,
        })
    )["result"];

    if (cardsInfo[0]["deckname"] != deck) {
        await callAnki("changeDeck", { cards, deck });
    }
}
