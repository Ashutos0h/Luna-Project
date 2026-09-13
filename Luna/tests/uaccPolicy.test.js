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
