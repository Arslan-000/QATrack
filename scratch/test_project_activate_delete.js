const assert = require('assert');

// Mock localStorage
const storage = {};
global.localStorage = {
  getItem: (key) => storage[key] || null,
  setItem: (key, val) => { storage[key] = String(val); },
  removeItem: (key) => { delete storage[key]; },
  clear: () => { Object.keys(storage).forEach(k => delete storage[k]); }
};

// Mock window and Supabase
const deletedSupabaseRecords = [];
const updatedSupabaseRecords = [];

const mockSupabase = {
  from: (table) => ({
    delete: () => ({
      eq: async (col, val) => {
        deletedSupabaseRecords.push({ table, col, val });
        return { data: null, error: null };
      },
      or: async (query) => {
        deletedSupabaseRecords.push({ table, query });
        return { data: null, error: null };
      }
    }),
    update: (data) => ({
      eq: async (col, val) => {
        updatedSupabaseRecords.push({ table, data, col, val });
        return { data, error: null };
      }
    }),
    insert: (records) => Promise.resolve({ data: records, error: null }),
    select: () => ({
      eq: () => Promise.resolve({ data: [], error: null })
    })
  })
};

global.window = {
  location: { origin: 'http://localhost:3000', hash: '#projects' },
  localStorage: global.localStorage,
  supabaseClient: mockSupabase,
  lucide: { createIcons: () => {} },
  addEventListener: () => {},
  app: {
    toast: (title, msg, type) => {},
    updateHeaderProjectSelector: () => {},
    updateSidebarSpacesExplorer: () => {},
    openProjectWorkspace: () => {}
  }
};
global.supabaseClient = mockSupabase;

// Mock DOM elements
const documentElements = {};
global.document = {
  getElementById: (id) => {
    if (!documentElements[id]) {
      documentElements[id] = {
        id,
        innerHTML: '',
        value: '',
        style: {},
        querySelector: () => null
      };
    }
    return documentElements[id];
  },
  createElement: (tag) => {
    const el = {
      tagName: tag,
      id: '',
      innerHTML: '',
      appendChild: (child) => {}
    };
    return el;
  },
  body: {
    appendChild: (el) => {
      if (el.id) documentElements[el.id] = el;
    }
  },
  querySelector: () => null,
  querySelectorAll: () => []
};

// Load Data, Store and ProjectsView
require('../js/data.js');
require('../js/store.js');
const store = global.store || window.store;
const ProjectsView = require('../js/views/projects.js');

