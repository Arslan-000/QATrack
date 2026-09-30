/**
 * Verification Test Suite for PulseWave Routing, Auth Flow & RBAC State Isolation
 */

const assert = require('assert');

// Mock localStorage
const localStorageMock = (function() {
  let store = {};
  return {
    getItem: function(key) { return store[key] || null; },
    setItem: function(key, value) { store[key] = value.toString(); },
    removeItem: function(key) { delete store[key]; },
    clear: function() { store = {}; }
  };
})();
global.localStorage = localStorageMock;

// Mock DOM elements
function createElement(id, tagName = 'div') {
  return {
    id,
    tagName: tagName.toUpperCase(),
    className: '',
    innerHTML: '',
    scrollTop: 0,
    classList: {
      _classes: new Set(),
      add: function(...cls) { cls.forEach(c => this._classes.add(c)); },
      remove: function(...cls) { cls.forEach(c => this._classes.delete(c)); },
      contains: function(c) { return this._classes.has(c); }
    }
  };
}

const elements = {
  appSidebar: createElement('appSidebar', 'aside'),
  header: createElement('header', 'header'),
  mainContent: createElement('mainContent', 'main'),
  sidebarSpacesExplorerContainer: createElement('sidebarSpacesExplorerContainer', 'div'),
  sidebarNavMenuContainer: createElement('sidebarNavMenuContainer', 'div'),
  sidebarUserFooterContainer: createElement('sidebarUserFooterContainer', 'div'),
  headerProjectSelectorContainer: createElement('headerProjectSelectorContainer', 'div'),
  headerPersonaWidget: createElement('headerPersonaWidget', 'div')
};

global.document = {
  getElementById: function(id) { return elements[id] || null; },
  querySelector: function(sel) {
    if (sel === 'header') return elements.header;
    if (sel === 'aside' || sel === '#appSidebar') return elements.appSidebar;
    if (sel === '#mainContent') return elements.mainContent;
    return null;
  },
  querySelectorAll: function() { return []; },
  createElement: function(tag) { return createElement('dyn_' + Date.now(), tag); },
  addEventListener: function() {}
};

global.window = {
  location: { hash: '' },
  addEventListener: function() {},
  lucide: { createIcons: function() {} }
};

// Seed legacy mock data in localStorage to test purging
localStorage.setItem('pulsewave_qa_v2_store', JSON.stringify({
  activeUserId: null,
  activeWorkspaceId: "ws_default",
  activeProjectId: "prj_pos",
  workspaces: [{ id: "ws_default", name: "Workspace" }],
  projects: [{ id: "prj_pos", name: "Retail POS Integration", key: "POS", customer: "Retail Tech Group" }],
  users: []
}));

// Load Initial Data
require('../js/data.js');
require('../js/services/releaseQualityService.js');

// Load Store
const store = require('../js/store.js');
const AppController = require('../js/app.js');

// Load Views
global.LandingPageView = {
  render: function(container) {
    container.innerHTML = '<div id="landingPageHero">Ship faster. Test smarter.</div>';
  }
};
global.DashboardView = {
  render: function(container) {
    container.innerHTML = '<div id="dashboardView">Executive Quality Dashboard</div>';
  }
};
global.ProjectWorkspaceView = {
  activeTab: 'overview',
  render: function(container) {
    container.innerHTML = '<div id="projectWorkspaceView">Project Workspace: ' + (store.getActiveProject()?.name || 'None') + '</div>';
  }
};
global.AuthView = {
  renderLogin: function(container) {
    container.innerHTML = '<div id="loginForm">Sign In to PulseWave</div>';
  },
  renderSignup: function(container) {
    container.innerHTML = '<div id="signupForm">Create Your PulseWave Account</div>';
  }
};
global.OnboardingView = {
  render: function(container) {
    container.innerHTML = '<div id="onboardingWizard">PulseWave Setup Wizard</div>';
  }
};

