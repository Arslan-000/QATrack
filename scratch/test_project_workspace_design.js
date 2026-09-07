// test_project_workspace_design.js
// Verification for the Advanced Executive Project Workspace / Detail Page Design

const assert = (condition, msg) => {
  if (!condition) {
    console.error(`  ✗ FAIL: ${msg}`);
    throw new Error(msg);
  } else {
    console.log(`  ✓ PASS: ${msg}`);
  }
};

// Setup DOM Mock
global.window = {
  location: { origin: 'http://localhost:3000', hash: '#project-workspace' },
  supabaseClient: null,
  lucide: { createIcons: () => {} },
  addEventListener: () => {}
};
global.document = {
  getElementById(id) {
    return {
      innerHTML: '',
      getContext: () => ({
        clearRect: () => {},
        beginPath: () => {},
        moveTo: () => {},
        lineTo: () => {},
        stroke: () => {},
        arc: () => {},
        fill: () => {},
        createRadialGradient: () => ({ addColorStop: () => {} }),
        createLinearGradient: () => ({ addColorStop: () => {} }),
        fillText: () => {},
        quadraticCurveTo: () => {},
        closePath: () => {}
      }),
      classList: { add: () => {}, remove: () => {}, contains: () => false },
      parentElement: { clientWidth: 400, clientHeight: 180 }
    };
  },
  querySelector() {
    return { classList: { add: () => {}, remove: () => {} } };
  },
  querySelectorAll() {
    return [];
  },
  addEventListener() {}
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

// 1. Setup Space & Project
const user = {
  id: "usr_arslan",
  name: "Arslan Munir",
  email: "arslandeveloper482@gmail.com",
  role: "PM"
};
const ws = { id: "ws_pos_test", name: "Taar Test", owner_id: user.id, members: [{ id: user.id, user_id: user.id, role: "PM" }] };
store.data.workspaces = [ws];
store.setActiveWorkspace(ws.id);
store.data.users = [user];
store.setActiveUser(user.id);

const prj = {
  id: "prj_pos_test",
  name: "Retail POS Integration",
  workspace_id: ws.id,
  key: "RPI",
  pmId: user.id,
  members: [user.id],
  priority: "P1",
  status: "Active",
  health: 100,
  description: "Core retail POS integration and QA verification suite.",
  customer: "Annoushka",
  flow: "Magento → Omni Connect → Retail Pro Prism",
  environment: "Production",
  type: "QA Testing",
  dueDate: "2026-12-01"
};
store.data.projects = [prj];
store.data.projectMembers = [{ projectId: prj.id, userId: user.id, role: "PM" }];
store.setActiveProject(prj.id);

// 2. Setup Issues
store.data.issues = [
  {
    id: "iss_bug_101",
    key: "BUG-101",
    projectId: prj.id,
    type: "Bug",
    title: "payment gateway",
    priority: "Critical",
    status: "Closed",
    qaStatus: "Passed",
    assigneeId: user.id,
    createdAt: new Date().toISOString()
  }
];

// 3. Setup Test Cases
store.data.testCases = [
  { id: "tc_1", projectId: prj.id, title: "Order Posting flow", status: "Passed" },
  { id: "tc_2", projectId: prj.id, title: "Inventory sync flow", status: "Passed" }
];

require('d:/QA new project/js/views/projectWorkspace.js');
const ProjectWorkspaceView = global.ProjectWorkspaceView || window.ProjectWorkspaceView;

console.log("================================================================================");
console.log("PROJECT DETAIL / WORKSPACE ADVANCED DESIGN TEST SUITE");
console.log("================================================================================\n");

let htmlOutput = "";
const mockContainer = {
  set innerHTML(val) { htmlOutput = val; },
  get innerHTML() { return htmlOutput; }
};

ProjectWorkspaceView.activeTab = "overview";
ProjectWorkspaceView.render(mockContainer);

// 1. Split Hero Header
console.log("--- Test 1: Split Executive Hero Header ---");
assert(htmlOutput.includes("Retail POS Integration"), "Renders Project Name 'Retail POS Integration'");
assert(htmlOutput.includes("RPI"), "Renders Project Key 'RPI'");
assert(htmlOutput.includes("Core retail POS integration and QA verification suite."), "Renders Project Description");
assert(htmlOutput.includes("Annoushka"), "Renders Application name 'Annoushka'");
assert(htmlOutput.includes("Arslan Munir"), "Renders Lead PM 'Arslan Munir'");
assert(htmlOutput.includes("Project Progress"), "Includes 'Project Progress' Ring Gauge");
assert(htmlOutput.includes("Delivery Velocity"), "Includes 'Delivery Velocity' Meter");

// 2. The 5 QA KPI Metric Cards
console.log("\n--- Test 2: Top 5 QA KPI Metric Cards ---");
assert(htmlOutput.includes("Total Test Cases"), "Renders KPI Card 1: Total Test Cases");
assert(htmlOutput.includes("Passed"), "Renders KPI Card 2: Passed");
assert(htmlOutput.includes("Failed"), "Renders KPI Card 3: Failed");
assert(htmlOutput.includes("Blocked"), "Renders KPI Card 4: Blocked");
assert(htmlOutput.includes("Defects"), "Renders KPI Card 5: Defects");

// 3. Tab Navigation Bar
console.log("\n--- Test 3: Segmented Tab Bar ---");
assert(htmlOutput.includes("Overview"), "Tabs contain 'Overview'");
assert(htmlOutput.includes("Kanban Board"), "Tabs contain 'Kanban Board'");
assert(htmlOutput.includes("Issues & Defects"), "Tabs contain 'Issues & Defects'");
assert(htmlOutput.includes("QA & Quality Telemetry"), "Tabs contain 'QA & Quality Telemetry'");
assert(htmlOutput.includes("Team & Workload"), "Tabs contain 'Team & Workload'");

// 4. 3-Column Structured Layout (Overview Tab)
console.log("\n--- Test 4: 3-Column Structured Layout ---");
assert(htmlOutput.includes("Project Overview"), "Column 1 renders 'Project Overview' Card");
assert(htmlOutput.includes("Module Coverage"), "Column 1 renders 'Module Coverage' Card");
assert(htmlOutput.includes("Order Posting"), "Module 1 'Order Posting' rendered");
assert(htmlOutput.includes("Invoice Processing"), "Module 2 'Invoice Processing' rendered");
assert(htmlOutput.includes("Refund Processing"), "Module 3 'Refund Processing' rendered");
assert(htmlOutput.includes("Inventory Sync"), "Module 4 'Inventory Sync' rendered");

assert(htmlOutput.includes("Test Execution Status"), "Column 2 renders 'Test Execution Status' Card");
assert(htmlOutput.includes("Pass Rate"), "Renders Donut Pass Rate");
assert(htmlOutput.includes("Test Execution Trend"), "Column 2 renders 'Test Execution Trend' Card");
assert(htmlOutput.includes("projectExecutionTrendCanvas"), "Includes Execution Trend Bar Chart Canvas");

assert(htmlOutput.includes("Quick Actions"), "Column 3 renders 'Quick Actions' Card");
assert(htmlOutput.includes("Create Test Case"), "Quick Action 1 '+ Create Test Case' rendered");
assert(htmlOutput.includes("Run Test"), "Quick Action 2 'Run Test' rendered");
assert(htmlOutput.includes("Log Defect"), "Quick Action 3 'Log Defect' rendered");
assert(htmlOutput.includes("View Reports"), "Quick Action 4 'View Reports' rendered");
assert(htmlOutput.includes("Project Team"), "Column 3 renders 'Project Team' Card");

console.log("\n================================================================================");
console.log("ALL PROJECT DETAIL / WORKSPACE DESIGN TESTS PASSED (100%)!");
console.log("================================================================================");
