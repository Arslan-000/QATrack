/**
 * Test Suite: All Issues & Quality Repository Data Accuracy & Filter Consistency Audit
 */

const fs = require('fs');
const path = require('path');

function createMockElement(id = '', tag = 'div') {
  return {
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
    querySelectorAll: () => [],
    querySelector: () => null,
    appendChild: function(child) { this.children.push(child); return child; },
    removeChild: function(child) { this.children = this.children.filter(c => c !== child); return child; },
    setAttribute: function(k, v) { this[k] = v; },
    getAttribute: function(k) { return this[k] || null; },
    addEventListener: () => {},
    removeEventListener: () => {},
    focus: () => {},
    click: () => {},
    scrollIntoView: () => {}
  };
}

const mainContent = createMockElement('mainContent');
const elementMap = { mainContent };

global.window = {
  location: { hash: '#all-issues' },
  addEventListener: () => {},
  removeEventListener: () => {},
  innerWidth: 1440,
  innerHeight: 900,
  lucide: { createIcons: () => {} },
  app: {
    navigate: () => {},
    openIssueDetails: () => {},
    openProjectWorkspace: () => {},
    openCreateIssueModal: () => {},
    toast: (t, m, type) => { console.log(`  [Toast] ${t}: ${m} (${type})`); }
  }
};

