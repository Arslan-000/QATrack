/**
 * Automated Verification Suite for PulseWave All Issues & Quality Repository Master View
 */

const fs = require('fs');
const path = require('path');
const assert = require('assert');

// Mock localStorage
global.localStorage = {
  store: {},
  getItem(key) { return this.store[key] || null; },
  setItem(key, value) { this.store[key] = String(value); },
  removeItem(key) { delete this.store[key]; },
  clear() { this.store = {}; }
};

// Mock Supabase Query Builder
function createQueryBuilder() {
  const qb = {
    then(onFulfilled) { return Promise.resolve({ data: [], error: null }).then(onFulfilled); },
    upsert: async (data) => ({ data, error: null }),
    update: (data) => qb,
    delete: () => qb,
    select: () => qb,
    eq: () => qb,
    in: () => qb,
    order: () => qb,
    maybeSingle: async () => ({ data: null, error: null }),
    single: async () => ({ data: null, error: null })
  };
  return qb;
}

global.window = {
  location: { origin: 'http://localhost:3000', pathname: '/' },
  addEventListener: () => {},
  app: {
    currentView: "all-issues",
    toast(title, msg, type) {},
    navigate(route) {
      this.currentView = route;
    },
    openIssueDetails(id) {},
    openCreateIssueModal(projectId) {},
    openProjectWorkspace(id, tab) {}
  },
  lucide: {
    createIcons() {}
  },
  supabaseClient: {
    from(table) { return createQueryBuilder(); }
  }
};

const domElements = {};
global.document = {
  body: {
    appendChild(el) { domElements[el.id] = el; },
    removeChild(el) {}
  },
  getElementById(id) {
    if (!domElements[id]) {
      domElements[id] = {
        id,
        innerHTML: '',
        value: '',
        classList: { 
          remove() {}, 
          add() {}, 
          toggle() {},
          contains() { return false; }
        },
        innerText: '',
        appendChild() {},
        remove() {},
        focus() {}
      };
    }
    return domElements[id];
  },
  createElement(tag) {
    return {
      className: '',
      innerHTML: '',
      setAttribute() {},
      click() {},
      classList: { add() {}, remove() {}, toggle() {} },
      remove() {}
    };
  },
  addEventListener() {}
};

global.Blob = class Blob {
  constructor(content, options) {
    this.content = content;
    this.options = options;
  }
};
global.URL = {
  createObjectURL(blob) { return 'blob:pulsewave/mock-url'; }
};

// Load code files
const initialDataCode = fs.readFileSync(path.join(__dirname, '../js/data.js'), 'utf8');
const storeCode = fs.readFileSync(path.join(__dirname, '../js/store.js'), 'utf8');
const allIssuesCode = fs.readFileSync(path.join(__dirname, '../js/views/allIssues.js'), 'utf8');

eval(initialDataCode);
eval(storeCode);
eval(allIssuesCode);

global.AllIssuesView = window.AllIssuesView || AllIssuesView;

