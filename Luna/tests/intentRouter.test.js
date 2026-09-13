import assert from "node:assert/strict";
import test from "node:test";

import {
  extractFallbackIntent,
  extractStableMemoryCandidate,
  getIntentTools,
  getNormalChatTool,
  normalizeIntentActions,
  routeClearlyConversationalIntent,
  routeExplicitDesktopCommand,
  validateIntentActions,
} from "../electron/intentRouter.js";

function toolCall(name, argumentsValue) {
  return { function: { name, arguments: argumentsValue } };
}

test("app-first typing requests reach semantic routing", () => {
  for (const message of ["In Notepad write hello", "In Chrome type example.com", "In chrme write hello"]) {
    assert.equal(routeClearlyConversationalIntent(message, false), null);
  }
});

test("explicit browser commands bypass unreliable model tool selection", () => {
  assert.deepEqual(routeExplicitDesktopCommand("open chrome and search yt"), {
    intent: "open_app_and_search",
    actions: [{
      type: "open_app_and_search",
      application: "Chrome",
      query: "yt",
      engine: "google",
    }],
  });

  assert.deepEqual(routeExplicitDesktopCommand("Search best eye doctors in Delhi on Microsoft Edge"), {
    intent: "open_app_and_search",
    actions: [{
      type: "open_app_and_search",
      application: "Microsoft Edge",
      query: "best eye doctors in Delhi",
      engine: "google",
    }],
  });

  assert.deepEqual(routeExplicitDesktopCommand("Please open Notepad"), {
    intent: "open_app",
    actions: [{ type: "open_app", application: "Notepad" }],
  });
  assert.equal(routeExplicitDesktopCommand("How do I open Chrome?"), null);
  assert.equal(routeExplicitDesktopCommand("Do not open Chrome"), null);
});

test("direct platform searches bypass a chat-model refusal", () => {
  assert.deepEqual(routeExplicitDesktopCommand("open YouTube and search lo-fi music"), {
    intent: "search_in_application",
    actions: [{ type: "search_in_application", application: "YouTube", query: "lo-fi music" }],
  });
  assert.deepEqual(routeExplicitDesktopCommand("search coding tutorials on YouTube"), {
    intent: "search_in_application",
    actions: [{ type: "search_in_application", application: "YouTube", query: "coding tutorials" }],
  });
  assert.deepEqual(routeExplicitDesktopCommand("search Arctic Monkeys in Spotify"), {
    intent: "search_in_application",
    actions: [{ type: "search_in_application", application: "Spotify", query: "Arctic Monkeys" }],
  });
});

test("generated writing requests are routed before the chat model can refuse the desktop action", () => {
  assert.deepEqual(routeExplicitDesktopCommand("Write a short story about a robot in Notepad"), {
    intent: "generate_and_type",
    actions: [{ type: "generate_and_type", application: "Notepad", continueChat: true }],
  });
  assert.deepEqual(routeExplicitDesktopCommand("Compose a leave request email and paste it into Notepad"), {
    intent: "generate_and_type",
    actions: [{ type: "generate_and_type", application: "Notepad", continueChat: true }],
  });
});

test("normalizes web search arguments and rejects extra external actions", () => {
  const actions = normalizeIntentActions([
    toolCall("search_web", JSON.stringify({ query: "best eye doctors in Delhi", engine: "bing" })),
    toolCall("open_application", { application: "Calculator" }),
  ], true);

  assert.deepEqual(actions, [{
    type: "search_web",
    query: "best eye doctors in Delhi",
    engine: "bing",
  }]);
});

test("normalizes safe website and common-folder actions", () => {
  assert.deepEqual(
    normalizeIntentActions([toolCall("open_website", { url: "youtube.com" })], true),
    [{ type: "open_url", url: "https://youtube.com/" }]
  );
  assert.deepEqual(
    normalizeIntentActions([toolCall("open_common_folder", { location: "downloads" })], true),
    [{ type: "open_folder", location: "downloads" }]
  );
  assert.deepEqual(
    normalizeIntentActions([toolCall("open_website", { url: "file:///C:/Windows" })], true),
    []
  );
});

test("automatic memory obeys privacy and mixed-intent controls", () => {
  const call = toolCall("save_memory", {
    title: "Food preference",
    value: "The user prefers vegetarian meals.",
    continue_chat: true,
  });

  assert.equal(normalizeIntentActions([call], false).length, 0);
  assert.deepEqual(normalizeIntentActions([call], true), [{
    type: "save_memory",
    title: "Food preference",
    value: "The user prefers vegetarian meals.",
    continueChat: true,
  }]);
  assert.equal(getIntentTools(false).some((tool) => tool.function.name === "save_memory"), false);
});

