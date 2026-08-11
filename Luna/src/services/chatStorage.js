export const STORAGE_KEY = "luna_conversations";


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

        return conversations;

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

    localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify(conversations)
    );

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

export function exportConversations() {

    const conversations = loadConversations();

    const json = JSON.stringify(
        conversations,
        null,
        2
    );

    const blob = new Blob(
        [json],
        {
            type: "application/json",
        }
    );

    // Create temporary URL
    const url = URL.createObjectURL(blob);

    // Create download link
    const link = document.createElement("a");

    link.href = url;

    link.download = "luna_conversations.json";

    document.body.appendChild(link);

    link.click();

    document.body.removeChild(link);

    // Remove temporary URL
    URL.revokeObjectURL(url);

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
                            "title" in chat &&
                            Array.isArray(chat.messages)
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

                saveConversations(
                    conversations
                );


                resolve(
                    conversations
                );


            } catch (error) {

                console.error(
                    "JSON parsing error:",
                    error
                );

                reject(
                    new Error(
                        "The selected file contains invalid JSON."
                    )
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