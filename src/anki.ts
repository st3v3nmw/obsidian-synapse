import { Question } from "./types";

async function callAnki(endpoint: string, action: string, params: object = {}): Promise<any> {
    const response = await fetch(endpoint, {
        method: "POST",
        body: JSON.stringify({ action, version: 6, params }),
    });
    return await response.json();
}

export async function createAnkiDeck(endpoint: string, deck: string): Promise<any> {
    return await callAnki(endpoint, "createDeck", { deck });
}

export async function createNewNoteOnAnki(
    endpoint: string,
    qn: Question,
    answer: string,
    deck: string,
): Promise<any> {
    return await callAnki(endpoint, "addNote", {
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
    endpoint: string,
    qn: Question,
    deck: string,
    answer?: string,
): Promise<void> {
    const cards = (
        await callAnki(endpoint, "notesInfo", {
            notes: [Number(qn.id)],
        })
    )["result"][0]["cards"];

    const cardsInfo = (
        await callAnki(endpoint, "cardsInfo", {
            cards: cards,
        })
    )["result"];

    if (cardsInfo[0]["deckname"] != deck) {
        await callAnki(endpoint, "changeDeck", { cards, deck });
    }

    if (answer) {
        await callAnki(endpoint, "updateNote", {
            note: {
                id: Number(qn.id),
                fields: {
                    Front: qn.content,
                    Back: answer,
                },
            },
        });
    }
}