async function runTests() {
  console.log("=================================================");
  console.log("RUNNING ROUTING & RBAC STATE ISOLATION TEST SUITE");
  console.log("=================================================");

  // TEST 1: Verify store legacy data purging
  console.log("\n[TEST 1] Verifying Legacy Mock Data Purging in loadState...");
  const rawProjects = store.data.projects;
  const rawWorkspaces = store.data.workspaces;
  assert.strictEqual(rawProjects.some(p => p.name === "Retail POS Integration"), false, "Must purge Retail POS Integration");
  assert.strictEqual(rawWorkspaces.some(w => w.name === "Workspace"), false, "Must purge dummy Workspace");
  assert.strictEqual(store.data.activeWorkspaceId, null, "Active workspace ID must be null");
  assert.strictEqual(store.data.activeProjectId, null, "Active project ID must be null");
  console.log("✓ PASS: Legacy mock data cleanly purged from store.");

  // TEST 2: Unauthenticated Visitor on Landing Page / Root
  console.log("\n[TEST 2] Verifying Unauthenticated Landing Page Navigation...");
  const app = new AppController();
  window.app = app;
  
  app.navigate("home");
  assert.ok(elements.appSidebar.classList.contains("hidden"), "Sidebar must be hidden on landing page");
  assert.ok(elements.header.classList.contains("hidden"), "Header must be hidden on landing page");
  assert.ok(elements.mainContent.innerHTML.includes("Ship faster"), "Main content must render Landing Page");
  console.log("✓ PASS: Landing page renders cleanly full-screen with sidebar & header hidden.");

  // TEST 3: Unauthenticated Visitor on Login Page
  console.log("\n[TEST 3] Verifying Unauthenticated Login Page Navigation...");
  app.navigate("login");
  assert.ok(elements.appSidebar.classList.contains("hidden"), "Sidebar must be hidden on login page");
  assert.ok(elements.header.classList.contains("hidden"), "Header must be hidden on login page");
  assert.ok(elements.mainContent.innerHTML.includes("Sign In to PulseWave"), "Main content must render Login form");
  console.log("✓ PASS: Login page renders cleanly full-screen with sidebar & header hidden.");

  // TEST 4: Unauthenticated Visitor trying to access internal dashboard
  console.log("\n[TEST 4] Verifying Unauthenticated Protected Route Guard...");
  app.navigate("dashboard");
  // Should redirect to home/landing
  assert.ok(elements.appSidebar.classList.contains("hidden"), "Sidebar must be hidden when guest tries protected route");
  assert.ok(elements.header.classList.contains("hidden"), "Header must be hidden when guest tries protected route");
  assert.ok(elements.mainContent.innerHTML.includes("Ship faster"), "Redirects cleanly to Landing Page");
  console.log("✓ PASS: Protected route redirect protects internal views from unauthenticated access.");

  // TEST 5: Owner / PM logs in (arslandeveloper482@gmail.com)
  console.log("\n[TEST 5] Verifying Owner / PM Login Flow...");
  const ownerUser = store.registerUser({
    id: "usr_owner_1",
    email: "arslandeveloper482@gmail.com",
    name: "Arslan Dev",
    role: "Project Manager"
  });
  store.setActiveUser(ownerUser.id);

  const ownerSpace = store.addWorkspace({
    id: "ws_live_1",
    name: "Alpha Corp Space",
    owner_id: ownerUser.id,
    created_by: ownerUser.email
  });

  const ownerProj = store.addRealProject({
    id: "prj_live_1",
    workspace_id: ownerSpace.id,
    name: "Payment Gateway Core",
    key: "PGC",
    pmId: ownerUser.name
  });

  app.navigate("dashboard");
  assert.strictEqual(elements.appSidebar.classList.contains("hidden"), false, "Sidebar must be visible for authenticated PM");
  assert.strictEqual(elements.header.classList.contains("hidden"), false, "Header must be visible for authenticated PM");
  assert.ok(elements.mainContent.innerHTML.includes("Executive Quality Dashboard"), "Main content renders Dashboard");
  assert.strictEqual(store.canCreateProject(ownerSpace.id, ownerUser.id), true, "Owner can create projects");
  assert.strictEqual(store.canDeleteWorkspace(ownerSpace.id, ownerUser.id), true, "Owner can delete space");
  console.log("✓ PASS: Owner/PM has full dashboard access and administrative privileges.");

  // TEST 6: Invited QA Engineer logs in (arslansqa482@gmail.com)
  console.log("\n[TEST 6] Verifying Invited QA Engineer Direct Route & Strict RBAC...");
  const qaUser = store.registerUser({
    id: "usr_qa_1",
    email: "arslansqa482@gmail.com",
    name: "Arslan QA",
    role: "QA Engineer"
  });
  
  // Add QA user as member to space and project
  store.addWorkspaceMember(ownerSpace.id, {
    user_id: qaUser.id,
    name: qaUser.name,
    email: qaUser.email,
    role: "QA"
  });
  store.addProjectMember(ownerProj.id, {
    userId: qaUser.id,
    name: qaUser.name,
    email: qaUser.email,
    role: "QA"
  });

  store.setActiveUser(qaUser.id);
  store.setActiveWorkspace(ownerSpace.id);
  store.setActiveProject(ownerProj.id);

  // If invited QA tries to visit onboarding, they MUST be redirected directly to project-workspace
  app.navigate("onboarding");
  assert.strictEqual(app.currentView, "project-workspace", "Invited QA user is auto-redirected directly to project-workspace");

  app.navigate("project-workspace");
  assert.strictEqual(elements.appSidebar.classList.contains("hidden"), false, "Sidebar is visible for QA in workspace");
  assert.ok(elements.mainContent.innerHTML.includes("Payment Gateway Core"), "QA lands directly in their project workspace");

  // Verify RBAC lockdown for QA Engineer
  assert.strictEqual(store.canCreateWorkspace(qaUser.id), false, "Invited QA cannot create workspaces");
  assert.strictEqual(store.canCreateProject(ownerSpace.id, qaUser.id), false, "Invited QA cannot create projects");
  assert.strictEqual(store.canDeleteWorkspace(ownerSpace.id, qaUser.id), false, "Invited QA cannot delete workspaces");
  assert.strictEqual(store.canDeleteProject(ownerProj.id, qaUser.id), false, "Invited QA cannot delete projects");
  assert.strictEqual(store.canManageWorkspaceTeam(ownerSpace.id, qaUser.id), false, "Invited QA cannot manage workspace team members");
  console.log("✓ PASS: Invited QA user routes directly to project workspace with complete RBAC lockdown.");

  console.log("\n=================================================");
  console.log("ALL 6 TESTS PASSED SUCCESSFULLY! 🚀");
  console.log("=================================================\n");
}

runTests().catch(err => {
  console.error("Test Suite Failed:", err);
  process.exit(1);
});
