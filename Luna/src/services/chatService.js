export async function sendMessage(
    message,
    documentContext = "",
    memories = [],
    aiModel = "qwen2.5:3b",
    conversationHistory = [],
    options = {}
) {

    let unsubscribe = null;

    try {

        if (!window.electronAPI) {

            console.warn("window.electronAPI is undefined. Returning browser fallback response.");

            return "Note: Electron API is not active in standard browser mode. Please open Luna via Electron desktop application.";

        }


        const requestId = options.requestId || `chat-${Date.now()}`;

        if (typeof options.onChunk === "function" && window.electronAPI.onChatStream) {
            unsubscribe = window.electronAPI.onChatStream((event) => {
                if (event?.requestId !== requestId || !event.delta) return;
                options.onChunk(event.delta);
            });
        }

        const response =
            await window.electronAPI.sendMessage({

                message: message,

                documentContext:
                    documentContext,

                memories: memories,

                aiModel: aiModel,

                conversationHistory:
                    conversationHistory,

                requestId: requestId,

                allowAutoMemory:
                    options.allowAutoMemory !== false,

                performanceMode:
                    options.performanceMode || "fast",

                desktopControlEnabled:
                    options.desktopControlEnabled === true,

            });

        if (typeof response === "string") {
            return {
                text: response,
                intent: "normal_chat",
                actions: [],
            };
        }

        return {
            text: String(response?.text || ""),
            intent: String(response?.intent || "normal_chat"),
            actions: Array.isArray(response?.actions) ? response.actions : [],
        };

    } catch (error) {

        console.error(
            "Chat service error:",
            error
        );

        throw error;

    } finally {

        unsubscribe?.();

    }

}

export async function cancelMessage(requestId) {
    if (!requestId || !window.electronAPI?.cancelChatRequest) return false;

    const result = await window.electronAPI.cancelChatRequest(requestId);
    return Boolean(result?.success);
}
