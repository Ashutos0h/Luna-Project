import { loadMemories } from "./memoryStorage";

export async function sendMessage(message) {

    const memories = loadMemories();

    let memoryContext = "";

    if (memories.length > 0) {

        memoryContext =
            memories
                .map(
                    memory =>
                        `${memory.title}: ${memory.value}`
                )
                .join("\n");

    }

    const prompt = `
User Memories:

${memoryContext}

User Question:

${message}
`;

    return await window.electronAPI.sendMessage(prompt);

}