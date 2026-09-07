// test_assigned_to_me_view.js
// Verification for the Assigned to Me / Personal Execution & Quality Queue View

const assert = (condition, msg) => {
  if (!condition) {
    console.error(`  ✗ FAIL: ${msg}`);
    throw new Error(msg);
  } else {
    console.log(`  ✓ PASS: ${msg}`);
  }
};

// Setup DOM Mock Environment
global.window = {
  location: { origin: 'http://localhost:3000', hash: '#my-issues' },
  supabaseClient: null,
  lucide: { createIcons: () => {} },
  addEventListener: () => {},
  app: {
    toast: (title, message, type) => {
      console.log(`    [Toast Notification] [${type || 'info'}] ${title}: ${message}`);
    },
    openIssueDetails: (id) => {
      console.log(`    [Modal] Opened issue details for: ${id}`);
    },
    openCreateIssueModal: () => {
      console.log(`    [Modal] Opened create issue modal`);
    },
    navigate: (route) => {
      console.log(`    [Router] Navigated to: ${route}`);
    }
  }
};

let capturedHTML = "";
global.document = {
  getElementById(id) {
    if (id === "mainContent") {
      return {
        set innerHTML(val) { capturedHTML = val; },
        get innerHTML() { return capturedHTML; }
      };
    }
    return {
      innerHTML: '',
      parentElement: { clientWidth: 1000, clientHeight: 260 },
      getContext: () => ({
        clearRect: () => {},
        beginPath: () => {},
        moveTo: () => {},
        lineTo: () => {},
        stroke: () => {},
        arc: () => {},
        fill: () => {},
        save: () => {},
        restore: () => {},
        translate: () => {},
        rotate: () => {},
        closePath: () => {},
        createRadialGradient: () => ({ addColorStop: () => {} }),
        createLinearGradient: () => ({ addColorStop: () => {} })
      }),
      classList: { add: () => {}, remove: () => {}, contains: () => false }
    };
  },
  createElement(tag) {
    return {
      setAttribute: () => {},
      click: () => {},
      tagName: tag
    };
  },
  body: {
    appendChild: () => {},
    removeChild: () => {}
  }
};

global.localStorage = {
  store: {},
  getItem(key) { return this.store[key] || null; },
  setItem(key, val) { this.store[key] = String(val); },
  removeItem(key) { delete this.store[key]; },
  clear() { this.store = {}; }
};

require('d:/QA new project/js/data.js');
require('d:/QA new project/js/store.js');
const store = global.store || window.store;
store.loadState();

// Initialize clean testing data
const testUser = {
  id: "usr_arslan_ali",
  supabase_id: "sb_user_12345",
  name: "Arslan Ali",
  email: "arslan@pulsewave.io",
  role: "Lead QA Engineer",
  department: "Quality Assurance",
  initials: "AA",
  color: "bg-slate-900"
};

const otherUser = {
  id: "usr_john_dev",
  name: "John Developer",
  email: "john@pulsewave.io",
  role: "Frontend Engineer",
  department: "Engineering"
};

store.data.users = [testUser, otherUser];
store.data.activeUserId = testUser.id;

const testProj = {
  id: "prj_assigned_test",
  name: "FinTech Cloud Platform",
  key: "FTC",
  description: "Core banking and checkout platform"
};
store.data.projects = [testProj];

const testSprint = {
  id: "sp_current",
  projectId: testProj.id,
  name: "Sprint 24 - Checkout Hardening",
  status: "Active"
};
store.data.sprints = [testSprint];

// Populate diverse issues for testUser
store.data.issues = [
  {
    id: "iss-101",
    key: "FTC-101",
    projectId: testProj.id,
    sprintId: testSprint.id,
    type: "Bug",
    title: "Double-charge on card authentication timeout",
    description: "Occurs under 3G network latency",
    priority: "Critical",
    status: "In Progress",
    assigneeId: testUser.id,
    developerId: testUser.id,
    qaId: "usr_arslan_ali",
    storyPoints: 8,
    qaStatus: "Not Tested",
    labels: ["payment", "security", "checkout"],
    dueDate: "2026-09-10"
  },
  {
    id: "iss-102",
    key: "FTC-102",
    projectId: testProj.id,
    sprintId: testSprint.id,
    type: "Story",
    title: "Apple Pay 1-click token integration",
    description: "Passes cryptogram to Stripe endpoint",
    priority: "High",
    status: "Ready for QA",
    assigneeId: testUser.id,
    developerId: "usr_john_dev",
    qaId: testUser.id,
    storyPoints: 5,
    qaStatus: "Ready for QA",
    labels: ["applepay", "checkout"],
    dueDate: "2026-09-12"
  },
  {
    id: "iss-103",
    key: "FTC-103",
    projectId: testProj.id,
    sprintId: testSprint.id,
    type: "Bug",
    title: "Session timeout race condition on mobile Safari",
    description: "Reopened due to cookie mismatch",
    priority: "High",
    status: "Reopened",
    assigneeId: testUser.id,
    developerId: testUser.id,
    qaId: testUser.id,
    storyPoints: 5,
    qaStatus: "Failed",
    reopenCount: 2,
    labels: ["safari", "auth"],
    dueDate: "2026-09-08"
  },
  {
    id: "iss-104",
    key: "FTC-104",
    projectId: testProj.id,
    sprintId: testSprint.id,
    type: "Task",
    title: "Setup Cypress E2E regression suite for payments",
    description: "Automate test cases TC-101 through TC-140",
    priority: "Medium",
    status: "Done",
    assigneeId: testUser.id,
    developerId: testUser.id,
    qaId: testUser.id,
    storyPoints: 3,
    qaStatus: "Passed",
    labels: ["automation", "cypress"],
    dueDate: "2026-09-02"
  },
  {
    id: "iss-105",
    key: "FTC-105",
    projectId: testProj.id,
    sprintId: testSprint.id,
    type: "Bug",
    title: "Unrelated bug assigned only to John",
    description: "Should not show in directly assigned for Arslan",
    priority: "Low",
    status: "Open",
    assigneeId: otherUser.id,
    developerId: otherUser.id,
    reporterId: otherUser.id,
    storyPoints: 1,
    qaStatus: "Not Tested",
    labels: ["minor"]
  }
];

