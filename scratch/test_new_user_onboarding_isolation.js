// Automated Test Script: Multi-Tenant Workspace & User Isolation Verification
const fs = require('fs');
const path = require('path');

console.log("================================================================================");
console.log("TEST SUITE: Multi-Tenant Workspace & User Isolation Verification");
console.log("================================================================================");

// Mock browser environment
global.window = {
  location: { hash: '', origin: 'http://localhost:3000' },
  localStorage: {
    _data: {},
    getItem(k) { return this._data[k] || null; },
    setItem(k, v) { this._data[k] = String(v); },
    removeItem(k) { delete this._data[k]; },
    clear() { this._data = {}; }
  },
  addEventListener() {},
  removeEventListener() {},
  dispatchEvent() {}
};
global.localStorage = global.window.localStorage;
global.document = {
  getElementById: () => null,
  querySelector: () => null,
  querySelectorAll: () => [],
  addEventListener: () => {},
  createElement: () => ({ setAttribute: () => {}, appendChild: () => {}, classList: { add() {}, remove() {} } }),
  body: { appendChild: () => {} }
};

// Load dependencies
require('../js/data.js');
require('../js/store.js');
const store = global.store || window.store;

require('../js/app.js');
const AppController = global.AppController || window.AppController;
window.app = new AppController();

let testsPassed = 0;
let testsTotal = 0;

function assert(condition, message) {
  testsTotal++;
  if (condition) {
    console.log(`  ✓ PASS: ${message}`);
    testsPassed++;
  } else {
    console.error(`  ✗ FAIL: ${message}`);
    throw new Error(`Assertion failed: ${message}`);
  }
}

