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
- save_memory: when the current message's main purpose is to remember a stable, useful, non-sensitive user fact.
- respond_normally: explanations, writing, coding, advice, troubleshooting, memory recall, and all other ordinary conversation.

IMPORTANT BOUNDARIES:
- "How do I open Chrome?" is respond_normally; "Open Chrome" is open_application.
- "Explain recursion" is respond_normally; never open a website to answer it.
- "What did I tell you about my project?" is respond_normally and must never create a new memory.
- "Open Notepad and write hello" is open_application_and_type with text exactly "hello".
- "Write a short story about space in Notepad" is generate_content_and_type. Generate the content immediately and paste it into the application.
- "Search lo-fi music on YouTube" is search_in_application with application "YouTube" and query "lo-fi music".
- "Click the Save button" is click_desktop_element with element "Save" only when desktop control is enabled.
- "Type hello in the active window" is type_into_active_application with text exactly "hello" only when desktop control is enabled.
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
      description: "Click one named, visible element in the currently open application using local accessibility matching. Use only when the user explicitly asks to click/select a visible button, menu item, checkbox, or link. Luna will always ask for confirmation before clicking.",
      parameters: {
        type: "object",
        required: ["element"],
        properties: {
          element: { type: "string", description: "The exact visible element label, such as Save, Submit, or New tab." },
          element_type: { type: "string", description: "Optional element kind, such as button, menu_item, checkbox, or link." },
        },
      },
    },
  },
  {
    type: "function",
    function: {
      name: "type_into_active_application",
      description: "Type the exact user-supplied text into the currently focused application. Use only when the user explicitly asks to type/write/paste text in their active application. Luna will always ask for confirmation before typing.",
      parameters: {
        type: "object",
        required: ["text"],
        properties: {
          text: { type: "string", description: "The exact text the user requested. Do not add, change, or interpret it." },
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
export function routeClearlyConversationalIntent(message, allowAutoMemory) {
  const text = String(message || "").trim();
  if (!text) return null;

  const mayNeedDesktopAction =
    /\b(?:open|launch|start|search|browse|google|look\s+up|navigate|go\s+to)\b/i.test(text) ||
    /\b(?:click|tap|select|press)\b[\s\S]{0,120}\b(?:button|menu|link|checkbox|tab|option|field|item)\b/i.test(text) ||
    /\b(?:remember|save|store|keep)\b.{0,35}\b(?:this|that|memory|in mind|for later)\b/i.test(text) ||
    /\b(?:type|paste|enter|write)\b.{0,80}\b(?:notepad|word|excel|chrome|browser|application|app)\b/i.test(text) ||
    /\b(?:type|paste|enter|write)\b[\s\S]{0,100}\b(?:active|current|focused)\s+(?:window|app|application)\b/i.test(text) ||
    /\b(?:notepad|note pad|word|excel|chrome|chrme|edge|browser|application|app)\b[\s\S]{0,160}\b(?:type|paste|enter|write)\b/i.test(text) ||
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

function generatedWriteAction(application, contentRequest) {
  const canonicalApplication = knownLaunchableApplications.get(String(application || "").trim().toLowerCase());
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

export function routeExplicitDesktopCommand(message) {
  const text = String(message || "").trim();
  if (!text || text.length > 1200 || isClearlyInstructionalRequest(text)) return null;
  if (/\b(?:do not|don't|dont|never)\s+(?:open|launch|start|search|browse|google)\b/i.test(text)) return null;

  // Generate-first composition requests cannot use open_app_and_type because
  // that action only accepts text the user already supplied. This route keeps
  // the generation and the later, confirmation-gated paste as one workflow.
  const generateThenWrite = /^(?:please\s+)?(?:generate|create|compose|draft|write)\s+(.+?)\s+(?:and|then)\s+(?:write|paste|put|save)\s+(?:it\s+)?(?:in|into|to)\s+([a-z0-9 ._-]{2,120})\s*[.!]?$/i;
  const generateInApplication = /^(?:please\s+)?(?:generate|create|compose|draft|write)\s+(.+?)\s+(?:in|into|to)\s+([a-z0-9 ._-]{2,120})\s*[.!]?$/i;
  let match = text.match(generateThenWrite);
  if (match) {
    const route = generatedWriteAction(match[2], match[1]);
    if (route) return route;
  }
  match = text.match(generateInApplication);
  if (match) {
    const route = generatedWriteAction(match[2], match[1]);
    if (route) return route;
  }

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
  const openTargetAndSearch = /^(?:please\s+)?(?:open|launch|start)\s+([a-z0-9 ._&+-]{2,120}?)\s+(?:and|then)\s+(?:search|google|look\s+up|browse)(?:\s+(?:for|on|in))?\s+(.+?)\s*$/i;
  const searchInTarget = /^(?:please\s+)?(?:search|google|look\s+up|browse)(?:\s+(?:for|on))?\s+(.+?)\s+(?:on|in|using)\s+([a-z0-9 ._&+-]{2,120})\s*$/i;

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

  return (Array.isArray(actions) ? actions : []).filter((action) => {
    const isExternal = ["search_web", "open_app", "open_app_and_type", "generate_and_type", "open_app_and_search", "search_in_application", "open_url", "open_folder", "uacc_click_element", "uacc_type_text"]
      .includes(action.type);

    if (isExternal && negatesDesktopAction) return false;
    if (["open_app", "open_url", "open_folder", "search_in_application", "generate_and_type"].includes(action.type) && isInstructionalQuestion) return false;
    if (["uacc_click_element", "uacc_type_text"].includes(action.type) && isInstructionalQuestion) return false;
    if (action.type === "open_app_and_type" && !explicitlyRequestsTyping) return false;
    if (action.type === "uacc_click_element" && !/\b(?:click|tap|select|press)\b/i.test(normalized)) return false;
    if (action.type === "uacc_type_text" && !/\b(?:type|write|paste|enter|put)\b/i.test(normalized)) return false;
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
