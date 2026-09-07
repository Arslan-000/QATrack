// test_login_and_invite_credentials.js
// Automated verification for team member login with PM-created credentials

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
  console.log("TESTING TEAM MEMBER LOGIN & INVITATION CREDENTIALS VERIFICATION");
  console.log("================================================================================\n");

  store.loadState();
  const ws = { id: "ws_login_test", name: "Taar Test", members: [] };
  store.data.workspaces = [ws];
  store.setActiveWorkspace(ws.id);

  const prj = { id: "prj_login_test", name: "Retail POS Integration", workspace_id: ws.id, key: "RPOS", members: [] };
  store.data.projects = [prj];
  store.setActiveProject(prj.id);

  // PM User
  const pmUser = { id: "usr_pm", name: "Arslan Munir", email: "pm@taartest.com", role: "PM" };
  store.data.users = [pmUser];
  store.setActiveUser(pmUser.id);
  await store.addWorkspaceMember(ws.id, { user_id: pmUser.id, name: pmUser.name, email: pmUser.email, role: "PM" });

  console.log("--- Test 1: PM Invites Team Member with Created Password ---");
  const memberEmail = "arslansqa482@gmail.com";
  const memberPassword = "Pass@6062";

  const inv = await store.inviteMember({
    workspaceId: ws.id,
    projectId: prj.id,
    email: memberEmail,
    password: memberPassword,
    role: "QA",
    scope: "SPACE"
  });

  assert(inv && inv.token, "Invitation generated with valid token");
  assert(inv.tempPassword === memberPassword, "PM password saved on invitation object");

  console.log("\n--- Test 2: Invalid Password Attempt Fails ---");
  const badAuth = store.authenticateUser(memberEmail, "WrongPassword@123");
  assert(badAuth === null, "Login correctly rejected for wrong password");

  console.log("\n--- Test 3: Correct PM Password Authenticates Successfully ---");
  const goodAuth = store.authenticateUser(memberEmail, memberPassword);
  assert(goodAuth !== null, "User successfully authenticated with PM-created password");
  assert(goodAuth.email === memberEmail, "Authenticated email matches");

  console.log("\n--- Test 4: Auto-Accept Pending Invitation on Login ---");
  // Accept invitation
  const acceptRes = await store.acceptProjectInvitation(inv.token, goodAuth);
  assert(acceptRes.success, "Invitation accepted successfully upon login");

  // Verify Space QA role
  assert(store.getUserSpaceRole(ws.id, goodAuth.id) === "QA", "User successfully has Space QA role");
  assert(store.getUserProjectRole(prj.id, goodAuth.id) === "QA", "User has QA access to project in space");

  console.log("\n================================================================================");
  console.log("ALL TEAM MEMBER LOGIN & CREDENTIALS TESTS PASSED (100%)!");
  console.log("================================================================================");
}

runTests().catch(err => {
  console.error("Test Suite Failed:", err);
  process.exit(1);
});
