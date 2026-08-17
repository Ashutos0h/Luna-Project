/* global process */
import { app, BrowserWindow, ipcMain } from "electron";
import path from "path";
import { fileURLToPath } from "url";
import axios from "axios";
import log from "electron-log/main.js";

// Initialize electron-log
log.initialize();

// Send console logs to Terminal and DevTools
Object.assign(console, log.functions);

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);


// ==============================
// Create Window
// ==============================

function createWindow() {

  const win = new BrowserWindow({

    width: 1200,
    height: 800,

webPreferences: {
    preload: path.join(__dirname, "preload.js"),
},

  });

  win.loadURL(
    "http://localhost:5173"
  );


}


// ==============================
// App Ready
// ==============================

app.whenReady().then(createWindow);


// ==============================
// Find Relevant Memories
// ==============================

function getRelevantMemories(memories, message) {

  if (!memories || memories.length === 0) {
    return [];
  }

  const questionWords = message
    .toLowerCase()
    .split(/\s+/)
    .filter(word => word.length > 2);


  const scoredMemories = memories.map(memory => {

    const memoryText = `
      ${memory.title}
      ${memory.value}
    `.toLowerCase();

    let score = 0;


    questionWords.forEach(word => {

      if (memoryText.includes(word)) {
        score++;
      }

    });


    return {
      memory,
      score,
    };

  });


  return scoredMemories

    .filter(item => item.score > 0)

    .sort(
      (a, b) =>
        b.score - a.score
    )

    .slice(0, 5)

    .map(item => item.memory);

}


// ==============================
// Chat + Document + Memory Handler
// ==============================

ipcMain.handle(
  "chat-message",
  async (event, data) => {

    console.log(
      "Message received:",
      data
    );

    try {

      // ==============================
      // Get Data
      // ==============================

      const message =
        data.message;

      const documentContext =
        data.documentContext || "";

    const memories =
  data.memories || [];

   const relevantMemories =
  getRelevantMemories(
    memories,
    message
  );


      // ==============================
      // Prepare Memory Context
      // ==============================

      let memoryContext = "";

if (relevantMemories.length > 0) {

  memoryContext = relevantMemories
  
    .map(memory => {

  console.log(
  "Relevant Memories:",
  relevantMemories
);      

            return `
Memory:
Title: ${memory.title}
Value: ${memory.value}
`;

          })
          .join("\n");

      }

      


      // ==============================
      // Prepare Ollama Messages
      // ==============================

      let messages;


      // ==============================
      // Document Mode
      // ==============================

      if (documentContext.trim()) {

        messages = [

          {
            role: "system",

            content: `
You are Luna, a helpful local AI assistant.

You have access to information saved by the user
as memories and to an attached document.

USER MEMORIES:

${memoryContext}

DOCUMENT RULES:

1. Use the attached document when the user's
   question is about the document.

2. If the answer is present in the document,
   answer directly.

3. Do not invent information from the document.

4. If the user asks about the document and the
   answer is not present, say:

"I couldn't find that information in the document."

MEMORY RULES:

1. Use memories when they are relevant to the
   user's question.

2. Do not invent memories.

3. If the user provides new information that
   conflicts with an old memory, prefer the
   user's current message.

Answer clearly and naturally.
            `,
          },


          {
            role: "user",

            content: `
===== ATTACHED DOCUMENT =====

${documentContext}

===== END DOCUMENT =====


===== USER QUESTION =====

${message}

===== END QUESTION =====
            `,
          },

        ];

      }


      // ==============================
      // Normal Chat
      // ==============================

      else {

        messages = [

          {
            role: "system",

            content: `
You are Luna, a helpful local AI assistant.

You have access to memories saved by the user.

USER MEMORIES:

${memoryContext}

MEMORY RULES:

1. Use memories when they are relevant to
   the user's question.

2. Do not invent memories.

3. If the user provides new information that
   conflicts with an old memory, prefer the
   user's current message.

Answer clearly and naturally.
            `,
          },


          {
            role: "user",

            content: message,

          },

        ];

      }


      // ==============================
      // Debug
      // ==============================

      console.log(
        "Memory Context:",
        memoryContext
      );

      console.log(
        "Messages sent to Ollama:",
        messages
      );


      // ==============================
      // Send to Ollama
      // ==============================

      console.log(
        "Sending prompt to Ollama..."
      );


      const response = await axios.post(

        "http://localhost:11434/api/chat",

        {

          model: "qwen2.5:3b",

          messages: messages,

          stream: false,

        }

      );


      // ==============================
      // Ollama Response
      // ==============================

      console.log(
        "Ollama Response:",
        response.data
      );


      return response.data.message.content;


    } catch (error) {

      console.error(
        "OLLAMA ERROR:"
      );

      console.error(
        error.response?.data
      );

      console.error(
        error.message
      );


      return "Unable to connect to Ollama.";

    }

  }
);


// ==============================
// Close App
// ==============================

app.on(
  "window-all-closed",
  () => {

    if (
      process.platform !== "darwin"
    ) {

      app.quit();

    }

  }
);