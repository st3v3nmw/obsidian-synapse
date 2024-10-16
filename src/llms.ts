// Open Router

export async function callOpenRouter(
    apiKey: string,
    model: string,
    prompt: string,
    context: string,
): Promise<string> {
    const body = {
        model: model,
        prompt: (prompt + context),
    };
    console.log("[Synapse] Generating flashcards with payload:")
    console.log(body);

    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
        method: "POST",
        headers: {
            Authorization: `Bearer ${apiKey}`,
            "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
    });

    const json = (await response.json());
    console.log("[Synapse] Got response:")
    console.log(json);

    return json["choices"][0]["text"];
}
