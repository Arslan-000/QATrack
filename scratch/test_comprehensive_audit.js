const fs = require('fs');

// Mock browser DOM environment
function createMockElement(id = '', tag = 'div') {
  const el = {
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
    querySelectorAll: function(sel) {
      return [];
    },
    querySelector: function(sel) {
      return null;
    },
    appendChild: function(child) {
      this.children.push(child);
      return child;
    },
    removeChild: function(child) {
      this.children = this.children.filter(c => c !== child);
      return child;
    },
    setAttribute: function(k, v) { this[k] = v; },
    getAttribute: function(k) { return this[k] || null; },
    addEventListener: function(event, handler) {},
    removeEventListener: function(event, handler) {},
    focus: function() {},
    click: function() {},
    scrollTop: 0
  };
  return el;
}

const domElements = {
  mainContent: createMockElement('mainContent', 'main'),
  appSidebar: createMockElement('appSidebar', 'aside'),
  sidebarBackdrop: createMockElement('sidebarBackdrop', 'div'),
  sidebarNavMenuContainer: createMockElement('sidebarNavMenuContainer', 'div'),
  sidebarSpacesExplorerContainer: createMockElement('sidebarSpacesExplorerContainer', 'div'),
  sidebarUserFooterContainer: createMockElement('sidebarUserFooterContainer', 'div'),
  headerPersonaWidget: createMockElement('headerPersonaWidget', 'div'),
  headerProjectSelectorContainer: createMockElement('headerProjectSelectorContainer', 'div'),
  headerProjectSelector: createMockElement('headerProjectSelector', 'div'),
  notifBadge: createMockElement('notifBadge', 'span'),
  notifListContainer: createMockElement('notifListContainer', 'div'),
  globalModalContainer: createMockElement('globalModalContainer', 'div'),
  globalDrawerContainer: createMockElement('globalDrawerContainer', 'div'),
  toastContainer: createMockElement('toastContainer', 'div'),
  appToastContainer: createMockElement('appToastContainer', 'div')
};

global.document = {
  elements: domElements,
  getElementById: function(id) {
    if (!this.elements[id]) {
      this.elements[id] = createMockElement(id);
    }
    return this.elements[id];
  },
  createElement: function(tag) {
    return createMockElement('', tag);
  },
  querySelectorAll: function(selector) {
    return [];
  },
  querySelector: function(selector) {
    if (selector === 'header') return createMockElement('header', 'header');
    return null;
  },
  body: createMockElement('body', 'body'),
  addEventListener: function() {},
  removeEventListener: function() {}
};

global.window = global;
global.window.document = global.document;
global.window.lucide = { createIcons: () => {} };
global.window.dispatchEvent = () => {};
global.window.addEventListener = () => {};
global.window.removeEventListener = () => {};
global.window.location = { hash: '', origin: 'http://localhost:3000' };
global.window.Chart = class { constructor() {} destroy() {} update() {} };
global.window.supabaseClient = null;
global.window.html2pdf = () => ({ set: () => ({ from: () => ({ output: async () => new Blob() }) }) });

global.localStorage = {
  store: {},
  getItem: function(k) { return this.store[k] || null; },
  setItem: function(k, v) { this.store[k] = v; },
  removeItem: function(k) { delete this.store[k]; },
  clear: function() { this.store = {}; }
};

global.CustomEvent = class CustomEvent {
  constructor(type, options) { this.type = type; this.detail = options ? options.detail : {}; }
};

// Load scripts
const scripts = [
  'js/data.js',
  'js/services/releaseQualityService.js',
  'js/services/aiQAService.js',
  'js/store.js',
  'js/views/dashboard.js',
  'js/views/projects.js',
  'js/views/backlogSprints.js',
  'js/views/projectWorkspace.js',
  'js/views/myIssues.js',
  'js/views/allIssues.js',
  'js/views/reports.js',
  'js/views/testManagement.js',
  'js/views/testReports.js',
  'js/views/releases.js',
  'js/views/documentation.js',
  'js/views/landingPage.js',
  'js/views/auth.js',
  'js/views/onboarding.js',
  'js/views/comingSoon.js',
  'js/views/projectChat.js',
  'js/views/settings.js',
  'js/views/aiQAAssistant.js',
  'js/app.js'
];

scripts.forEach(s => {
  const code = fs.readFileSync(s, 'utf8');
  eval(code);
});

for (const key of Object.keys(global.window)) {
  global[key] = global.window[key];
}

