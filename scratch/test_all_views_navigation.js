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
global.window.Chart = class { constructor() {} destroy() {} };
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

// Read files in order of index.html
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

console.log('Loading scripts...');
scripts.forEach(s => {
  try {
    const code = fs.readFileSync(s, 'utf8');
    eval(code);
    console.log('✓ Loaded:', s);
  } catch (err) {
    console.error('✗ Error loading:', s, err);
  }
});

// Ensure all window globals are accessible globally
for (const key of Object.keys(global.window)) {
  global[key] = global.window[key];
}

async function runTests() {
  console.log('\n--- TESTING APP INITIALIZATION (FIRST TIME START) ---');
  window.app = new AppController();
  await window.app.init();
  console.log('Initial view after init:', window.app.currentView);
  console.log('DOM mainContent length:', domElements.mainContent.innerHTML.length);

  console.log('\n--- TESTING ALL NAVIGATION ROUTES (LOGGED OUT) ---');
  const routes = [
    'home', 'landing', 'login', 'signup', 'verify-email',
    'join', 'invite', 'accept-invite', 'project-invite', 'onboarding',
    'dashboard', 'projects', 'backlog-sprints',
    'project-workspace', 'my-issues', 'all-issues', 'reports',
    'test-management', 'test-reports', 'releases', 'documentation',
    'qa-queue', 'settings', 'project-chat',
    'customer-portal-locked', 'automation-locked', 'ai-assistant-locked', 'integrations-locked'
  ];

  routes.forEach(r => {
    try {
      window.app.navigate(r);
      console.log(`✓ Route [${r}] -> currentView: [${window.app.currentView}] (content length: ${domElements.mainContent.innerHTML.length})`);
    } catch (e) {
      console.error(`✗ ERROR navigating to [${r}]:`, e);
    }
  });

  // Now create a mock active user and workspace in store
  console.log('\n--- TESTING ALL NAVIGATION ROUTES (LOGGED IN) ---');
  const mockUser = {
    id: 'usr_test_1',
    name: 'Alex Johnson',
    email: 'alex@example.com',
    role: 'Project Manager',
    initials: 'AJ',
    color: 'bg-indigo-600'
  };
  const mockWs = {
    id: 'ws_test_1',
    name: 'Alpha Engineering',
    slug: 'alpha-eng',
    ownerId: mockUser.id,
    members: [{ userId: mockUser.id, role: 'OWNER' }]
  };
  const mockPrj = {
    id: 'prj_test_1',
    key: 'ALPHA',
    name: 'Alpha Platform',
    workspace_id: mockWs.id,
    workspaceId: mockWs.id,
    status: 'ACTIVE',
    pmId: mockUser.id,
    members: [mockUser.id]
  };

  store.data.users = [mockUser];
  store.data.activeUserId = mockUser.id;
  store.data.workspaces = [mockWs];
  store.data.activeWorkspaceId = mockWs.id;
  store.data.projects = [mockPrj];
  store.data.activeProjectId = mockPrj.id;
  store.saveState();

  routes.forEach(r => {
    try {
      window.app.navigate(r);
      console.log(`✓ Route [${r}] -> currentView: [${window.app.currentView}] (content length: ${domElements.mainContent.innerHTML.length})`);
    } catch (e) {
      console.error(`✗ ERROR navigating to [${r}]:`, e);
    }
  });

  console.log('\n--- ALL NAVIGATION TESTS COMPLETED SUCCESSFULLY! ---');
}

runTests();
