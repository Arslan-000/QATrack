/**
 * PulseWave - Retail POS Integration Kanban Board Verification Suite
 * Verifies that Critical and Reopened issues in "Retail POS Integration"
 * render seamlessly across Kanban columns, swimlanes, issues table, and detail modals.
 */

const fs = require('fs');
const path = require('path');
const assert = require('assert');

// 1. Mock LocalStorage & DOM
global.localStorage = {
  store: {},
  getItem(key) { return this.store[key] || null; },
  setItem(key, val) { this.store[key] = String(val); },
  removeItem(key) { delete this.store[key]; },
  clear() { this.store = {}; }
};

global.window = {
  location: { origin: 'http://localhost:3000', pathname: '/' },
  addEventListener: () => {},
  app: {
    currentView: "project-workspace",
    toast(title, msg, type) {},
    openIssueDetails(id) {},
    openCreateIssueModal() {},
    navigate(view) { this.currentView = view; }
  },
  lucide: {
    createIcons: () => {}
  }
};

global.document = {
  getElementById: (id) => ({
    innerHTML: '',
    appendChild: () => {},
    style: {}
  }),
  createElement: (tag) => ({
    id: '',
    innerHTML: '',
    style: {},
    appendChild: () => {}
  }),
  body: {
    appendChild: () => {}
  },
  querySelectorAll: () => []
};

// 2. Load Store and Views
const dataCode = fs.readFileSync(path.join(__dirname, '../js/data.js'), 'utf8');
const storeCode = fs.readFileSync(path.join(__dirname, '../js/store.js'), 'utf8');
const projectWorkspaceCode = fs.readFileSync(path.join(__dirname, '../js/views/projectWorkspace.js'), 'utf8');
const appCode = fs.readFileSync(path.join(__dirname, '../js/app.js'), 'utf8');

eval(dataCode);
eval(storeCode);
const store = global.store;

eval(projectWorkspaceCode);
eval(appCode);

async function runTests() {
  console.log('--- RUNNING RETAIL POS KANBAN VERIFICATION ---');

  // Create Project: Retail POS Integration
  const project = {
    id: 'prj_pos_1788356294038',
    key: 'RPI',
    name: 'Retail POS Integration',
    workspace_id: 'ws_1788355508034',
    workspaceId: 'ws_1788355508034',
    pmId: 'u-pm-1',
    members: ['u-pm-1', 'u-dev-1']
  };

  store.data.projects = [project];
  store.data.activeProjectId = project.id;

  // Create Issue: Payment Gateway (Critical, Reopened, Bug, unassigned)
  const criticalIssue = {
    id: 'iss-1788430856458',
    key: 'BUG-101',
    title: 'payment gateway',
    priority: 'Critical',
    status: 'Reopened',
    type: 'Bug',
    projectId: project.id,
    project_id: project.id,
    sprintId: null,
    sprint_id: null,
    assigneeId: null,
    assignee_id: null,
    developerId: null,
    developer_id: null,
    qaId: null,
    qa_id: null,
    storyPoints: 8,
    reopenCount: 1
  };

  store.data.issues = [criticalIssue];

  // Test 1: store.getIssues returns the issue for project
  const projectIssues = store.getIssues(project.id);
  assert.strictEqual(projectIssues.length, 1, 'Should find 1 issue for Retail POS Integration');
  assert.strictEqual(projectIssues[0].key, 'BUG-101');
  console.log('✓ Test 1 Passed: store.getIssues returned project issue correctly');

  // Test 2: filterIssues with 'all', 'critical_only', and 'bugs_only'
  ProjectWorkspaceView.filterQuick = 'all';
  let filtered = ProjectWorkspaceView.filterIssues(projectIssues);
  assert.strictEqual(filtered.length, 1, 'Should keep issue with filterQuick=all');

  ProjectWorkspaceView.filterQuick = 'critical_only';
  filtered = ProjectWorkspaceView.filterIssues(projectIssues);
  assert.strictEqual(filtered.length, 1, 'Should keep issue with filterQuick=critical_only');

  ProjectWorkspaceView.filterQuick = 'bugs_only';
  filtered = ProjectWorkspaceView.filterIssues(projectIssues);
  assert.strictEqual(filtered.length, 1, 'Should keep issue with filterQuick=bugs_only');
  console.log('✓ Test 2 Passed: filterIssues keeps critical bug under active filter pills');

  // Test 3: renderSingleColumn for Backlog maps "Reopened" status
  const backlogCol = ProjectWorkspaceView.columns.find(c => c.id === 'Backlog');
  const renderedBacklog = ProjectWorkspaceView.renderSingleColumn(backlogCol, filtered, project);
  assert(renderedBacklog.includes('BUG-101'), 'Backlog column must contain BUG-101 card');
  assert(renderedBacklog.includes('payment gateway'), 'Backlog column must contain issue title');
  assert(renderedBacklog.includes('Reopened') || renderedBacklog.includes('Failed'), 'Card must show QA status pill');
  console.log('✓ Test 3 Passed: Backlog column correctly renders the Reopened Critical Bug BUG-101');

  // Test 4: renderBoardTab full template output
  const stats = store.getProjectStats(project.id);
  const boardHtml = ProjectWorkspaceView.renderBoardTab(project, stats);
  assert(boardHtml.includes('BUG-101'), 'Board HTML must contain BUG-101');
  assert(boardHtml.includes('Critical'), 'Board HTML toolbar must display Critical pill');
  assert(boardHtml.includes('Bugs'), 'Board HTML toolbar must display Bugs pill');
  console.log('✓ Test 4 Passed: renderBoardTab renders toolbar counts and cards without error');

  // Test 5: Swimlanes (Assignee, Priority, Type)
  ProjectWorkspaceView.swimlaneBy = 'assignee';
  const assigneeSwimlanes = ProjectWorkspaceView.renderBoardColumns(filtered, project);
  assert(assigneeSwimlanes.includes('BUG-101'), 'Assignee swimlanes must include unassigned BUG-101 card');

  ProjectWorkspaceView.swimlaneBy = 'priority';
  const prioritySwimlanes = ProjectWorkspaceView.renderBoardColumns(filtered, project);
  assert(prioritySwimlanes.includes('BUG-101'), 'Priority swimlanes must include Critical BUG-101 card');

  ProjectWorkspaceView.swimlaneBy = 'type';
  const typeSwimlanes = ProjectWorkspaceView.renderBoardColumns(filtered, project);
  assert(typeSwimlanes.includes('BUG-101'), 'Type swimlanes must include Bug BUG-101 card');
  console.log('✓ Test 5 Passed: All Swimlane views render BUG-101 properly');

  // Test 6: Issues tab rendering
  const issuesHtml = ProjectWorkspaceView.renderIssuesTab(project, stats);
  assert(issuesHtml.includes('BUG-101'), 'Issues tab must render BUG-101 row');
  assert(issuesHtml.includes('Unassigned'), 'Issues tab must handle null assignee cleanly');
  console.log('✓ Test 6 Passed: renderIssuesTab renders unassigned BUG-101 without null reference error');

  // Test 7: Open Issue Details modal for BUG-101
  window.app.openIssueDetails(criticalIssue.id);
  console.log('✓ Test 7 Passed: openIssueDetails executed without error for unassigned critical issue');

  console.log('\nALL 7 TESTS PASSED SUCCESSFULLY! 🚀');
}

runTests().then(() => process.exit(0)).catch(err => {
  console.error('Test failed:', err);
  process.exit(1);
});
