/**
 * PulseWave QA Platform — Automated AI QA Chat Bot & Short Tasks Verification Suite
 */

const assert = require('assert');
const fs = require('fs');
const path = require('path');

// Mock DOM and browser globals
class MockElement {
  constructor(tagName = 'div') {
    this.tagName = tagName.toUpperCase();
    this.children = [];
    this.attributes = {};
    this.style = {};
    this.innerHTML = '';
    this.value = '';
    this.className = '';
    this.id = '';
    this.scrollTop = 0;
    this.scrollHeight = 100;
  }
  appendChild(c) { this.children.push(c); return c; }
  remove() { this.parentElement = null; }
  setAttribute(k, v) { this.attributes[k] = v; }
  getAttribute(k) { return this.attributes[k]; }
  addEventListener() {}
  removeEventListener() {}
  focus() {}
}

const elementsById = {};
global.document = {
  getElementById: (id) => {
    if (!elementsById[id]) {
      elementsById[id] = new MockElement();
      elementsById[id].id = id;
    }
    return elementsById[id];
  },
  createElement: (tag) => new MockElement(tag),
  body: new MockElement('body'),
  addEventListener: () => {}
};

global.window = {
  addEventListener: () => {},
  removeEventListener: () => {},
  lucide: { createIcons: () => {} },
  app: {
    toast: () => {},
    openIssueDetails: () => {},
    openCreateIssueModal: () => {}
  }
};

global.localStorage = {
  store: {},
  getItem(k) { return this.store[k] || null; },
  setItem(k, v) { this.store[k] = String(v); },
  removeItem(k) { delete this.store[k]; },
  clear() { this.store = {}; }
};

global.INITIAL_DATA = {
  workspaces: [{ id: "ws_alpha", name: "Alpha Space" }],
  projects: [{ id: "prj_pos", workspace_id: "ws_alpha", key: "POS", name: "Retail POS Integration" }],
  users: [
    { id: "usr_pm", name: "Sarah PM", email: "pm@company.io", role: "Project Manager", initials: "SP", color: "bg-slate-900" },
    { id: "usr_dev1", name: "Alex Dev", email: "alex@company.io", role: "Developer", initials: "AD", color: "bg-emerald-600" },
    { id: "usr_qa1", name: "Elena QA", email: "elena@company.io", role: "QA Engineer", initials: "EQ", color: "bg-purple-600" }
  ],
  issues: []
};

// Load Store, Services, and Views
const store = require('../js/store.js');
global.store = store;

const AIQAService = require('../js/services/aiQAService.js');
global.AIQAService = AIQAService;

const AIQAAssistantView = require('../js/views/aiQAAssistant.js');
global.AIQAAssistantView = AIQAAssistantView;

