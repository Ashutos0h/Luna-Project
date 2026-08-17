export async function sendMessage(
    message,
    documentContext = "",
    memories = []
) {

    try {

        const response =
            await window.electronAPI.sendMessage({

                message: message,

                documentContext:
                    documentContext,

                memories: memories,

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