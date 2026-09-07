// test_member_details_and_status.js
// Automated verification for Member Details, Active/Inactive Status Toggle, PM Controls, and Invite Switcher

const assert = (condition, msg) => {
  if (!condition) {
    console.error(`  ✗ FAIL: ${msg}`);
    throw new Error(msg);
  } else {
    console.log(`  ✓ PASS: ${msg}`);
  }
};

global.window = {
  location: { origin: 'http://localhost:3000' },
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
  console.log("TESTING MEMBER DETAILS MODAL, ACTIVE/INACTIVE STATUS & PM MANAGEMENT ACTIONS");
  console.log("================================================================================\n");

  store.loadState();
  const ws = { id: "ws_details_test", name: "Executive Space", members: [] };
  store.data.workspaces = [ws];
  store.setActiveWorkspace(ws.id);

  const prj = { id: "prj_details_test", name: "POS Integration", workspace_id: ws.id, key: "POS", members: [] };
  store.data.projects = [prj];
  store.setActiveProject(prj.id);

  // Setup PM User
  const pmUser = { id: "usr_pm_1", name: "Arslan PM", email: "pm@test.com", role: "PM" };
  store.data.users = [pmUser];
  store.setActiveUser(pmUser.id);
  await store.addWorkspaceMember(ws.id, { user_id: pmUser.id, name: pmUser.name, email: pmUser.email, role: "PM" });
  await store.addProjectMember({ projectId: prj.id, userId: pmUser.id, email: pmUser.email, role: "PM", status: "Active" });

  // Setup Developer Member
  const devUser = { id: "usr_dev_1", name: "Arslan Dev", email: "arslandeveloper482@gmail.com", role: "DEVELOPER" };
  store.data.users.push(devUser);
  await store.addProjectMember({ projectId: prj.id, userId: devUser.id, email: devUser.email, role: "DEVELOPER", status: "Active" });

  console.log("--- Test 1: Active Member Role Resolution ---");
  assert(store.getUserProjectRole(prj.id, devUser.id) === "DEVELOPER", "Active developer resolves DEVELOPER role");
  assert(store.canEditIssue(prj.id, null, devUser.id) === true, "Active developer can edit assigned issues");

  console.log("\n--- Test 2: PM Deactivates Member (Active -> Inactive) ---");
  await store.updateProjectMemberStatus(prj.id, devUser.id, "Inactive");
  const membersAfterDeact = store.getProjectMembers(prj.id);
  const devMember = membersAfterDeact.find(m => m.userId === devUser.id);
  assert(devMember.status === "Inactive", "Developer member status updated to Inactive in store");

  // Verify RBAC access is revoked when Inactive
  assert(store.getUserProjectRole(prj.id, devUser.id) === null, "Inactive member receives NULL role (access blocked)");
  assert(store.canEditIssue(prj.id, null, devUser.id) === false, "Inactive member CANNOT edit issues or perform project actions");

  console.log("\n--- Test 3: PM Reactivates Member (Inactive -> Active) ---");
  await store.updateProjectMemberStatus(prj.id, devUser.id, "Active");
  const membersAfterReactivate = store.getProjectMembers(prj.id);
  const devMemberActive = membersAfterReactivate.find(m => m.userId === devUser.id);
  assert(devMemberActive.status === "Active", "Developer member status restored to Active");
  assert(store.getUserProjectRole(prj.id, devUser.id) === "DEVELOPER", "Active developer role restored");

  console.log("\n--- Test 4: PM Self-Deactivation Guard ---");
  let selfDeactFailed = false;
  try {
    await store.updateProjectMemberStatus(prj.id, pmUser.id, "Inactive");
  } catch (err) {
    selfDeactFailed = true;
    assert(err.message.includes("cannot deactivate your own"), "Guard successfully blocked PM from deactivating their own account");
  }
  assert(selfDeactFailed, "Self-deactivation guard enforced");

  console.log("\n--- Test 5: PM Deletes Member from Project / Database ---");
  await store.removeProjectMember(prj.id, devUser.id);
  const membersAfterDelete = store.getProjectMembers(prj.id);
  assert(!membersAfterDelete.some(m => m.userId === devUser.id), "Member completely removed from project members");
  assert(store.getUserProjectRole(prj.id, devUser.id) === null, "Deleted member has zero project access");

  console.log("\n================================================================================");
  console.log("ALL MEMBER DETAILS, STATUS & PM MANAGEMENT TESTS PASSED (100%)!");
  console.log("================================================================================");
}

runTests().catch(err => {
  console.error("Test Suite Failed:", err);
  process.exit(1);
});
