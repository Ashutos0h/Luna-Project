import { loadMemories } from "./memoryStorage";
import { loadSettings } from "./settingsStorage";

export async function sendMessage(message) {

    const memories = loadMemories();

    const settings = loadSettings();

    let memoryContext = "";

    if(memories.length>0){

        memoryContext = memories
            .map(memory=>`${memory.title}: ${memory.value}`)
            .join("\n");

    }

    const prompt = `

Assistant Name:
${settings.assistantName}

Language:
${settings.language}

User Memories:

${memoryContext}

User Question:

${message}

`;

    return await window.electronAPI.sendMessage({

        model:settings.aiModel,

        prompt,

    });

}