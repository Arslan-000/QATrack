// test_accepted_members_visibility.js
// Automated verification: Accepted members appear in Members tab and only pending/unaccepted in Invitations

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
  console.log("TESTING ACCEPTED MEMBERS VISIBILITY IN MEMBERS TAB & PENDING INVITATIONS ISOLATION");
  console.log("================================================================================\n");

  store.loadState();
  const ws = { id: "ws_members_vis", name: "Alpha Space", members: [] };
  store.data.workspaces = [ws];
  store.setActiveWorkspace(ws.id);

  const prj = { id: "prj_members_vis", name: "Core Mobile App", workspace_id: ws.id, key: "CMA", members: [] };
  store.data.projects = [prj];
  store.setActiveProject(prj.id);

  // 1. PM User
  const pmUser = { id: "usr_pm_alpha", name: "Alpha PM", email: "pm@alpha.com", role: "PM" };
  store.data.users = [pmUser];
  store.setActiveUser(pmUser.id);
  prj.pmId = pmUser.id;
  await store.addWorkspaceMember(ws.id, { user_id: pmUser.id, name: pmUser.name, email: pmUser.email, role: "PM" });

  console.log("--- Initial State: 1 Member (PM) ---");
  let members = store.getProjectMembers(prj.id);
  assert(members.length === 1, "Initially 1 member (PM)");
  assert(members[0].email === "pm@alpha.com", "PM is present in members list");

  console.log("\n--- Step 2: PM Sends Space-wide QA Invitation ---");
  const inv = await store.inviteMember({
    workspaceId: ws.id,
    projectId: prj.id,
    email: "arslansqa482@gmail.com",
    password: "Pass@6062",
    role: "QA",
    scope: "SPACE"
  });

  const pendingInvs = store.getWorkspaceInvitations(ws.id).filter(i => i.status === 'PENDING');
  assert(pendingInvs.length === 1, "Invitations tab has 1 pending invitation awaiting acceptance");

  console.log("\n--- Step 3: Invited User Accepts Invitation ---");
  const qaUser = store.authenticateUser("arslansqa482@gmail.com", "Pass@6062");
  await store.acceptProjectInvitation(inv.token, qaUser);

  console.log("\n--- Step 4: Verify Members Tab includes Accepted User ---");
  members = store.getProjectMembers(prj.id);
  assert(members.length === 2, "Members list now has 2 members (PM + Accepted QA Member)");
  assert(members.some(m => m.email === "arslansqa482@gmail.com"), "Accepted QA member is visible in Members tab");

  console.log("\n--- Step 5: Verify Pending Invitations Count is Now 0 ---");
  const remainingPendingInvs = store.getWorkspaceInvitations(ws.id).filter(i => i.status === 'PENDING');
  assert(remainingPendingInvs.length === 0, "Zero pending invitations remain in Invitations tab");

  console.log("\n================================================================================");
  console.log("ALL ACCEPTED MEMBERS AND INVITATIONS TAB TESTS PASSED (100%)!");
  console.log("================================================================================");
}

runTests().catch(err => {
  console.error("Test Suite Failed:", err);
  process.exit(1);
});
