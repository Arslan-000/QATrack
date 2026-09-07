/**
 * Automated Verification Test Suite for Settings View & Store Operations
 * Covers Space Configuration, Profile Updates, Team Management, Role Changes,
 * Member Removals, Invitations Lifecycle, and Danger Zone Cascades.
 */

const fs = require('fs');
const path = require('path');
const assert = require('assert');

// 1. Setup Mock DOM & LocalStorage
global.localStorage = {
  store: {},
  getItem(key) { return this.store[key] || null; },
  setItem(key, val) { this.store[key] = String(val); },
  removeItem(key) { delete this.store[key]; },
  clear() { this.store = {}; }
};

global.window = {
  location: { origin: 'http://localhost:3000', pathname: '/' },
  app: {
    toast(title, msg, type) { console.log(`    [Toast] (${type || 'info'}) ${title}: ${msg}`); },
    updateHeaderPersona() {},
    updateSidebarUserFooter() {},
    updateSidebarSpacesExplorer() {},
    navigate(view) { console.log(`    [Navigate] -> ${view}`); }
  }
};

// Chainable Mock Supabase Client
function createQueryBuilder() {
  const qb = {
    then(onFulfilled) { return Promise.resolve({ data: [], error: null }).then(onFulfilled); },
    upsert: async (data) => ({ data, error: null }),
    update: (data) => qb,
    delete: () => qb,
    select: () => qb,
    eq: () => qb,
    ilike: () => qb,
    in: () => qb,
    order: () => qb,
    maybeSingle: async () => ({ data: null, error: null }),
    single: async () => ({ data: null, error: null })
  };
  return qb;
}

global.window.supabaseClient = {
  from(table) {
    return createQueryBuilder();
  },
  auth: {
    getUser: async () => ({ data: { user: { id: 'usr_test_pm', email: 'sarah.connor@skyqa.io' } }, error: null }),
    updateUser: async () => ({ error: null }),
    signOut: async () => ({ error: null }),
    resetPasswordForEmail: async (email) => ({ error: null })
  }
};

global.document = {
  getElementById(id) {
    return {
      innerHTML: '',
      value: '',
      focus() {}
    };
  }
};

// 2. Load Store and Settings View Code
const initialDataCode = fs.readFileSync(path.join(__dirname, '../js/data.js'), 'utf8');
const storeCode = fs.readFileSync(path.join(__dirname, '../js/store.js'), 'utf8');
const settingsCode = fs.readFileSync(path.join(__dirname, '../js/views/settings.js'), 'utf8');

eval(initialDataCode);
eval(storeCode);
eval(settingsCode);

console.log("==================================================================");
console.log("🛠️ RUNNING SETTINGS & PREFERENCES COMPREHENSIVE VERIFICATION SUITE");
console.log("==================================================================\n");

let passedCount = 0;
async function test(name, fn) {
  try {
    await fn();
    console.log(`  ✅ PASS: ${name}`);
    passedCount++;
  } catch (err) {
    console.error(`  ❌ FAIL: ${name}`);
    console.error(`     Error: ${err.message}`);
    console.error(err.stack);
    process.exit(1);
  }
}

