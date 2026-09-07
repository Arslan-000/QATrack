// test_projects_register_design.js
// Verification for the 3D Modern Project Register Page Redesign

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
  location: { origin: 'http://localhost:3000', hash: '#projects' },
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

// Setup mock space & projects
const user = {
  id: "usr_arslan",
  name: "Arslan Munir",
  email: "arslandeveloper482@gmail.com",
  role: "PM"
};
const ws = { id: "ws_reg_test", name: "Enterprise Space", owner_id: user.id, created_by: user.id, members: [{ userId: user.id, role: "PM" }] };
store.data.workspaces = [ws];
store.setActiveWorkspace(ws.id);
store.data.users = [user];
store.setActiveUser(user.id);

const prj1 = {
  id: "prj_oms",
  name: "Oms",
  workspace_id: ws.id,
  key: "OS",
  pmId: user.id,
  members: [user.id],
  priority: "P1",
  status: "Active",
  customer: "Mackel",
  description: "test test",
  dueDate: "2026-08-15"
};

const prj2 = {
  id: "prj_pos",
  name: "Retail POS Integration",
  workspace_id: ws.id,
  key: "RPI",
  pmId: user.id,
  members: [user.id],
  priority: "P1",
  status: "Active",
  customer: "Retail Tech Group",
  description: "Core retail POS integration and QA verification suite.",
  dueDate: "2026-12-01"
};

store.data.projects = [prj1, prj2];
store.setActiveProject(prj2.id);

store.data.issues = [
  {
    id: "iss_bug_101",
    key: "BUG-101",
    projectId: prj2.id,
    type: "Bug",
    title: "payment gateway",
    priority: "Critical",
    status: "Closed",
    qaStatus: "Passed",
    assigneeId: user.id
  }
];

require('d:/QA new project/js/views/projects.js');
const ProjectsView = global.ProjectsView || window.ProjectsView;

console.log("================================================================================");
console.log("PROJECT REGISTER 3D MODERN REDESIGN TEST SUITE");
console.log("================================================================================\n");

let htmlOutput = "";
const mockContainer = {
  set innerHTML(val) { htmlOutput = val; },
  get innerHTML() { return htmlOutput; }
};

// 1. Table View Mode
console.log("--- Test 1: Unified 3D Hero Header & Table Mode ---");
ProjectsView.selectedProjectFilter = "all";
ProjectsView.searchQuery = "";
ProjectsView.statusFilter = "all";
ProjectsView.priorityFilter = "all";
ProjectsView.viewMode = "table";
ProjectsView.render(mockContainer);

assert(htmlOutput.includes("Project Register"), "Renders Header Title 'Project Register'");
assert(htmlOutput.includes("Central register of enterprise workspaces"), "Renders Header Subtitle");
assert(htmlOutput.includes("projectRegisterLatticeCanvas"), "Includes 3D Wireframe Node Lattice Mesh Canvas (#projectRegisterLatticeCanvas)");
assert(htmlOutput.includes("Create Project"), "Renders '+ Create Project' Primary Action Button");
assert(htmlOutput.includes("SELECT PROJECT:"), "Renders 'SELECT PROJECT:' Dropdown Label");
assert(htmlOutput.includes("Search projects by key, name, customer, lead..."), "Renders Search Input");

console.log("\n--- Test 2: The 4 Bento Metric Cards ---");
assert(htmlOutput.includes("TOTAL PROJECTS"), "Renders Bento 1: TOTAL PROJECTS");
assert(htmlOutput.includes("ACTIVE"), "Renders Bento 2: ACTIVE");
assert(htmlOutput.includes("AVG. PROGRESS"), "Renders Bento 3: AVG. PROGRESS");
assert(htmlOutput.includes("TEAM ALLOCATION"), "Renders Bento 4: TEAM ALLOCATION");
assert(htmlOutput.includes("2"), "Displays 2 registered projects in Space");

console.log("\n--- Test 3: Table Columns & Rows (Matching Reference Screenshot) ---");
assert(htmlOutput.includes("KEY"), "Table header contains KEY");
assert(htmlOutput.includes("PROJECT"), "Table header contains PROJECT");
assert(htmlOutput.includes("CUSTOMER"), "Table header contains CUSTOMER");
assert(htmlOutput.includes("PM"), "Table header contains PM");
assert(htmlOutput.includes("PRIORITY"), "Table header contains PRIORITY");
assert(htmlOutput.includes("STATUS"), "Table header contains STATUS");
assert(htmlOutput.includes("PROGRESS"), "Table header contains PROGRESS");
assert(htmlOutput.includes("DUE"), "Table header contains DUE");
assert(htmlOutput.includes("ACTION"), "Table header contains ACTION");

assert(htmlOutput.includes("OS"), "Renders Project Key OS");
assert(htmlOutput.includes("Oms"), "Renders Project Name Oms");
assert(htmlOutput.includes("Mackel"), "Renders Customer Mackel");
assert(htmlOutput.includes("RPI"), "Renders Project Key RPI");
assert(htmlOutput.includes("Retail POS Integration"), "Renders Project Name Retail POS Integration");
assert(htmlOutput.includes("CURRENT"), "Renders CURRENT badge on active project");
assert(htmlOutput.includes("Retail Tech Group"), "Renders Customer Retail Tech Group");
assert(htmlOutput.includes("Arslan"), "Renders PM Arslan");
assert(htmlOutput.includes("Open"), "Renders Open Action Button");

console.log("\n--- Test 4: 3D Bento Grid View Mode ---");
ProjectsView.viewMode = "grid";
ProjectsView.render(mockContainer);

assert(htmlOutput.includes("DELIVERY VELOCITY"), "Grid card renders 'DELIVERY VELOCITY' Meter");
assert(htmlOutput.includes("Retail POS Integration"), "Grid renders Project 1 Card");
assert(htmlOutput.includes("Oms"), "Grid renders Project 2 Card");

console.log("\n================================================================================");
console.log("ALL PROJECT REGISTER REDESIGN TESTS PASSED (100%)!");
console.log("================================================================================");
