// test_roles_and_permissions_system.js
// Comprehensive automated test suite for Team Member Role & Permission System (PM, QA, Developer, Viewer)

const assert = (condition, msg) => {
  if (!condition) {
    console.error(`  ✗ FAIL: ${msg}`);
    throw new Error(msg);
  } else {
    console.log(`  ✓ PASS: ${msg}`);
  }
};

global.window = {
  location: { origin: 'http://localhost:3000', hash: '' },
  supabaseClient: null
};
global.localStorage = {
  store: {},
  getItem(key) { return this.store[key] || null; },
  setItem(key, val) { this.store[key] = String(val); },
  removeItem(key) { delete this.store[key]; },
  clear() { this.store = {}; }
};

require('d:/QA new project/js/data.js');
require('d:/QA new project/js/store.js');
const store = global.store || window.store;

async function runTests() {
  console.log("================================================================================");
  console.log("TEAM MEMBER ROLE & PERMISSION SYSTEM VERIFICATION SUITE");
  console.log("Roles: PM | QA | Developer | Viewer");
  console.log("================================================================================\n");

  store.loadState();

  // 1. Setup Test Environment: Space with 2 Projects
  const ws = { id: "ws_rbac_core", name: "Apex Engineering Space", members: [] };
  store.data.workspaces = [ws];
  store.setActiveWorkspace(ws.id);

  const prjAlpha = { id: "prj_alpha", name: "Alpha Core API", workspace_id: ws.id, key: "ALP", pmId: "usr_pm", members: [] };
  const prjBeta = { id: "prj_beta", name: "Beta Mobile App", workspace_id: ws.id, key: "BET", pmId: "usr_pm", members: [] };
  store.data.projects = [prjAlpha, prjBeta];

  // 2. Setup Persona Users
  const userPM = { id: "usr_pm", name: "Arslan PM", email: "pm@apex.io", role: "PM" };
  const userQA = { id: "usr_qa", name: "Arslan QA", email: "qa@apex.io", role: "QA" };
  const userDev = { id: "usr_dev", name: "Arslan Dev", email: "dev@apex.io", role: "DEVELOPER" };
  const userViewer = { id: "usr_viewer", name: "Arslan Viewer", email: "viewer@apex.io", role: "VIEWER" };
  const userPM2 = { id: "usr_pm2", name: "Sarah PM2", email: "pm2@apex.io", role: "PM" };

  store.data.users = [userPM, userQA, userDev, userViewer, userPM2];

  // Space-level memberships:
  // PM & PM2 are Space PMs, QA is Space QA, Dev & Viewer have Space memberships
  await store.addWorkspaceMember(ws.id, { user_id: userPM.id, name: userPM.name, email: userPM.email, role: "PM" });
  await store.addWorkspaceMember(ws.id, { user_id: userPM2.id, name: userPM2.name, email: userPM2.email, role: "PM" });
  await store.addWorkspaceMember(ws.id, { user_id: userQA.id, name: userQA.name, email: userQA.email, role: "QA" });

  // Project-level memberships:
  // Developer is assigned ONLY to Project Alpha (prj_alpha)
  await store.addProjectMember({ projectId: prjAlpha.id, userId: userDev.id, email: userDev.email, role: "DEVELOPER" });
  
  // Viewer is assigned to Project Alpha (prj_alpha)
  await store.addProjectMember({ projectId: prjAlpha.id, userId: userViewer.id, email: userViewer.email, role: "VIEWER" });

  console.log("--- Suite 1: PM — FULL ACCESS VERIFICATION ---");
  store.setActiveUser(userPM.id);
  assert(store.getUserSpaceRole(ws.id, userPM.id) === "PM", "PM has Space-level PM role");
  assert(store.getUserProjectRole(prjAlpha.id, userPM.id) === "PM", "PM has Project Alpha PM role");
  assert(store.getUserProjectRole(prjBeta.id, userPM.id) === "PM", "PM has Project Beta PM role");
  assert(store.getAuthorizedProjects(ws.id, userPM.id).length === 2, "PM sees ALL projects in Space (Alpha + Beta)");
  assert(store.canCreateProject(ws.id, userPM.id) === true, "PM can create new projects");
  assert(store.canDeleteProject(prjAlpha.id, userPM.id) === true, "PM can delete projects");
  assert(store.canCreateIssue(prjAlpha.id, userPM.id) === true, "PM can create issues");
  assert(store.canEditIssue(prjAlpha.id, null, userPM.id) === true, "PM can edit issues");
  assert(store.canMoveKanbanCard(prjAlpha.id, null, "Done", userPM.id) === true, "PM can move Kanban cards to any status");
  assert(store.canCreateSprint(prjAlpha.id, userPM.id) === true, "PM can create sprints");
  assert(store.canManageSprint(prjAlpha.id, userPM.id) === true, "PM can manage sprints");
  assert(store.canVerifyQA(prjAlpha.id, userPM.id) === true, "PM can sign off QA verification gates");
  assert(store.canCreateReport(prjAlpha.id, userPM.id) === true, "PM can create Test Reports");
  assert(store.canManageProjectTeam(prjAlpha.id, userPM.id) === true, "PM can manage Team Members");
  assert(store.canEditProjectSettings(prjAlpha.id, userPM.id) === true, "PM can edit project settings");
  assert(store.canEditSpaceSettings(ws.id, userPM.id) === true, "PM can edit space settings");
  assert(store.canDeleteSpace(ws.id, userPM.id) === true, "PM can delete space");

  console.log("\n--- Suite 2: QA — SPACE LEVEL ACCESS & RESTRICTIONS ---");
  store.setActiveUser(userQA.id);
  assert(store.getUserSpaceRole(ws.id, userQA.id) === "QA", "QA has Space-level QA role");
  assert(store.getUserProjectRole(prjAlpha.id, userQA.id) === "QA", "QA has trusted access to Project Alpha");
  assert(store.getUserProjectRole(prjBeta.id, userQA.id) === "QA", "QA has trusted access to Project Beta");
  assert(store.getAuthorizedProjects(ws.id, userQA.id).length === 2, "QA sees ALL projects in Space (Alpha + Beta)");
  assert(store.canCreateProject(ws.id, userQA.id) === false, "QA CANNOT create new projects");
  assert(store.canCreateSprint(prjAlpha.id, userQA.id) === true, "QA CAN create/manage sprints");
  assert(store.canCreateIssue(prjAlpha.id, userQA.id) === true, "QA CAN create issues");
  assert(store.canEditIssue(prjAlpha.id, null, userQA.id) === true, "QA CAN edit issues");
  assert(store.canVerifyQA(prjAlpha.id, userQA.id) === true, "QA CAN perform QA verification");
  assert(store.canCreateReport(prjAlpha.id, userQA.id) === true, "QA CAN create Test Reports");
  assert(store.canMoveKanbanCard(prjAlpha.id, null, "Done", userQA.id) === true, "QA CAN move Kanban cards");
  // QA CANNOT:
  assert(store.canDeleteProject(prjAlpha.id, userQA.id) === false, "QA CANNOT delete projects");
  assert(store.canManageProjectTeam(prjAlpha.id, userQA.id) === false, "QA CANNOT manage team members or invite");
  assert(store.canChangeUserRole(prjAlpha.id, userDev.id, userQA.id) === false, "QA CANNOT change another user's role");
  assert(store.canChangeUserRole(prjAlpha.id, userQA.id, userQA.id) === false, "QA CANNOT change their own role");
  assert(store.canDeleteSpace(ws.id, userQA.id) === false, "QA CANNOT delete space");

  console.log("\n--- Suite 3: DEVELOPER — PROJECT LEVEL ACCESS & STRICT ISOLATION ---");
  store.setActiveUser(userDev.id);
  assert(store.getUserProjectRole(prjAlpha.id, userDev.id) === "DEVELOPER", "Dev has DEVELOPER role in assigned Project Alpha");
  assert(store.getUserProjectRole(prjBeta.id, userDev.id) === null, "Dev has NO role in unassigned Project Beta (Null)");
  
  const devProjects = store.getAuthorizedProjects(ws.id, userDev.id);
  assert(devProjects.length === 1 && devProjects[0].id === prjAlpha.id, "Developer sees ONLY assigned project (Project Alpha)");
  assert(!devProjects.some(p => p.id === prjBeta.id), "Project Beta is STRICTLY HIDDEN from Developer");

  assert(store.canMoveKanbanCard(prjAlpha.id, null, "In Progress", userDev.id) === true, "Dev CAN move card to 'In Progress'");
  assert(store.canMoveKanbanCard(prjAlpha.id, null, "Ready for QA", userDev.id) === true, "Dev CAN move card to 'Ready for QA'");
  assert(store.canMoveKanbanCard(prjAlpha.id, null, "Closed", userDev.id) === false, "Dev CANNOT move card to 'Closed'");
  assert(store.canEditIssue(prjAlpha.id, null, userDev.id) === true, "Dev CAN update allowed issue fields");
  // Developer CANNOT:
  assert(store.canCreateProject(ws.id, userDev.id) === false, "Dev CANNOT create projects");
  assert(store.canDeleteProject(prjAlpha.id, userDev.id) === false, "Dev CANNOT delete projects");
  assert(store.canCreateSprint(prjAlpha.id, userDev.id) === false, "Dev CANNOT create sprints");
  assert(store.canCreateReport(prjAlpha.id, userDev.id) === false, "Dev CANNOT create Test Reports");
  assert(store.canVerifyQA(prjAlpha.id, userDev.id) === false, "Dev CANNOT perform QA verification");
  assert(store.canManageProjectTeam(prjAlpha.id, userDev.id) === false, "Dev CANNOT manage team members");
  assert(store.canChangeUserRole(prjAlpha.id, userDev.id, userDev.id) === false, "Dev CANNOT change roles");
  assert(store.canEditSpaceSettings(ws.id, userDev.id) === false, "Dev CANNOT access space settings");

  console.log("\n--- Suite 4: VIEWER — READ ONLY ACCESS ---");
  store.setActiveUser(userViewer.id);
  assert(store.getUserProjectRole(prjAlpha.id, userViewer.id) === "VIEWER", "Viewer has VIEWER role in Project Alpha");
  assert(store.canCreateProject(ws.id, userViewer.id) === false, "Viewer CANNOT create projects");
  assert(store.canCreateIssue(prjAlpha.id, userViewer.id) === false, "Viewer CANNOT create issues");
  assert(store.canEditIssue(prjAlpha.id, null, userViewer.id) === false, "Viewer CANNOT edit issues");
  assert(store.canMoveKanbanCard(prjAlpha.id, null, "In Progress", userViewer.id) === false, "Viewer CANNOT move Kanban cards");
  assert(store.canCreateSprint(prjAlpha.id, userViewer.id) === false, "Viewer CANNOT create sprints");
  assert(store.canCreateReport(prjAlpha.id, userViewer.id) === false, "Viewer CANNOT create reports");
  assert(store.canManageProjectTeam(prjAlpha.id, userViewer.id) === false, "Viewer CANNOT manage team members");
  assert(store.canChangeUserRole(prjAlpha.id, userViewer.id, userViewer.id) === false, "Viewer CANNOT change roles");

  console.log("\n--- Suite 5: ROLE SECURITY & SELF-MODIFICATION GUARDS ---");
  // 1. PM can change other users' roles
  store.setActiveUser(userPM.id);
  assert(store.canChangeUserRole(prjAlpha.id, userDev.id, userPM.id) === true, "PM can change Developer's role");
  
  // 2. PM cannot change their own role
  assert(store.canChangeUserRole(prjAlpha.id, userPM.id, userPM.id) === false, "PM CANNOT change their own role");
  
  // 3. QA, Dev, Viewer cannot change anyone's role
  assert(store.canChangeUserRole(prjAlpha.id, userDev.id, userQA.id) === false, "QA CANNOT change Developer's role");
  assert(store.canChangeUserRole(prjAlpha.id, userQA.id, userDev.id) === false, "Dev CANNOT change QA's role");
  assert(store.canChangeUserRole(prjAlpha.id, userDev.id, userViewer.id) === false, "Viewer CANNOT change Developer's role");

  // 4. Test store.changeProjectMemberRole exception handling for non-PM
  store.setActiveUser(userQA.id);
  let nonPMRoleChangeBlocked = false;
  try {
    await store.changeProjectMemberRole(prjAlpha.id, userDev.id, "QA_MANAGER");
  } catch (err) {
    nonPMRoleChangeBlocked = true;
    assert(err.message.includes("Only a Project Manager"), "Non-PM role modification threw security exception");
  }
  assert(nonPMRoleChangeBlocked, "Store strictly blocked QA from changing member role");

  // 5. Test store.changeProjectMemberRole exception handling for self-role modification
  store.setActiveUser(userPM.id);
  // Add a project membership record for userPM to test self-change guard
  const pmProjMember = await store.addProjectMember({ projectId: prjAlpha.id, userId: userPM.id, email: userPM.email, role: "OWNER" });
  let selfRoleChangeBlocked = false;
  try {
    await store.changeProjectMemberRole(prjAlpha.id, pmProjMember.id, "DEVELOPER");
  } catch (err) {
    selfRoleChangeBlocked = true;
    assert(err.message.includes("cannot change your own role"), "PM self-role modification threw security exception");
  }
  assert(selfRoleChangeBlocked, "Store strictly blocked PM from changing their own role");

  // 6. Another PM (userPM2) CAN change userPM's role
  store.setActiveUser(userPM2.id);
  const updatedMember = await store.changeProjectMemberRole(prjAlpha.id, pmProjMember.id, "DEVELOPER");
  assert(updatedMember.role === "DEVELOPER", "Second PM (Sarah PM2) successfully updated PM's role");

  console.log("\n================================================================================");
  console.log("ALL TEAM MEMBER ROLE & PERMISSION TESTS PASSED (100%)!");
  console.log("================================================================================");
}

runTests().catch(err => {
  console.error("Test Suite Failed:", err);
  process.exit(1);
});