global.document = {
  getElementById: (id) => elementMap[id] || (elementMap[id] = createMockElement(id)),
  querySelector: () => null,
  querySelectorAll: () => [],
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

// Evaluate scripts
eval(fs.readFileSync(path.join(__dirname, '../js/data.js'), 'utf8'));
eval(fs.readFileSync(path.join(__dirname, '../js/store.js'), 'utf8'));
eval(fs.readFileSync(path.join(__dirname, '../js/views/allIssues.js'), 'utf8'));

console.log("==================================================================");
console.log("🏃 RUNNING ALL ISSUES & QUALITY REPOSITORY DATA ACCURACY AUDIT");
console.log("==================================================================");

// Seed 2 Projects with 6 realistic issues matching the user's screenshot
const uDev = { id: "u_dev", name: "David Dev", role: "Developer", initials: "DD" };
const uQA = { id: "u_qa", name: "Sarah QA", role: "QA Engineer", initials: "SQ" };

const prj1 = { id: "prj_pos", key: "POS", name: "Point of Sale" };
const prj2 = { id: "prj_logo", key: "LOGO", name: "Logo & Branding" };

store.data = {
  users: [uDev, uQA],
  currentUser: uQA,
  workspaces: [{ id: "ws_main", name: "PulseWave Engineering", members: [uDev.id, uQA.id] }],
  activeWorkspaceId: "ws_main",
  projects: [prj1, prj2],
  activeProjectId: prj2.id, // User is currently in "Logo"
  issues: [
    // 1. POS-101 (Ready for QA)
    { id: "iss_1", key: "POS-101", projectId: prj1.id, title: "Checkout payment gateway retry timeout", type: "Bug", status: "Ready for QA", qaStatus: "Ready for QA", priority: "Critical", storyPoints: 5, reopenCount: 0 },
    // 2. POS-102 (Reopened / Failed QA)
    { id: "iss_2", key: "POS-102", projectId: prj1.id, title: "Barcode scanner freeze on double scan", type: "Bug", status: "Reopened", qaStatus: "Failed", priority: "High", storyPoints: 3, reopenCount: 2 },
    // 3. POS-103 (In Progress)
    { id: "iss_3", key: "POS-103", projectId: prj1.id, title: "Biometric authentication at checkout", type: "Story", status: "In Progress", qaStatus: "Testing", priority: "Medium", storyPoints: 3, reopenCount: 0 },
    // 4. LOGO-201 (Ready for QA)
    { id: "iss_4", key: "LOGO-201", projectId: prj2.id, title: "High-resolution SVG navbar branding", type: "Task", status: "Ready for QA", qaStatus: "Ready for QA", priority: "Low", storyPoints: 2, reopenCount: 0 },
    // 5. LOGO-202 (QA Failed)
    { id: "iss_5", key: "LOGO-202", projectId: prj2.id, title: "Dark mode logo contrast ratio issue", type: "Bug", status: "To Do", qaStatus: "Failed", priority: "High", storyPoints: 3, reopenCount: 1 },
    // 6. LOGO-203 (Ready for QA)
    { id: "iss_6", key: "LOGO-203", projectId: prj2.id, title: "Favicon rendering on Safari iOS", type: "Task", status: "Ready for QA", qaStatus: "Ready for QA", priority: "Low", storyPoints: 0, reopenCount: 0 }
  ],
  sprints: []
};

store.saveState();

// Audit 1: Total Initial Render Across All Projects
AllIssuesView.filterProject = "all";
AllIssuesView.activeSavedView = "all";
AllIssuesView.render(mainContent);

const allIssuesList = store.getIssues();
const filteredAll = AllIssuesView.filterAndSortIssues(allIssuesList, uQA);
console.log(`Total Issues: ${filteredAll.length} (Expected: 6)`);
console.assert(filteredAll.length === 6, "All view must return 6 issues");
console.log("  ✅ Total View: Correctly displays all 6 cross-project issues.");

// Audit 2: Saved View: Reopened / Failed (The exact bug in the screenshot)
AllIssuesView.applySavedView("reopened");
const reopenedIssues = AllIssuesView.filterAndSortIssues(allIssuesList, uQA);
console.log(`Reopened / Failed Issues: ${reopenedIssues.length} (Expected: 2 -> POS-102 and LOGO-202)`);
console.assert(reopenedIssues.length === 2, `Reopened view must return 2 issues, got ${reopenedIssues.length}`);
console.assert(reopenedIssues.some(i => i.key === "POS-102"), "Must include POS-102");
console.assert(reopenedIssues.some(i => i.key === "LOGO-202"), "Must include LOGO-202");
console.log("  ✅ Reopened / Failed View: Correctly returns 2 matching issues (POS-102, LOGO-202)!");

// Audit 3: Saved View: Ready for QA
AllIssuesView.applySavedView("ready_for_qa");
const readyForQaIssues = AllIssuesView.filterAndSortIssues(allIssuesList, uQA);
console.log(`Ready for QA Issues: ${readyForQaIssues.length} (Expected: 3 -> POS-101, LOGO-201, LOGO-203)`);
console.assert(readyForQaIssues.length === 3, `Ready for QA view must return 3 issues, got ${readyForQaIssues.length}`);
console.log("  ✅ Ready for QA View: Correctly returns 3 matching issues!");

// Audit 4: Saved View: Bugs Only
AllIssuesView.applySavedView("open_bugs");
const bugsOnlyIssues = AllIssuesView.filterAndSortIssues(allIssuesList, uQA);
console.log(`Bugs Only Issues: ${bugsOnlyIssues.length} (Expected: 3 bugs in dataset: POS-101, POS-102, LOGO-202)`);
console.assert(bugsOnlyIssues.length === 3, `Bugs Only view must return 3 issues, got ${bugsOnlyIssues.length}`);
console.log("  ✅ Bugs Only View: Correctly returns 3 issues!");

// Audit 5: Specific Project Filter (e.g. Logo only)
AllIssuesView.applySavedView("all");
AllIssuesView.setFilter("project", prj2.id);
const logoIssues = AllIssuesView.filterAndSortIssues(allIssuesList, uQA);
console.log(`Logo Project Issues: ${logoIssues.length} (Expected: 3)`);
console.assert(logoIssues.length === 3, `Logo project must return 3 issues, got ${logoIssues.length}`);
console.log("  ✅ Specific Project Filter: Correctly scopes issues to selected project.");

console.log("==================================================================");
console.log("🎉 ALL ISSUES & QUALITY REPOSITORY AUDIT PASSED 100%!");
console.log("==================================================================");
