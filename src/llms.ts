// Open Router

export async function callOpenRouter(question: string, context: string): Promise<string> {
    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
        method: "POST",
        headers: {
            Authorization: `Bearer `,
            "X-Title": "Obsidian Synapse",
            "Content-Type": "application/json",
        },
        body: JSON.stringify({
            model: "anthropic/claude-3-sonnet",
            prompt:
                `In about 30 words, give a concise answer to the question "${question}"` +
                `Base your answer on the following context:\n${context}`,
        }),
    });

    return (await response.json())["choices"][0]["text"];
}