async function runComprehensiveAudit() {
  console.log("==================================================================");
  console.log("🚀 PULSEWAVE QA PLATFORM - FULL NAVIGATION & INITIAL LOAD AUDIT");
  console.log("==================================================================");

  let errors = 0;
  let passed = 0;

  // Test 1: First time start / Clean init
  console.log("\n[Test 1] Clean AppController.init()");
  try {
    window.app = new AppController();
    await window.app.init();
    console.log(`✓ Init succeeded. Current view: ${window.app.currentView}`);
    passed++;
  } catch (err) {
    console.error("✗ Init failed:", err);
    errors++;
  }

  // Test 2: Seed mock data
  console.log("\n[Test 2] Seed Rich Workspace, Projects, Issues & Test Runs");
  const pmUser = {
    id: "usr_pm_1",
    name: "Alex Johnson",
    email: "alex@pulsewave.io",
    role: "Project Manager",
    initials: "AJ",
    color: "bg-slate-950 text-[#bef264]"
  };
  const qaUser = {
    id: "usr_qa_1",
    name: "Sarah QA Lead",
    email: "sarah@pulsewave.io",
    role: "QA",
    initials: "SQ",
    color: "bg-purple-600 text-white"
  };
  const devUser = {
    id: "usr_dev_1",
    name: "David Developer",
    email: "david@pulsewave.io",
    role: "DEVELOPER",
    initials: "DD",
    color: "bg-indigo-600 text-white"
  };

  const ws1 = {
    id: "ws_alpha",
    name: "Retail Banking Platform",
    slug: "retail-banking",
    ownerId: pmUser.id,
    members: [
      { userId: pmUser.id, role: "OWNER" },
      { userId: qaUser.id, role: "QA" },
      { userId: devUser.id, role: "DEVELOPER" }
    ]
  };

  const prj1 = {
    id: "prj_pos",
    key: "POS",
    name: "Point of Sale Modernization",
    workspace_id: ws1.id,
    workspaceId: ws1.id,
    status: "ACTIVE",
    pmId: pmUser.id,
    members: [pmUser.id, qaUser.id, devUser.id]
  };

  const issue1 = {
    id: "iss_1",
    key: "POS-101",
    title: "Checkout payment gateway timeout on Stripe webhook retry",
    type: "Bug",
    priority: "High",
    status: "Ready for QA",
    projectId: prj1.id,
    developerId: devUser.id,
    qaId: qaUser.id,
    reporterId: pmUser.id,
    description: "When processing high-concurrency cart checkouts, stripe webhooks trigger 504.",
    labels: ["Payment", "Backend"],
    buildVersion: "v2.4.1",
    environment: "Staging"
  };

  store.data.users = [pmUser, qaUser, devUser];
  store.data.activeUserId = pmUser.id;
  store.data.workspaces = [ws1];
  store.data.activeWorkspaceId = ws1.id;
  store.data.projects = [prj1];
  store.data.activeProjectId = prj1.id;
  store.data.issues = [issue1];
  store.saveState();

  // Test 3: Navigate to every view with PM Persona
  const viewsToTest = [
    "dashboard",
    "projects",
    "backlog-sprints",
    "project-workspace",
    "my-issues",
    "all-issues",
    "reports",
    "test-management",
    "test-reports",
    "releases",
    "documentation",
    "settings",
    "project-chat",
    "home",
    "landing",
    "login",
    "signup",
    "onboarding"
  ];

  console.log("\n[Test 3] Navigating to all views as Project Manager (PM)...");
  for (const v of viewsToTest) {
    try {
      window.app.navigate(v);
      console.log(`  ✓ Route: #${v} -> Rendered ${domElements.mainContent.innerHTML.length} bytes`);
      passed++;
    } catch (err) {
      console.error(`  ✗ Route failed: #${v}`, err);
      errors++;
    }
  }

  // Test 4: Switch Persona to QA Engineer and test views
  console.log("\n[Test 4] Switching Persona to QA Engineer...");
  try {
    store.setActiveUser(qaUser.id);
    window.app.updateSidebarNav();
    window.app.updateHeaderPersona();
    window.app.navigate("test-management");
    console.log(`  ✓ Switched to QA. Current view: ${window.app.currentView}`);
    passed++;
  } catch (err) {
    console.error("  ✗ QA Persona switch failed:", err);
    errors++;
  }

  // Test 5: Switch Persona to Developer and test route guards
  console.log("\n[Test 5] Switching Persona to Developer and testing route guard...");
  try {
    store.setActiveUser(devUser.id);
    window.app.updateSidebarNav();
    window.app.updateHeaderPersona();
    // Attempting restricted view as Developer should redirect to project-workspace
    window.app.navigate("test-management");
    if (window.app.currentView === "project-workspace") {
      console.log(`  ✓ Restricted route correctly redirected Developer to project-workspace`);
      passed++;
    } else {
      console.warn(`  ! Expected redirect to project-workspace, got: ${window.app.currentView}`);
    }
  } catch (err) {
    console.error("  ✗ Developer guard failed:", err);
    errors++;
  }

  // Test 6: Issue Details Drawer & Modals
  console.log("\n[Test 6] Testing Issue Details Drawer and Modals...");
  try {
    window.app.openIssueDetails(issue1.id);
    console.log(`  ✓ openIssueDetails drawer rendered (${domElements.globalDrawerContainer.innerHTML.length} bytes)`);
    passed++;

    window.app.openWorkflowTransitionModal(issue1.id, "Done", false, "PASS");
    console.log(`  ✓ openWorkflowTransitionModal rendered (${domElements.globalModalContainer.innerHTML.length} bytes)`);
    passed++;

    window.app.openLinkWorkItemModal(issue1.id);
    console.log(`  ✓ openLinkWorkItemModal rendered (${domElements.globalModalContainer.innerHTML.length} bytes)`);
    passed++;

    window.app.openWorkflowTourModal();
    console.log(`  ✓ openWorkflowTourModal rendered (${domElements.globalModalContainer.innerHTML.length} bytes)`);
    passed++;
  } catch (err) {
    console.error("  ✗ Modal / Drawer testing failed:", err);
    errors++;
  }

  // Test 7: Project Selector & Workspace Switching
  console.log("\n[Test 7] Testing Space & Project Selector Switching...");
  try {
    window.app.selectSidebarSpace(ws1.id);
    window.app.selectSidebarProject(prj1.id);
    window.app.openProjectWorkspace(prj1.id, "overview");
    console.log(`  ✓ Space & Project switching succeeded. View: ${window.app.currentView}`);
    passed++;
  } catch (err) {
    console.error("  ✗ Space / Project selector failed:", err);
    errors++;
  }

  console.log("\n==================================================================");
  console.log(`🏁 AUDIT RESULTS: ${passed} PASSED, ${errors} ERRORS`);
  console.log("==================================================================");
}

runComprehensiveAudit();
