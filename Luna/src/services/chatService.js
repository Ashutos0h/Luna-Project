export async function sendMessage(
    message,
    documentContext = "",
    memories = [],
    aiModel = "qwen2.5:3b"
) {

    try {

        if (!window.electronAPI) {

            console.warn("window.electronAPI is undefined. Returning browser fallback response.");

            return "Note: Electron API is not active in standard browser mode. Please open Luna via Electron desktop application.";

        }


        const response =
            await window.electronAPI.sendMessage({

                message: message,

                documentContext:
                    documentContext,

                memories: memories,

                aiModel: aiModel,

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