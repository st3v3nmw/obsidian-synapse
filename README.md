# Obsidian Synapse

Generate flashcard answers with LLMs based on your Obsidian notes and sync them to Anki.

-   install AnkiConnect
    -   add `app://obsidian.md` to config (`webCorsOriginList`)

```json
{
    "apiKey": null,
    "apiLogPath": null,
    "ignoreOriginList": [],
    "webBindAddress": "127.0.0.1",
    "webBindPort": 8765,
    "webCorsOriginList": ["http://localhost", "app://obsidian.md"]
}
```

Create a note model called Synapse...

Add your question as a call-out:

```
> [!question] What is X?
```
