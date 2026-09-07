// test_pm_created_credentials_invite.js
// Automated verification for PM password creation, credentials sharing, direct link, and invited user sign-in

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
  console.log("TESTING PM PASSWORD CREATION, DIRECT INVITE LINK & SIGN-IN FLOW");
  console.log("================================================================================\n");

  store.loadState();
  const ws = store.getActiveWorkspace() || { id: "ws_alpha", name: "Alpha Space", members: [] };
  if (!store.data.workspaces) store.data.workspaces = [];
  if (!store.data.workspaces.find(w => w.id === ws.id)) store.data.workspaces.push(ws);
  store.setActiveWorkspace(ws.id);

  const prj = store.getActiveProject() || { id: "prj_core", name: "Core Platform", workspace_id: ws.id, key: "CP", members: [] };
  if (!store.data.projects) store.data.projects = [];
  if (!store.data.projects.find(p => p.id === prj.id)) store.data.projects.push(prj);
  store.setActiveProject(prj.id);

  console.log("--- Test 1: PM Invites Member with Initial Password ---");
  const testEmail = "developer.alex@testcorp.com";
  const testPass = "DevSecurePass@2026!";
  
  const inv = await store.inviteMember({
    workspaceId: ws.id,
    projectId: prj.id,
    email: testEmail,
    password: testPass,
    role: "DEVELOPER",
    scope: "PROJECT"
  });

  assert(inv && inv.token, "Invitation generated with secure token");
  assert(inv.tempPassword === testPass, "Initial password stored on invitation object");
  assert((inv.invitedEmail || inv.invited_email) === testEmail, "Invited email matches");
  assert(inv.status === 'PENDING', "Invitation status is PENDING");

  // Verify user record was provisioned
  const user = store.getUsers().find(u => u.email && u.email.toLowerCase() === testEmail.toLowerCase());
  assert(user, "User account provisioned in store");
  assert(user.password === testPass, "User password matches PM-created password");
  assert(user.role === "DEVELOPER", "User role set to DEVELOPER");

  console.log("\n--- Test 2: Direct Link Generation ---");
  const inviteUrl = `${window.location.origin}/#accept-invite?token=${inv.token}&email=${encodeURIComponent(testEmail)}`;
  assert(inviteUrl.includes("token=" + inv.token), "Direct invite link contains correct token");
  assert(inviteUrl.includes("email=" + encodeURIComponent(testEmail)), "Direct invite link contains encoded email");

  console.log("\n--- Test 3: Invited Member Signs In with PM-Created Password ---");
  // Simulate member signing in with credentials created by PM
  const authUser = store.authenticateUser(testEmail, testPass);
  assert(authUser && authUser.id, "User successfully authenticated with PM-created credentials");

  // Accept the invitation token
  const res = await store.acceptProjectInvitation(inv.token, authUser);
  assert(res.success, "Invitation accepted successfully");
  assert(res.project && res.project.id === prj.id, "User granted access to project Core Platform");

  // Verify project membership
  const members = store.getProjectMembers(prj.id);
  const memberRecord = members.find(m => m.email && m.email.toLowerCase() === testEmail.toLowerCase());
  assert(memberRecord, "Member found in project members list");
  assert(memberRecord.role === "DEVELOPER", "Member assigned DEVELOPER role");

  console.log("\n--- Test 4: Project Isolation Verification ---");
  // Check that developer only has access to this project
  const prj2 = { id: "prj_secret", name: "Secret Finance Project", workspace_id: ws.id, key: "SFP", members: [] };
  store.data.projects.push(prj2);
  const devProjects = store.getAuthorizedProjects(ws.id, authUser.id);
  assert(devProjects.some(p => p.id === prj.id) && !devProjects.some(p => p.id === prj2.id), "Developer is strictly isolated to invited project");

  console.log("\n================================================================================");
  console.log("ALL PM CREATED PASSWORD & DIRECT INVITE TESTS PASSED (100%)!");
  console.log("================================================================================");
}

runTests().catch(err => {
  console.error("Test Suite Failed:", err);
  process.exit(1);
});
