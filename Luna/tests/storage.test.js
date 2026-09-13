import assert from "node:assert/strict";
import test from "node:test";

import {
  loadConversations,
  normalizeConversations,
  saveConversations,
  STORAGE_KEY,
} from "../src/services/chatStorage.js";
import { loadMemories, saveMemories } from "../src/services/memoryStorage.js";
import { normalizeSettings, saveSettings } from "../src/services/settingsStorage.js";

function withLocalStorage(storage, run) {
  const previous = globalThis.localStorage;
  globalThis.localStorage = storage;
  try {
    return run();
  } finally {
    if (previous === undefined) delete globalThis.localStorage;
    else globalThis.localStorage = previous;
  }
}

function withoutExpectedErrorLogs(run) {
  const previous = console.error;
  console.error = () => {};
  try {
    return run();
  } finally {
    console.error = previous;
  }
}

test("repairs duplicate conversation and message ids while dropping invalid records", () => {
  const conversations = normalizeConversations([
    {
      id: "same",
      title: " First chat ",
      messages: [
        { id: "message", sender: "user", text: " Hello " },
        { id: "message", sender: "assistant", text: "Hi" },
        { sender: "system", text: "not allowed" },
      ],
    },
    { id: "same", title: "Second chat", messages: [] },
    { id: "broken" },
  ]);

  assert.equal(conversations.length, 2);
  assert.equal(conversations[0].title, "First chat");
  assert.equal(conversations[0].messages.length, 2);
  assert.notEqual(conversations[0].messages[0].id, conversations[0].messages[1].id);
  assert.notEqual(conversations[0].id, conversations[1].id);
});

test("storage write failures are contained instead of crashing the UI", () => {
  withoutExpectedErrorLogs(() => {
    withLocalStorage({
      getItem: () => null,
      setItem: () => { throw new Error("quota exceeded"); },
    }, () => {
      assert.equal(saveConversations([]), false);
      assert.equal(saveMemories([]), false);
      assert.equal(saveSettings({}), false);
    });
  });
});

test("invalid settings are constrained to supported safe values", () => {
  assert.deepEqual(normalizeSettings({
    userName: "  A very patient user  ",
    assistantName: " Luna ",
    language: "Unknown",
    profession: "Wizard",
    theme: "neon",
    aiModel: "bad model; rm",
    autoMemory: false,
    performanceMode: "turbo",
  }), {
    userName: "A very patient user",
    assistantName: "Luna",
    language: "English",
    profession: "Student",
    theme: "dark",
    aiModel: "qwen2.5:3b",
    autoMemory: false,
    performanceMode: "fast",
    desktopControlEnabled: false,
  });
});

test("corrupt persisted data safely falls back to empty collections", () => {
  withoutExpectedErrorLogs(() => {
    withLocalStorage({
      getItem: (key) => key === STORAGE_KEY ? "not json" : "{bad",
      setItem: () => {},
    }, () => {
      assert.deepEqual(loadConversations(), []);
      assert.deepEqual(loadMemories(), []);
    });
  });
});
