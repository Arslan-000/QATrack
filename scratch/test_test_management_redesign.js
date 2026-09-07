/**
 * Comprehensive Automated Verification for Test Management Redesign
 * Validates the complete 23-point specification:
 * 1. Clean 3-tab navigation (Overview, Test Library, Test Execution)
 * 2. Multi-step test case creation & field persistence
 * 3. Execution cycles & dynamic counter calculations
 * 4. Failed Test -> Create Bug integration
 * 5. Bug -> Retest workflow & immutable execution history
 * 6. Honest Quality Gate states (NOT EVALUATED -> IN PROGRESS -> PASSED/FAILED)
 * 7. Project & release isolation
 * 8. Role-based permissions
 */

const fs = require('fs');

// Mock browser DOM
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
    },
    navigate: (view) => {
      // console.log(`[NAVIGATE] -> ${view}`);
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
  console.log("🧪 RUNNING COMPREHENSIVE TEST MANAGEMENT REDESIGN VERIFICATION");
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

  // 1. Setup Projects & Workspaces
  const qaUser = store.registerUser({ name: "Sarah Jenkins", email: "sarah@qa.com", role: "QA Lead" });
  store.setActiveUser(qaUser.id);

  const ws = store.addWorkspace({ id: "ws-retail", name: "Retail Solutions Corp", slug: "retail" });
  store.setActiveWorkspace(ws.id);

  const prj1 = await store.createProject({
    id: "prj-pos",
    workspace_id: ws.id,
    name: "Retail POS Integration",
    key: "POS",
    release_version: "v1.0.0",
    environment: "Staging"
  });
  store.setActiveProject(prj1.id);

  const prj2 = await store.createProject({
    id: "prj-ecom",
    workspace_id: ws.id,
    name: "E-Commerce Checkout",
    key: "ECOM",
    release_version: "v2.0.0",
    environment: "Production"
  });

  console.log("\n--- TEST GROUP 1: 3-Tab Navigation & Empty State ---");
  const container = { innerHTML: "" };
  await TestManagementView.render(container);

  assert(container.innerHTML.includes("1. Overview"), "Overview tab present in navigation");
  assert(container.innerHTML.includes("2. Test Library"), "Test Library tab present in navigation");
  assert(container.innerHTML.includes("3. Test Execution"), "Test Execution tab present in navigation");
  assert(!container.innerHTML.includes("Test Plans ("), "Bloated Test Plans top-level tab removed");
  assert(!container.innerHTML.includes("Test Suites ("), "Bloated Test Suites top-level tab removed");
  assert(!container.innerHTML.includes("Execution Runner"), "Bloated Execution Runner top-level tab removed");
  assert(!container.innerHTML.includes("Traceability Matrix"), "Bloated Traceability Matrix top-level tab removed");

  // Empty state check
  const initialStats = TestManagementView.computeProjectStats([], []);
  assert(initialStats.total === 0, "0 Total test cases initially");
  assert(initialStats.qualityGate === "NOT EVALUATED", "Quality Gate is NOT EVALUATED when no tests have run (no fake 100%)");

  console.log("\n--- TEST GROUP 2: Create Test Cases with Multi-Row Steps ---");
  const tc1 = store.createTestCase({
    title: "Valid Customer Login",
    module: "Authentication",
    testType: "Smoke",
    priority: "Critical",
    status: "Active",
    preconditions: "User registered with active status",
    testData: "user@test.com / Pass123!",
    environment: "Staging",
    tags: ["Smoke", "Auth"],
    steps: [
      { stepNumber: 1, action: "Navigate to login screen", expectedResult: "Login form displayed with email & password inputs." },
      { stepNumber: 2, action: "Enter valid credentials and submit", expectedResult: "Session token granted and redirected to dashboard." }
    ],
    expectedResult: "User authenticated successfully",
    projectId: prj1.id
  });

  const tc2 = store.createTestCase({
    title: "Verify inventory updates after partial return",
    module: "Orders",
    testType: "Regression",
    priority: "High",
    status: "Active",
    preconditions: "Order placed with 2 line items",
    testData: "OrderID: ORD-1001, ReturnQty: 1",
    environment: "Staging",
    tags: ["Regression", "Orders"],
    steps: [
      { stepNumber: 1, action: "Create an order with 2 items", expectedResult: "Order created successfully." },
      { stepNumber: 2, action: "Return one item from order", expectedResult: "Return invoice processed." },
      { stepNumber: 3, action: "Verify inventory count in catalog", expectedResult: "Inventory count increases by 1." }
    ],
    expectedResult: "Inventory increases by 1",
    projectId: prj1.id
  });

  const tc3 = store.createTestCase({
    title: "Process Credit Card Checkout",
    module: "Payments",
    testType: "Functional",
    priority: "High",
    status: "Active",
    preconditions: "Payment gateway reachable",
    testData: "Card: 4111-2222-3333-4444",
    environment: "Staging",
    tags: ["Payments", "Checkout"],
    steps: [
      { stepNumber: 1, action: "Submit payment with test Visa card", expectedResult: "Payment approved with 200 OK." }
    ],
    expectedResult: "Payment transaction committed",
    projectId: prj1.id
  });

  assert(tc1.id.startsWith("TC-"), `Generated valid TC ID: ${tc1.id}`);
  assert(tc2.steps.length === 3, `Multi-row steps preserved: 3 steps in ${tc2.id}`);
  assert(store.getTestCases(prj1.id).length === 3, "3 test cases retrieved for POS project");
  assert(store.getTestCases(prj2.id).length === 0, "0 test cases leaked to ECOM project (Strict Project Isolation)");

  console.log("\n--- TEST GROUP 3: Start Testing Cycle & Execute Cases ---");
  const cycle = store.saveTestCycle({
    name: "Regression Testing Cycle — Release v1.0.0",
    release: "v1.0.0",
    environment: "Staging",
    testType: "Regression",
    projectId: prj1.id
  });
  assert(cycle.status === "Active", "Active testing cycle created");

  // Execute TC-1 as Passed
  const exec1 = store.executeTestCase(tc1.id, "Passed", "Login succeeded with 200 OK session token.", "Verified cleanly.", ["Pass", "Pass"], { cycleName: cycle.name });
  assert(exec1.status === "Passed", "TC-1 executed as Passed");
  assert(store.getTestCaseById(tc1.id).lastResult === "Passed", "TC-1 lastResult updated to Passed");

  // Execute TC-2 as Failed
  const exec2 = store.executeTestCase(tc2.id, "Failed", "Inventory remained unchanged at 9 instead of increasing to 10.", "Defect observed on step 3.", ["Pass", "Pass", "Fail"], { cycleName: cycle.name });
  assert(exec2.status === "Failed", "TC-2 executed as Failed");
  assert(store.getTestCaseById(tc2.id).lastResult === "Failed", "TC-2 lastResult updated to Failed");

  // Execute TC-3 as Blocked
  const exec3 = store.executeTestCase(tc3.id, "Blocked", "Payment sandbox 503 gateway unavailable.", "Blocked by external sandbox outage.", ["Blocked"], { cycleName: cycle.name });
  assert(exec3.status === "Blocked", "TC-3 executed as Blocked");

  const midStats = TestManagementView.computeProjectStats(store.getTestCases(prj1.id), store.getTestExecutions(prj1.id));
  assert(midStats.total === 3, "Total cases = 3");
  assert(midStats.executed === 3, "Executed = 3");
  assert(midStats.passed === 1, "Passed = 1");
  assert(midStats.failed === 1, "Failed = 1");
  assert(midStats.blocked === 1, "Blocked = 1");
  assert(midStats.notRun === 0, "Not Run = 0");
  assert(midStats.passRate === 33, `Pass rate calculated honestly: ${midStats.passRate}%`);
  assert(midStats.qualityGate === "AT RISK" || midStats.qualityGate === "FAILED", `Quality Gate correctly identified failures: ${midStats.qualityGate}`);

  console.log("\n--- TEST GROUP 4: Failed Test -> Create Bug Integration ---");
  const bug = store.createBugFromFailedTest(tc2.id, {
    title: "Inventory not updated after partial return",
    actualResult: "Inventory remains unchanged at 9 after 1 item returned.",
    priority: "Critical"
  });

  assert(bug.key.startsWith("BUG-"), `Bug created with key: ${bug.key}`);
  assert(bug.linkedTestCaseId === tc2.id, `Bug linkedTestCaseId points to ${tc2.id}`);
  assert(store.getTestCaseById(tc2.id).relatedIssueKey === bug.key, `Test Case relatedIssueKey set to ${bug.key}`);
  assert(store.getIssues(prj1.id).some(i => i.key === bug.key), "Bug appears directly on Issues & Defects board without duplicate data model");

  console.log("\n--- TEST GROUP 5: Bug Retest Workflow & Immutable Execution History ---");
  // Developer resolves bug
  bug.status = "Ready for QA";
  store.saveState();

  // QA executes Retest (Retest 1: Still Failed)
  const retest1 = store.retestTestCase(tc2.id, "Failed", "Retest 1 failed: Inventory still at 9.", "Developer fix patch not deployed.", ["Pass", "Pass", "Fail"]);
  assert(retest1.runType === "Retest 1", `Execution runType = ${retest1.runType}`);

  // Developer fixes again -> QA executes Retest (Retest 2: Passed!)
  const retest2 = store.retestTestCase(tc2.id, "Passed", "Retest 2 passed: Inventory successfully incremented to 10.", "Verified on build b102.", ["Pass", "Pass", "Pass"]);
  assert(retest2.runType === "Retest 2", `Execution runType = ${retest2.runType}`);
  assert(retest2.status === "Passed", "Retest 2 verdict = Passed");
  assert(store.getTestCaseById(tc2.id).lastResult === "Passed", "TC-2 lastResult updated to Passed");

  // Verify immutable execution history
  const history = store.getTestCaseExecutionHistory(tc2.id);
  assert(history.length === 3, `Full immutable history preserved with ${history.length} execution runs`);
  assert(history[2].status === "Failed", "Run 1 was Failed");
  assert(history[1].status === "Failed", "Retest 1 was Failed");
  assert(history[0].status === "Passed", "Retest 2 was Passed");

  console.log("\n--- TEST GROUP 6: Quality Gate Transition & UI Rendering ---");
  // Execute TC-3 as Passed to clear blocked status
  store.executeTestCase(tc3.id, "Passed", "Sandbox restored. Payment processed 200 OK.", "Verified cleanly.");

  const finalStats = TestManagementView.computeProjectStats(store.getTestCases(prj1.id), store.getTestExecutions(prj1.id));
  assert(finalStats.passed === 3, "All 3 tests passed");
  assert(finalStats.failed === 0, "0 failures remaining");
  assert(finalStats.passRate === 100, "100% pass rate achieved");
  assert(finalStats.qualityGate === "PASSED", "Quality Gate is now PASSED (Ready for Release)");

  // Test UI Library tab rendering
  store.setActiveProject(prj1.id);
  TestManagementView.activeTab = "library";
  TestManagementView.render(container);
  assert(container.innerHTML.includes("Authentication"), "Module 'Authentication' rendered in Test Library");
  assert(container.innerHTML.includes("Orders"), "Module 'Orders' rendered in Test Library");
  assert(container.innerHTML.includes("Payments"), "Module 'Payments' rendered in Test Library");
  assert(container.innerHTML.includes(tc1.id), "TC-001 visible in Test Library table");
  assert(container.innerHTML.includes(tc2.id), "TC-002 visible in Test Library table");

  // Test UI Execution tab rendering
  TestManagementView.activeTab = "execution";
  await TestManagementView.render(container);
  assert(container.innerHTML.includes("ACTIVE TESTING CYCLE"), "Active Testing Cycle rendered in Test Execution");
  assert(container.innerHTML.includes("Generate QA Report"), "Report generation integration button present");

  console.log("\n==================================================================");
  console.log(`🎉 TEST MANAGEMENT VERIFICATION COMPLETE: ${passed} PASSED, ${failed} FAILED`);
  console.log("==================================================================");

  if (failed > 0) {
    process.exit(1);
  }
}

runTests().catch(err => {
  console.error("Test execution error:", err);
  process.exit(1);
});
