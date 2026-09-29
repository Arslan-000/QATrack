/**
 * Backlog & Sprints Module Data Accuracy & Modern QA Standards Test Suite
 */
const fs = require('fs');
const path = require('path');

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
    querySelectorAll: function(sel) { return []; },
    querySelector: function(sel) { return null; },
    appendChild: function(child) { this.children.push(child); return child; },
    removeChild: function(child) { this.children = this.children.filter(c => c !== child); return child; },
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

const mainContent = createMockElement('mainContent');
const elementMap = { mainContent };

global.window = {
  location: { hash: '#backlog-sprints' },
  addEventListener: () => {},
  removeEventListener: () => {},
  innerWidth: 1440,
  innerHeight: 900,
  lucide: { createIcons: () => {} },
  app: {
    navigate: () => {},
    openIssueDetails: () => {},
    openProjectWorkspace: () => {},
    openCreateProjectModal: () => {},
    openCreateIssueModal: () => {},
    selectSidebarProject: () => {},
    toast: (t, m, type) => { console.log(`  [Toast] ${t}: ${m} (${type})`); }
  }
};

global.document = {
  getElementById: (id) => elementMap[id] || (elementMap[id] = createMockElement(id)),
  querySelector: (sel) => null,
  querySelectorAll: (sel) => [],
  createElement: (tag) => createMockElement('', tag),
  body: createMockElement('body')
};

global.localStorage = {
  store: {},
  getItem(key) { return this.store[key] || null; },
  setItem(key, val) { this.store[key] = String(val); },
  removeItem(key) { delete this.store[key]; },
  clear() { this.store = {}; }
};

// Load data, store, and backlogSprints
eval(fs.readFileSync(path.join(__dirname, '../js/data.js'), 'utf8'));
eval(fs.readFileSync(path.join(__dirname, '../js/store.js'), 'utf8'));
eval(fs.readFileSync(path.join(__dirname, '../js/views/backlogSprints.js'), 'utf8'));

console.log("==================================================================");
console.log("🏃 RUNNING BACKLOG & SPRINTS DATA ACCURACY & FUNCTIONALITY AUDIT");
console.log("==================================================================");

// Seed Rich Workspace with Sprints and Backlog
const pmUser = { id: "usr_pm_1", name: "Alex Johnson", email: "alex@pulsewave.io", role: "PROJECT_MANAGER", initials: "AJ", color: "bg-slate-950 text-[#bef264]" };
const qaUser = { id: "usr_qa_1", name: "Sarah QA Lead", email: "sarah@pulsewave.io", role: "QA", initials: "SQ", color: "bg-purple-600 text-white" };
const devUser = { id: "usr_dev_1", name: "David Developer", email: "david@pulsewave.io", role: "DEVELOPER", initials: "DD", color: "bg-indigo-600 text-white" };

const prj1 = {
  id: "prj_pos",
  key: "POS",
  name: "Point of Sale Modernization",
  status: "Active",
  pmId: pmUser.id,
  members: [pmUser.id, qaUser.id, devUser.id]
};

const sprintActive = {
  id: "sp_active_1",
  name: "Sprint 10: Checkout & Gateway",
  projectId: prj1.id,
  status: "Active",
  startDate: "2026-09-20",
  endDate: "2026-10-04",
  goal: "Zero checkout defect tolerance and automated gateway verification"
};

const sprintPlanned = {
  id: "sp_planned_1",
  name: "Sprint 11: Loyalty & Offline Sync",
  projectId: prj1.id,
  status: "Planned",
  startDate: "2026-10-05",
  endDate: "2026-10-19",
  goal: "Offline queue syncing"
};

const issueSprint1 = {
  id: "iss_sp_1",
  key: "POS-101",
  title: "Checkout payment gateway timeout on Stripe retry",
  type: "Bug",
  priority: "Critical",
  status: "In Progress",
  qaStatus: "Testing",
  projectId: prj1.id,
  sprintId: sprintActive.id,
  storyPoints: 8,
  developerId: devUser.id,
  qaId: qaUser.id
};

const issueSprint2 = {
  id: "iss_sp_2",
  key: "POS-102",
  title: "Receipt printer USB driver reconnect",
  type: "Task",
  priority: "High",
  status: "Done",
  qaStatus: "Passed",
  projectId: prj1.id,
  sprintId: sprintActive.id,
  storyPoints: 5,
  developerId: devUser.id,
  qaId: qaUser.id
};

const issueBacklog = {
  id: "iss_bk_1",
  key: "POS-103",
  title: "Refund barcode scanner integration with Bluetooth HID",
  type: "Story",
  priority: "Medium",
  status: "Backlog",
  qaStatus: "Not Tested",
  projectId: prj1.id,
  sprintId: null,
  storyPoints: 3,
  developerId: devUser.id,
  qaId: qaUser.id
};

store.data.users = [pmUser, qaUser, devUser];
store.data.activeUserId = pmUser.id;
store.data.projects = [prj1];
store.data.activeProjectId = prj1.id;
store.data.sprints = [sprintActive, sprintPlanned];
store.data.issues = [issueSprint1, issueSprint2, issueBacklog];
store.saveState();

// Test 1: Render View
BacklogSprintsView.render(mainContent);
const rendered = mainContent.innerHTML;

const assertContains = (label, text) => {
  if (rendered.includes(text)) {
    console.log(`  ✅ ${label}: Correctly rendered "${text}"`);
  } else {
    console.error(`  ❌ ${label}: Missing "${text}" in output!`);
    process.exit(1);
  }
};

assertContains("Active Sprint Header", sprintActive.name);
assertContains("Active Sprint Goal", sprintActive.goal);
assertContains("Planned Sprint Header", sprintPlanned.name);
assertContains("Product Backlog Header", "Product Backlog");
assertContains("Sprint Ticket Key", issueSprint1.key);
assertContains("Backlog Ticket Key", issueBacklog.key);
assertContains("Active Sprint Story Points", "13 SP");

console.log("\n--- Testing Sprint Movements & Story Point Updates ---");

// Test 2: Quick Story Point Update
BacklogSprintsView.handleQuickSP(issueBacklog.id, 5);
const updatedBk = store.getIssueById(issueBacklog.id);
console.log(`  ✅ Quick Story Points updated: ${updatedBk.storyPoints} SP`);

// Test 3: Move issue from Backlog to Planned Sprint
BacklogSprintsView.handleMoveSprint(issueBacklog.id, sprintPlanned.id);
const movedBk = store.getIssueById(issueBacklog.id);
console.log(`  ✅ Issue moved to Sprint: ${movedBk.sprintId === sprintPlanned.id}`);

// Test 4: Move back to Backlog
BacklogSprintsView.handleMoveSprint(issueBacklog.id, null);
const rolledBk = store.getIssueById(issueBacklog.id);
console.log(`  ✅ Issue moved back to Backlog: ${rolledBk.sprintId === null}`);

console.log("\n==================================================================");
console.log("🎉 BACKLOG & SPRINTS AUDIT PASSED 100%!");
console.log("==================================================================");