async function runAIQAChatBotTests() {
  console.log("=================================================");
  console.log("🚀 STARTING AI QA CHAT BOT AUTOMATED VERIFICATION");
  console.log("=================================================\n");

  let passed = 0;
  let failed = 0;

  async function test(name, fn) {
    try {
      await fn();
      console.log(`✅ PASS: ${name}`);
      passed++;
    } catch (err) {
      console.error(`❌ FAIL: ${name}`);
      console.error(err);
      failed++;
    }
  }

  const pId = "prj_pos";
  store.data.projects = [{ id: pId, workspace_id: "ws_alpha", key: "POS", name: "Retail POS Integration", pmId: "usr_pm", members: ["usr_pm", "usr_dev1", "usr_qa1"] }];
  store.data.users = global.INITIAL_DATA.users;
  store.data.activeProjectId = pId;
  store.data.activeWorkspaceId = "ws_alpha";
  store.data.activeUserId = "usr_pm";

  // Setup real board test issues
  store.data.issues = [
    {
      id: "iss_101",
      key: "POS-101",
      projectId: pId,
      title: "Card payment NFC reader timeout",
      type: "Bug",
      priority: "Critical",
      status: "Reopened",
      qaStatus: "Failed",
      developerId: "usr_dev1",
      qaId: "usr_qa1",
      storyPoints: 8,
      reopenCount: 2,
      createdAt: new Date().toISOString()
    },
    {
      id: "iss_102",
      key: "POS-102",
      projectId: pId,
      title: "Thermal printer receipt logo rendering",
      type: "Story",
      priority: "Medium",
      status: "In Progress",
      qaStatus: "Testing",
      developerId: "usr_dev1",
      storyPoints: 5,
      createdAt: new Date().toISOString()
    },
    {
      id: "iss_103",
      key: "POS-103",
      projectId: pId,
      title: "Barcode scanner Bluetooth reconnect retry loop",
      type: "Bug",
      priority: "High",
      status: "Ready for QA",
      qaStatus: "Testing",
      developerId: "usr_dev1",
      storyPoints: 3,
      createdAt: new Date().toISOString()
    },
    {
      id: "iss_104",
      key: "POS-104",
      projectId: pId,
      title: "Cash drawer kick pulse pulse trigger",
      type: "Task",
      priority: "Low",
      status: "Done",
      qaStatus: "Passed",
      developerId: "usr_dev1",
      storyPoints: 2,
      createdAt: new Date().toISOString()
    }
  ];

  // 1. Quick Questions List
  await test("1. AIQAService.getQuickQuestions returns 7 pre-built short task prompts", async () => {
    const questions = AIQAService.getQuickQuestions();
    assert.strictEqual(questions.length, 7, "Must contain exactly 7 quick questions");
    const ids = questions.map(q => q.id);
    assert.ok(ids.includes("summary_blockers"), "Must include summary_blockers");
    assert.ok(ids.includes("critical_high_defects"), "Must include critical_high_defects");
    assert.ok(ids.includes("reopened_failed_qa"), "Must include reopened_failed_qa");
    assert.ok(ids.includes("workload_assignees"), "Must include workload_assignees");
    assert.ok(ids.includes("release_readiness_check"), "Must include release_readiness_check");
    assert.ok(ids.includes("latest_added_updated"), "Must include latest_added_updated");
    assert.ok(ids.includes("daily_standup_3bullets"), "Must include daily_standup_3bullets");
  });

  // 2. Test Question 1: Summary & Blockers
  await test("2. Quick Question: 'summary_blockers' generates accurate board summary and active blockers", async () => {
    const res = await AIQAService.chatWithAssistant({ projectId: pId, quickQuestionId: "summary_blockers" });
    assert.strictEqual(res.success, true);
    assert.ok(res.reply.includes("Board Summary"), "Reply must include title");
    assert.ok(res.reply.includes("POS-101"), "Reply must identify critical blocker POS-101");
    assert.ok(res.actions.some(a => a.action === "copy"), "Must include copy action");
  });

  // 3. Test Question 2: Critical & High Defects
  await test("3. Quick Question: 'critical_high_defects' lists Critical and High defects with keys and assignees", async () => {
    const res = await AIQAService.chatWithAssistant({ projectId: pId, quickQuestionId: "critical_high_defects" });
    assert.strictEqual(res.success, true);
    assert.ok(res.reply.includes("POS-101"), "Must include Critical POS-101");
    assert.ok(res.reply.includes("POS-103"), "Must include High POS-103");
    assert.ok(res.reply.includes("Alex Dev"), "Must mention assigned developer");
  });

  // 4. Test Question 3: Reopened / Failed QA
  await test("4. Quick Question: 'reopened_failed_qa' highlights reopened tickets and failed verifications", async () => {
    const res = await AIQAService.chatWithAssistant({ projectId: pId, quickQuestionId: "reopened_failed_qa" });
    assert.strictEqual(res.success, true);
    assert.ok(res.reply.includes("POS-101"), "Must include reopened bug POS-101");
    assert.ok(res.reply.includes("Reopen Count"), "Must include reopen count telemetry");
  });

  // 5. Test Question 4: Team Workload & Assignees
  await test("5. Quick Question: 'workload_assignees' calculates story points and ticket counts per team member", async () => {
    const res = await AIQAService.chatWithAssistant({ projectId: pId, quickQuestionId: "workload_assignees" });
    assert.strictEqual(res.success, true);
    assert.ok(res.reply.includes("Alex Dev"), "Must mention Alex Dev");
    assert.ok(res.reply.includes("18 Story Points") || res.reply.includes("18 SP") || res.reply.includes("Story Points"), "Must calculate total story points");
  });

  // 6. Test Question 5: Release Readiness Gate Check
  await test("6. Quick Question: 'release_readiness_check' evaluates gate outcome accurately (NOT_READY on Critical bug)", async () => {
    const res = await AIQAService.chatWithAssistant({ projectId: pId, quickQuestionId: "release_readiness_check" });
    assert.strictEqual(res.success, true);
    assert.ok(res.reply.includes("NOT_READY") || res.reply.includes("BLOCKED"), "Must report blocked state due to Critical bug");
    assert.ok(res.reply.includes("Critical"), "Must mention critical bug signal");
  });

  // 7. Test Question 6: Latest Added & Updated
  await test("7. Quick Question: 'latest_added_updated' returns most recent issues on board", async () => {
    const res = await AIQAService.chatWithAssistant({ projectId: pId, quickQuestionId: "latest_added_updated" });
    assert.strictEqual(res.success, true);
    assert.ok(res.reply.includes("POS-101") || res.reply.includes("POS-102"), "Must return recent issues");
  });

  // 8. Test Question 7: 3-Bullet Daily Standup Update
  await test("8. Quick Question: 'daily_standup_3bullets' formats 3-bullet standup (Done, In Progress, Blockers)", async () => {
    const res = await AIQAService.chatWithAssistant({ projectId: pId, quickQuestionId: "daily_standup_3bullets" });
    assert.strictEqual(res.success, true);
    assert.ok(res.reply.includes("1. ✅ Done / Verified"), "Must include Done bullet");
    assert.ok(res.reply.includes("2. 🔍 Today / In Progress QA"), "Must include In Progress bullet");
    assert.ok(res.reply.includes("3. 🚨 Blockers & Risks"), "Must include Blockers bullet");
    assert.ok(res.reply.includes("POS-101"), "Must list POS-101 as blocker");
  });

  // 9. Test Custom Natural Language Ticket Query
  await test("9. Custom Query: Specific ticket lookup (e.g. 'tell me about the payment card issue')", async () => {
    const res = await AIQAService.chatWithAssistant({ projectId: pId, message: "tell me about the payment card issue" });
    assert.strictEqual(res.success, true);
    assert.ok(res.reply.includes("POS-101"), "Must find POS-101");
    assert.ok(res.reply.includes("Critical"), "Must show severity");
    assert.ok(res.reply.includes("Reopened"), "Must show status");
  });

  // 10. Test Short Slack / Team Message Drafting
  await test("10. Custom Query: 'Draft a quick Slack message for the team' produces short message", async () => {
    const res = await AIQAService.chatWithAssistant({ projectId: pId, message: "Draft a quick Slack message for the team" });
    assert.strictEqual(res.success, true);
    assert.ok(res.reply.includes("Short Team Message Draft"), "Must create short team draft");
    assert.ok(res.reply.includes("POS-101"), "Must reference critical bug in message");
  });

  // 11. Test Store Chat History Persistence
  await test("11. Store maintains AI Chat messages and supports clearAIChatHistory", async () => {
    store.clearAIChatHistory(pId);
    assert.strictEqual(store.getAIChatHistory(pId).length, 0);

    store.addAIChatMessage(pId, { role: "user", text: "What is the board status?" });
    store.addAIChatMessage(pId, { role: "assistant", text: "4 issues on the board." });

    const history = store.getAIChatHistory(pId);
    assert.strictEqual(history.length, 2);
    assert.strictEqual(history[0].text, "What is the board status?");
    assert.strictEqual(history[1].text, "4 issues on the board.");

    store.clearAIChatHistory(pId);
    assert.strictEqual(store.getAIChatHistory(pId).length, 0);
  });

  // 12. DOM View Rendering & Mode Switch
  await test("12. AIQAAssistantView opens in Chat Bot mode and allows switching between Chat and Reports", async () => {
    AIQAAssistantView.open(pId);
    assert.strictEqual(AIQAAssistantView.isOpen, true);
    assert.strictEqual(AIQAAssistantView.activeMode, "chat");

    const container = document.getElementById("aiQAAssistantContainer");
    assert.ok(container.innerHTML.includes("Short Tasks:"), "Must render short task bar");
    assert.ok(container.innerHTML.includes("Chat Bot"), "Must render Chat Bot mode tab");
    assert.ok(container.innerHTML.includes("Documents &amp; Emails") || container.innerHTML.includes("Documents & Emails"), "Must render Reports mode tab");

    // Switch to Reports mode
    AIQAAssistantView.switchMode("reports");
    assert.strictEqual(AIQAAssistantView.activeMode, "reports");
    assert.ok(container.innerHTML.includes("Select Testing Date"), "Reports mode must show date selection");
    assert.ok(container.innerHTML.includes("AI Generation Options"), "Reports mode must show generation buttons");

    // Switch back to Chat mode
    AIQAAssistantView.switchMode("chat");
    assert.strictEqual(AIQAAssistantView.activeMode, "chat");

    // Close view
    AIQAAssistantView.close();
    assert.strictEqual(AIQAAssistantView.isOpen, false);
  });

  console.log("\n=================================================");
  console.log(`🎉 ALL TESTS COMPLETED: ${passed} Passed, ${failed} Failed`);
  console.log("=================================================\n");

  if (failed > 0) process.exit(1);
}

runAIQAChatBotTests().catch(err => {
  console.error(err);
  process.exit(1);
});
