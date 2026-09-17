export const INTENT_ROUTER_MODEL = "qwen2.5:3b";

export const INTENT_ROUTER_SYSTEM_PROMPT = `You are Luna's dedicated intent router. Infer the user's meaning from the current request and recent context, then select exactly one primary tool. Never answer the request yourself.

DECISION POLICY:
- search_web: current, local, nearby, best/recommended providers, live news, prices, schedules, weather, or an explicit request to search/browse.
- open_website: only when the user wants a specific named website opened. Do not use it merely because a useful webpage exists.
- open_common_folder: only when the user wants a standard Windows folder opened.
- open_application: only when the user explicitly wants installed software launched.
- open_application_and_type: only when the user explicitly wants an app opened and exact supplied text typed or pasted into it.
- generate_content_and_type: only when the user asks Luna to create content such as a story, email, note, or draft and then put that generated content in a named application.
- search_in_application: only when Advanced desktop control is enabled and the user explicitly asks to search for a query inside a named application or platform.
- click_desktop_element: only when Advanced desktop control is enabled and the user explicitly asks to click a visible, named element in the currently open application.
- type_into_active_application: only when Advanced desktop control is enabled and the user explicitly asks to type exact supplied text into the currently focused application.
- press_hotkey: only when Advanced desktop control is enabled and the user asks to press a keyboard shortcut like Ctrl+S, Ctrl+Z, F5, Enter, Escape, Alt+Tab, etc.
- scroll_desktop: only when Advanced desktop control is enabled and the user asks to scroll up, scroll down, scroll to top, page down, etc.
- focus_application_window: only when Advanced desktop control is enabled and the user asks to switch to, focus, or bring up a specific named application window.
- save_memory: when the current message's main purpose is to remember a stable, useful, non-sensitive user fact.
- respond_normally: explanations, writing, coding, advice, troubleshooting, memory recall, and all other ordinary conversation.

IMPORTANT BOUNDARIES:
- "How do I open Chrome?" is respond_normally; "Open Chrome" is open_application.
- "Explain recursion" is respond_normally; never open a website to answer it.
- "What did I tell you about my project?" is respond_normally and must never create a new memory.
- "Open Notepad and write hello" is open_application_and_type with text exactly "hello".
- "Write a short story about space in Notepad" is generate_content_and_type. Generate the content immediately and paste it into the application.
- If the user already received generated content and then says "save", "put it in Notepad", or "it is not saved yet", treat that as generate_content_and_type / typing into the same application. Never claim the file was saved unless a desktop action actually ran.
- "Search lo-fi music on YouTube" is search_in_application with application "YouTube" and query "lo-fi music".
- "Click the Save button" is click_desktop_element with element "Save" only when desktop control is enabled.
- "Click Subscribe on YouTube" is click_desktop_element with element "Subscribe" only when desktop control is enabled.
- "Type hello in the active window" is type_into_active_application with text exactly "hello" only when desktop control is enabled.
- "Press Ctrl+S" or "save with keyboard shortcut" is press_hotkey with keys ["ctrl","s"] only when desktop control is enabled.
- "Press Enter" is press_hotkey with keys ["enter"] only when desktop control is enabled.
- "Scroll down" or "scroll the page down" is scroll_desktop with direction "down" only when desktop control is enabled.
- "Switch to Chrome" or "focus Chrome" is focus_application_window with title "Chrome" only when desktop control is enabled.
- For a mixed message such as "I prefer short answers; explain recursion", use respond_normally and include memory_title/memory_value for the asserted preference.
- A question, request, guess, temporary detail, secret, or fact about somebody else is not a memory.
- If uncertain, use respond_normally.`;

export const intentTools = [
  {
    type: "function",
    function: {
      name: "search_web",
      description: "Open a web search in the user's default browser. Use when the user wants to search/browse/Google something, or needs current local results such as doctors, restaurants, news, prices, schedules, or nearby services.",
      parameters: {
        type: "object",
        required: ["query"],
        properties: {
          query: { type: "string", description: "A concise search query containing the important location and subject." },
          engine: { type: "string", enum: ["google", "bing", "duckduckgo", "yahoo", "brave"] },
          memory_title: { type: "string", description: "Optional stable user fact category stated in this same message." },
          memory_value: { type: "string", description: "Optional stable, non-sensitive user fact stated in this same message." },
        },
      },
    },
  },
  {
    type: "function",
    function: {
      name: "generate_content_and_type",
      description: "Generate requested written content, then open a named application and paste that generated content. Use only when the user explicitly asks Luna to write/create/draft/compose content such as a story, email, note, or message in a named application such as Notepad or Word. Generate the content immediately — a native system dialog will handle confirmation before pasting.",
      parameters: {
        type: "object",
        required: ["application"],
        properties: {
          application: { type: "string", description: "The target application, for example Notepad or Word." },
        },
      },
    },
  },
  {
    type: "function",
    function: {
      name: "open_website",
      description: "Open a specific website in the default browser. Use for requests such as go to YouTube or open github.com. Use search_web instead when the user wants results for a query.",
      parameters: {
        type: "object",
        required: ["url"],
        properties: {
          url: { type: "string", description: "The website URL or domain, such as https://youtube.com or github.com." },
          memory_title: { type: "string", description: "Optional stable user fact category stated in this same message." },
          memory_value: { type: "string", description: "Optional stable, non-sensitive user fact stated in this same message." },
        },
      },
    },
  },
  {
    type: "function",
    function: {
      name: "open_common_folder",
      description: "Open one of the user's standard Windows folders. Use only when the user asks to open Desktop, Downloads, Documents, Pictures, Music, Videos, or their home folder.",
      parameters: {
        type: "object",
        required: ["location"],
        properties: {
          location: {
            type: "string",
            enum: ["desktop", "downloads", "documents", "pictures", "music", "videos", "home"],
          },
          memory_title: { type: "string", description: "Optional stable user fact category stated in this same message." },
          memory_value: { type: "string", description: "Optional stable, non-sensitive user fact stated in this same message." },
        },
      },
    },
  },
  {
    type: "function",
    function: {
      name: "open_application",
      description: "Open an application installed on the user's Windows computer. Use only when the user clearly wants an app launched, not when they ask how to use or install an app.",
      parameters: {
        type: "object",
        required: ["application"],
        properties: {
          application: { type: "string", description: "The application name, such as Chrome, Calculator, VS Code, or WhatsApp." },
          memory_title: { type: "string", description: "Optional stable user fact category stated in this same message." },
          memory_value: { type: "string", description: "Optional stable, non-sensitive user fact stated in this same message." },
        },
      },
    },
  },
  {
    type: "function",
    function: {
      name: "open_application_and_type",
      description: "Open an installed application and type or paste user-provided text into it. Use only when the user explicitly asks both to open an app and write/type/paste specific text. The application will ask for confirmation before typing.",
      parameters: {
        type: "object",
        required: ["application", "text"],
        properties: {
          application: { type: "string", description: "The target application, such as Notepad or Word." },
          text: { type: "string", description: "The exact text the user requested to type. Do not add or rewrite content." },
          memory_title: { type: "string", description: "Optional stable user fact category stated in this same message." },
          memory_value: { type: "string", description: "Optional stable, non-sensitive user fact stated in this same message." },
        },
      },
    },
  },
  {
    type: "function",
    function: {
      name: "save_memory",
      description: "Save a stable, useful user fact for future conversations even when the user did not explicitly say remember. Save preferences, identity details, recurring work context, or long-term goals. Never save passwords, secrets, financial/medical details, temporary requests, guesses, or facts about other people.",
      parameters: {
        type: "object",
        required: ["title", "value"],
        properties: {
          title: { type: "string", description: "A short category such as Food preference or Work role." },
          value: { type: "string", description: "One concise factual sentence about the user." },
          continue_chat: { type: "boolean", description: "True only when the same message also asks a question that still needs an answer." },
        },
      },
    },
  },
];

