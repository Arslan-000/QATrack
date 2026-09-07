// test_dashboard_real_data.js
// Verification for live real data rendering across Dashboard

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
  location: { origin: 'http://localhost:3000', hash: '#dashboard' },
  supabaseClient: null,
  lucide: { createIcons: () => {} },
  addEventListener: () => {}
};
global.document = {
  getElementById(id) {
    return {
      innerHTML: '',
      getContext: () => ({
        createLinearGradient: () => ({ addColorStop: () => {} })
      }),
      classList: { add: () => {}, remove: () => {}, contains: () => false }
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
const ws = { id: "ws_dash_test", name: "PulseWave Core Space", members: [] };
store.data.workspaces = [ws];
store.setActiveWorkspace(ws.id);

const prj = {
  id: "prj_dash_test",
  name: "Omni Logistics",
  workspace_id: ws.id,
  key: "OLG",
  pmId: "usr_arslan",
  members: ["usr_arslan"],
  priority: "P1",
  status: "Active",
  health: 96
};
store.data.projects = [prj];
store.setActiveProject(prj.id);

// 2. Setup Active User
const user = {
  id: "usr_arslan",
  name: "Arslan Munir",
  email: "arslandeveloper482@gmail.com",
  role: "PM"
};
store.data.users = [user];
store.setActiveUser(user.id);

// 3. Create Real Issues assigned to Arslan
store.data.issues = [
  {
    id: "iss_1",
    key: "OLG-101",
    projectId: prj.id,
    type: "Bug",
    title: "Checkout API token expiration on high load",
    priority: "Critical",
    status: "Open",
    assigneeId: user.id,
    qaStatus: "Not Tested",
    createdAt: new Date().toISOString()
  },
  {
    id: "iss_2",
    key: "OLG-102",
    projectId: prj.id,
    type: "Task",
    title: "Implement OAuth2 refresh token lifecycle",
    priority: "High",
    status: "In Progress",
    assigneeId: user.email,
    qaStatus: "Not Tested",
    createdAt: new Date().toISOString()
  },
  {
    id: "iss_3",
    key: "OLG-103",
    projectId: prj.id,
    type: "Bug",
    title: "Payment gateway webhook timeout",
    priority: "Medium",
    status: "Ready for QA",
    assigneeId: "u-dev-other",
    qaStatus: "Ready for QA",
    createdAt: new Date().toISOString()
  }
];

require('d:/QA new project/js/views/dashboard.js');
require('d:/QA new project/js/app.js');

console.log("================================================================================");
console.log("DASHBOARD REAL LIVE DATA VERIFICATION SUITE");
console.log("================================================================================\n");

// Test 1: Live Activities & Relative Timestamps
console.log("--- Test 1: Live Project & Quality Stream Activities ---");
const activities = store.getActivities(10);
assert(activities.length > 0, `Store generated ${activities.length} dynamic/live activities`);
assert(activities.some(a => a.issueKey === "OLG-101" || a.issueKey === "OLG"), "Activity stream contains real project/issue key");
assert(typeof activities[0].time === "string" && activities[0].time.length > 0, `Relative timestamp formatted properly: [${activities[0].time}]`);

// Test 2: Render Dashboard with Real Data
console.log("\n--- Test 2: Dashboard Render & Assigned Focus ---");
let dashboardHTML = "";
const mockContainer = {
  set innerHTML(val) { dashboardHTML = val; },
  get innerHTML() { return dashboardHTML; }
};

DashboardView.render(mockContainer);

// Validate user banner
assert(dashboardHTML.includes("Arslan Munir"), "User banner displays 'Arslan Munir'");
assert(dashboardHTML.includes("arslandeveloper482@gmail.com"), "User banner displays user email");
assert(dashboardHTML.includes("PulseWave Core Space"), "User banner displays active workspace name");

// Validate Assigned to You section
assert(dashboardHTML.includes("Assigned to You"), "Assigned to You card is rendered");
assert(dashboardHTML.includes("2 In Flight"), "Assigned to You shows '2 In Flight' for Arslan (OLG-101 & OLG-102)");
assert(dashboardHTML.includes("OLG-101"), "Assigned to You lists issue OLG-101");
assert(dashboardHTML.includes("OLG-102"), "Assigned to You lists issue OLG-102");
assert(dashboardHTML.includes("Checkout API token expiration"), "Assigned to You displays issue title");

// Validate Live Stream
assert(dashboardHTML.includes("Live Project & Quality Stream"), "Live Stream card is rendered");
assert(dashboardHTML.includes("Live Telemetry"), "Live Stream shows active telemetry badge");

// Validate Bento cards
assert(dashboardHTML.includes("Active project workspaces"), "Bento Card 1 (Workspaces) rendered");
assert(dashboardHTML.includes("DELIVERY PIPELINE"), "Bento Card 2 (Delivery Pipeline) rendered");
assert(dashboardHTML.includes("QA DEFECTS"), "Bento Card 3 (Defects) rendered");
assert(dashboardHTML.includes("QUALITY GATE"), "Bento Card 4 (Quality Gate) rendered");

// Test 3: Empty Focus state
console.log("\n--- Test 3: Graceful 'All Caught Up' State when no issues assigned ---");
// Reassign issues to another user
store.data.issues.forEach(i => { i.assigneeId = "u-other"; i.developerId = "u-other"; });
DashboardView.render(mockContainer);
assert(dashboardHTML.includes("All Caught Up!"), "Displays 'All Caught Up!' when 0 tasks assigned");
assert(dashboardHTML.includes("0 In Flight"), "Displays '0 In Flight'");

console.log("\n================================================================================");
console.log("ALL DASHBOARD REAL DATA TESTS PASSED (100%)!");
console.log("================================================================================");