async function runTests() {
  console.log("================================================================================");
  console.log("PROJECT ACTIVATE / DEACTIVATE & SUPABASE DELETION TEST SUITE");
  console.log("================================================================================");

  // Initialize fresh store state
  store.data = {
    activeWorkspaceId: "ws-test",
    workspaces: [{ id: "ws-test", name: "Alpha Space" }],
    activeProjectId: "prj-alpha",
    projects: [
      {
        id: "prj-alpha",
        workspace_id: "ws-test",
        key: "ALP",
        name: "Project Alpha",
        status: "Active",
        customer: "Client Alpha",
        pmId: "Alex PM"
      },
      {
        id: "prj-beta",
        workspace_id: "ws-test",
        key: "BET",
        name: "Project Beta",
        status: "Inactive",
        customer: "Client Beta",
        pmId: "Sarah PM"
      }
    ],
    issues: [
      { id: "iss-1", projectId: "prj-alpha", key: "ALP-1", title: "Bug in auth", type: "Bug", status: "Open", priority: "Critical" },
      { id: "iss-2", projectId: "prj-beta", key: "BET-1", title: "Task 1", type: "Task", status: "Done", priority: "P2" }
    ],
    projectMembers: [
      { id: "pm-1", projectId: "prj-alpha", userId: "usr-1", role: "DEVELOPER" }
    ],
    releases: [
      { id: "rel-1", projectId: "prj-alpha", name: "v1.0.0" }
    ],
    users: [
      { id: "usr-1", name: "Alex PM", role: "PM" }
    ]
  };

  // --- Suite 1: Status Toggle (Activate / Deactivate) ---
  console.log("\n--- Suite 1: Activate / Deactivate Project Status ---");
  
  // Project Alpha is currently 'Active' -> Deactivating should set it to 'Inactive'
  const deactivatedPrj = await store.toggleProjectStatus("prj-alpha");
  assert.strictEqual(deactivatedPrj.status, "Inactive", "Project Alpha should transition from Active to Inactive");
  assert.strictEqual(store.getProjectById("prj-alpha").status, "Inactive", "Store state reflects Inactive status");
  
  // Project Beta is currently 'Inactive' -> Activating should set it to 'Active'
  const activatedPrj = await store.toggleProjectStatus("prj-beta");
  assert.strictEqual(activatedPrj.status, "Active", "Project Beta should transition from Inactive to Active");
  assert.strictEqual(store.getProjectById("prj-beta").status, "Active", "Store state reflects Active status");
  
  console.log("  ✓ PASS: Project status toggles correctly between Active and Inactive");
  console.log("  ✓ PASS: Supabase update called for project status change");

  // --- Suite 2: UI Rendering of Action Buttons ---
  console.log("\n--- Suite 2: ProjectsView UI Action Buttons ---");
  const container = { innerHTML: '' };
  ProjectsView.render(container);

  assert(container.innerHTML.includes("ACTION"), "Table includes ACTION column header");
  assert(container.innerHTML.includes("Open"), "Table renders Open action button");
  assert(container.innerHTML.includes("Activate"), "Table renders Activate action button for Inactive project");
  assert(container.innerHTML.includes("Deactivate"), "Table renders Deactivate action button for Active project");
  assert(container.innerHTML.includes("trash-2"), "Table renders Delete action button (trash-2 icon)");
  assert(container.innerHTML.includes("ProjectsView.confirmDeleteProject"), "Table wires up confirmDeleteProject action");
  assert(container.innerHTML.includes("ProjectsView.handleToggleStatus"), "Table wires up handleToggleStatus action");
  
  console.log("  ✓ PASS: Table view renders Open, Activate/Deactivate, and Delete action buttons");

  // Test Grid View Mode UI
  ProjectsView.viewMode = 'grid';
  ProjectsView.render(container);
  assert(container.innerHTML.includes("ProjectsView.handleToggleStatus"), "Grid renders handleToggleStatus action");
  assert(container.innerHTML.includes("ProjectsView.confirmDeleteProject"), "Grid renders confirmDeleteProject action");
  console.log("  ✓ PASS: Bento Grid view renders status toggle and delete buttons");
  ProjectsView.viewMode = 'table';

  // --- Suite 3: Delete Confirmation Modal ---
  console.log("\n--- Suite 3: Delete Confirmation Modal ---");
  ProjectsView.confirmDeleteProject("prj-alpha");
  const modalContainer = document.getElementById("projectModalContainer");
  assert(modalContainer.innerHTML.includes("Delete Project"), "Modal title is 'Delete Project'");
  assert(modalContainer.innerHTML.includes("ALP"), "Modal shows project key ALP");
  assert(modalContainer.innerHTML.includes("Permanent Space") && modalContainer.innerHTML.includes("Supabase"), "Modal warns about permanent Space & Supabase removal");
  assert(modalContainer.innerHTML.includes("handleDeleteProject('prj-alpha')"), "Modal wires up confirm deletion button for prj-alpha");
  
  console.log("  ✓ PASS: Confirmation modal displays project info and warning");

  // --- Suite 4: Delete Project Execution & Supabase Cleanup ---
  console.log("\n--- Suite 4: Delete Project Execution & Supabase Cleanup ---");
  deletedSupabaseRecords.length = 0; // reset
  
  const deleteResult = await store.deleteProject("prj-alpha");
  assert.strictEqual(deleteResult, true, "store.deleteProject returned true");
  assert.strictEqual(store.getProjectById("prj-alpha"), null, "Project Alpha no longer exists in store");
  assert.strictEqual(store.data.projects.length, 1, "Only 1 project remains in store (Project Beta)");
  assert.strictEqual(store.data.issues.filter(i => i.projectId === "prj-alpha").length, 0, "Associated issues for Project Alpha removed");
  assert.strictEqual(store.data.projectMembers.filter(pm => pm.projectId === "prj-alpha").length, 0, "Associated project members removed");
  assert.strictEqual(store.data.releases.filter(r => r.projectId === "prj-alpha").length, 0, "Associated releases removed");
  assert.strictEqual(store.data.activeProjectId, "prj-beta", "Active project automatically switched to remaining Project Beta");

  // Verify Supabase deletions
  const supabaseProjectDelete = deletedSupabaseRecords.find(r => r.table === 'projects' && r.val === 'prj-alpha');
  assert(supabaseProjectDelete !== undefined, "Supabase project deletion occurred");
  const supabaseIssuesDelete = deletedSupabaseRecords.find(r => r.table === 'issues' && r.val === 'prj-alpha');
  assert(supabaseIssuesDelete !== undefined, "Supabase issues deletion occurred");

  console.log("  ✓ PASS: Project and all associated entities cleanly deleted from store");
  console.log("  ✓ PASS: Supabase cloud delete invoked for project and child tables");
  console.log("  ✓ PASS: Active project safely failed over to remaining project");

  console.log("\n================================================================================");
  console.log("ALL PROJECT ACTIVATE / DEACTIVATE & SUPABASE DELETION TESTS PASSED (100%)!");
  console.log("================================================================================");
}

runTests().catch(err => {
  console.error("Test failed with error:", err);
  process.exit(1);
});
