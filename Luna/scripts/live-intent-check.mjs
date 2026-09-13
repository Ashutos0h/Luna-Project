import {
  INTENT_ROUTER_MODEL,
  INTENT_ROUTER_SYSTEM_PROMPT,
  extractStableMemoryCandidate,
  getIntentTools,
  getNormalChatTool,
  normalizeIntentActions,
  routeClearlyConversationalIntent,
  validateIntentActions,
} from "../electron/intentRouter.js";

const cases = [
  { prompt: "tell me the best eye doctors in Delhi", expected: "search_web" },
  { prompt: "explain recursion with an example", expected: "normal_chat" },
  { prompt: "how do I open Chrome?", expected: "normal_chat" },
  { prompt: "open Chrome", expected: "open_app" },
  { prompt: "open Notepad and write Hello from Luna", expected: "open_app_and_type" },
  { prompt: "Do not open Notepad", expected: "normal_chat" },
  { prompt: "I prefer concise answers. Explain recursion.", expected: "normal_chat", required: "save_memory" },
  { prompt: "what did I tell you about my project?", expected: "normal_chat", forbidden: "save_memory" },
  { prompt: "My password is hunter2", expected: "normal_chat", forbidden: "save_memory" },
];

let failures = 0;

for (const testCase of cases) {
  const localRoute = routeClearlyConversationalIntent(testCase.prompt, true);
  let actions = localRoute?.actions || [];
  let actual = localRoute?.intent || "";
  let routeSource = localRoute ? "fast" : "semantic";

  if (!localRoute) {
    const response = await fetch("http://127.0.0.1:11434/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model: INTENT_ROUTER_MODEL,
        messages: [
          { role: "system", content: INTENT_ROUTER_SYSTEM_PROMPT },
          { role: "user", content: testCase.prompt },
        ],
        tools: [getNormalChatTool(true), ...getIntentTools(true)],
        stream: false,
        think: false,
        keep_alive: "2m",
        options: { temperature: 0, num_ctx: 2048, num_predict: 160 },
      }),
      signal: AbortSignal.timeout(90000),
    });

    if (!response.ok) throw new Error(`Ollama returned HTTP ${response.status}.`);

    const payload = await response.json();
    const rawCalls = payload.message?.tool_calls || [];
    const firstName = String(rawCalls[0]?.function?.name || "").toLowerCase();
    actions = validateIntentActions(testCase.prompt, normalizeIntentActions(rawCalls, true));
    const stableMemory = extractStableMemoryCandidate(testCase.prompt);
    if (stableMemory && !actions.some((action) => action.type === "save_memory")) actions.push(stableMemory);
    const primaryAction = actions.find((action) => action.type !== "save_memory");
    actual = firstName === "respond_normally" || !firstName
      ? "normal_chat"
      : (primaryAction?.type || actions[0]?.type || "normal_chat");
  }
  const actionTypes = actions.map((action) => action.type);
  const passed = actual === testCase.expected &&
    !actionTypes.includes(testCase.forbidden) &&
    (!testCase.required || actionTypes.includes(testCase.required));

  if (!passed) failures++;
  console.log(`${passed ? "PASS" : "FAIL"} | ${routeSource} | ${testCase.prompt} | ${actual} | ${actionTypes.join(",") || "no action"}`);
}

if (failures > 0) {
  console.error(`${failures} live intent case(s) failed.`);
  process.exitCode = 1;
} else {
  console.log(`All ${cases.length} live intent cases passed.`);
}
