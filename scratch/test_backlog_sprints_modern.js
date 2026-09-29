/**
 * Automated Verification Suite for PulseWave Modern Backlog & Sprints Module
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
    currentView: "backlog-sprints",
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
    appendChild(el) { domElements[el.id] = el; }
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
      classList: { add() {}, remove() {}, toggle() {} },
      remove() {}
    };
  },
  addEventListener() {}
};

// Load code files
const initialDataCode = fs.readFileSync(path.join(__dirname, '../js/data.js'), 'utf8');
const storeCode = fs.readFileSync(path.join(__dirname, '../js/store.js'), 'utf8');
const backlogViewCode = fs.readFileSync(path.join(__dirname, '../js/views/backlogSprints.js'), 'utf8');
const projectWorkspaceCode = fs.readFileSync(path.join(__dirname, '../js/views/projectWorkspace.js'), 'utf8');

eval(initialDataCode);
eval(storeCode);
eval(backlogViewCode);
eval(projectWorkspaceCode);

global.BacklogSprintsView = window.BacklogSprintsView || BacklogSprintsView;
global.ProjectWorkspaceView = window.ProjectWorkspaceView || ProjectWorkspaceView;

async function runBacklogSprintsTests() {
  console.log('========================================================');
  console.log('🧪 RUNNING PULSEWAVE BACKLOG & SPRINTS VERIFICATION SUITE');
  console.log('========================================================\n');

  const store = global.store;

  // 1. Setup Mock User & Project
  console.log('Step 1: Setting up isolated multi-tenant test project & user...');
  const testUser = {
    id: 'user_sprint_tester',
    name: 'Alex SprintMaster',
    email: 'alex.sprint@pulsewave.io',
    initials: 'AS',
    role: 'OWNER'
  };
  store.data.users = [testUser];
  store.data.currentUser = testUser;
  store.data.activeUserId = testUser.id;

  const testSpace = {
    id: 'ws_test_001',
    name: 'Alpha Space',
    owner_id: testUser.id,
    created_by: testUser.email
  };
  store.data.workspaces = [testSpace];
  store.data.userSpaces = [testSpace];
  store.data.workspace = testSpace;
  store.data.activeWorkspaceId = testSpace.id;

  const testProjectA = {
    id: 'prj_sprint_alpha',
    name: 'Alpha Ecommerce Platform',
    key: 'AEC',
    workspaceId: 'ws_test_001',
    workspace_id: 'ws_test_001',
    status: 'Active',
    members: [testUser.id]
  };

  const testProjectB = {
    id: 'prj_sprint_beta',
    name: 'Beta Mobile App',
    key: 'BMA',
    workspaceId: 'ws_test_001',
    workspace_id: 'ws_test_001',
    status: 'Active',
    members: [testUser.id]
  };

  store.data.projects = [testProjectA, testProjectB];
  store.data.projectMembers = [
    { projectId: testProjectA.id, project_id: testProjectA.id, userId: testUser.id, user_id: testUser.id, role: 'PM' },
    { projectId: testProjectB.id, project_id: testProjectB.id, userId: testUser.id, user_id: testUser.id, role: 'PM' }
  ];
  store.data.issues = [];
  store.data.sprints = [];
  store.setActiveProject('prj_sprint_alpha');

  assert.strictEqual(store.getActiveProject().id, 'prj_sprint_alpha', 'Active project should be Alpha');
  console.log('✅ Step 1 Passed: Project & User state initialized.\n');

  // 2. Sprint Creation Lifecycle
  console.log('Step 2: Testing Sprint Creation...');
  const sprint1 = await store.createSprint({
    projectId: testProjectA.id,
    name: 'Sprint 1 - Authentication & Cart',
    goal: 'Ship OAuth2 and shopping cart verification with 100% test pass rate',
    startDate: '2026-09-10',
    endDate: '2026-09-24',
    status: 'future'
  });

  assert.ok(sprint1.id, 'Sprint 1 must have an ID');
  assert.strictEqual(sprint1.name, 'Sprint 1 - Authentication & Cart');
  assert.strictEqual(sprint1.status, 'future');
  assert.strictEqual(sprint1.projectId, 'prj_sprint_alpha');

  const sprint2 = await store.createSprint({
    projectId: testProjectA.id,
    name: 'Sprint 2 - Payment Gateways',
    goal: 'Integrate Stripe and PayPal',
    startDate: '2026-09-25',
    endDate: '2026-10-09',
    status: 'future'
  });

  const projectASprints = store.getSprints(testProjectA.id);
  assert.strictEqual(projectASprints.length, 2, 'Project A should have 2 sprints');
  
  const projectBSprints = store.getSprints(testProjectB.id);
  assert.strictEqual(projectBSprints.length, 0, 'Project B should have 0 sprints (strict tenant isolation)');
  console.log('✅ Step 2 Passed: Sprint creation and multi-tenant isolation verified.\n');

  // 3. Issue Creation & Story Points Quick Estimation
  console.log('Step 3: Creating Backlog Issues and testing Story Point Quick Estimation...');
  const issue1 = await store.createIssue({
    projectId: testProjectA.id,
    title: 'Implement OAuth2 Google Sign-in',
    type: 'Story',
    priority: 'High',
    status: 'To Do',
    storyPoints: 5,
    assigneeId: testUser.id
  });

  const issue2 = await store.createIssue({
    projectId: testProjectA.id,
    title: 'Fix cart item count badge caching bug',
    type: 'Bug',
    priority: 'Critical',
    status: 'In Progress',
    storyPoints: 0,
    assigneeId: testUser.id
  });

  const issue3 = await store.createIssue({
    projectId: testProjectA.id,
    title: 'Write automated unit tests for tax calculator',
    type: 'Task',
    priority: 'Medium',
    status: 'Ready for QA',
    storyPoints: 3,
    assigneeId: 'user_other'
  });

  const issue4 = await store.createIssue({
    projectId: testProjectA.id,
    title: 'Design checkout order summary UI',
    type: 'Story',
    priority: 'Low',
    status: 'To Do',
    storyPoints: 0,
    assigneeId: testUser.id
  });

  // Test Quick SP Estimator
  await store.quickUpdateStoryPoints(issue2.id, 8);
  const updatedIssue2 = store.getIssueById(issue2.id);
  assert.strictEqual(updatedIssue2.storyPoints, 8, 'Issue 2 story points should be updated to 8');
  assert.strictEqual(updatedIssue2.story_points, 8, 'Issue 2 story_points should be updated to 8');
  console.log('✅ Step 3 Passed: Backlog issues created and SP estimation verified.\n');

  // 4. Issue Assignment to Sprints (Single & Bulk Movement)
  console.log('Step 4: Testing Single & Bulk Movement of Tickets into Sprint...');
  await store.moveIssueToSprint(issue1.id, sprint1.id);
  assert.strictEqual(store.getIssueById(issue1.id).sprintId, sprint1.id, 'Issue 1 must be in Sprint 1');

  await store.bulkMoveIssuesToSprint([issue2.id, issue3.id], sprint1.id);
  assert.strictEqual(store.getIssueById(issue2.id).sprintId, sprint1.id, 'Issue 2 must be in Sprint 1');
  assert.strictEqual(store.getIssueById(issue3.id).sprintId, sprint1.id, 'Issue 3 must be in Sprint 1');

  // Issue 4 remains in backlog
  assert.strictEqual(store.getIssueById(issue4.id).sprintId, null, 'Issue 4 must remain in Backlog');
  console.log('✅ Step 4 Passed: Single and bulk issue sprint assignment verified.\n');

  // 5. Start Sprint Lifecycle
  console.log('Step 5: Testing Start Sprint Transition...');
  await store.startSprint(sprint1.id);
  const activeSprint = store.getSprintById(sprint1.id);
  assert.strictEqual(activeSprint.status.toLowerCase(), 'active', 'Sprint 1 status must now be active');
  console.log('✅ Step 5 Passed: Sprint successfully activated.\n');

  // 6. Test BacklogSprintsView Rendering & Filtering
  console.log('Step 6: Testing BacklogSprintsView Rendering, Search & Filtering...');
  const mainContainer = document.getElementById('mainContent');
  global.BacklogSprintsView.render(mainContainer);

  assert.ok(mainContainer.innerHTML.includes('Alpha Ecommerce Platform'), 'Rendered HTML must contain project name');
  assert.ok(mainContainer.innerHTML.includes('Sprint 1 - Authentication & Cart'), 'Rendered HTML must contain active sprint');
  assert.ok(mainContainer.innerHTML.includes('Active Sprint'), 'Rendered HTML must display Active Sprint badge');
  assert.ok(mainContainer.innerHTML.includes('Product Backlog'), 'Rendered HTML must contain Product Backlog container');
  assert.ok(mainContainer.innerHTML.includes('Design checkout order summary UI'), 'Rendered HTML must contain unassigned backlog item');

  // Test Quick Filters
  const allIssues = store.getIssues(testProjectA.id);
  
  // Quick Filter: Bugs Only
  global.BacklogSprintsView.quickFilter = 'bugs_only';
  const bugsFiltered = global.BacklogSprintsView.filterIssues(allIssues, testUser);
  assert.strictEqual(bugsFiltered.length, 1, 'Bugs only filter should return exactly 1 issue');
  assert.strictEqual(bugsFiltered[0].type, 'Bug', 'Filtered issue must be a Bug');

  // Quick Filter: Critical
  global.BacklogSprintsView.quickFilter = 'critical';
  const critFiltered = global.BacklogSprintsView.filterIssues(allIssues, testUser);
  assert.strictEqual(critFiltered.length, 1, 'Critical filter should return 1 issue');
  assert.strictEqual(critFiltered[0].priority, 'Critical');

  // Quick Filter: Unestimated
  global.BacklogSprintsView.quickFilter = 'unestimated';
  const unestimatedFiltered = global.BacklogSprintsView.filterIssues(allIssues, testUser);
  assert.strictEqual(unestimatedFiltered.length, 1, 'Unestimated filter should return 1 issue (Issue 4)');
  assert.strictEqual(unestimatedFiltered[0].id, issue4.id);

  // Search Query Filter
  global.BacklogSprintsView.quickFilter = 'all';
  global.BacklogSprintsView.searchQuery = 'tax calculator';
  const searchFiltered = global.BacklogSprintsView.filterIssues(allIssues, testUser);
  assert.strictEqual(searchFiltered.length, 1, 'Search query must match tax calculator issue');
  global.BacklogSprintsView.searchQuery = '';
  console.log('✅ Step 6 Passed: BacklogSprintsView DOM render and filtering logic verified.\n');

  // 7. Complete Sprint Lifecycle with Incomplete Rollover to Backlog / Next Sprint
  console.log('Step 7: Testing Complete Sprint Lifecycle with Incomplete Ticket Rollover...');
  // Mark issue1 as Done, leave issue2 (In Progress) and issue3 (Ready for QA) incomplete
  await store.updateIssue(issue1.id, { status: 'Done', qaStatus: 'Passed' });

  // Complete sprint1 and roll incomplete tickets to sprint2
  await store.completeSprint(sprint1.id, sprint2.id);

  const completedSprint1 = store.getSprintById(sprint1.id);
  assert.strictEqual(completedSprint1.status.toLowerCase(), 'completed', 'Sprint 1 status must be completed');

  assert.strictEqual(store.getIssueById(issue1.id).sprintId, sprint1.id, 'Completed issue 1 must remain linked to completed sprint 1 for audit');
  assert.strictEqual(store.getIssueById(issue2.id).sprintId, sprint2.id, 'Incomplete issue 2 must have rolled over to Sprint 2');
  assert.strictEqual(store.getIssueById(issue3.id).sprintId, sprint2.id, 'Incomplete issue 3 must have rolled over to Sprint 2');
  console.log('✅ Step 7 Passed: Sprint completion and ticket rollover verified.\n');

  // 8. Delete Sprint Lifecycle with Safe Ticket Rollover to Backlog
  console.log('Step 8: Testing Delete Sprint with Safe Rollover to Backlog...');
  await store.deleteSprint(sprint2.id);
  assert.strictEqual(store.getSprintById(sprint2.id), null, 'Sprint 2 must be deleted');
  assert.strictEqual(store.getIssueById(issue2.id).sprintId, null, 'Issue 2 must have safely rolled over to Backlog');
  assert.strictEqual(store.getIssueById(issue3.id).sprintId, null, 'Issue 3 must have safely rolled over to Backlog');
  console.log('✅ Step 8 Passed: Sprint deletion and safe ticket backlog fallback verified.\n');

  // 9. Project Workspace View Sprints Tab Verification
  console.log('Step 9: Testing Project Workspace Sprints Tab Rendering...');
  global.ProjectWorkspaceView.activeTab = 'sprints';
  global.ProjectWorkspaceView.render(mainContainer);

  assert.ok(mainContainer.innerHTML.includes('Sprint Lifecycle & Milestone Roadmap'), 'ProjectWorkspaceView must render modern sprints roadmap');
  assert.ok(mainContainer.innerHTML.includes('Sprint 1 - Authentication & Cart'), 'ProjectWorkspaceView must render archived Sprint 1');
  assert.ok(mainContainer.innerHTML.includes('Open Backlog & Sprints'), 'ProjectWorkspaceView must render navigation button');
  console.log('✅ Step 9 Passed: ProjectWorkspaceView Sprints Tab rendering verified.\n');

  console.log('========================================================');
  console.log('🎉 ALL 9 VERIFICATION CHECKS PASSED WITH ZERO ERRORS!');
  console.log('========================================================');
}

runBacklogSprintsTests().catch(err => {
  console.error('❌ Test failed:', err);
  process.exit(1);
});
