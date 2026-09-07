// test_pm_names_and_protection.js
// Automated verification for proper member names, initials, role presentation, and PM self-deletion protection

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
  console.log("TESTING MEMBER NAMES RESOLUTION, INITIALS & PM PROTECTION AGAINST DELETION");
  console.log("================================================================================\n");

  store.loadState();
  const ws = { id: "ws_names_test", name: "PulseWave Space", members: [] };
  store.data.workspaces = [ws];
  store.setActiveWorkspace(ws.id);

  const prj = { 
    id: "prj_names_test", 
    name: "Enterprise QA", 
    workspace_id: ws.id, 
    key: "EQA", 
    pmId: "arslan munir",
    members: [] 
  };
  store.data.projects = [prj];
  store.setActiveProject(prj.id);

  // 1. Setup Current Logged In PM user
  const loggedInPM = {
    id: "usr_pm_dev",
    name: "Arslan Developer",
    email: "arslandeveloper482@gmail.com",
    role: "PM"
  };
  store.data.users = [loggedInPM];
  store.setActiveUser(loggedInPM.id);
  await store.addWorkspaceMember(ws.id, { user_id: loggedInPM.id, name: loggedInPM.name, email: loggedInPM.email, role: "PM" });

  // 2. Setup Invited QA member
  const qaUser = {
    id: "usr_qa_member",
    name: "Arslan SQA",
    email: "arslansqa482@gmail.com",
    role: "QA"
  };
  store.data.users.push(qaUser);
  await store.addWorkspaceMember(ws.id, { user_id: qaUser.id, name: qaUser.name, email: qaUser.email, role: "QA" });

  console.log("--- Test 1: Validate Proper Name & Initials Formatting (No 'Unassigned') ---");
  const members = store.getProjectMembers(prj.id);
  
  for (const m of members) {
    console.log(`  Member Found: [${m.name}] | Role: [${m.role}] | Initials: [${m.initials}] | Email: [${m.email}]`);
    assert(m.name !== "Unassigned", `Member name '${m.name}' is NOT 'Unassigned'`);
    assert(m.initials !== "--" && m.initials !== "—", `Member initials '${m.initials}' are valid (not '--')`);
  }

  console.log("\n--- Test 2: Name Resolution from Email Strings ---");
  assert(store.formatDisplayName("arslan munir", "") === "Arslan Munir", "Formatted string 'arslan munir' -> 'Arslan Munir'");
  assert(store.formatDisplayName("Unassigned", "arslandeveloper482@gmail.com") === "Arslan Developer", "Formatted email 'arslandeveloper482@gmail.com' -> 'Arslan Developer'");
  assert(store.formatDisplayName("", "arslansqa482@gmail.com") === "Arslan Sqa", "Formatted email 'arslansqa482@gmail.com' -> 'Arslan Sqa'");
  assert(store.getInitials("Arslan Munir") === "AM", "Initials for 'Arslan Munir' -> 'AM'");
  assert(store.getInitials("Arslan Developer") === "AD", "Initials for 'Arslan Developer' -> 'AD'");
  assert(store.getInitials("Arslan Sqa") === "AS", "Initials for 'Arslan Sqa' -> 'AS'");

  console.log("\n--- Test 3: Self-Deletion & PM Protection Guards ---");
  const currentUser = store.getActiveUser();
  const targetPM = members.find(m => m.email === currentUser.email || m.userId === currentUser.id);
  assert(targetPM !== undefined, "Active PM found in project members");

  let selfDeleteBlocked = false;
  try {
    await store.removeProjectMember(prj.id, targetPM.id);
  } catch (err) {
    selfDeleteBlocked = true;
    assert(err.message.includes("cannot delete your own"), "Store rejected self-deletion of active PM account");
  }
  assert(selfDeleteBlocked, "Self-deletion guard strictly enforced");

  console.log("\n================================================================================");
  console.log("ALL NAMES RESOLUTION & PM PROTECTION TESTS PASSED (100%)!");
  console.log("================================================================================");
}

runTests().catch(err => {
  console.error("Test Suite Failed:", err);
  process.exit(1);
});
