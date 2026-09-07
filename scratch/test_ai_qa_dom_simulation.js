/**
 * DOM Integration & Interaction Test for AI QA Assistant
 */

const assert = require('assert');

// Simple DOM Mock
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
    this.checked = false;
  }
  appendChild(child) {
    this.children.push(child);
    return child;
  }
  remove() {
    this.parentElement = null;
  }
  setAttribute(k, v) { this.attributes[k] = v; }
  getAttribute(k) { return this.attributes[k]; }
  querySelector() { return null; }
  querySelectorAll() { return []; }
  addEventListener() {}
  removeEventListener() {}
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
  navigator: { clipboard: { writeText: async () => {} } },
  print: () => {}
};

global.localStorage = {
  getItem: () => null,
  setItem: () => {},
  removeItem: () => {}
};

global.INITIAL_DATA = {
  workspaces: [{ id: "ws_alpha", name: "Main Workspace" }],
  projects: [{ id: "prj_checkout", workspace_id: "ws_alpha", key: "CHK", name: "Checkout Modernization" }],
  users: [{ id: "usr_lead", name: "Lead QA", email: "qa@company.io", role: "QA Engineer" }],
  issues: []
};

const store = require('../js/store.js');
const AIQAService = require('../js/services/aiQAService.js');
global.store = store;
global.AIQAService = AIQAService;

// Load AIQAAssistantView
require('../js/views/aiQAAssistant.js');
const AIQAAssistantView = global.AIQAAssistantView || window.AIQAAssistantView;

async function testDomInteractions() {
  console.log("=================================================");
  console.log("🖥️  TESTING AI QA ASSISTANT DOM & USER FLOWS");
  console.log("=================================================\n");

  const pId = "prj_checkout";
  store.data.projects = [{ id: pId, workspace_id: "ws_alpha", key: "CHK", name: "Checkout Modernization" }];
  store.data.activeProjectId = pId;
  store.data.activeWorkspaceId = "ws_alpha";

  const today = new Date().toISOString().split("T")[0];
  store.data.issues = [
    {
      id: "iss_c1",
      key: "CHK-101",
      projectId: pId,
      title: "Payment authorization token expiry crash",
      priority: "Critical",
      status: "Open",
      qaStatus: "Failed",
      createdAt: `${today}T08:00:00Z`
    },
    {
      id: "iss_c2",
      key: "CHK-102",
      projectId: pId,
      title: "Stripe webhook retry delay",
      priority: "High",
      status: "In Progress",
      qaStatus: "Testing",
      createdAt: `${today}T10:30:00Z`
    }
  ];

  // 1. Open Assistant
  AIQAAssistantView.open(pId);
  assert.strictEqual(AIQAAssistantView.isOpen, true, "Modal must be open");
  assert.strictEqual(AIQAAssistantView.matchingIssues.length, 2, "Must match 2 issues for today");
  console.log("✅ Step 1: Opened Assistant & Loaded Issues");

  // 2. Deselect 1 issue and test checklist
  AIQAAssistantView.toggleIssueSelection("iss_c2");
  assert.strictEqual(AIQAAssistantView.selectedIssueIds.size, 1, "Only 1 issue selected");
  console.log("✅ Step 2: Interactive checklist deselection");

  // 3. Re-select all
  AIQAAssistantView.toggleSelectAllIssues(true);
  assert.strictEqual(AIQAAssistantView.selectedIssueIds.size, 2, "All 2 issues selected");
  console.log("✅ Step 3: Select all issues");

  // 4. Trigger QA Summary generation
  await AIQAAssistantView.generate('qa_summary');
  assert.ok(AIQAAssistantView.currentGeneration, "Current generation record must exist");
  assert.strictEqual(AIQAAssistantView.currentGeneration.generation_type, 'qa_summary');
  console.log("✅ Step 4: Generated QA Summary");

  // 5. Trigger Developer Email generation
  await AIQAAssistantView.generate('developer_email');
  assert.strictEqual(AIQAAssistantView.currentGeneration.generation_type, 'developer_email');
  console.log("✅ Step 5: Generated Developer Email");

  // 6. Open Email Modal
  AIQAAssistantView.openEmailModal();
  assert.strictEqual(AIQAAssistantView.emailModalOpen, true, "Email modal open");
  assert.ok(AIQAAssistantView.emailSubject.includes("QA Testing Summary"));
  console.log("✅ Step 6: Email Composer opened with pre-filled content");

  // 7. Send Email
  AIQAAssistantView.emailRecipient = "lead@engineering.org";
  await AIQAAssistantView.sendEmail();
  assert.strictEqual(AIQAAssistantView.emailModalOpen, false, "Email modal closes upon send");
  console.log("✅ Step 7: Email sent & logged to audit table");

  // 8. Close Assistant
  AIQAAssistantView.close();
  assert.strictEqual(AIQAAssistantView.isOpen, false, "Assistant closed");
  console.log("✅ Step 8: Clean teardown and close");

  console.log("\n=================================================");
  console.log("🎉 ALL DOM & USER FLOW TESTS PASSED SUCCESSFULLY!");
  console.log("=================================================\n");
}

testDomInteractions().catch(e => {
  console.error(e);
  process.exit(1);
});