store.saveState();

// Require MyIssuesView
const MyIssuesView = require('d:/QA new project/js/views/myIssues.js');

console.log("\n=======================================================");
console.log("  TEST SUITE: Assigned to Me View Functional Verification");
console.log("=======================================================\n");

// 1. Initial Render & Identity Matching
console.log("--- Test 1: Render and Identity Validation ---");
const mainEl = document.getElementById("mainContent");
MyIssuesView.resetFilters();
MyIssuesView.render(mainEl);

assert(capturedHTML.includes("Assigned to Me"), "Page title rendered");
assert(capturedHTML.includes("Personal Execution Queue"), "Subtitle rendered");
assert(capturedHTML.includes("Arslan Ali"), "Active user name rendered");
assert(capturedHTML.includes("Lead QA Engineer"), "User role rendered");
assert(capturedHTML.includes("assignedMeshCanvas"), "3D Holographic Mesh Canvas element present");

// 2. Bento Metric Cards Checks
console.log("\n--- Test 2: Executive Bento Metric Cards ---");
assert(capturedHTML.includes("Active In-Flight"), "Bento Card 1: Active In-Flight rendered");
assert(capturedHTML.includes("In Development"), "Bento Card 2: In Development rendered");
assert(capturedHTML.includes("QA Clearance Gate"), "Bento Card 3: QA Clearance Gate rendered");
assert(capturedHTML.includes("Gate Verified ✓"), "Bento Card 4: Gate Verified rendered");

// In-Flight items for Arslan: FTC-101 (In Progress), FTC-102 (Ready for QA), FTC-103 (Reopened). Total: 3
assert(capturedHTML.includes("3</span>") && capturedHTML.includes("/ 4 total"), "Calculates 3 in-flight out of 4 total assigned items");

// 3. One-Click Status Transitions
console.log("\n--- Test 3: Status Transition System ---");
assert(capturedHTML.includes("FTC-101"), "Lists FTC-101 in card grid");
assert(capturedHTML.includes("Double-charge on card authentication timeout"), "Displays title for FTC-101");

// Move FTC-101 to Ready for QA via MyIssuesView.updateStatus
(async () => {
  await MyIssuesView.updateStatus("iss-101", "Ready for QA");
  const updatedIssue = store.getIssueById("iss-101");
  assert(updatedIssue.status === "Ready for QA", "store.updateIssueStatus updated FTC-101 to 'Ready for QA'");
  assert(updatedIssue.qaStatus === "Ready for QA", "Quality Gate status set to Ready for QA");

  // Verify re-render
  assert(capturedHTML.includes("FTC-101"), "Re-rendered with updated issue");

  // Move FTC-101 to Done
  await MyIssuesView.updateStatus("iss-101", "Done");
  const doneIssue = store.getIssueById("iss-101");
  assert(doneIssue.status === "Done", "FTC-101 moved to Done");
  assert(doneIssue.qaStatus === "Passed", "Quality Gate set to Passed");
  
  // 4. Tab Switching
  console.log("\n--- Test 4: Tab Switching ---");
  MyIssuesView.setTab("completed");
  assert(capturedHTML.includes("FTC-101"), "Completed tab includes completed FTC-101");
  assert(capturedHTML.includes("FTC-104"), "Completed tab includes FTC-104");

  MyIssuesView.setTab("retesting");
  assert(capturedHTML.includes("FTC-103"), "Retesting tab shows reopened FTC-103");
  assert(!capturedHTML.includes("FTC-104"), "Retesting tab excludes completed FTC-104");

  // 5. Live Search & Filters
  console.log("\n--- Test 5: Live Search & Filter Controls ---");
  MyIssuesView.setTab("all");
  MyIssuesView.setSearch("Apple Pay");
  assert(capturedHTML.includes("FTC-102"), "Search for 'Apple Pay' matches FTC-102");
  assert(!capturedHTML.includes("FTC-103"), "Search excludes non-matching FTC-103");

  MyIssuesView.setSearch("");
  MyIssuesView.setTypeFilter("Bug");
  assert(capturedHTML.includes("FTC-101"), "Type filter Bug includes FTC-101");
  assert(!capturedHTML.includes("FTC-102"), "Type filter Bug excludes Story FTC-102");

  // 6. Enterprise Table View Mode
  console.log("\n--- Test 6: Enterprise Table View Switcher ---");
  MyIssuesView.setTypeFilter("all");
  MyIssuesView.setViewMode("table");
  assert(capturedHTML.includes("<table"), "Table view renders <table> tag");
  assert(capturedHTML.includes("Key") && capturedHTML.includes("Quality Gate") && capturedHTML.includes("Status & Transition"), "Table columns header rendered");
  assert(capturedHTML.includes("FTC-102"), "Table includes FTC-102 row");

  // 7. CSV Exporter
  console.log("\n--- Test 7: CSV Exporter ---");
  let exportSuccess = false;
  try {
    MyIssuesView.exportCSV();
    exportSuccess = true;
  } catch (e) {
    console.error(e);
  }
  assert(exportSuccess, "exportCSV executes without errors");

  console.log("\n=======================================================");
  console.log("  ALL TESTS PASSED (100%) - ASSIGNED TO ME WORKSPACE VERIFIED");
  console.log("=======================================================\n");
})();
