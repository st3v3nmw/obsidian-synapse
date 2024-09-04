import { interpolate } from "./utils";

// Open Router

export async function callOpenRouter(
    apiKey: string,
    model: string,
    prompt: string,
    question: string,
    context: string,
): Promise<string> {
    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
        method: "POST",
        headers: {
            Authorization: `Bearer ${apiKey}`,
            "Content-Type": "application/json",
        },
        body: JSON.stringify({
            model: model,
            prompt: interpolate(prompt, { question, context }),
        }),
    });

    return (await response.json())["choices"][0]["text"];
}