async function runTests() {
  try {
    // Clear any previous state
    store.data.workspaces = [];
    store.data.projects = [];
    store.data.users = [];
    store.data.projectInvitations = [];
    store.data.projectMembers = [];
    store.data.activeUserId = null;
    store.data.activeWorkspaceId = null;
    store.data.activeProjectId = null;

    // Step 1: User A (arslandeveloper482@gmail.com) registers
    console.log("\n--- Step 1: User A Registration & Workspace Creation ---");
    const userA = store.registerUser({
      name: "Arslan Developer",
      email: "arslandeveloper482@gmail.com",
      password: "Password123!",
      role: "PROJECT_MANAGER"
    });
    assert(userA.email === "arslandeveloper482@gmail.com", "User A registered successfully");
    assert(store.getActiveUser().email === "arslandeveloper482@gmail.com", "User A is active user");

    // User A creates space "test taar"
    const spaceA = store.addWorkspace({
      id: "ws_taar_123",
      name: "test taar",
      slug: "test-taar",
      company_name: "Taar Corp",
      owner_id: userA.id,
      created_by: userA.email
    });
    assert(spaceA.name === "test taar", "Workspace 'test taar' created");

    const projA = await store.addRealProject({
      id: "prj_taar_1",
      workspace_id: spaceA.id,
      name: "Taar POS Core",
      key: "TAR",
      pmId: userA.name,
      customer: "Taar Retail",
      priority: "P1",
      status: "Active"
    });
    assert(projA.key === "TAR", "Project 'TAR' created in space 'test taar'");

    const userASpaces = store.getWorkspaces(userA.id);
    assert(userASpaces.length === 1 && userASpaces[0].name === "test taar", "User A sees 1 workspace: 'test taar'");
    assert(store.getActiveWorkspace().id === "ws_taar_123", "User A active workspace is 'test taar'");

    // Step 2: Sign Out User A
    console.log("\n--- Step 2: Sign Out User A ---");
    store.clearSupabaseUser();
    assert(store.getActiveUser() === null, "Active user is null after sign out");
    assert(store.data.activeWorkspaceId === null, "Active workspace is null after sign out");
    assert(store.data.activeProjectId === null, "Active project is null after sign out");

    // Step 3: User B (dogararslan682@gmail.com) signs up
    console.log("\n--- Step 3: User B (dogararslan682@gmail.com) Signs Up ---");
    const userB = store.registerUser({
      name: "Dogar Arslan",
      email: "dogararslan682@gmail.com",
      password: "Password123!",
      role: "PROJECT_MANAGER"
    });
    assert(userB.email === "dogararslan682@gmail.com", "User B registered successfully");
    assert(store.getActiveUser().email === "dogararslan682@gmail.com", "User B is active user");

    // Step 4: Verify User B has NO access to User A's workspace
    console.log("\n--- Step 4: Strict Workspace Isolation Check for User B ---");
    const userBSpaces = store.getWorkspaces(userB.id);
    assert(userBSpaces.length === 0, "User B has 0 workspaces (User A's 'test taar' is NOT leaked)");
    assert(store.getActiveWorkspace() === null, "User B active workspace is null");
    assert(store.getActiveProject() === null, "User B active project is null");

    // Step 5: Test Route Guard - Attempting navigation to dashboard/projects redirects to onboarding
    console.log("\n--- Step 5: Route Guard Redirection Check ---");
    window.app.navigate("dashboard");
    assert(window.app.currentView === "onboarding", "User B navigated to 'dashboard' is automatically redirected to 'onboarding'");

    window.app.navigate("projects");
    assert(window.app.currentView === "onboarding", "User B navigated to 'projects' is automatically redirected to 'onboarding'");

    window.app.navigate("test-management");
    assert(window.app.currentView === "onboarding", "User B navigated to 'test-management' is automatically redirected to 'onboarding'");

    // Step 6: User B creates their own workspace "Dogar Space"
    console.log("\n--- Step 6: User B Creates Their Own Workspace ---");
    const spaceB = store.addWorkspace({
      id: "ws_dogar_456",
      name: "Dogar Space",
      slug: "dogar-space",
      company_name: "Dogar Tech",
      owner_id: userB.id,
      created_by: userB.email
    });
    assert(spaceB.name === "Dogar Space", "User B workspace 'Dogar Space' created");

    const projB = await store.addRealProject({
      id: "prj_dogar_1",
      workspace_id: spaceB.id,
      name: "Dogar Cloud App",
      key: "DOG",
      pmId: userB.name,
      customer: "Dogar Enterprises",
      priority: "P1",
      status: "Active"
    });
    assert(projB.key === "DOG", "Project 'DOG' created in 'Dogar Space'");

    const userBSpacesAfter = store.getWorkspaces(userB.id);
    assert(userBSpacesAfter.length === 1 && userBSpacesAfter[0].name === "Dogar Space", "User B sees ONLY 'Dogar Space'");
    assert(store.getActiveWorkspace().id === "ws_dogar_456", "User B active workspace is 'Dogar Space'");
    assert(store.getActiveProject().key === "DOG", "User B active project is 'DOG'");

    // Step 7: Switch back to User A & Verify Isolation
    console.log("\n--- Step 7: Switch Back to User A & Verify Cross-Tenant Isolation ---");
    const authUserA = store.authenticateUser("arslandeveloper482@gmail.com", "Password123!");
    assert(authUserA !== null, "User A re-authenticated");
    assert(store.getActiveUser().email === "arslandeveloper482@gmail.com", "User A is active");

    const userASpacesFinal = store.getWorkspaces(userA.id);
    assert(userASpacesFinal.length === 1 && userASpacesFinal[0].name === "test taar", "User A sees ONLY 'test taar' (User B's 'Dogar Space' is NOT leaked)");
    assert(store.getActiveWorkspace().id === "ws_taar_123", "User A active workspace is 'test taar'");
    assert(store.getActiveProject().key === "TAR", "User A active project is 'TAR'");

    // Step 8: User A invites User B to Project 'TAR' as DEVELOPER
    console.log("\n--- Step 8: Explicit Collaboration Invitation Workflow ---");
    const inv = await store.inviteMember({
      projectId: projA.id,
      workspaceId: spaceA.id,
      email: "dogararslan682@gmail.com",
      role: "DEVELOPER",
      scope: "PROJECT",
      invitedBy: userA.name
    });
    assert(Boolean(inv && inv.token), "Invitation token generated");

    // User B accepts invitation
    store.authenticateUser("dogararslan682@gmail.com", "Password123!");
    assert(store.getActiveUser().email === "dogararslan682@gmail.com", "User B is active");

    await store.acceptProjectInvitation(inv.token, userB);

    const userBSpacesWithInvite = store.getWorkspaces(userB.id);
    assert(userBSpacesWithInvite.length === 2, "User B now has 2 spaces ('Dogar Space' [Owner] and 'test taar' [Invited Member])");

    // Verify Role in each space
    const roleInSpaceB = store.getUserSpaceRole(spaceB.id, userB.id);
    const roleInSpaceA = store.getUserSpaceRole(spaceA.id, userB.id);
    assert(roleInSpaceB === "OWNER" || roleInSpaceB === "PM", `User B is OWNER/PM of their own space (${roleInSpaceB})`);
    assert(roleInSpaceA === "DEVELOPER", `User B is DEVELOPER in invited space (${roleInSpaceA})`);

    console.log("\n================================================================================");
    console.log(`RESULTS: All ${testsPassed} / ${testsTotal} tests PASSED! Multi-tenant isolation verified.`);
    console.log("================================================================================");
  } catch (e) {
    console.error("Test Suite Failed with error:", e);
    process.exit(1);
  }
}

runTests();
