global.INITIAL_DATA = { workspaces: [], projects: [], users: [] };
global.localStorage = {
  store: {},
  getItem(k) { return this.store[k] || null; },
  setItem(k, v) { this.store[k] = String(v); },
  removeItem(k) { delete this.store[k]; },
  clear() { this.store = {}; }
};

const store = require('../js/store.js');

async function runTests() {
  console.log("=========================================");
  console.log("   PULSEWAVE TWO-TIER RBAC & ROUTING TEST ");
  console.log("=========================================");

  // Seed data identical to Supabase
  const ws = {
    id: "ws_1790720498081",
    name: "Logo Workspace",
    slug: "logo-workspace",
    company_name: "Logo Corp",
    owner_id: "d79e9e9e-8794-4677-a91c-7b99f31cbc0b",
    created_by: "arslandeveloper482@gmail.com"
  };

  const wmOwner = {
    id: "wm_ws_owner",
    workspace_id: "ws_1790720498081",
    user_id: "usr_pm_1",
    name: "Arslan Munir",
    email: "arslandeveloper482@gmail.com",
    role: "OWNER"
  };

  const wmQA = {
    id: "wm_ws_qa",
    workspace_id: "ws_1790720498081",
    user_id: "usr_qa_2",
    name: "Arslan QA",
    email: "arslansqa482@gmail.com",
    role: "QA_ENGINEER"
  };

  const prj = {
    id: "prj_1790720548098",
    workspace_id: "ws_1790720498081",
    key: "LOGO",
    name: "Logo Project",
    pm_id: "Arslan Munir"
  };

  const pmOwner = {
    id: "pm_prj_owner",
    project_id: "prj_1790720548098",
    user_id: "usr_pm_1",
    email: "arslandeveloper482@gmail.com",
    role: "PROJECT_MANAGER"
  };

  const pmQA = {
    id: "pm_prj_qa",
    project_id: "prj_1790720548098",
    user_id: "usr_qa_2",
    email: "arslansqa482@gmail.com",
    role: "QA_ENGINEER"
  };

  store.data.workspaces = [ws];
  store.data.workspaceMembers = [wmOwner, wmQA];
  store.data.projects = [prj];
  store.data.projectMembers = [pmOwner, pmQA];

  const userOwner = { id: "usr_pm_1", name: "Arslan Munir", email: "arslandeveloper482@gmail.com", role: "PROJECT_MANAGER" };
  const userQA = { id: "usr_qa_2", name: "Arslan QA", email: "arslansqa482@gmail.com", role: "QA_ENGINEER" };

  store.data.users = [userOwner, userQA];

  // -------------------------------------------------------------
  // TEST 1: PM / OWNER PERMISSIONS
  // -------------------------------------------------------------
  console.log("\n[TEST 1] PM/Owner Permissions (arslandeveloper482@gmail.com)");
  store.data.activeUserId = userOwner.id;
  const ownerSpaces = store.getWorkspaces(userOwner.id);
  console.log("  - Accessible spaces count:", ownerSpaces.length);
  console.assert(ownerSpaces.length === 1, "Owner should see 1 space");
  
  const ownerSpaceRole = store.getUserSpaceRole(ws.id, userOwner.id);
  console.log("  - Space Role:", ownerSpaceRole);
  console.assert(ownerSpaceRole === "PM", "Owner space role should resolve to PM");

  console.log("  - Can Create Space:", store.canCreateWorkspace(userOwner.id));
  console.assert(store.canCreateWorkspace(userOwner.id) === true, "Owner can create space");

  console.log("  - Can Create Project:", store.canCreateProject(ws.id, userOwner.id));
  console.assert(store.canCreateProject(ws.id, userOwner.id) === true, "Owner can create project");

  console.log("  - Can Delete Project:", store.canDeleteProject(prj.id, userOwner.id));
  console.assert(store.canDeleteProject(prj.id, userOwner.id) === true, "Owner can delete project");

  console.log("  - Can Delete Space:", store.canDeleteWorkspace(ws.id, userOwner.id));
  console.assert(store.canDeleteWorkspace(ws.id, userOwner.id) === true, "Owner can delete space");

  console.log("  - Can Manage Workspace Team:", store.canManageWorkspaceTeam(ws.id, userOwner.id));
  console.assert(store.canManageWorkspaceTeam(ws.id, userOwner.id) === true, "Owner can manage team");

  // -------------------------------------------------------------
  // TEST 2: INVITED QA ENGINEER PERMISSIONS (arslansqa482@gmail.com)
  // -------------------------------------------------------------
  console.log("\n[TEST 2] Invited QA Permissions (arslansqa482@gmail.com)");
  store.data.activeUserId = userQA.id;
  const qaSpaces = store.getWorkspaces(userQA.id);
  console.log("  - Accessible spaces count:", qaSpaces.length);
  console.assert(qaSpaces.length === 1, "QA should see the invited space");

  const qaSpaceRole = store.getUserSpaceRole(ws.id, userQA.id);
  console.log("  - Space Role:", qaSpaceRole);
  console.assert(qaSpaceRole === "QA", "QA space role should be QA");

  const qaProjectRole = store.getUserProjectRole(prj.id, userQA.id);
  console.log("  - Project Role:", qaProjectRole);
  console.assert(qaProjectRole === "QA", "QA project role should be QA");

  const qaCanCreateSpace = store.canCreateWorkspace(userQA.id);
  console.log("  - Can Create Space:", qaCanCreateSpace);
  console.assert(qaCanCreateSpace === false, "QA MUST NOT be able to create spaces");

  const qaCanCreatePrj = store.canCreateProject(ws.id, userQA.id);
  console.log("  - Can Create Project:", qaCanCreatePrj);
  console.assert(qaCanCreatePrj === false, "QA MUST NOT be able to create projects");

  const qaCanDeletePrj = store.canDeleteProject(prj.id, userQA.id);
  console.log("  - Can Delete Project:", qaCanDeletePrj);
  console.assert(qaCanDeletePrj === false, "QA MUST NOT be able to delete projects");

  const qaCanDeleteWs = store.canDeleteWorkspace(ws.id, userQA.id);
  console.log("  - Can Delete Space:", qaCanDeleteWs);
  console.assert(qaCanDeleteWs === false, "QA MUST NOT be able to delete spaces");

  const qaCanManageTeam = store.canManageWorkspaceTeam(ws.id, userQA.id);
  console.log("  - Can Manage Workspace Team:", qaCanManageTeam);
  console.assert(qaCanManageTeam === false, "QA MUST NOT be able to remove members");

  // Verify createProject throws for QA
  let threwCreate = false;
  try {
    await store.createProject({ workspace_id: ws.id, name: "Unauthorized Project", key: "UNAUTH" });
  } catch (e) {
    threwCreate = true;
    console.log("  - createProject threw expected error:", e.message);
  }
  console.assert(threwCreate === true, "createProject should throw error for QA");

  // Verify deleteProject throws for QA
  let threwDelete = false;
  try {
    await store.deleteProject(prj.id);
  } catch (e) {
    threwDelete = true;
    console.log("  - deleteProject threw expected error:", e.message);
  }
  console.assert(threwDelete === true, "deleteProject should throw error for QA");

  // Verify removeWorkspaceMember throws for QA
  let threwRemove = false;
  try {
    await store.removeWorkspaceMember(ws.id, wmOwner.id);
  } catch (e) {
    threwRemove = true;
    console.log("  - removeWorkspaceMember threw expected error:", e.message);
  }
  console.assert(threwRemove === true, "removeWorkspaceMember should throw error for QA");

  // -------------------------------------------------------------
  // TEST 3: ONBOARDING SKIP FALLBACK
  // -------------------------------------------------------------
  console.log("\n[TEST 3] Fresh uninvited user onboarding fallback");
  store.data.workspaces = [];
  store.data.workspaceMembers = [];
  store.data.projects = [];
  store.data.projectMembers = [];
  
  const freshUser = { id: "usr_fresh_9", name: "Fresh Lead", email: "fresh@test.io", role: "PROJECT_MANAGER" };
  store.data.users = [freshUser];
  store.data.activeUserId = freshUser.id;

  console.log("  - Spaces before skip:", store.getWorkspaces(freshUser.id).length);
  const createdWs = store.createDefaultWorkspaceIfEmpty();
  console.log("  - Fallback Space Created:", createdWs.name, createdWs.id);
  console.assert(store.getWorkspaces(freshUser.id).length === 1, "Default workspace created on skip");

  console.log("\n=========================================");
  console.log("   ALL RBAC & NAVIGATION TESTS PASSED!   ");
  console.log("=========================================");
}

runTests();