const advancedDesktopControlTools = [
  {
    type: "function",
    function: {
      name: "search_in_application",
      description: "Search for a user-supplied query inside a named application or platform. Use only when the user explicitly asks to search in/on a named app or service, such as YouTube, Spotify, GitHub, Slack, or a desktop application. Luna asks for confirmation before searching. Known web platforms use direct search links; other installed apps use guarded local desktop control.",
      parameters: {
        type: "object",
        required: ["application", "query"],
        properties: {
          application: { type: "string", description: "The named target, such as YouTube, Spotify, GitHub, Slack, or VS Code." },
          query: { type: "string", description: "The exact query to search for." },
        },
      },
    },
  },
  {
    type: "function",
    function: {
      name: "click_desktop_element",
      description: "Click one named, visible element in the currently open application using accessibility matching. Falls back to visual AI matching automatically. Use only when the user explicitly asks to click/select a visible button, menu item, checkbox, or link.",
      parameters: {
        type: "object",
        required: ["element"],
        properties: {
          element: { type: "string", description: "The exact visible element label, such as Save, Subscribe, or New tab." },
          element_type: { type: "string", description: "Optional element kind, such as button, menu_item, checkbox, or link." },
        },
      },
    },
  },
  {
    type: "function",
    function: {
      name: "type_into_active_application",
      description: "Type the exact user-supplied text into the currently focused application. Use only when the user explicitly asks to type/write/paste text in their active application.",
      parameters: {
        type: "object",
        required: ["text"],
        properties: {
          text: { type: "string", description: "The exact text the user requested. Do not add, change, or interpret it." },
        },
      },
    },
  },
  {
    type: "function",
    function: {
      name: "press_hotkey",
      description: "Press a keyboard shortcut in the currently active application. Use when the user asks to press a key combination such as Ctrl+S, Ctrl+Z, F5, Enter, Escape, or Alt+Tab.",
      parameters: {
        type: "object",
        required: ["keys"],
        properties: {
          keys: {
            type: "array",
            items: { type: "string" },
            description: "Array of key names to press together, e.g. [\"ctrl\", \"s\"] or [\"f5\"] or [\"escape\"].",
          },
        },
      },
    },
  },
  {
    type: "function",
    function: {
      name: "scroll_desktop",
      description: "Scroll up or down in the currently focused application or window. Use when the user asks to scroll up, scroll down, scroll to top, etc.",
      parameters: {
        type: "object",
        required: ["direction"],
        properties: {
          direction: { type: "string", enum: ["up", "down", "left", "right"], description: "The scroll direction." },
          amount: { type: "number", description: "Number of scroll steps, default 3." },
        },
      },
    },
  },
  {
    type: "function",
    function: {
      name: "focus_application_window",
      description: "Bring a named application window to the foreground and focus it. Use when the user asks to switch to, focus, or bring up a specific application.",
      parameters: {
        type: "object",
        required: ["title"],
        properties: {
          title: { type: "string", description: "The application or window title to focus, e.g. Chrome, Notepad, VS Code." },
        },
      },
    },
  },
];

export function getIntentTools(allowAutoMemory, desktopControlEnabled = false) {
  const standardTools = allowAutoMemory
    ? intentTools
    : intentTools.filter((tool) => tool.function.name !== "save_memory");
  return desktopControlEnabled
    ? [...standardTools, ...advancedDesktopControlTools]
    : standardTools;
}

export function getNormalChatTool(allowAutoMemory) {
  return {
    type: "function",
    function: {
      name: "respond_normally",
      description: "Use for ordinary conversation, explanations, writing, coding, advice, document questions, memory recall, troubleshooting, or anything that does not require a desktop action.",
      parameters: {
        type: "object",
        required: allowAutoMemory ? ["memory_title", "memory_value"] : [],
        properties: allowAutoMemory
          ? {
              memory_title: { type: "string", description: "Category for a stable user fact, or an empty string when there is no safe fact to remember." },
              memory_value: { type: "string", description: "Concise stable, useful, non-sensitive user fact asserted in the current message. Use an empty string for questions, requests, guesses, temporary details, and sensitive information." },
            }
          : {},
      },
    },
  };
}