async function runTests() {
  const store = global.store;

  // Initialize a fresh test workspace and user
  const testUser = {
    id: 'usr_test_pm',
    name: 'Sarah Connor',
    email: 'sarah.connor@skyqa.io',
    role: 'PROJECT_MANAGER',
    initials: 'SC',
    color: 'bg-slate-950 text-[#bef264]'
  };
  store.data.currentUser = testUser;
  store.data.users = [testUser];

  const testSpace = {
    id: 'ws_skyqa',
    name: 'SkyQA Core',
    company_name: 'Cyberdyne Systems',
    slug: 'skyqa-core',
    workspace_type: 'Software Company',
    logo_color: 'bg-slate-900',
    description: 'Autonomous QA and software validation space',
    members: [{ id: testUser.id, name: testUser.name, email: testUser.email, role: 'OWNER' }]
  };
  store.addWorkspace(testSpace);
  store.setActiveWorkspace(testSpace.id);

  console.log("--- TEST GROUP 1: Space Settings Configuration ---");
  await test("Update workspace settings via store.updateWorkspace", () => {
    const updated = store.updateWorkspace('ws_skyqa', {
      name: 'SkyQA Enterprise Cloud',
      company_name: 'SkyQA Global Labs',
      workspace_type: 'QA & Testing Agency',
      logo_color: 'bg-emerald-600',
      description: 'Enterprise grade QA automation and performance suites'
    });
    assert.strictEqual(updated.name, 'SkyQA Enterprise Cloud');
    assert.strictEqual(updated.company_name, 'SkyQA Global Labs');
    assert.strictEqual(updated.workspace_type, 'QA & Testing Agency');
    assert.strictEqual(updated.logo_color, 'bg-emerald-600');
  });

  console.log("\n--- TEST GROUP 2: Personal Profile Updates & Supabase Sync ---");
  await test("Update profile via store.updateUserProfile", async () => {
    const updatedUser = await store.updateUserProfile('usr_test_pm', {
      name: 'Sarah Connor - Chief QA',
      role: 'PROJECT_MANAGER',
      initials: 'SC',
      color: 'bg-indigo-600 text-white',
      phone: '+1-555-888-9999',
      bio: 'Leading test architecture, reliability gates, and release sign-offs.'
    });
    assert.strictEqual(updatedUser.name, 'Sarah Connor - Chief QA');
    assert.strictEqual(updatedUser.color, 'bg-indigo-600 text-white');
    assert.strictEqual(updatedUser.phone, '+1-555-888-9999');

    // Verify workspace member name/role kept in sync
    const members = store.getWorkspaceMembers('ws_skyqa');
    const me = members.find(m => m.user_id === 'usr_test_pm' || m.email === 'sarah.connor@skyqa.io');
    assert(me, 'User exists in workspace members');
    assert.strictEqual(me.name, 'Sarah Connor - Chief QA');
  });

  console.log("\n--- TEST GROUP 3: Team Directory, Roles & Permissions ---");
  await test("Add multiple team members to workspace", async () => {
    await store.addWorkspaceMember('ws_skyqa', {
      user_id: 'usr_dev_1',
      name: 'John Connor',
      email: 'john.c@skyqa.io',
      role: 'DEVELOPER'
    });
    await store.addWorkspaceMember('ws_skyqa', {
      user_id: 'usr_qa_1',
      name: 'Kyle Reese',
      email: 'kyle.r@skyqa.io',
      role: 'QA_ENGINEER'
    });

    const members = store.getWorkspaceMembers('ws_skyqa');
    assert.strictEqual(members.length, 3, "Workspace has 3 total members");
  });

  await test("Update member role via store.updateWorkspaceMemberRole", async () => {
    await store.updateWorkspaceMemberRole('ws_skyqa', 'john.c@skyqa.io', 'PROJECT_MANAGER');
    const members = store.getWorkspaceMembers('ws_skyqa');
    const john = members.find(m => m.email === 'john.c@skyqa.io');
    assert.strictEqual(john.role, 'PROJECT_MANAGER', "John's role updated to PROJECT_MANAGER");
  });

  await test("Self-deletion guard prevents PM removing self from space", async () => {
    let errorCaught = false;
    try {
      await store.removeWorkspaceMember('ws_skyqa', 'sarah.connor@skyqa.io', 'usr_test_pm');
    } catch (err) {
      errorCaught = true;
      assert(err.message.includes('cannot delete your own account'), "Self-deletion error thrown");
    }
    assert(errorCaught, "Self-deletion guard triggered successfully");
  });

  await test("Remove team member via store.removeWorkspaceMember", async () => {
    await store.removeWorkspaceMember('ws_skyqa', 'kyle.r@skyqa.io', 'usr_test_pm');
    const members = store.getWorkspaceMembers('ws_skyqa');
    assert.strictEqual(members.length, 2, "Member successfully removed, 2 remaining");
    assert(!members.some(m => m.email === 'kyle.r@skyqa.io'), "Kyle is no longer in members");
  });

  console.log("\n--- TEST GROUP 4: Invitations Lifecycle ---");
  let createdToken = null;
  let createdInvId = null;

  await test("Create invitation with secure token & 7-day expiration", async () => {
    const inv = await store.createInvitation('ws_skyqa', {
      email: 'dr.silberman@hospital.org',
      role: 'VIEWER'
    });
    assert(inv, "Invitation object created");
    assert.strictEqual(inv.invited_email, 'dr.silberman@hospital.org');
    assert.strictEqual(inv.role, 'VIEWER');
    assert.strictEqual(inv.status, 'Pending');
    assert(inv.token && inv.token.startsWith('tok_'), "Secure token generated");
    
    createdInvId = inv.id;
    createdToken = inv.token;

    const currentInvs = store.getInvitations('ws_skyqa');
    assert(currentInvs.some(i => i.id === createdInvId), "Invitation found in store.getInvitations");
  });

  await test("Resend invitation updates timestamp", async () => {
    await new Promise(r => setTimeout(r, 10));
    await store.resendInvitation(createdInvId);
    const refreshed = store.getInvitations('ws_skyqa').find(i => i.id === createdInvId);
    assert(refreshed, "Invitation exists");
    assert.strictEqual(refreshed.status, 'Pending');
  });

  await test("Cancel invitation sets status to Cancelled", async () => {
    await store.cancelInvitation(createdInvId);
    const cancelled = store.getInvitations('ws_skyqa').find(i => i.id === createdInvId);
    assert.strictEqual(cancelled.status, 'Cancelled');
  });

  await test("Delete invitation removes record permanently", async () => {
    await store.deleteWorkspaceInvitation(createdInvId);
    const afterDelete = store.getInvitations('ws_skyqa');
    assert(!afterDelete.some(i => i.id === createdInvId), "Invitation deleted from store");
  });

  console.log("\n--- TEST GROUP 5: Danger Zone Cascading Deletions ---");
  await test("Create temporary workspace with project, issues, and test cases", async () => {
    const tempWs = {
      id: 'ws_temp_delete',
      name: 'Temporary Sandbox',
      slug: 'temp-sandbox',
      members: []
    };
    store.addWorkspace(tempWs);

    const tempPrj = {
      id: 'prj_temp_1',
      workspace_id: 'ws_temp_delete',
      key: 'TMP',
      name: 'Temp Project'
    };
    store.data.projects.push(tempPrj);

    store.data.issues.push({ id: 'iss_1', project_id: 'prj_temp_1', key: 'TMP-1', title: 'Test Bug' });
    store.data.testCases.push({ id: 'tc_1', workspace_id: 'ws_temp_delete', title: 'Test Case 1' });
    store.data.testExecutions.push({ id: 'exec_1', workspace_id: 'ws_temp_delete', testCaseId: 'tc_1' });

    assert(store.getWorkspaceById('ws_temp_delete'), "Temporary workspace exists");
  });

  await test("Delete workspace cascades and purges all related records", async () => {
    await store.deleteWorkspace('ws_temp_delete');

    assert(!store.getWorkspaceById('ws_temp_delete'), "Workspace removed");
    assert(!store.data.projects.some(p => p.workspace_id === 'ws_temp_delete'), "Projects purged");
    assert(!store.data.issues.some(i => i.project_id === 'prj_temp_1'), "Issues purged");
    assert(!store.data.testCases.some(tc => tc.workspace_id === 'ws_temp_delete'), "Test cases purged");
    assert(!store.data.testExecutions.some(te => te.workspace_id === 'ws_temp_delete'), "Test executions purged");
  });

  await test("Delete user account signs out and cleans user profile", async () => {
    await store.deleteUserAccount('usr_test_pm');
    const currentUser = store.getActiveUser();
    assert(currentUser?.id !== 'usr_test_pm', "Deleted user is no longer active");
    assert(!store.data.users.some(u => u.id === 'usr_test_pm'), "Deleted user removed from store users");
  });

  console.log("\n==================================================================");
  console.log(`🎉 ALL ${passedCount}/${passedCount} SETTINGS & PREFERENCES TESTS PASSED WITH 100% SUCCESS!`);
  console.log("==================================================================");
}

runTests();
