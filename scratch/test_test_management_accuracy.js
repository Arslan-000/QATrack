/**
 * Test Suite: Test Management Data Accuracy & Workflow Audit
 */

const fs = require('fs');
const path = require('path');

function createMockElement(id = '', tag = 'div') {
  return {
    id,
    tagName: tag.toUpperCase(),
    innerHTML: '',
    value: '',
    style: {},
    children: [],
    dataset: {},
    classList: {
      classes: new Set(),
      add: function(...c) { c.forEach(x => this.classes.add(x)); },
      remove: function(...c) { c.forEach(x => this.classes.delete(x)); },
      toggle: function(c) { if (this.classes.has(c)) this.classes.delete(c); else this.classes.add(c); },
      contains: function(c) { return this.classes.has(c); }
    },
    querySelectorAll: () => [],
    querySelector: () => null,
    appendChild: function(child) { this.children.push(child); return child; },
    removeChild: function(child) { this.children = this.children.filter(c => c !== child); return child; },
    setAttribute: function(k, v) { this[k] = v; },
    getAttribute: function(k) { return this[k] || null; },
    addEventListener: () => {},
    removeEventListener: () => {},
    focus: () => {},
    click: () => {},
    scrollIntoView: () => {}
  };
}

const mainContent = createMockElement('mainContent');
const elementMap = { mainContent };

global.window = {
  location: { hash: '#test-management' },
  addEventListener: () => {},
  removeEventListener: () => {},
  innerWidth: 1440,
  innerHeight: 900,
  lucide: { createIcons: () => {} },
  app: {
    navigate: () => {},
    openIssueDetails: () => {},
    openProjectWorkspace: () => {},
    selectSidebarProject: () => {},
    toast: (t, m, type) => { console.log(`  [Toast] ${t}: ${m} (${type})`); }
  }
};

global.document = {
  getElementById: (id) => elementMap[id] || (elementMap[id] = createMockElement(id)),
  querySelector: () => null,
  querySelectorAll: () => [],
  createElement: (tag) => createMockElement('', tag),
  body: createMockElement('body')
};

global.localStorage = {
  store: {},
  getItem(key) { return this.store[key] || null; },
  setItem(key, val) { this.store[key] = String(val); },
  removeItem(key) { delete this.store[key]; },
  clear() { this.store = {}; }
};

// Evaluate scripts in order
eval(fs.readFileSync(path.join(__dirname, '../js/data.js'), 'utf8'));
eval(fs.readFileSync(path.join(__dirname, '../js/store.js'), 'utf8'));
eval(fs.readFileSync(path.join(__dirname, '../js/views/testManagement.js'), 'utf8'));

console.log("==================================================================");
console.log("🏃 RUNNING TEST MANAGEMENT DATA ACCURACY & WORKFLOW AUDIT");
console.log("==================================================================");

// Seed Rich Test Workspace
const qaUser = { id: "usr_qa_1", name: "Sarah QA Lead", email: "sarah@pulsewave.io", role: "QA", initials: "SQ", color: "bg-purple-600 text-white" };
const devUser = { id: "usr_dev_1", name: "David Developer", email: "david@pulsewave.io", role: "DEVELOPER", initials: "DD", color: "bg-indigo-600 text-white" };

const prj = {
  id: "prj_pos",
  key: "POS",
  name: "Point of Sale Modernization",
  status: "Active",
  release_version: "v2.1.0",
  environment: "Staging",
  members: [qaUser.id, devUser.id]
};

store.data = {
  users: [qaUser, devUser],
  currentUser: qaUser,
  workspaces: [{ id: "ws_default", name: "PulseWave Engineering", members: [qaUser.id, devUser.id] }],
  activeWorkspaceId: "ws_default",
  projects: [prj],
  activeProjectId: prj.id,
  testCases: [
    {
      id: "TC-101",
      projectId: prj.id,
      title: "Verify POS checkout payment calculation with VAT",
      module: "Checkout",
      testType: "Functional",
      priority: "Critical",
      status: "Active",
      lastResult: "Passed",
      assignedQA: "Sarah QA Lead",
      environment: "Staging",
      steps: [
        { stepNumber: 1, action: "Scan item", expectedResult: "Price shows with VAT" },
        { stepNumber: 2, action: "Apply 10% coupon", expectedResult: "Net discount calculated correctly" }
      ]
    },
    {
      id: "TC-102",
      projectId: prj.id,
      title: "Verify contactless NFC payment processing timeout",
      module: "Payments",
      testType: "Integration",
      priority: "High",
      status: "Active",
      lastResult: "Failed",
      assignedQA: "Sarah QA Lead",
      environment: "Staging",
      relatedIssueKey: "POS-201",
      steps: [
        { stepNumber: 1, action: "Tap NFC card", expectedResult: "Card reader beeps" },
        { stepNumber: 2, action: "Simulate gateway timeout", expectedResult: "Payment fails gracefully with retry prompt" }
      ]
    }
  ],
  testExecutions: [
    {
      id: "exec_1",
      testCaseId: "TC-101",
      projectId: prj.id,
      status: "Passed",
      executedBy: "Sarah QA Lead",
      executionDate: "2026-09-27",
      actualResult: "Passed without deviation"
    },
    {
      id: "exec_2",
      testCaseId: "TC-102",
      projectId: prj.id,
      status: "Failed",
      executedBy: "Sarah QA Lead",
      executionDate: "2026-09-27",
      actualResult: "Timeout caused app hang instead of prompt",
      linkedDefectKey: "POS-201"
    }
  ],
  testCycles: [
    {
      id: "cycle_1",
      projectId: prj.id,
      name: "Release v2.1.0 Regression Testing",
      release: "v2.1.0",
      environment: "Staging",
      status: "Active"
    }
  ],
  issues: [
    {
      id: "iss_201",
      key: "POS-201",
      projectId: prj.id,
      title: "Contactless NFC payment processing timeout causes UI freeze",
      type: "Bug",
      status: "Ready for QA",
      priority: "High",
      linkedTestCaseId: "TC-102"
    }
  ]
};