// Fast first stage for requests that clearly do not need a desktop tool.
// Action-like or time-sensitive requests deliberately return null so the
// semantic Ollama router still makes the final decision. This keeps normal
// conversation fast without going back to brittle keyword-only tool routing.
export function routeClearlyConversationalIntent(message, allowAutoMemory, conversationHistory = []) {
  const text = String(message || "").trim();
  if (!text) return null;

  const mentionsWritableApp = /\b(?:notepad|note\s*pad|notpad|word|excel|chrome|chrme|edge|browser|application|app)\b/i.test(text);
  const mayNeedDesktopAction =
    /\b(?:open|launch|start|search|browse|google|look\s+up|navigate|go\s+to)\b/i.test(text) ||
    /\b(?:click|tap|select|press)\b/i.test(text) ||
    /\b(?:remember|save|store|keep)\b.{0,35}\b(?:this|that|memory|in mind|for later)\b/i.test(text) ||
    (/\b(?:generate|create|compose|draft|write|type|paste|enter|put|save)\b/i.test(text) && mentionsWritableApp) ||
    /\b(?:type|paste|enter|write)\b[\s\S]{0,100}\b(?:active|current|focused)\s+(?:window|app|application)\b/i.test(text) ||
    (isSaveGeneratedContentFollowUp(text) && previousTurnWantedGeneratedWrite(conversationHistory)) ||
    /\b(?:latest|current|today|nearby|near me|weather|news|price|schedule|best|recommended)\b/i.test(text);

  if (mayNeedDesktopAction) return null;

  const memory = allowAutoMemory ? extractStableMemoryCandidate(text) : null;
  return {
    intent: "normal_chat",
    actions: memory ? [memory] : [],
  };
}

// A small, high-confidence command grammar sits in front of the model router.
// It only accepts an unambiguous imperative with a known browser or application.
// This is intentionally not a replacement for semantic intent routing: it keeps
// frequent desktop commands dependable when a small local model declines tools.
const knownLaunchableApplications = new Map([
  ["calculator", "Calculator"], ["calc", "Calculator"],
  ["notepad", "Notepad"], ["note pad", "Notepad"],
  ["chrome", "Chrome"], ["google chrome", "Chrome"],
  ["edge", "Microsoft Edge"], ["microsoft edge", "Microsoft Edge"],
  ["firefox", "Firefox"], ["brave", "Brave"],
  ["paint", "Paint"], ["file explorer", "File Explorer"], ["explorer", "File Explorer"],
  ["word", "Word"], ["excel", "Excel"], ["powerpoint", "PowerPoint"],
  ["vs code", "VS Code"], ["vscode", "VS Code"], ["code", "VS Code"],
  ["camera", "Camera"], ["windows camera", "Camera"],
  ["spotify", "Spotify"], ["whatsapp", "WhatsApp"], ["discord", "Discord"],
  ["terminal", "Terminal"], ["powershell", "PowerShell"],
  ["task manager", "Task Manager"], ["settings", "Settings"],
  ["photos", "Photos"],
  ["yt", "YouTube"], ["youtube", "YouTube"],
]);

const browserNames = new Map([
  ["chrome", "Chrome"], ["google chrome", "Chrome"],
  ["edge", "Microsoft Edge"], ["microsoft edge", "Microsoft Edge"],
  ["firefox", "Firefox"], ["brave", "Brave"],
]);

