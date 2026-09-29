// Automated Test Script: Live Stream, Issues, Notifications & Stats Isolation
const fs = require('fs');
const path = require('path');

console.log("================================================================================");
console.log("TEST SUITE: Live Stream, Issues, Notifications & Stats Isolation Verification");
console.log("================================================================================");

// Mock browser environment
global.window = {
  location: { hash: '', origin: 'http://localhost:3000' },
  localStorage: {
    _data: {},
    getItem(k) { return this._data[k] || null; },
    setItem(k, v) { this._data[k] = String(v); },
    removeItem(k) { delete this._data[k]; },
    clear() { this._data = {}; }
  },
  addEventListener() {},
  removeEventListener() {},
  dispatchEvent() {}
};
global.localStorage = global.window.localStorage;
global.document = {
  getElementById: () => null,
  querySelector: () => null,
  querySelectorAll: () => [],
  addEventListener: () => {},
  createElement: () => ({ setAttribute: () => {}, appendChild: () => {}, classList: { add() {}, remove() {} } }),
  body: { appendChild: () => {} }
};

// Load dependencies
require('../js/data.js');
require('../js/store.js');
const store = global.store || window.store;

require('../js/app.js');
const AppController = global.AppController || window.AppController;
window.app = new AppController();

let testsPassed = 0;
let testsTotal = 0;

function assert(condition, message) {
  testsTotal++;
  if (condition) {
    console.log(`  ✓ PASS: ${message}`);
    testsPassed++;
  } else {
    console.error(`  ✗ FAIL: ${message}`);
    throw new Error(`Assertion failed: ${message}`);
  }
}

