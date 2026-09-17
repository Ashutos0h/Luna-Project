export const STORAGE_KEY = "luna_conversations";
const MAX_BACKUP_SIZE = 10 * 1024 * 1024;
const MAX_CONVERSATIONS = 500;
const MAX_MESSAGES_PER_CONVERSATION = 500;

function createStorageId(prefix) {
    return `${prefix}-${globalThis.crypto?.randomUUID?.() || `${Date.now()}-${Math.random().toString(36).slice(2)}`}`;
}

export function normalizeConversations(value) {
    if (!Array.isArray(value)) return [];

    const seenChatIds = new Set();

    return value.slice(0, MAX_CONVERSATIONS).flatMap((chat) => {
        if (!chat || typeof chat !== "object" || !Array.isArray(chat.messages)) return [];

        let chatId = String(chat.id ?? "").trim();
        if (!chatId || seenChatIds.has(chatId)) chatId = createStorageId("chat");
        seenChatIds.add(chatId);

        const seenMessageIds = new Set();
        const messages = chat.messages.slice(-MAX_MESSAGES_PER_CONVERSATION).flatMap((message) => {
            if (!message || !["user", "assistant"].includes(message.sender)) return [];
            const rawText = String(message.text || "");
            if (!rawText.trim()) return [];
            const text = rawText.slice(0, 12000);

            let messageId = String(message.id ?? "").trim();
            if (!messageId || seenMessageIds.has(messageId)) messageId = createStorageId("message");
            seenMessageIds.add(messageId);

            return [{
                id: messageId,
                sender: message.sender,
                text,
                error: Boolean(message.error),
                edited: Boolean(message.edited),
                kind: ["action", "memory"].includes(message.kind) ? message.kind : undefined,
                intent: typeof message.intent === "string" ? message.intent.slice(0, 80) : undefined,
            }];
        });

        return [{
            id: chatId,
            title: String(chat.title || "Untitled conversation").trim().slice(0, 100) || "Untitled conversation",
            pinned: Boolean(chat.pinned),
            customTitle: Boolean(chat.customTitle),
            updatedAt: Number.isFinite(Number(chat.updatedAt)) && Number(chat.updatedAt) > 0 ? Number(chat.updatedAt) : (Number(chat.id) || 0),
            messages,
        }];
    });
}


// ==============================
// Load Conversations
// ==============================

export function loadConversations() {

    const data = localStorage.getItem(STORAGE_KEY);

    if (!data) {
        return [];
    }

    try {

        const conversations = JSON.parse(data);

        if (!Array.isArray(conversations)) {
            console.error("Stored conversations are not an array.");
            return [];
        }

        return normalizeConversations(conversations);

    } catch (error) {

        console.error(
            "Error loading conversations:",
            error
        );

        return [];

    }

}


// ==============================
// Save Conversations
// ==============================

export function saveConversations(conversations) {
    try {
        localStorage.setItem(
            STORAGE_KEY,
            JSON.stringify(normalizeConversations(conversations))
        );
        return true;
    } catch (error) {
        console.error("Unable to save conversations:", error);
        return false;
    }

}


// ==============================
// Clear Conversations
// ==============================

export function clearConversations() {

    localStorage.removeItem(STORAGE_KEY);

}


// ==============================
// Export Conversations
// ==============================

function downloadConversationJson(conversations, fileName) {
    const json = JSON.stringify(conversations, null, 2);
    const blob = new Blob([json], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");

    link.href = url;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export function exportConversations() {

    const conversations = loadConversations();
    downloadConversationJson(conversations, "luna_conversations.json");

}


export function exportConversation(conversation) {
    if (!conversation || !Array.isArray(conversation.messages)) return false;

    const safeTitle = String(conversation.title || "conversation")
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-|-$/g, "")
        .slice(0, 60) || "conversation";

    downloadConversationJson([conversation], `luna-${safeTitle}.json`);
    return true;
}


// ==============================
// Import Conversations
// ==============================

export function importConversations(file) {

    return new Promise((resolve, reject) => {

        if (!file) {

            reject(
                new Error("No file selected.")
            );

            return;

        }

        if (file.size > MAX_BACKUP_SIZE) {

            reject(
                new Error("The backup is too large. Please select a file smaller than 10 MB.")
            );

            return;

        }


        // Make sure the user selected JSON
        if (
            file.type !== "application/json" &&
            !file.name.toLowerCase().endsWith(".json")
        ) {

            reject(
                new Error(
                    "Please select a JSON file."
                )
            );

            return;

        }


        const reader = new FileReader();


        // File successfully read
        reader.onload = (event) => {

            try {

                const conversations = JSON.parse(
                    event.target.result
                );


                // ==========================
                // Check root structure
                // ==========================

                if (!Array.isArray(conversations)) {

                    reject(
                        new Error(
                            "Invalid Luna backup: the file must contain a list of conversations."
                        )
                    );

                    return;

                }


                // ==========================
                // Check conversation structure
                // ==========================

                const validConversations =
                    conversations.every((chat) => {

                        return (
                            chat &&
                            typeof chat === "object" &&
                            "id" in chat &&
                            typeof chat.title === "string" &&
                            Array.isArray(chat.messages) &&
                            chat.messages.every((message) => (
                                message &&
                                typeof message === "object" &&
                                (message.sender === "user" || message.sender === "assistant") &&
                                typeof message.text === "string"
                            ))
                        );

                    });


                if (!validConversations) {

                    reject(
                        new Error(
                            "Invalid Luna backup: conversation format is incorrect."
                        )
                    );

                    return;

                }


                // ==========================
                // Save imported conversations
                // ==========================

                const importedConversations = normalizeConversations(conversations);
                if (!saveConversations(importedConversations)) {
                    reject(new Error("Luna could not save the imported conversations. Check available disk space."));
                    return;
                }


                resolve(
                    importedConversations
                );


            } catch (error) {

                console.error(
                    "JSON parsing error:",
                    error
                );

                reject(
                    error instanceof SyntaxError
                        ? new Error("The selected file contains invalid JSON.")
                        : error
                );

            }

        };


        // File reading error
        reader.onerror = () => {

            reject(
                new Error(
                    "Unable to read the selected file."
                )
            );

        };


        // Start reading file
        reader.readAsText(file);

    });

}