function cleanExplicitQuery(value) {
  return String(value || "")
    .trim()
    .replace(/^['"`]+|['"`]+$/g, "")
    .replace(/[.!?]+$/g, "")
    .trim()
    .slice(0, 1000);
}

function isClearlyInstructionalRequest(text) {
  return /\?$/.test(text) || /^(?:how\s+(?:do|can|could|should|would)\s+i|how\s+to|can\s+you\s+(?:explain|tell|show)|tell\s+me\s+how)\b/i.test(text);
}

function canonicalApplicationName(rawName) {
  const name = String(rawName || "")
    .trim()
    .toLowerCase()
    .replace(/[.!?]+$/g, "")
    .replace(/\s+/g, " ");
  if (!name) return null;
  if (knownLaunchableApplications.has(name)) return knownLaunchableApplications.get(name);

  const collapsed = name.replace(/[^a-z0-9]/g, "");
  if (collapsed.includes("notepad") || /not+e?p+ad/.test(collapsed)) return "Notepad";

  const tokens = name.split(" ").filter(Boolean);
  for (let count = Math.min(3, tokens.length); count >= 1; count--) {
    const slice = tokens.slice(-count).join(" ");
    if (knownLaunchableApplications.has(slice)) return knownLaunchableApplications.get(slice);
  }
  return null;
}

function extractDestinationApplication(text) {
  const normalized = String(text || "").replace(/\s+/g, " ").trim();
  if (!normalized) return null;

  const prepMatch = normalized.match(/\b(?:in|into|to|on)\s+([a-z0-9][a-z0-9 ._-]{1,80})$/i);
  if (prepMatch) {
    const application = canonicalApplicationName(prepMatch[1]);
    if (application) return application;
  }

  const tokens = normalized.split(" ").filter(Boolean);
  for (let count = Math.min(4, tokens.length); count >= 1; count--) {
    const application = canonicalApplicationName(tokens.slice(-count).join(" "));
    if (application) return application;
  }
  return null;
}

function isSaveGeneratedContentFollowUp(text) {
  const normalized = String(text || "").trim().toLowerCase();
  return /^(?:please\s+)?(?:save(?:\s+it)?(?:\s+(?:in|into|to)\s+[\w ._-]+)?|put\s+it(?:\s+(?:in|into|to)\s+[\w ._-]+)?|write\s+it(?:\s+(?:in|into|to)\s+[\w ._-]+)?|paste\s+it(?:\s+(?:in|into|to)\s+[\w ._-]+)?|store\s+it(?:\s+(?:in|into|to)\s+[\w ._-]+)?)[.!?]?$/.test(normalized)
    || /^(?:it|id|it's|its)\s+is\s+not\s+saved(?:\s+yet)?[.!?]?$/.test(normalized)
    || /^(?:y+e+s+|y+e+a+h*|y+e+p|s+u+r+e|o+k+a*y*|p+l+e+a+s+e|d+o\s+i+t|g+o\s+a+h+e+a+d)[.!?]*$/i.test(normalized);
}

function previousTurnWantedGeneratedWrite(history) {
  const reversed = [...(Array.isArray(history) ? history : [])].reverse();
  const lastAssistant = reversed.find((entry) => entry?.role === "assistant");
  if (/\b(?:save|store|paste|put|write)\b.{0,60}\b(?:notepad|application|file|document)\b/i.test(String(lastAssistant?.content || ""))) {
    return true;
  }
  const lastUser = reversed.find((entry) => entry?.role === "user");
  return Boolean(routeGeneratedWriteCommand(String(lastUser?.content || "")))
    || (/\b(?:generate|write|compose|story|poem)\b/i.test(String(lastUser?.content || "")) && /\b(?:notepad|calc|word|editor)\b/i.test(String(lastUser?.content || "")));
}

function pasteableAssistantText(history) {
  const lastAssistant = [...(Array.isArray(history) ? history : [])].reverse().find((entry) => entry?.role === "assistant");
  const cleaned = String(lastAssistant?.content || "")
    .replace(/^of course[^\n]*\n+/i, "")
    .replace(/^sure,?\s+here['’]?s[^\n]*:\s*/i, "")
    .replace(/^here['’]?s\s+[^\n]*:\s*/i, "")
    .replace(/\n+would you like[\s\S]*$/i, "")
    .trim();
  if (!cleaned || cleaned.length < 20) return "";
  if (/^\*[^*]+\*$/.test(cleaned) && cleaned.length < 240) return "";
  return cleaned.slice(0, 4000);
}

function generatedWriteAction(application, contentRequest) {
  const canonicalApplication = canonicalApplicationName(application);
  const request = cleanExplicitQuery(contentRequest);
  if (!canonicalApplication || !request) return null;
  return {
    intent: "generate_and_type",
    actions: [{
      type: "generate_and_type",
      application: canonicalApplication,
      continueChat: true,
    }],
  };
}

function routeGeneratedWriteCommand(text) {
  const normalized = String(text || "").replace(/\s+/g, " ").trim();
  if (!normalized || /\b(?:do not|don't|dont|never)\b/i.test(normalized)) return null;

  const stripped = normalized.replace(/^(?:hey\s+|hi\s+|hello\s+)?(?:can\s+you\s+(?:help\s+me\s+(?:with\s+|to\s+)?)?|could\s+you\s+(?:please\s+)?|please\s+|help\s+me\s+(?:to\s+|with\s+)?|i\s+want\s+you\s+to\s+|would\s+you\s+)/i, "").trim();

  if (!/^(?:please\s+)?(?:generate|create|compose|draft|write|make)\b/i.test(stripped)) return null;

  const application = extractDestinationApplication(normalized) || extractDestinationApplication(stripped);
  if (!application) return null;

  const hasDestinationCue = /\b(?:in|into|to)\s+\S+/i.test(normalized)
    || /\b(?:and|then)\s+(?:write|paste|put|save|store)\b/i.test(normalized)
    || /\b(?:put|paste|save|store)\b/i.test(normalized);
  if (!hasDestinationCue) return null;

  const contentRequest = stripped
    .replace(/^(?:please\s+)?(?:generate|create|compose|draft|write|make)\s+/i, "")
    .replace(/\s+(?:and|then)\s+(?:write|paste|put|save|store)\b[\s\S]*$/i, "")
    .replace(/\s+(?:in|into|to)\s+[a-z0-9 ._-]{2,120}\s*[.!?]?$/i, "")
    .trim();
  return generatedWriteAction(application, contentRequest || "the requested content");
}

function routePendingGeneratedWriteFollowUp(message, conversationHistory) {
  if (!isSaveGeneratedContentFollowUp(message) || !previousTurnWantedGeneratedWrite(conversationHistory)) {
    return null;
  }

  const application = extractDestinationApplication(message)
    || extractDestinationApplication(
      [...(Array.isArray(conversationHistory) ? conversationHistory : [])]
        .reverse()
        .find((entry) => entry?.role === "user")?.content
    )
    || "Notepad";
  const existingText = pasteableAssistantText(conversationHistory);
  if (existingText) {
    return {
      intent: "open_app_and_type",
      actions: [{ type: "open_app_and_type", application, text: existingText }],
    };
  }
  return generatedWriteAction(application, "the previously requested content");
}

export function routeExplicitDesktopCommand(message, conversationHistory = [], desktopControlEnabled = false) {
  const rawText = String(message || "").trim();
  if (!rawText || rawText.length > 1200 || isClearlyInstructionalRequest(rawText)) return null;
  if (/\b(?:do not|don't|dont|never)\s+(?:open|launch|start|search|browse|google|play)\b/i.test(rawText)) return null;

  // Strip conversational preambles (e.g. "hey can you", "could you please", "luna please", "can you")
  // so natural requests match explicit desktop and platform playback routes directly.
  const text = rawText
    .replace(/^(?:hey\s+(?:luna\s+)?|hi\s+(?:luna\s+)?|hello\s+(?:luna\s+)?|luna[,\s]+)?(?:can\s+you\s+(?:please\s+)?|could\s+you\s+(?:please\s+)?|please\s+|i\s+want\s+you\s+to\s+|i\s+want\s+to\s+|would\s+you\s+(?:please\s+)?)/i, "")
    .trim();
  if (!text) return null;

  const pendingWrite = routePendingGeneratedWriteFollowUp(text, conversationHistory);
  if (pendingWrite) return pendingWrite;

  // Generate-first composition requests cannot use open_app_and_type because
  // that action only accepts text the user already supplied. This route keeps
  // the generation and the later, confirmation-gated paste as one workflow.
  const generatedWrite = routeGeneratedWriteCommand(text);
  if (generatedWrite) return generatedWrite;

  let match;

  const browserPattern = "(?:google\\s+chrome|chrome|microsoft\\s+edge|edge|firefox|brave)";
  const openAndSearch = new RegExp(
    `^(?:please\\s+)?(?:open|launch|start)\\s+(${browserPattern})(?:\\s+(?:and|then)\\s+)?(?:search|google|look\\s+up|browse)(?:\\s+(?:for|on(?:\\s+google)?|in))?\\s+(.+?)\\s*$`,
    "i"
  );
  const searchInBrowser = new RegExp(
    `^(?:please\\s+)?(?:search|google|look\\s+up|browse)(?:\\s+(?:for|on))?\\s+(.+?)\\s+(?:on|in|using)\\s+(${browserPattern})\\s*$`,
    "i"
  );

  match = text.match(openAndSearch);
  if (match) {
    const application = browserNames.get(match[1].toLowerCase());
    const query = cleanExplicitQuery(match[2]);
    if (application && query) {
      return {
        intent: "open_app_and_search",
        actions: [{ type: "open_app_and_search", application, query, engine: "google" }],
      };
    }
  }

  match = text.match(searchInBrowser);
  if (match) {
    const application = browserNames.get(match[2].toLowerCase());
    const query = cleanExplicitQuery(match[1]);
    if (application && query) {
      return {
        intent: "open_app_and_search",
        actions: [{ type: "open_app_and_search", application, query, engine: "google" }],
      };
    }
  }

  // Platform searches are intentionally recognized before normal chat. Known
  // web platforms use their own search URLs; all other named applications are
  // handed to the guarded UACC search runner.
  const openTargetAndSearch = /^(?:please\s+)?(?:open|launch|start)\s+([a-z0-9 ._&+-]{2,120}?)\s+(?:and|then)\s+(?:search|google|look\s+up|browse|find|play|listen\s+to|listen|put\s+on|queue|watch|stream|stream\s+music|show)(?:\s+(?:for|on|in|me))?(?:\s+some)?\s+(.+?)\s*$/i;
  const searchInTarget = /^(?:please\s+)?(?:search|google|look\s+up|browse|find|play|listen\s+to|listen|put\s+on|queue|watch|stream|show)(?:\s+(?:for|on|me))?(?:\s+some)?\s+(.+?)\s+(?:on|in|using|with|via)\s+([a-z0-9 ._&+-]{2,120})\s*$/i;

  match = text.match(openTargetAndSearch);
  if (match) {
    const application = match[1].trim().replace(/[.!?]+$/, "");
    const query = cleanExplicitQuery(match[2]);
    if (application && query) {
      return {
        intent: "search_in_application",
        actions: [{ type: "search_in_application", application, query }],
      };
    }
  }

  match = text.match(searchInTarget);
  if (match) {
    const query = cleanExplicitQuery(match[1]);
    const application = match[2].trim().replace(/[.!?]+$/, "");
    if (application && query) {
      return {
        intent: "search_in_application",
        actions: [{ type: "search_in_application", application, query }],
      };
    }
  }

  // Open application and write/type text: "open notepad and write hello ashutosh"
  const openAndTypeMatch = text.match(
    /^(?:please\s+)?(?:open|launch|start)\s+([a-z0-9 ._-]{2,80})\s+(?:and|then)\s+(?:write|type|paste|enter|put)\s+["']?([\s\S]+?)["']?[.!?]?$/i
  );
  if (openAndTypeMatch) {
    const rawApp = openAndTypeMatch[1].trim();
    const application = canonicalApplicationName(rawApp);
    const content = cleanExplicitQuery(openAndTypeMatch[2]);
    if (application && content) {
      return {
        intent: "open_app_and_type",
        actions: [{ type: "open_app_and_type", application, text: content }],
      };
    }
  }

  // Type/write text in application: "write hello ashutosh in notepad"
  const typeInAppMatch = text.match(
    /^(?:please\s+)?(?:write|type|paste|enter|put)\s+["']?([^"'\n\r]+?)["']?\s+(?:in|into)\s+([a-z0-9 ._-]{2,80})[.!?]?$/i
  );
  if (typeInAppMatch && !isClearlyInstructionalRequest(text)) {
    const rawApp = typeInAppMatch[2].trim();
    const content = cleanExplicitQuery(typeInAppMatch[1]);
    if (!/\b(?:active|current|focused)\s+(?:window|app|application)\b/i.test(rawApp)) {
      const application = canonicalApplicationName(rawApp);
      if (application && content) {
        return {
          intent: "open_app_and_type",
          actions: [{ type: "open_app_and_type", application, text: content }],
        };
      }
    }
  }

  match = text.match(/^(?:please\s+)?(?:open|launch|start)\s+([a-z0-9 ._-]{2,120})\s*[.!]?$/i);
  if (match) {
    const application = knownLaunchableApplications.get(match[1].trim().toLowerCase());
    if (application) {
      return {
        intent: "open_app",
        actions: [{ type: "open_app", application }],
      };
    }
  }

  if (desktopControlEnabled) {
    // 1. Photo / camera capture: "click picture", "click photo", "take photo", "take picture", "capture photo"
    if (/^(?:please\s+)?(?:click|take|capture)(?:\s+(?:a|the))?\s+(?:picture|photo|snapshot)[.!]?$/i.test(text)) {
      return {
        intent: "uacc_click_element",
        actions: [{ type: "uacc_click_element", element: "Take Photo", elementType: "button" }],
      };
    }

    // 2. Compound camera: "open camera and (click picture|take photo|take picture)"
    if (/^(?:please\s+)?(?:open|launch|start)\s+(?:the\s+)?camera\s+(?:and|then)\s+(?:click|take|capture)(?:\s+(?:a|the))?\s+(?:picture|photo|snapshot)[.!]?$/i.test(text)) {
      return {
        intent: "uacc_click_element",
        actions: [
          { type: "open_app", application: "Camera" },
          { type: "uacc_click_element", element: "Take Photo", elementType: "button", delayMs: 1500 },
        ],
      };
    }

    // 3. Keyboard hotkeys: "press Ctrl+S", "press Enter", "press Escape", "press F5", "hit Ctrl+Z"
    const hotkeyMatch = text.match(
      /^(?:please\s+)?(?:press|hit|use|send)\s+(?:the\s+)?(?:keyboard\s+shortcut\s+)?([a-z0-9 +]+)[.!]?$/i
    );
    if (hotkeyMatch) {
      const raw = hotkeyMatch[1].trim().toLowerCase();
      // Parse "ctrl+s", "ctrl + s", "ctrl s" all the same way
      const keys = raw.split(/[\s+]+/).map((k) => k.trim()).filter(Boolean);
      const KNOWN_KEY = /^([a-z]|[0-9]|f[1-9]|f1[0-2]|enter|return|escape|esc|tab|space|backspace|delete|del|home|end|pageup|pagedown|pgup|pgdn|up|down|left|right|ctrl|control|shift|alt|win|cmd|meta|plus|minus|insert)$/i;
      if (keys.length >= 1 && keys.length <= 5 && keys.every((k) => KNOWN_KEY.test(k))) {
        return {
          intent: "uacc_hotkey",
          actions: [{ type: "uacc_hotkey", keys }],
        };
      }
    }

    // 4. General desktop click: "click [element]", "click on [element]", "click the [element] button"
    const clickMatch = text.match(
      /^(?:please\s+)?(?:click|tap|press|select)(?:\s+on)?(?:\s+the)?\s+["']?([^"'\n\r.!?]+?)["']?(?:\s+(?:button|link|icon|tab|checkbox|option|control))?[.!]?$/i
    );
    if (clickMatch && !isClearlyInstructionalRequest(text)) {
      const element = cleanExplicitQuery(clickMatch[1].replace(/^(?:the|a)\s+/i, ""));
      if (element && element.length <= 120 && !/\b(?:do not|don't|dont|never)\b/i.test(element)) {
        return {
          intent: "uacc_click_element",
          actions: [{ type: "uacc_click_element", element }],
        };
      }
    }

    // 5. Typing in active window: "type [text] in (the )?active window"
    const typeInActiveMatch = text.match(
      /^(?:please\s+)?(?:type|enter|paste)\s+["']?([^"'\n\r]+?)["']?\s+(?:in|into)\s+(?:the\s+)?(?:active|current|focused)\s+(?:window|app|application)[.!]?$/i
    );
    if (typeInActiveMatch) {
      const textToType = typeInActiveMatch[1].trim().slice(0, 4000);
      if (textToType) {
        return {
          intent: "uacc_type_text",
          actions: [{ type: "uacc_type_text", text: textToType }],
        };
      }
    }

    // 6. Scroll: "scroll down", "scroll up", "scroll to top", "scroll to bottom", "page down"
    const scrollMatch = text.match(
      /^(?:please\s+)?(?:scroll\s+(?:the\s+)?(?:page\s+)?(up|down|left|right|to\s+(?:the\s+)?top|to\s+(?:the\s+)?bottom)|page\s+(up|down))[.!]?$/i
    );
    if (scrollMatch) {
      const raw = (scrollMatch[1] || scrollMatch[2] || "down").toLowerCase().trim();
      let direction = "down";
      let amount = 3;
      if (raw.startsWith("to") && raw.includes("top")) { direction = "up"; amount = 50; }
      else if (raw.startsWith("to") && raw.includes("bottom")) { direction = "down"; amount = 50; }
      else if (raw === "up" || raw === "page up") { direction = "up"; amount = 5; }
      else if (raw === "down" || raw === "page down") { direction = "down"; amount = 5; }
      else if (raw === "left") { direction = "left"; amount = 3; }
      else if (raw === "right") { direction = "right"; amount = 3; }
      return {
        intent: "uacc_scroll",
        actions: [{ type: "uacc_scroll", direction, amount }],
      };
    }

    // 7. Focus window: "switch to Chrome", "focus Chrome", "bring up Notepad", "go to VS Code"
    const focusMatch = text.match(
      /^(?:please\s+)?(?:switch\s+to|focus|bring\s+up|go\s+to|show|activate)\s+(?:the\s+)?([a-z0-9 ._-]{2,80})[.!]?$/i
    );
    if (focusMatch && !isClearlyInstructionalRequest(text)) {
      const appTitle = focusMatch[1].trim();
      if (appTitle && appTitle.length <= 80) {
        return {
          intent: "uacc_focus_window",
          actions: [{ type: "uacc_focus_window", title: appTitle }],
        };
      }
    }
  }

  return null;
}

function parseToolArguments(rawArguments) {
  if (rawArguments && typeof rawArguments === "object" && !Array.isArray(rawArguments)) {
    return rawArguments;
  }

  if (typeof rawArguments !== "string") return {};

  try {
    const parsed = JSON.parse(rawArguments);
    return parsed && typeof parsed === "object" && !Array.isArray(parsed) ? parsed : {};
  } catch {
    return {};
  }
}

export function normalizeIntentActions(rawCalls, allowAutoMemory, desktopControlEnabled = false) {
  if (!Array.isArray(rawCalls)) return [];

  const actions = [];
  let externalActionSelected = false;

  for (const rawCall of rawCalls.slice(0, 4)) {
    const functionCall = rawCall?.function || rawCall || {};
    const name = String(functionCall.name || rawCall?.name || "").trim().toLowerCase();
    const args = parseToolArguments(functionCall.arguments ?? rawCall?.arguments);

    if (name === "search_web" && !externalActionSelected) {
      const query = String(args.query || "").trim().slice(0, 1000);
      const requestedEngine = String(args.engine || "google").toLowerCase();
      const supportedEngines = new Set(["google", "bing", "duckduckgo", "yahoo", "brave"]);
      if (query) {
        actions.push({
          type: "search_web",
          query,
          engine: supportedEngines.has(requestedEngine) ? requestedEngine : "google",
        });
        externalActionSelected = true;
      }
    }

    if (name === "open_website" && !externalActionSelected) {
      let rawUrl = String(args.url || args.website || "").trim().slice(0, 2048);
      if (rawUrl && !/^[a-z][a-z0-9+.-]*:\/\//i.test(rawUrl)) rawUrl = `https://${rawUrl}`;

      try {
        const parsedUrl = new URL(rawUrl);
        if (["http:", "https:"].includes(parsedUrl.protocol)) {
          actions.push({ type: "open_url", url: parsedUrl.toString() });
          externalActionSelected = true;
        }
      } catch {
        // Invalid model-produced URLs are ignored instead of reaching the OS.
      }
    }

    if (name === "open_common_folder" && !externalActionSelected) {
      const location = String(args.location || "").trim().toLowerCase();
      const supportedLocations = new Set([
        "desktop", "downloads", "documents", "pictures", "music", "videos", "home",
      ]);
      if (supportedLocations.has(location)) {
        actions.push({ type: "open_folder", location });
        externalActionSelected = true;
      }
    }

    if (name === "open_application" && !externalActionSelected) {
      const application = String(args.application || args.app || "").trim().slice(0, 120);
      if (application && !/[\r\n\0]/.test(application)) {
        actions.push({ type: "open_app", application });
        externalActionSelected = true;
      }
    }

    if (name === "open_application_and_type" && !externalActionSelected) {
      const application = String(args.application || args.app || "").trim().slice(0, 120);
      const text = String(args.text || "").slice(0, 4000);
      if (application && text.trim() && !/[\r\n\0]/.test(application)) {
        actions.push({ type: "open_app_and_type", application, text });
        externalActionSelected = true;
      }
    }

    if (name === "generate_content_and_type" && !externalActionSelected) {
      const application = String(args.application || args.app || "").trim().slice(0, 120);
      if (application && !/[\r\n\0]/.test(application)) {
        actions.push({ type: "generate_and_type", application, continueChat: true });
        externalActionSelected = true;
      }
    }

    if (desktopControlEnabled && name === "search_in_application" && !externalActionSelected) {
      const application = String(args.application || args.app || "").trim().slice(0, 120);
      const query = String(args.query || "").trim().slice(0, 1000);
      if (application && query && !/[\r\n\0]/.test(application) && !/[\r\n\0]/.test(query)) {
        actions.push({ type: "search_in_application", application, query });
        externalActionSelected = true;
      }
    }

    if (desktopControlEnabled && name === "click_desktop_element" && !externalActionSelected) {
      const element = String(args.element || args.name || "").trim().slice(0, 160);
      const elementType = String(args.element_type || "").trim().slice(0, 60);
      if (element && !/[\r\n\0]/.test(element)) {
        actions.push({
          type: "uacc_click_element",
          element,
          ...(elementType ? { elementType } : {}),
        });
        externalActionSelected = true;
      }
    }

    if (desktopControlEnabled && name === "type_into_active_application" && !externalActionSelected) {
      const text = String(args.text || "").slice(0, 4000);
      if (text.trim()) {
        actions.push({ type: "uacc_type_text", text });
        externalActionSelected = true;
      }
    }

    if (desktopControlEnabled && name === "press_hotkey" && !externalActionSelected) {
      const keys = Array.isArray(args.keys)
        ? args.keys.map((k) => String(k).trim().toLowerCase()).filter(Boolean).slice(0, 5)
        : [];
      if (keys.length > 0) {
        actions.push({ type: "uacc_hotkey", keys });
        externalActionSelected = true;
      }
    }

    if (desktopControlEnabled && name === "scroll_desktop" && !externalActionSelected) {
      const direction = ["up", "down", "left", "right"].includes(String(args.direction || "").toLowerCase())
        ? String(args.direction).toLowerCase()
        : "down";
      const amount = Number.isFinite(args.amount) && args.amount > 0 ? Math.min(args.amount, 50) : 3;
      actions.push({ type: "uacc_scroll", direction, amount });
      externalActionSelected = true;
    }

    if (desktopControlEnabled && name === "focus_application_window" && !externalActionSelected) {
      const title = String(args.title || "").trim().slice(0, 200);
      if (title && !/[\r\n\0]/.test(title)) {
        actions.push({ type: "uacc_focus_window", title });
        externalActionSelected = true;
      }
    }

    if (name === "save_memory" && allowAutoMemory) {
      const title = String(args.title || "Useful detail").trim().slice(0, 100);
      const value = String(args.value || "").trim().slice(0, 1000);
      if (value && !actions.some((action) => action.type === "save_memory" && action.value.toLowerCase() === value.toLowerCase())) {
        actions.push({
          type: "save_memory",
          title: title || "Useful detail",
          value,
          continueChat: Boolean(args.continue_chat),
        });
      }
    }


    // Memory is metadata, not a mutually exclusive primary intent. This lets a
    // message such as "I prefer short answers; explain recursion" both receive
    // an answer and save the preference without forcing a second tool call.
    if (allowAutoMemory && name !== "save_memory") {
      const memoryTitle = String(args.memory_title || "Useful detail").trim().slice(0, 100);
      const memoryValue = String(args.memory_value || "").trim().slice(0, 1000);
      if (memoryValue && !actions.some((action) => (
        action.type === "save_memory" && action.value.toLowerCase() === memoryValue.toLowerCase()
      ))) {
        actions.push({
          type: "save_memory",
          title: memoryTitle || "Useful detail",
          value: memoryValue,
          continueChat: name === "respond_normally",
        });
      }
    }
  }

  return actions;
}

export function validateIntentActions(message, actions) {
  const text = String(message || "").trim();
  const normalized = text.toLowerCase();
  const isInstructionalQuestion = /^(?:how\s+(?:do|can|could|should|would)\s+i|how\s+to|why\s+(?:does|is|won't|will not)|can you explain|tell me how)\b/i.test(text);
  const isQuestion = /\?$/.test(text) || /^(?:who|what|when|where|why|how|did|do|does|can|could|would|should|is|are|was|were)\b/i.test(text);
  const explicitlyRequestsMemory = /\b(?:remember|save|store|keep)\b.{0,30}\b(?:this|that|memory|in mind|for later)\b/i.test(text);
  const negatesDesktopAction = /\b(?:do not|don't|dont|never)\s+(?:open|launch|start|search|browse|type|write|paste|click|tap|select|press)\b/i.test(text);
  const containsSensitiveData = /\b(?:password|passcode|pin|one[- ]time password|otp|api[- ]?key|access[- ]?token|secret|credit card|debit card|cvv|bank account|social security|ssn|medical diagnosis)\b/i.test(text);
  const explicitlyRequestsTyping = /\b(?:type|write|paste|enter|put)\b/i.test(normalized) &&
    /\b(?:open|launch|start|use|in|into)\b/i.test(normalized);
  const explicitlyRequestsSaveToApp = isSaveGeneratedContentFollowUp(text);

  return (Array.isArray(actions) ? actions : []).filter((action) => {
    const isExternal = [
      "search_web", "open_app", "open_app_and_type", "generate_and_type",
      "open_app_and_search", "search_in_application", "open_url", "open_folder",
      "uacc_click_element", "uacc_type_text", "uacc_hotkey", "uacc_scroll", "uacc_focus_window",
    ].includes(action.type);

    if (isExternal && negatesDesktopAction) return false;
    if (["open_app", "open_url", "open_folder", "search_in_application", "generate_and_type"].includes(action.type) && isInstructionalQuestion) return false;
    if (["uacc_click_element", "uacc_type_text", "uacc_hotkey", "uacc_scroll", "uacc_focus_window"].includes(action.type) && isInstructionalQuestion) return false;
    if (action.type === "open_app_and_type" && !explicitlyRequestsTyping && !explicitlyRequestsSaveToApp) return false;
    if (action.type === "uacc_click_element" && !/\b(?:click|tap|select|press)\b/i.test(normalized)) return false;
    if (action.type === "uacc_type_text" && !/\b(?:type|write|paste|enter|put)\b/i.test(normalized)) return false;
    if (action.type === "uacc_hotkey" && !/\b(?:press|hit|use|send)\b/i.test(normalized)) return false;
    if (action.type === "uacc_scroll" && !/\b(?:scroll|page)\b/i.test(normalized)) return false;
    if (action.type === "uacc_focus_window" && !/\b(?:switch|focus|bring|go\s+to|show|activate)\b/i.test(normalized)) return false;
    if (["uacc_click_element", "uacc_type_text"].includes(action.type) && containsSensitiveData) return false;
    if (action.type === "save_memory" && containsSensitiveData) return false;
    if (action.type === "save_memory" && isQuestion && !explicitlyRequestsMemory) return false;
    return true;
  });
}

export function extractStableMemoryCandidate(message) {
  const text = String(message || "").trim();
  if (!text || /\b(?:password|passcode|pin|one[- ]time password|otp|api[- ]?key|access[- ]?token|secret|credit card|debit card|cvv|bank account|social security|ssn|medical diagnosis)\b/i.test(text)) {
    return null;
  }

  const rules = [
    {
      pattern: /\bI\s+prefer\s+([^.!?]{1,180})/i,
      title: "Preference",
      value: (match) => `The user prefers ${match[1].trim()}.`,
    },
    {
      pattern: /\bmy\s+(?:favorite|favourite)\s+([^.!?]{1,60}?)\s+is\s+([^.!?]{1,140})/i,
      title: "Favorite",
      value: (match) => `The user's favorite ${match[1].trim()} is ${match[2].trim()}.`,
    },
    {
      pattern: /\bmy\s+name\s+is\s+([a-z][a-z .'-]{0,80})/i,
      title: "Name",
      value: (match) => `The user's name is ${match[1].trim()}.`,
    },
    {
      pattern: /\bI\s+use\s+([^.!?]{1,160}?)\s+(every day|daily|for work)\b/i,
      title: "Regular tool",
      value: (match) => `The user uses ${match[1].trim()} ${match[2].toLowerCase()}.`,
    },
  ];

  for (const rule of rules) {
    const match = text.match(rule.pattern);
    if (!match) continue;
    return {
      type: "save_memory",
      title: rule.title,
      value: rule.value(match).slice(0, 1000),
      continueChat: true,
    };
  }

  return null;
}

export function extractFallbackIntent(responseText, allowAutoMemory, desktopControlEnabled = false) {
  const text = String(responseText || "");
  const match = text.match(/<LUNA_ACTION>\s*([\s\S]*?)\s*<\/LUNA_ACTION>/i);
  if (!match) return { text: text.trim(), actions: [] };

  try {
    const parsed = JSON.parse(match[1]);
    const rawCall = {
      function: {
        name: parsed.name || parsed.type,
        arguments: parsed.arguments || parsed,
      },
    };

    return {
      text: text.replace(match[0], "").trim(),
      actions: normalizeIntentActions([rawCall], allowAutoMemory, desktopControlEnabled),
    };
  } catch {
    return { text: text.trim(), actions: [] };
  }
}
