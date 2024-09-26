# Obsidian Synapse

Generate flashcard answers with LLMs based on your Obsidian notes and sync them to Anki.

## Context

I tried generating flashcards from my notes where the LLM generates both the questions
and the answers. One issue with this approach is that the LLM would add questions that I didn't
care about, for instance the dates of historical events. Or I didn't like how it phrased the questions.

Of course this can easily be fixed by reviewing the list of generated flashcards to weed out what you don't want. Or you can update your prompt to do exactly what you want. But why do that when we can create a new plugin? :)

This plugin acts as a middle ground between creating all your flashcards manually and having an LLM generate them for you.

Please note that this plugin is a proof of concept. I don't use it in my day-to-day. If you use the [Spaced Repetition](https://github.com/st3v3nmw/obsidian-spaced-repetition) plugin, you can try the [Obsidian Flashcards LLM](https://github.com/crybot/obsidian-flashcards-llm) plugin instead.

## Setup

### Anki

- Install [Anki](https://apps.ankiweb.net/)
- Install [AnkiConnect](https://ankiweb.net/shared/info/2055492159)
    -   Add `app://obsidian.md` to the `webCorsOriginList` entry in the add-on's config (`Tools -> Add-ons -> AnkiConnect -> Config`). It should look like this afterwards:

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

- Next, create a note type called `Synapse` (`Tools -> Manage Notes Type -> Add`). It should have 3 fields: `Front`, `Back`, & `Topic`. It's basically, a `Basic` note with a `Topic` field to add context on which file the card was generated from.

You can use this as the template:

Front:

```
<i>{{Topic}}</i>

<br/><br/>

{{Front}}
```

Back:

```
{{FrontSide}}

<hr id=answer>

{{Back}}
```

### Plugin

In the plugin's settings, add your [OpenRouter API Key](https://openrouter.ai/docs/api-keys).

If you wish, you can update the LLM prompt. This is the default:

```
In one short sentence, give a concise answer to the question "${question}".
For math equations, use the format: <anki-mathjax>equation</anki-mathjax>.
Wrap code in italics <i>code</i>.
DO NOT repeat the instructions or question in your answer.
Base your answer on the following context:
${context}
```

## Usage

Add your question as a one-line [call-out](https://help.obsidian.md/Editing+and+formatting/Callouts):

```markdown
Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.
Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.
Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur.
Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.

> [!question] What is X?
```

Click the plugin's icon on the ribbon bar to generate and sync the flashcards to Anki. Make sure that Anki is running.

Done!

If you want to regenerate the flashcards, use the `Regenerate flashcards & sync` command.
