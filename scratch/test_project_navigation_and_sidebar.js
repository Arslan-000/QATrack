// test_project_navigation_and_sidebar.js
// Verification for sidebar menu cleanup and project navigation to workspace

const assert = (condition, msg) => {
  if (!condition) {
    console.error(`  ✗ FAIL: ${msg}`);
    throw new Error(msg);
  } else {
    console.log(`  ✓ PASS: ${msg}`);
  }
};

// Setup DOM mock
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
      classList: {
        add: () => {},
        remove: () => {},
        contains: () => false
      }
    };
  },
  querySelector() {
    return {
      classList: {
        add: () => {},
        remove: () => {}
      }
    };
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

// Setup test project & space
const ws = { id: "ws_nav_test", name: "Apex Test Space", members: [] };
store.data.workspaces = [ws];
store.setActiveWorkspace(ws.id);

const prj = {
  id: "prj_nav_test",
  name: "Apex Cloud Services",
  workspace_id: ws.id,
  key: "ACS",
  pmId: "usr_pm",
  members: ["usr_pm", "usr_dev"],
  techStack: ["React", "Node.js", "Supabase"],
  priority: "P1",
  status: "Active"
};
store.data.projects = [prj];

// Setup user
const userPM = { id: "usr_pm", name: "Arslan PM", email: "pm@apex.io", role: "PM" };
const userDev = { id: "usr_dev", name: "Arslan Dev", email: "dev@apex.io", role: "DEVELOPER" };
store.data.users = [userPM, userDev];
store.setActiveUser(userPM.id);

require('d:/QA new project/js/views/projects.js');
require('d:/QA new project/js/views/projectWorkspace.js');
require('d:/QA new project/js/app.js');

const app = window.app || new AppController();
global.window.app = app;

console.log("================================================================================");
console.log("PROJECT NAVIGATION & SIDEBAR CLEANUP TEST SUITE");
console.log("================================================================================\n");

// 1. Test Sidebar Nav for PM, Dev, Viewer
console.log("--- Test 1: Verify 'Project Workspace' is removed from sidebar menu ---");
let sidebarContent = "";
const mockContainer = {
  set innerHTML(val) { sidebarContent = val; },
  get innerHTML() { return sidebarContent; }
};
global.document.getElementById = (id) => {
  if (id === "sidebarNavMenuContainer") return mockContainer;
  return { innerHTML: '', classList: { add: () => {}, remove: () => {} } };
};

// Check PM
store.setActiveUser(userPM.id);
app.updateSidebarNav();
assert(!sidebarContent.includes("data-view=\"project-workspace\""), "PM Sidebar does NOT contain 'Project Workspace' button");
assert(sidebarContent.includes("data-view=\"projects\""), "PM Sidebar contains 'Projects Register'");
assert(sidebarContent.includes("data-view=\"dashboard\""), "PM Sidebar contains 'Dashboard'");

// Check Dev
store.setActiveUser(userDev.id);
app.updateSidebarNav();
assert(!sidebarContent.includes("data-view=\"project-workspace\""), "Developer Sidebar does NOT contain 'Project Workspace' button");
assert(sidebarContent.includes("data-view=\"projects\""), "Developer Sidebar contains 'Projects Register'");

// 2. Test Clicking Project from Projects Register navigates to workspace
console.log("\n--- Test 2: Verify Clicking Project Navigates to Project Workspace ---");
store.setActiveUser(userPM.id);

// Simulate clicking project row from projects register
app.openProjectWorkspace(prj.id, "overview");

assert(store.getActiveProject().id === prj.id, "store.getActiveProject() matches clicked project ID");
assert(app.currentView === "project-workspace", "app.currentView navigated to 'project-workspace'");

// 3. Test ProjectWorkspaceView.render runs without ReferenceError and renders project info
console.log("\n--- Test 3: Verify ProjectWorkspaceView.render Executes Successfully ---");
let workspaceHTML = "";
const mockWorkspaceContainer = {
  set innerHTML(val) { workspaceHTML = val; },
  get innerHTML() { return workspaceHTML; }
};

// Test for PM
ProjectWorkspaceView.render(mockWorkspaceContainer);
assert(workspaceHTML.includes("Apex Cloud Services"), "ProjectWorkspaceView rendered project title 'Apex Cloud Services'");
assert(workspaceHTML.includes("ACS"), "ProjectWorkspaceView rendered project key 'ACS'");
assert(workspaceHTML.includes("Arslan PM"), "ProjectWorkspaceView rendered PM name 'Arslan PM'");
assert(workspaceHTML.includes("Create Issue"), "PM view rendered 'Create Issue' button");

// Test for Developer
store.setActiveUser(userDev.id);
ProjectWorkspaceView.render(mockWorkspaceContainer);
assert(workspaceHTML.includes("Apex Cloud Services"), "Developer view rendered project workspace");
assert(!workspaceHTML.includes(">Create Issue<"), "Developer view does NOT render 'Create Issue' button");

console.log("\n================================================================================");
console.log("ALL NAVIGATION & SIDEBAR TESTS PASSED (100%)!");
console.log("================================================================================");
