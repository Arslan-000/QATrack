/**
 * Automated Verification Suite for Kanban Board Redesign
 */

const assert = require('assert');

// DOM and Environment Mock
class MockElement {
  constructor(tagName = 'div') {
    this.tagName = tagName.toUpperCase();
    this.children = [];
    this.attributes = {};
    this.style = {};
    this.innerHTML = '';
    this.value = '';
    this.className = '';
    this.id = '';
  }
  appendChild(c) { this.children.push(c); return c; }
  remove() { this.parentElement = null; }
  setAttribute(k, v) { this.attributes[k] = v; }
  getAttribute(k) { return this.attributes[k]; }
  addEventListener() {}
  removeEventListener() {}
}

const elementsById = {};
global.document = {
  getElementById: (id) => {
    if (!elementsById[id]) {
      elementsById[id] = new MockElement();
      elementsById[id].id = id;
    }
    return elementsById[id];
  },
  createElement: (tag) => new MockElement(tag),
  body: new MockElement('body'),
  addEventListener: () => {}
};

global.window = {
  addEventListener: () => {},
  removeEventListener: () => {},
  lucide: { createIcons: () => {} },
  app: {
    toast: () => {},
    openCreateIssueModal: () => {},
    openAIQAAssistant: () => {},
    openIssueDetails: () => {}
  }
};

global.localStorage = {
  getItem: () => null,
  setItem: () => {},
  removeItem: () => {}
};

global.INITIAL_DATA = {
  workspaces: [{ id: "ws_alpha", name: "Main Workspace" }],
  projects: [{ id: "prj_pos", workspace_id: "ws_alpha", key: "POS", name: "Retail POS Integration" }],
  users: [{ id: "usr_dev", name: "Alex Developer", email: "dev@company.io", role: "Developer" }],
  issues: []
};

const store = require('../js/store.js');
global.store = store;

require('../js/views/projectWorkspace.js');
const ProjectWorkspaceView = global.ProjectWorkspaceView || window.ProjectWorkspaceView;

async function runKanbanRedesignTests() {
  console.log("=================================================");
  console.log("🚀 TESTING KANBAN BOARD REDESIGN & STREAMLINED TOOLBAR");
  console.log("=================================================\n");

  let passed = 0;
  let failed = 0;

  function test(name, fn) {
    try {
      fn();
      console.log(`✅ PASS: ${name}`);
      passed++;
    } catch (err) {
      console.error(`❌ FAIL: ${name}`);
      console.error(err);
      failed++;
    }
  }

  const pId = "prj_pos";
  store.data.projects = [{ id: pId, workspace_id: "ws_alpha", key: "POS", name: "Retail POS Integration" }];
  store.data.activeProjectId = pId;
  store.data.activeWorkspaceId = "ws_alpha";
  store.data.activeUserId = "usr_dev";

  store.data.issues = [
    {
      id: "iss_1",
      key: "POS-101",
      projectId: pId,
      title: "Critical card payment NFC timeout",
      type: "Bug",
      priority: "Critical",
      status: "Reopened",
      qaStatus: "Failed",
      developerId: "usr_dev",
      storyPoints: 8,
      createdAt: new Date().toISOString()
    },
    {
      id: "iss_2",
      key: "POS-102",
      projectId: pId,
      title: "Dark mode receipt thermal preview",
      type: "Story",
      priority: "Medium",
      status: "In Progress",
      qaStatus: "Testing",
      developerId: "usr_dev",
      storyPoints: 3,
      createdAt: new Date().toISOString()
    }
  ];

  const project = store.getProjectById(pId);
  const stats = store.getProjectStats(pId);

  // 1. Verify Streamlined Toolbar Rendering
  test("1. Board toolbar renders clean unified header with Search and Segmented Pills", () => {
    const html = ProjectWorkspaceView.renderBoardTab(project, stats);
    assert.ok(html.includes("Search cards..."), "Must include instant search input");
    assert.ok(html.includes("My Tasks"), "Must include My Tasks quick filter");
    assert.ok(html.includes("AI QA Assistant"), "Must include AI QA Assistant button");
    assert.ok(html.includes("Add Card"), "Must include primary Add Card button");
    assert.ok(!html.includes("All QA Statuses"), "Clunky duplicate QA Status dropdown must not be in default view");
  });

  // 2. Verify Quick Filter Pills
  test("2. Quick Filter 'bugs_only' filters issues correctly", () => {
    ProjectWorkspaceView.setQuickFilter("bugs_only");
    const filtered = ProjectWorkspaceView.filterIssues(store.getIssues(pId));
    assert.strictEqual(filtered.length, 1);
    assert.strictEqual(filtered[0].key, "POS-101");
  });

  // 3. Verify Filter Popover Toggle
  test("3. Advanced Filter Popover toggles open and closed", () => {
    assert.strictEqual(ProjectWorkspaceView.filterMenuOpen, false);
    ProjectWorkspaceView.toggleFilterMenu();
    assert.strictEqual(ProjectWorkspaceView.filterMenuOpen, true);
    const htmlOpen = ProjectWorkspaceView.renderBoardTab(project, stats);
    assert.ok(htmlOpen.includes("Advanced Filters"), "Popover must show advanced filter options");
    ProjectWorkspaceView.toggleFilterMenu();
    assert.strictEqual(ProjectWorkspaceView.filterMenuOpen, false);
  });

  // 4. Verify Decluttered Card Rendering
  test("4. Kanban Card renders uncluttered with key, priority badge, and assignee", () => {
    const cardHtml = ProjectWorkspaceView.renderBoardCard(store.data.issues[0]);
    assert.ok(cardHtml.includes("POS-101"), "Must include card key");
    assert.ok(cardHtml.includes("Critical"), "Must include priority badge");
    assert.ok(cardHtml.includes("Reopened"), "Must include compact QA status badge");
    assert.ok(cardHtml.includes("Alex"), "Must include assigned developer first name");
    assert.ok(cardHtml.includes("8 SP"), "Must include story points pill");
  });

  // 5. Verify Column Header & SP Sum
  test("5. Kanban Column renders clean header with SP total and WIP limit", () => {
    ProjectWorkspaceView.clearFilters();
    const col = ProjectWorkspaceView.columns[0]; // Backlog / Open
    const colHtml = ProjectWorkspaceView.renderSingleColumn(col, store.data.issues, project);
    assert.ok(colHtml.includes("Backlog / Open"), "Must include column title");
    assert.ok(colHtml.includes("8 SP"), "Must calculate SP sum for column");
  });

  console.log("\n=================================================");
  console.log(`🎉 KANBAN REDESIGN TESTS COMPLETED: ${passed} Passed, ${failed} Failed`);
  console.log("=================================================\n");

  if (failed > 0) process.exit(1);
}

runKanbanRedesignTests().catch(e => {
  console.error(e);
  process.exit(1);
});
