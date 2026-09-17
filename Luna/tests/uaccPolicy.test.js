import assert from "node:assert/strict";
import test from "node:test";

import {
  isReadOnlyUaccTool,
  summarizeUaccAction,
  validateUaccInvocation,
} from "../electron/uaccPolicy.js";

test("separates UACC inspection tools from screen-changing tools", () => {
  assert.equal(isReadOnlyUaccTool("get_active_window"), true);
  assert.equal(isReadOnlyUaccTool("click"), false);
  assert.equal(isReadOnlyUaccTool("screenshot"), false);
});

test("allows a narrow named-element click and rejects unapproved control tools", () => {
  assert.deepEqual(
    validateUaccInvocation("click_element", { name: "Save", element_type: "button" }),
    {
      valid: true,
      name: "click_element",
      arguments: { name: "Save", element_type: "button" },
    }
  );
  assert.equal(validateUaccInvocation("execute_actions", { actions: [] }).valid, false);
  assert.equal(validateUaccInvocation("click_element", { name: "" }).valid, false);
});

test("does not automate typing credentials or oversized text", () => {
  assert.equal(validateUaccInvocation("type_text", { text: "password: hunter2" }).valid, false);
  assert.equal(validateUaccInvocation("type_text", { text: "a".repeat(4001) }).valid, false);
  assert.equal(validateUaccInvocation("type_text", { text: "Hello from Luna" }).valid, true);
});

test("summarizes user-visible confirmations without exposing full typed text", () => {
  const summary = summarizeUaccAction("type_text", { text: "A deliberately long message that should only be summarized in the confirmation dialog.".repeat(2) });
  assert.match(summary, /^Type /);
  assert.ok(summary.length < 90);
});

test("validates smart_click, special hotkeys, and scroll", () => {
  // smart_click validation
  assert.equal(validateUaccInvocation("smart_click", { description: "Subscribe button" }).valid, true);
  assert.equal(validateUaccInvocation("smart_click", { description: "" }).valid, false);

  // hotkeys with special keys (enter, escape, f5, ctrl+s)
  assert.equal(validateUaccInvocation("hotkey", { keys: ["ctrl", "s"] }).valid, true);
  assert.equal(validateUaccInvocation("hotkey", { keys: ["enter"] }).valid, true);
  assert.equal(validateUaccInvocation("hotkey", { keys: ["escape"] }).valid, true);
  assert.equal(validateUaccInvocation("hotkey", { keys: ["f5"] }).valid, true);
  assert.equal(validateUaccInvocation("hotkey", { keys: ["invalid_key_name_that_is_too_long"] }).valid, false);

  // scroll validation
  assert.equal(validateUaccInvocation("scroll", { direction: "down" }).valid, true);
  assert.equal(validateUaccInvocation("scroll", { direction: "up" }).valid, true);
  assert.equal(validateUaccInvocation("scroll", { direction: "sideways" }).valid, false);

  // action summaries
  assert.equal(summarizeUaccAction("smart_click", { description: "Subscribe" }), 'Click "Subscribe" (visual match)');
  assert.equal(summarizeUaccAction("hotkey", { keys: ["ctrl", "s"] }), "Press ctrl + s");
  assert.equal(summarizeUaccAction("scroll", { direction: "down", amount: 5 }), "Scroll down (5×)");
  assert.equal(summarizeUaccAction("focus_window", { title: "Chrome" }), "Focus window: Chrome");
});