test("fallback envelopes are removed before rendering", () => {
  const result = extractFallbackIntent(
    'Working on it. <LUNA_ACTION>{"type":"open_common_folder","location":"documents"}</LUNA_ACTION>',
    true
  );

  assert.equal(result.text, "Working on it.");
  assert.deepEqual(result.actions, [{ type: "open_folder", location: "documents" }]);
});

test("normal chat can carry a separate automatic-memory candidate", () => {
  const actions = normalizeIntentActions([
    toolCall("respond_normally", {
      memory_title: "Response preference",
      memory_value: "The user prefers concise answers.",
    }),
  ], true);

  assert.deepEqual(actions, [{
    type: "save_memory",
    title: "Response preference",
    value: "The user prefers concise answers.",
    continueChat: true,
  }]);
  assert.equal(getNormalChatTool(false).function.parameters.properties.memory_value, undefined);
});

test("normalizes a guarded open-and-type action without rewriting text", () => {
  assert.deepEqual(normalizeIntentActions([
    toolCall("open_application_and_type", {
      application: "Notepad",
      text: "Hello from Luna!",
    }),
  ], true), [{
    type: "open_app_and_type",
    application: "Notepad",
    text: "Hello from Luna!",
  }]);

  assert.deepEqual(normalizeIntentActions([
    toolCall("open_application_and_type", { application: "Notepad", text: "" }),
  ], true), []);
});

test("blocks unsafe false-positive actions after semantic routing", () => {
  assert.deepEqual(validateIntentActions("How do I open Chrome?", [
    { type: "open_app", application: "Chrome" },
  ]), []);

  assert.deepEqual(validateIntentActions("What did I tell you about my project?", [
    { type: "save_memory", title: "Project", value: "The user has a project." },
  ]), []);

  assert.deepEqual(validateIntentActions("My password is hunter2", [
    { type: "save_memory", title: "Password", value: "The user's password is hunter2." },
  ]), []);

  assert.deepEqual(validateIntentActions("Do not open Chrome", [
    { type: "open_app", application: "Chrome" },
  ]), []);

  assert.deepEqual(validateIntentActions("Open Notepad and type hello", [
    { type: "open_app_and_type", application: "Notepad", text: "hello" },
  ]), [{ type: "open_app_and_type", application: "Notepad", text: "hello" }]);
});

test("extracts narrow stable preferences without storing sensitive data", () => {
  assert.deepEqual(extractStableMemoryCandidate("I prefer concise answers. Explain recursion."), {
    type: "save_memory",
    title: "Preference",
    value: "The user prefers concise answers.",
    continueChat: true,
  });
  assert.equal(extractStableMemoryCandidate("My password is hunter2"), null);
  assert.equal(extractStableMemoryCandidate("I am tired today"), null);
});

test("fast conversational routing bypasses the model only when no tool may be needed", () => {
  assert.deepEqual(
    routeClearlyConversationalIntent("Explain recursion with a small example.", true),
    { intent: "normal_chat", actions: [] }
  );
  assert.equal(routeClearlyConversationalIntent("Open Chrome", true), null);
  assert.equal(routeClearlyConversationalIntent("Tell me the best eye doctors in Delhi", true), null);
  assert.equal(routeClearlyConversationalIntent("How do I open Chrome?", true), null);
  assert.equal(routeClearlyConversationalIntent("Click the Save button", true), null);
  assert.equal(routeClearlyConversationalIntent("Type hello in the active window", true), null);
});

test("advanced desktop actions remain disabled unless the setting explicitly enables them", () => {
  const clickCall = toolCall("click_desktop_element", { element: "Save", element_type: "button" });
  const typeCall = toolCall("type_into_active_application", { text: "Hello" });

  assert.deepEqual(normalizeIntentActions([clickCall], true, false), []);
  assert.deepEqual(normalizeIntentActions([typeCall], true, false), []);
  assert.deepEqual(normalizeIntentActions([
    toolCall("search_in_application", { application: "Slack", query: "release notes" }),
  ], true, false), []);
  assert.deepEqual(normalizeIntentActions([clickCall, typeCall], true, true), [{
    type: "uacc_click_element",
    element: "Save",
    elementType: "button",
  }]);
  assert.deepEqual(validateIntentActions("How do I click the Save button?", [{
    type: "uacc_click_element",
    element: "Save",
  }]), []);
  assert.deepEqual(normalizeIntentActions([
    toolCall("search_in_application", { application: "Slack", query: "release notes" }),
  ], true, true), [{ type: "search_in_application", application: "Slack", query: "release notes" }]);
});

test("fast conversational routing preserves safe automatic memory", () => {
  const route = routeClearlyConversationalIntent("I prefer concise answers. Explain recursion.", true);
  assert.equal(route.intent, "normal_chat");
  assert.equal(route.actions[0]?.type, "save_memory");
  assert.equal(route.actions[0]?.continueChat, true);
});