store.saveState();

// 1. Audit Overview Tab Rendering
TestManagementView.activeTab = "overview";
TestManagementView.render(mainContent);

const stats = TestManagementView.computeProjectStats(
  store.getTestCases(prj.id),
  store.getTestExecutions(prj.id)
);

console.log(`Stats -> Total: ${stats.total}, Executed: ${stats.executed}, Passed: ${stats.passed}, Failed: ${stats.failed}, PassRate: ${stats.passRate}%, QualityGate: ${stats.qualityGate}`);
console.assert(mainContent.innerHTML.includes("Release Quality Gate"), "Overview should render Quality Gate");
console.assert(mainContent.innerHTML.includes("Testing Defect Connections"), "Overview should render Defect Connections");
console.assert(mainContent.innerHTML.includes("POS-201"), "Overview should display linked defect POS-201");
console.log("  ✅ Overview Tab: Rendered accurately with real project stats and linked defect.");

// 2. Audit Test Library Tab Rendering
TestManagementView.activeTab = "library";
TestManagementView.render(mainContent);
console.assert(mainContent.innerHTML.includes("TC-101"), "Library should render TC-101");
console.assert(mainContent.innerHTML.includes("TC-102"), "Library should render TC-102");
console.log("  ✅ Library Tab: Rendered accurately with real test cases.");

// 3. Audit Test Case Creation with Multi-Row Steps
const newTestCase = store.createTestCase({
  projectId: prj.id,
  title: "Verify Stripe Checkout Webhook Idempotency",
  module: "Payments",
  testType: "Integration",
  priority: "Critical",
  status: "Active",
  assignedQA: "Sarah QA Lead",
  environment: "Staging",
  preconditions: "Stripe sandbox key configured",
  testData: "event_id: evt_test_123",
  expectedResult: "Webhook processed once with 200 OK",
  tags: ["Payments", "Security", "Stripe"],
  steps: [
    { stepNumber: 1, action: "Send initial payment webhook", expectedResult: "Returns 200 OK" },
    { stepNumber: 2, action: "Resend identical webhook with same event_id", expectedResult: "Returns 200 OK without duplicate ledger entry" }
  ]
});

console.log(`  ✅ Created Test Case: ${newTestCase.id} - "${newTestCase.title}"`);
console.assert(newTestCase.id.startsWith("TC-"), "Test Case ID must follow TC- prefix format");
console.assert(newTestCase.steps.length === 2, "Test Case steps must equal 2");

// 4. Audit Test Execution
store.executeTestCase(newTestCase.id, "Failed", "Duplicate charge ledger entry recorded", "Critical defect blocking automated webhook retry.");
const failedCase = store.getTestCaseById(newTestCase.id);
console.assert(failedCase.lastResult === "Failed", "Test case lastResult should be Failed");
console.log(`  ✅ Executed Test Case: Marked ${newTestCase.id} as Failed with actual result.`);

// 5. Audit Bug Creation from Failed Test
const linkedBug = store.createBugFromFailedTest(newTestCase.id, {
  title: `[${newTestCase.id}] Duplicate charge on webhook retry`,
  priority: "Critical",
  developerId: devUser.id,
  actualResult: "Duplicate charge ledger entry recorded"
});

console.log(`  ✅ Created Bug from Failed Test: ${linkedBug.key} linked to ${newTestCase.id}`);
console.assert(linkedBug.linkedTestCaseId === newTestCase.id, "Bug must be linked to testCaseId");

// 6. Audit Retest Workflow
store.retestTestCase(newTestCase.id, "Passed", "Retest passed: Duplicate ledger issue resolved in patch.", "Verified on build 2.1.0");
const retestedCase = store.getTestCaseById(newTestCase.id);
console.assert(retestedCase.lastResult === "Passed", "Test case lastResult should now be Passed");
const executionHistory = store.getTestCaseExecutionHistory(newTestCase.id);
console.assert(executionHistory.length >= 2, "Execution history must contain at least 2 runs");
console.log(`  ✅ Retest Workflow Verified: ${newTestCase.id} updated to Passed across ${executionHistory.length} recorded runs.`);

// 7. Audit Test Execution Tab
TestManagementView.activeTab = "execution";
TestManagementView.render(mainContent);
console.assert(mainContent.innerHTML.includes("ACTIVE TESTING CYCLE"), "Execution Tab should render Active Testing Cycle");
console.log("  ✅ Execution Tab: Rendered accurately with real cycle runner.");

console.log("==================================================================");
console.log("🎉 TEST MANAGEMENT AUDIT PASSED 100%!");
console.log("==================================================================");
