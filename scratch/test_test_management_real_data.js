/**
 * Comprehensive Verification Test for Test Management View & Real Data Integration
 */

const fs = require('fs');

// Mock browser environment
global.document = {
  elements: {},
  getElementById: function(id) {
    if (!this.elements[id]) {
      this.elements[id] = {
        id,
        innerHTML: '',
        value: '',
        classList: {
          classes: new Set(),
          add: function(c) { this.classes.add(c); },
          remove: function(c) { this.classes.delete(c); },
          toggle: function(c) { if (this.classes.has(c)) this.classes.delete(c); else this.classes.add(c); },
          contains: function(c) { return this.classes.has(c); }
        },
        querySelectorAll: function() { return []; },
        querySelector: function() { return null; },
        appendChild: function(child) { return child; }
      };
    }
    return this.elements[id];
  },
  createElement: function(tag) {
    return {
      tagName: tag,
      className: '',
      innerHTML: '',
      style: {},
      appendChild: function() {},
      classList: {
        classes: new Set(),
        add: function(c) { this.classes.add(c); },
        remove: function(c) { this.classes.delete(c); },
        toggle: function(c) { if (this.classes.has(c)) this.classes.delete(c); else this.classes.add(c); },
        contains: function(c) { return this.classes.has(c); }
      }
    };
  }
};

global.window = {
  document: global.document,
  lucide: { createIcons: () => {} },
  app: {
    toast: (title, msg, type) => {
      // console.log(`[TOAST] ${title}: ${msg} (${type})`);
    }
  }
};

global.localStorage = {
  store: {},
  getItem: function(k) { return this.store[k] || null; },
  setItem: function(k, v) { this.store[k] = v; }
};

// Load codebase
const INITIAL_DATA = require('../js/data.js');
global.INITIAL_DATA = INITIAL_DATA;
global.window.INITIAL_DATA = INITIAL_DATA;

eval(fs.readFileSync('./js/store.js', 'utf8'));
global.store = store;
global.window.store = store;
eval(fs.readFileSync('./js/views/testManagement.js', 'utf8'));
const TestManagementView = global.window.TestManagementView;
global.TestManagementView = TestManagementView;

