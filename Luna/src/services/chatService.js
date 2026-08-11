import { loadMemories } from "./memoryStorage";
import { loadSettings } from "./settingsStorage";

export async function sendMessage(message, documentContext = "") {

    try {

        const response = await window.electronAPI.sendMessage({

            message: message,

            documentContext: documentContext,

        });

        return response;

    } catch (error) {

        console.error(
            "Chat service error:",
            error
        );

        throw error;

    }

}