async function runTests() {
  try {
    // Step 1: User A creates space 'test taar', project 'TAR', issues, activities, notifications
    console.log("\n--- Step 1: User A Creates 'test taar' & Generates Activities ---");
    const userA = store.registerUser({
      name: "Arslan PM",
      email: "arslandeveloper482@gmail.com",
      password: "Password123!",
      role: "PROJECT_MANAGER"
    });

    const spaceA = store.addWorkspace({
      id: "ws_taar_123",
      name: "test taar",
      slug: "test-taar",
      company_name: "Taar Corp",
      owner_id: userA.id,
      created_by: userA.email
    });

    const projA = await store.addRealProject({
      id: "prj_taar_1",
      workspace_id: spaceA.id,
      name: "Taar POS Core",
      key: "TAR",
      pmId: userA.name
    });

    // Create issues in Project A
    const issueA1 = await store.createIssue({
      projectId: projA.id,
      title: "order sync failed",
      type: "Task",
      priority: "High"
    });

    const issueA2 = await store.createIssue({
      projectId: projA.id,
      title: "login fail",
      type: "Bug",
      priority: "Critical"
    });

    // Add activity and notification in Project A
    store.addActivity({
      issueKey: issueA1.key,
      projectId: projA.id,
      user: "Arslan PM",
      action: `Moved ${issueA1.key} status from "To Do" to "Done"`
    });

    store.addNotification({
      id: "notif_a_1",
      workspaceId: spaceA.id,
      projectId: projA.id,
      title: "New Defect Logged",
      message: "Critical bug reported on login"
    });

    assert(store.getIssues().length === 2, "User A has 2 issues in Project TAR");
    assert(store.getActivities().length === 3, "User A has 3 activity stream items");
    assert(store.getNotifications().length === 1, "User A has 1 notification");

    // Step 2: Sign Out User A
    console.log("\n--- Step 2: Sign Out User A ---");
    store.clearSupabaseUser();

    // Step 3: User B (dogararslan682@gmail.com) Signs Up & Creates 'Testing Team' & 'Omeni n2'
    console.log("\n--- Step 3: User B (dogararslan682@gmail.com) Creates Space & Project ---");
    const userB = store.registerUser({
      name: "Arslan Test",
      email: "dogararslan682@gmail.com",
      password: "Password123!",
      role: "PROJECT_MANAGER"
    });

    const spaceB = store.addWorkspace({
      id: "ws_testing_team_99",
      name: "Testing Team",
      slug: "testing-team",
      company_name: "Testing Corp",
      owner_id: userB.id,
      created_by: userB.email
    });

    const projB = await store.addRealProject({
      id: "prj_omeni_n2",
      workspace_id: spaceB.id,
      name: "Omeni n2",
      key: "ON",
      pmId: userB.name
    });

    // Step 4: Strict Verification for User B's Clean Environment
    console.log("\n--- Step 4: Verify User B Environment is Clean & Irrelevant Data Filtered Out ---");
    
    // Check Activities (Live Project & Quality Stream)
    const bActivities = store.getActivities();
    assert(bActivities.length === 0, "User B has 0 activities (User A's TAR activities are NOT shown in stream)");

    // Check Issues
    const bIssues = store.getIssues();
    assert(bIssues.length === 0, "User B has 0 issues (User A's TAR issues are NOT shown)");

    // Check Notifications
    const bNotifs = store.getNotifications();
    assert(bNotifs.length === 0, "User B has 0 notifications (User A's TAR notifications are NOT shown)");

    // Check Global Stats
    const bStats = store.getGlobalStats();
    assert(bStats.activeProjectsCount === 1, "User B stats: 1 active project ('Omeni n2')");
    assert(bStats.totalIssues === 0, "User B stats: totalIssues is 0");
    assert(bStats.openBugs === 0, "User B stats: openBugs is 0");
    assert(bStats.criticalBugs === 0, "User B stats: criticalBugs is 0");

    // Check Releases & Test Cases
    const bReleases = store.getReleases();
    assert(bReleases.length === 0, "User B has 0 releases");

    const bTestCases = store.getTestCases();
    assert(bTestCases.length === 0, "User B has 0 test cases");

    const bTestSuites = store.getTestSuites();
    assert(bTestSuites.length === 0, "User B has 0 test suites");

    const bTestRuns = store.getTestRuns();
    assert(bTestRuns.length === 0, "User B has 0 test runs");

    // Step 5: User B creates issue in 'Omeni n2'
    console.log("\n--- Step 5: User B Creates Ticket in 'Omeni n2' ---");
    const issueB1 = await store.createIssue({
      projectId: projB.id,
      title: "Initial setup verification",
      type: "Task",
      priority: "Medium"
    });

    assert(issueB1.key.startsWith("ON-"), `Issue key '${issueB1.key}' correctly uses project key 'ON'`);
    assert(store.getIssues().length === 1, "User B has 1 issue in 'Omeni n2'");
    assert(store.getIssues()[0].key === issueB1.key, "Issue retrieved matches created issue");

    // Add activity for User B
    store.addActivity({
      issueKey: issueB1.key,
      projectId: projB.id,
      user: "Arslan Test",
      action: `Created Task ${issueB1.key}: "Initial setup verification"`
    });

    const bActivitiesAfter = store.getActivities();
    assert(bActivitiesAfter.length === 2, "User B stream has 2 activities for 'Omeni n2'");
    assert(bActivitiesAfter[0].issueKey === issueB1.key, `Activity stream displays '${issueB1.key}'`);

    // Step 6: Switch back to User A & Verify Isolation
    console.log("\n--- Step 6: Switch back to User A & Verify Isolation ---");
    store.authenticateUser("arslandeveloper482@gmail.com", "Password123!");
    assert(store.getActiveUser().email === "arslandeveloper482@gmail.com", "User A active");

    const aIssues = store.getIssues();
    assert(aIssues.length === 2, "User A sees 2 issues in 'test taar'");
    assert(!aIssues.some(i => i.key === issueB1.key), "User A cannot see User B's 'ON' issues");

    const aActivities = store.getActivities();
    assert(aActivities.length === 3, "User A sees only 'test taar' activities");
    assert(!aActivities.some(a => a.issueKey === issueB1.key), "User A stream does not contain 'ON' activities");

    console.log("\n================================================================================");
    console.log(`RESULTS: All ${testsPassed} / ${testsTotal} tests PASSED! Live Stream & Stats Isolation verified.`);
    console.log("================================================================================");
  } catch (e) {
    console.error("Test Suite Failed with error:", e);
    process.exit(1);
  }
}

runTests();