async function runTests() {
  console.log("==================================================================");
  console.log("🧪 RUNNING TEST MANAGEMENT REAL-DATA & REDESIGN VERIFICATION");
  console.log("==================================================================");

  let passed = 0;
  let failed = 0;

  function assert(condition, message) {
    if (condition) {
      console.log(`  ✅ PASS: ${message}`);
      passed++;
    } else {
      console.error(`  ❌ FAIL: ${message}`);
      failed++;
    }
  }

  // 1. Initialize clean project & user in store

  const user = store.registerUser({ name: "Sarah Jenkins", email: "sarah@qa.com", role: "QA Lead" });
  const ws = store.addWorkspace({ id: "ws-real", name: "FinTech Systems", slug: "fintech" });
  const proj = await store.createProject({
    id: "prj-pay",
    name: "Payment Gateway Core",
    key: "PAY",
    customer: "Global Bank Corp",
    release_version: "v3.1.0",
    environment: "Staging Lab",
    build_version: "b-204"
  });

  store.setActiveWorkspace(ws.id);
  store.setActiveProject(proj.id);

  assert(store.getActiveProject().id === "prj-pay", "Active project is Payment Gateway Core");
  assert(store.getActiveProject().customer === "Global Bank Corp", "Project customer is Global Bank Corp");

  // 2. Test Plan Creation
  const plan = store.createTestPlan({
    name: "Sprint 14 Regression Quality Gate",
    testingType: "Regression"
  });

  assert(plan.projectId === "prj-pay", "Test plan bound to active project ID");
  assert(plan.customer === "Global Bank Corp", "Test plan inherits project customer Global Bank Corp");
  assert(plan.release === "v3.1.0", "Test plan inherits project release v3.1.0");
  assert(plan.environment === "Staging Lab", "Test plan inherits project environment Staging Lab");
  assert(!JSON.stringify(plan).includes("Acme Retail"), "Test plan has zero dummy Acme Retail strings");

  // 3. Test Suite Creation
  const suite = store.createTestSuite({
    name: "Card Payments & Webhook Verification",
    priority: "P0",
    testType: "Functional"
  });

  assert(suite.projectId === "prj-pay", "Test suite bound to active project");
  assert(suite.name === "Card Payments & Webhook Verification", "Test suite created successfully");

  // 4. Test Case Creation
  const tc1 = store.createTestCase({
    title: "Process 3D-Secure Credit Card Transaction",
    module: "Payments",
    suiteId: suite.id,
    testType: "Positive",
    priority: "Critical",
    steps: [
      { stepNumber: 1, action: "Submit card payload with 3DS token", expectedResult: "Card authorized with HTTP 200" }
    ]
  });

  const tc2 = store.createTestCase({
    title: "Reject Expired Card with 402 Payment Required",
    module: "Payments",
    suiteId: suite.id,
    testType: "Negative",
    priority: "High",
    steps: [
      { stepNumber: 1, action: "Submit expired card payload", expectedResult: "Returns error code 'card_expired'" }
    ]
  });

  assert(tc1.projectId === "prj-pay", "Test case 1 bound to active project");
  assert(tc1.suiteId === suite.id, "Test case 1 attached to created suite");
  assert(store.getTestCases("prj-pay").length === 2, "2 test cases returned for active project");

  // 5. Test Case Execution
  const execResult1 = store.executeTestCase(tc1.id, "Pass");
  assert(execResult1.result === "Pass", "Test case 1 executed as Pass");
  assert(tc1.lastResult === "Passed", "Test case 1 status updated to Passed");
  assert(execResult1.build === "b-204", "Execution record bound to real project build b-204");
  assert(execResult1.environment === "Staging Lab", "Execution record bound to real project environment");

  const execResult2 = store.executeTestCase(tc2.id, "Fail", "Observed 500 Internal Server Error instead of 402");
  assert(execResult2.result === "Fail", "Test case 2 executed as Fail");
  assert(tc2.lastResult === "Failed", "Test case 2 status updated to Failed");

  // 6. Bug Creation from Failed Test
  const bug = store.createBugFromFailedTest(tc2.id, {
    title: "[TC-PAY-002] 500 Server Error on Expired Card",
    severity: "Critical",
    actualResult: "500 Internal Server Error returned by payment processor"
  });

  assert(bug.linkedTestCaseId === tc2.id, "Bug linked to test case 2");
  assert(tc2.relatedIssueKey === bug.key, "Test case 2 relatedIssueKey updated with bug key");
  assert(bug.environment === "Staging Lab", "Bug environment matches project environment");
  assert(bug.releaseVersion === "v3.1.0", "Bug release matches project release");
  assert(bug.key.startsWith("BUG-PAY"), "Bug key prefixed with project key PAY");

  // 7. Render TestManagementView DOM
  const container = document.getElementById("mainContent");
  TestManagementView.render(container);

  assert(container.innerHTML.includes("Test Management"), "Test Management title rendered");
  assert(container.innerHTML.includes("Global Bank Corp"), "Project customer rendered dynamically");
  assert(container.innerHTML.includes("v3.1.0"), "Project release v3.1.0 rendered dynamically");
  assert(container.innerHTML.includes("Staging Lab"), "Project environment Staging Lab rendered dynamically");
  assert(!container.innerHTML.includes("Acme Retail"), "No dummy 'Acme Retail' in rendered view");
  assert(!container.innerHTML.includes("v2.4.1-b14"), "No dummy 'v2.4.1-b14' in rendered view");

  // 8. Test Sub-Tab Switching
  TestManagementView.switchTab("plans");
  assert(container.innerHTML.includes("Sprint 14 Regression Quality Gate"), "Test Plans tab renders active plan");

  TestManagementView.switchTab("suites");
  assert(container.innerHTML.includes("Card Payments & Webhook Verification"), "Test Suites tab renders active suite");

  TestManagementView.switchTab("cases");
  assert(container.innerHTML.includes("Process 3D-Secure Credit Card Transaction"), "Test Cases tab renders test case 1");
  assert(container.innerHTML.includes("Reject Expired Card with 402 Payment Required"), "Test Cases tab renders test case 2");

  TestManagementView.switchTab("execution");
  assert(container.innerHTML.includes("LIVE RUNNER"), "Execution Runner renders");
  assert(container.innerHTML.includes("Step Failed"), "Execution Runner shows failed step status");
  assert(container.innerHTML.includes(bug.key), "Execution Runner shows linked defect key");

  TestManagementView.switchTab("traceability");
  assert(container.innerHTML.includes("End-to-End QA Traceability Chain"), "Traceability tab renders");
  assert(container.innerHTML.includes(bug.key), "Traceability matrix links to bug");

  // 9. Test Empty States for Fresh Project
  const emptyProj = await store.createProject({
    id: "prj-empty",
    name: "New Unconfigured Service",
    key: "NUS",
    customer: "Acme Inc" // real custom name
  });
  store.setActiveProject("prj-empty");
  TestManagementView.switchTab("overview");
  assert(container.innerHTML.includes("No Test Plans Configured"), "Overview shows clean empty state for test plans");
  assert(container.innerHTML.includes("No Test Suites Created"), "Overview shows clean empty state for test suites");
  assert(container.innerHTML.includes("Zero Failed Tests in Scope"), "Overview shows zero failed tests empty state");

  TestManagementView.switchTab("plans");
  assert(container.innerHTML.includes("No Test Plans for New Unconfigured Service"), "Plans tab shows empty state");

  TestManagementView.switchTab("suites");
  assert(container.innerHTML.includes("No Test Suites Found"), "Suites tab shows empty state");

  TestManagementView.switchTab("cases");
  assert(container.innerHTML.includes("No test cases match active filters"), "Cases tab shows empty state");

  // 10. Test Create Case Modal with Template Selection
  store.setActiveProject("prj-pay");
  TestManagementView.openCreateCaseModal();
  const modalContainer = document.getElementById("tmModalContainer");
  assert(modalContainer.innerHTML.includes("Choose Built-in QA Template"), "Create Case modal rendered");
  assert(modalContainer.innerHTML.includes("Test Procedure Steps"), "Step builder rendered in Create Case modal");

  // 11. Test Create Bug from Failed Test with Dynamic Project Members
  const devMember = store.registerUser({ name: "Farhan Ali", email: "farhan@dev.com", role: "Developer" });
  store.addProjectMember("prj-pay", devMember);
  store.setActiveProject("prj-pay");
  TestManagementView.openCreateBugFromTestModal(tc2.id);
  assert(modalContainer.innerHTML.includes("Farhan Ali") || modalContainer.innerHTML.includes("farhan@dev.com"), "Create Bug modal populated with real project member developers");
  assert(!modalContainer.innerHTML.includes("Ali Raza (Senior Dev)"), "No hardcoded dummy developer in Create Bug modal");

  // 12. Test Evidence Attachment Modal
  TestManagementView.openEvidenceModal(tc2.id);
  assert(modalContainer.innerHTML.includes("Attach Test Evidence"), "Evidence modal rendered");
  assert(modalContainer.innerHTML.includes(tc2.id), "Evidence modal references test case ID");

  console.log("==================================================================");
  console.log(`SUMMARY: ${passed} Passed, ${failed} Failed`);
  console.log("==================================================================");

  if (failed > 0) {
    process.exit(1);
  }
}

runTests();