async function runAllIssuesTests() {
  console.log('========================================================');
  console.log('🧪 RUNNING ALL ISSUES & QUALITY REPOSITORY VERIFICATION');
  console.log('========================================================\n');

  const store = global.store;

  // 1. Setup Mock User & Project
  console.log('Step 1: Setting up isolated multi-tenant test data...');
  const testDev = {
    id: 'usr_dev_arslan',
    name: 'Arslan Dev',
    email: 'arslan.dev@pulsewave.io',
    initials: 'AD',
    role: 'DEVELOPER'
  };
  const testQA = {
    id: 'usr_qa_sarah',
    name: 'Sarah QA Lead',
    email: 'sarah.qa@pulsewave.io',
    initials: 'SQ',
    role: 'QA'
  };
  store.data.users = [testDev, testQA];
  store.data.currentUser = testDev;
  store.data.activeUserId = testDev.id;

  const testSpace = {
    id: 'ws_test_001',
    name: 'Retail Workspace',
    owner_id: testDev.id,
    created_by: testDev.email
  };
  store.data.workspaces = [testSpace];
  store.data.userSpaces = [testSpace];
  store.data.workspace = testSpace;
  store.data.activeWorkspaceId = testSpace.id;

  const testProject = {
    id: 'prj_rpi',
    name: 'Retail POS Integration',
    key: 'RPI',
    workspaceId: 'ws_test_001',
    workspace_id: 'ws_test_001',
    status: 'Active',
    members: [testDev.id, testQA.id]
  };

  store.data.projects = [testProject];
  store.data.projectMembers = [
    { projectId: testProject.id, project_id: testProject.id, userId: testDev.id, user_id: testDev.id, role: 'DEVELOPER' },
    { projectId: testProject.id, project_id: testProject.id, userId: testQA.id, user_id: testQA.id, role: 'QA' }
  ];
  store.setActiveProject('prj_rpi');

  // 2. Sprints Setup
  const sprint1 = await store.createSprint({
    projectId: testProject.id,
    name: 'Sprint 14 - Checkout & Cart',
    status: 'Active'
  });

  // 3. Issues Setup with full professional attributes
  store.data.issues = [];
  const issue1 = await store.createIssue({
    projectId: testProject.id,
    key: 'TSK-103',
    title: 'Order sync failed between offline till and central DB',
    type: 'Task',
    priority: 'Critical',
    status: 'Ready for QA',
    qaStatus: 'Failed',
    reopenCount: 1,
    storyPoints: 5,
    developerId: testDev.id,
    qaId: testQA.id,
    environment: 'Staging',
    buildVersion: 'v2.4.1',
    sprintId: sprint1.id
  });

  const issue2 = await store.createIssue({
    projectId: testProject.id,
    key: 'BUG-102',
    title: 'User authentication login fail on session expiry',
    type: 'Bug',
    priority: 'High',
    status: 'In Progress',
    qaStatus: 'In Review',
    reopenCount: 0,
    storyPoints: 8,
    developerId: testDev.id,
    qaId: testQA.id,
    environment: 'Staging',
    buildVersion: 'v1.4.2-rc',
    sprintId: sprint1.id
  });

  const issue3 = await store.createIssue({
    projectId: testProject.id,
    key: 'BUG-101',
    title: 'Payment gateway timeout error handling',
    type: 'Bug',
    priority: 'Critical',
    status: 'Done',
    qaStatus: 'Passed',
    reopenCount: 2,
    storyPoints: 13,
    developerId: testDev.id,
    qaId: testQA.id,
    environment: 'Staging',
    buildVersion: 'v1.4.2-rc',
    sprintId: sprint1.id
  });

  const issue4 = await store.createIssue({
    projectId: testProject.id,
    key: 'STY-104',
    title: 'Export daily transaction summary report as PDF',
    type: 'Story',
    priority: 'Low',
    status: 'Backlog',
    qaStatus: 'pending',
    reopenCount: 0,
    storyPoints: 0,
    developerId: null,
    qaId: null,
    environment: 'Development',
    buildVersion: 'v2.5.0-dev',
    sprintId: null
  });

  console.log('✅ Step 1 Passed: Multi-tenant test issues, users and sprints created.\n');

  // 4. Test Table Rendering & Professional Columns
  console.log('Step 2: Testing AllIssuesView DOM Render & Column Elements...');
  const mainContainer = document.getElementById('mainContent');
  global.AllIssuesView.filterProject = 'all';
  global.AllIssuesView.render(mainContainer);

  const html = mainContainer.innerHTML;

  // Search input padding check
  assert.ok(html.includes('pl-10'), 'Search input must use pl-10 to prevent icon overlap');
  assert.ok(html.includes('id="allIssuesSearchField"'), 'Search input must have valid ID');

  // Professional column headers check
  assert.ok(html.includes('Key'), 'Table must have Key column');
  assert.ok(html.includes('Type'), 'Table must have Type column');
  assert.ok(html.includes('Summary &amp; Scope') || html.includes('Summary & Scope'), 'Table must have Summary & Scope column');
  assert.ok(html.includes('Project'), 'Table must have Project column');
  assert.ok(html.includes('Sprint Scope'), 'Table must have Sprint Scope column');
  assert.ok(html.includes('Story Pts'), 'Table must have Story Points column');
  assert.ok(html.includes('Status'), 'Table must have Status column');
  assert.ok(html.includes('Priority'), 'Table must have Priority column');
  assert.ok(html.includes('QA Quality Gate'), 'Table must have QA Quality Gate column');
  assert.ok(html.includes('Assignee'), 'Table must have Assignee column');
  assert.ok(html.includes('QA Lead'), 'Table must have QA Lead column');
  assert.ok(html.includes('Env / Build'), 'Table must have Env / Build column');
  assert.ok(html.includes('Actions'), 'Table must have Actions column');

  // Issue rows data check
  assert.ok(html.includes('TSK-103'), 'Rendered table must include TSK-103');
  assert.ok(html.includes('BUG-102'), 'Rendered table must include BUG-102');
  assert.ok(html.includes('BUG-101'), 'Rendered table must include BUG-101');
  assert.ok(html.includes('STY-104'), 'Rendered table must include STY-104');
  assert.ok(html.includes('Sprint 14 - Checkout &amp; Cart') || html.includes('Sprint 14 - Checkout & Cart'), 'Rendered table must include Sprint name');
  assert.ok(html.includes('Sarah'), 'QA Lead name must be displayed properly instead of raw ID');
  assert.ok(html.includes('Arslan'), 'Developer name must be displayed properly');

  console.log('✅ Step 2 Passed: All professional market table columns rendered cleanly.\n');

  // 5. Test Quick Filters & Search
  console.log('Step 3: Testing Quick Filters & Search...');
  const allIssues = store.getIssues();

  // Search by Keyword
  global.AllIssuesView.searchQuery = 'offline till';
  const searchResults = global.AllIssuesView.filterAndSortIssues(allIssues, testDev);
  assert.strictEqual(searchResults.length, 1, 'Search for "offline till" should return 1 issue');
  assert.strictEqual(searchResults[0].key, 'TSK-103');
  global.AllIssuesView.searchQuery = '';

  // Filter: Bugs Only
  global.AllIssuesView.filterType = 'Bug';
  const bugsResults = global.AllIssuesView.filterAndSortIssues(allIssues, testDev);
  assert.strictEqual(bugsResults.length, 2, 'Bugs filter should return 2 bugs');
  global.AllIssuesView.filterType = 'all';

  // Filter: QA Quality Gate Passed / Verified
  global.AllIssuesView.filterQualityGate = 'passed';
  const passedResults = global.AllIssuesView.filterAndSortIssues(allIssues, testDev);
  assert.strictEqual(passedResults.length, 1, 'Passed filter should return 1 verified issue (BUG-101)');
  assert.strictEqual(passedResults[0].key, 'BUG-101');
  global.AllIssuesView.filterQualityGate = 'all';

  // Filter: Unestimated (0 SP)
  global.AllIssuesView.activeSavedView = 'unestimated';
  const unestimatedResults = global.AllIssuesView.filterAndSortIssues(allIssues, testDev);
  assert.strictEqual(unestimatedResults.length, 1, 'Unestimated filter should return 1 issue (STY-104)');
  assert.strictEqual(unestimatedResults[0].key, 'STY-104');
  global.AllIssuesView.activeSavedView = 'all';

  console.log('✅ Step 3 Passed: Search and filter accuracy verified.\n');

  // 6. Test Story Points Quick Estimation
  console.log('Step 4: Testing Story Points Quick Estimation...');
  await global.AllIssuesView.handleQuickSP(issue4.id, 5);
  const updatedIssue4 = store.getIssueById(issue4.id);
  assert.strictEqual(updatedIssue4.storyPoints, 5, 'Issue 4 Story Points must be updated to 5 SP');
  console.log('✅ Step 4 Passed: Inline story points estimation verified.\n');

  // 7. Test Bulk Selection & Operations
  console.log('Step 5: Testing Bulk Selection & Status Update...');
  global.AllIssuesView.toggleSelectIssue(issue1.id, true);
  global.AllIssuesView.toggleSelectIssue(issue2.id, true);
  assert.strictEqual(global.AllIssuesView.selectedIssueIds.size, 2, '2 issues should be selected');

  await global.AllIssuesView.handleBulkStatusChange('Done');
  assert.strictEqual(store.getIssueById(issue1.id).status, 'Done', 'Issue 1 status should be updated to Done');
  assert.strictEqual(store.getIssueById(issue2.id).status, 'Done', 'Issue 2 status should be updated to Done');
  assert.strictEqual(global.AllIssuesView.selectedIssueIds.size, 0, 'Selection should clear after bulk update');
  console.log('✅ Step 5 Passed: Bulk selection and batch update verified.\n');

  // 8. Test CSV Export Generation
  console.log('Step 6: Testing CSV Export generation...');
  global.AllIssuesView.exportCSV();
  console.log('✅ Step 6 Passed: CSV export generated successfully.\n');

  console.log('========================================================');
  console.log('🎉 ALL ISSUES & QUALITY REPOSITORY VERIFIED (100% PASS)!');
  console.log('========================================================');
}

runAllIssuesTests().catch(err => {
  console.error('❌ Test failed:', err);
  process.exit(1);
});
